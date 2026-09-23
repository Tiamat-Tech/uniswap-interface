import type { ListTokensResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { sortRwaChainTokens } from 'uniswap/src/data/apiClients/dataApiService/rwa/rwaMappingUtils'
import type { Rwa, RwaSparkline } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'

function mapSparkline(points: RankedMultichainToken['sparkline']): RwaSparkline {
  return { points: points.map((point) => ({ timestampS: Number(point.timestamp), value: point.value })) }
}

/**
 * Maps a v2 ListTokens entry to a single-issuer Rwa row, the flat shape the Commodities table renders.
 * v2 ListTokens carries no issuer for these tokens (verified against prod), so the issuer label is empty;
 * an issuer would need the v1 name resolution, not a raw id, before it could render here.
 */
export function mapRankedMultichainTokenToRwa(ranked: RankedMultichainToken): Rwa | null {
  const token = ranked.multichainToken
  if (!token?.symbol) {
    return null
  }
  const chainTokens = sortRwaChainTokens(
    Object.entries(token.addresses)
      .map(([chainId, address]) => ({ chainId: Number(chainId), address }))
      .filter((chainToken) => !Number.isNaN(chainToken.chainId)),
  )
  if (chainTokens.length === 0) {
    return null
  }

  const metrics = {
    priceUsd: token.price?.spotUsd ?? ranked.stats?.price ?? 0,
    priceChange1hPct: token.price?.percentChange1h ?? ranked.stats?.priceChange1h,
    priceChange24hPct: token.price?.percentChange1d ?? ranked.stats?.priceChange1d,
    marketCapUsd: ranked.stats?.marketCap,
    volume24hUsd: ranked.stats?.volume1d ?? 0,
    sparkline1d: mapSparkline(ranked.sparkline),
  }
  const logoUrl = token.project?.logoUrl ?? ''

  return {
    symbol: token.symbol,
    name: token.name,
    logoUrl,
    ...metrics,
    issuerTokens: [{ symbol: token.symbol, name: token.name, logoUrl, issuer: '', ...metrics, chainTokens }],
  }
}

export function mapRankedMultichainTokenList(response?: ListTokensResponse): Rwa[] {
  return (response?.multichainTokens ?? []).map(mapRankedMultichainTokenToRwa).filter((rwa): rwa is Rwa => rwa !== null)
}
