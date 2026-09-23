import { createServer, IncomingMessage, Server } from 'node:http'
import { gatewayFixtureResponses, liquidityFixtureResponses } from './gatewayResponses'

/**
 * Local stand-in for the interface gateway used by the cloud-function tests.
 * The dev-server worker is pointed here via CLOUD_FUNCTIONS_GRAPHQL_ENDPOINT_OVERRIDE
 * (Apollo GraphQL, functions/client.ts) and CLOUD_FUNCTIONS_LIQUIDITY_ENDPOINT_OVERRIDE
 * (the liquidity v2 connect-RPC POSTs getPool.ts / getPosition.ts make) so meta-tag /
 * OG-image tests replay checked-in responses instead of depending on live gateway latency.
 *
 * GraphQL requests arrive at `/v1/graphql`; liquidity requests at
 * `/uniswap.liquidity.v2.LiquidityService/<Method>`. Routing is by URL path.
 */

const ROOT_FIELD_BY_OPERATION: Record<string, string> = {
  TokenWeb: 'token',
}

interface ParsedGraphQLRequest {
  operationName: string
  chain: string
  address: string
}

function parseGraphQLRequest(raw: string): ParsedGraphQLRequest | undefined {
  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return undefined
  }
  if (typeof body !== 'object' || body === null) {
    return undefined
  }
  const { operationName, variables } = body as { operationName?: unknown; variables?: unknown }
  if (typeof operationName !== 'string') {
    return undefined
  }
  const vars = typeof variables === 'object' && variables !== null ? (variables as Record<string, unknown>) : {}
  const chain = typeof vars.chain === 'string' ? vars.chain : ''
  const rawAddress = vars.address ?? vars.poolId
  const address = typeof rawAddress === 'string' ? rawAddress.toLowerCase() : ''
  return { operationName, chain, address }
}

function resolveGraphQLResponse(parsed: ParsedGraphQLRequest): object {
  const key = `${parsed.operationName}:${parsed.chain}:${parsed.address}`
  const fixture = gatewayFixtureResponses[key]
  if (fixture) {
    return fixture
  }

  const rootField = ROOT_FIELD_BY_OPERATION[parsed.operationName]
  if (!rootField) {
    // Unknown operation — a new query was added to the worker without a
    // fixture. Warn loudly so the failure is diagnosable from test output.
    console.warn(
      `[gateway-fixtures] no fixture for operation "${parsed.operationName}" — ` +
        `add one to functions/fixtures/gatewayResponses.ts`,
    )
    return { data: null }
  }

  // Same shape the live gateway returns for unknown assets; the
  // invalid-token test cases depend on this.
  return { data: { [rootField]: null } }
}

/**
 * Resolves a liquidity v2 connect-RPC request. `method` is the RPC name from the URL
 * (`GetPool` / `GetPosition`); the identifying fields are read from the JSON body. An unmatched key
 * returns an empty message — the same "no pool / no position" shape the live service returns for an
 * unknown identifier, which the invalid-pool test cases depend on.
 */
function resolveLiquidityResponse(method: string, raw: string): object {
  let body: Record<string, unknown> = {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null) {
      body = parsed as Record<string, unknown>
    }
  } catch {
    return {}
  }

  if (method === 'GetPool') {
    const pool = typeof body.pool === 'object' && body.pool !== null ? (body.pool as Record<string, unknown>) : {}
    const chainId = typeof pool.chainId === 'number' ? pool.chainId : Number(pool.chainId)
    const addressOrId = typeof pool.addressOrId === 'string' ? pool.addressOrId.toLowerCase() : ''
    return liquidityFixtureResponses[`GetPool:${chainId}:${addressOrId}`] ?? {}
  }
  if (method === 'GetPosition') {
    const chainId = typeof body.chainId === 'number' ? body.chainId : Number(body.chainId)
    const version = typeof body.version === 'number' ? body.version : Number(body.version)
    const tokenId = typeof body.tokenId === 'string' ? body.tokenId.toLowerCase() : ''
    return liquidityFixtureResponses[`GetPosition:${chainId}:${version}:${tokenId}`] ?? {}
  }
  console.warn(
    `[gateway-fixtures] no fixture handler for liquidity method "${method}" — ` +
      `add one to functions/fixtures/gatewayFixtureServer.ts`,
  )
  return {}
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk: Buffer) => {
      raw += chunk.toString()
    })
    req.on('end', () => resolve(raw))
    req.on('error', reject)
  })
}

/**
 * Starts the fixture server on the given port. Returns a handle that resolves
 * once the server is closed. Expected failures (port in use) reject the
 * returned promise.
 */
export async function startGatewayFixtureServer(port: number): Promise<{ close(): Promise<void> }> {
  const server: Server = createServer((req, res) => {
    readBody(req)
      .then((raw) => {
        const liquidityMethod = req.url?.match(/\/uniswap\.liquidity\.v2\.LiquidityService\/(\w+)$/)?.[1]
        if (liquidityMethod) {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(resolveLiquidityResponse(liquidityMethod, raw)))
          return
        }

        const parsed = parseGraphQLRequest(raw)
        if (!parsed) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ errors: [{ message: 'gateway fixture server: malformed GraphQL request' }] }))
          return
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(resolveGraphQLResponse(parsed)))
      })
      .catch(() => {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ errors: [{ message: 'gateway fixture server: failed to read request' }] }))
      })
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', resolve)
  })

  return {
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      }),
  }
}
