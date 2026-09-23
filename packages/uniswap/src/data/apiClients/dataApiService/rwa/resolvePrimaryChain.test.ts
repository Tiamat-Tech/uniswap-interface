import { UniverseChainId } from '@universe/chains'
import { resolvePrimaryChain } from 'uniswap/src/data/apiClients/dataApiService/rwa/resolvePrimaryChain'
import type { IssuerToken } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'

const ENABLED_CHAINS = [UniverseChainId.Mainnet, UniverseChainId.Base]

const issuer: IssuerToken = {
  symbol: 'AAPLon',
  name: 'Apple (Ondo)',
  logoUrl: '',
  issuer: 'ondo',
  priceUsd: 1,
  volume24hUsd: 1,
  sparkline1d: { points: [] },
  chainTokens: [
    { chainId: UniverseChainId.Mainnet, address: '0xeth' },
    { chainId: UniverseChainId.Base, address: '0xbase' },
  ],
}

describe('resolvePrimaryChain', () => {
  it('resolves the mainnet-first enabled deployment without a chain filter', () => {
    expect(resolvePrimaryChain({ issuer, enabledChainIds: ENABLED_CHAINS })).toEqual({
      chainId: UniverseChainId.Mainnet,
      chainToken: issuer.chainTokens[0],
    })
  })

  it('resolves the filtered deployment when a chain filter is active', () => {
    expect(resolvePrimaryChain({ issuer, enabledChainIds: ENABLED_CHAINS, chainFilter: UniverseChainId.Base })).toEqual(
      { chainId: UniverseChainId.Base, chainToken: issuer.chainTokens[1] },
    )
  })

  it('falls back to the primary pick when the issuer is not deployed on the filtered chain', () => {
    expect(
      resolvePrimaryChain({ issuer, enabledChainIds: ENABLED_CHAINS, chainFilter: UniverseChainId.ArbitrumOne }),
    ).toEqual({ chainId: UniverseChainId.Mainnet, chainToken: issuer.chainTokens[0] })
  })

  it('ignores a chain filter that is not enabled', () => {
    expect(
      resolvePrimaryChain({ issuer, enabledChainIds: [UniverseChainId.Mainnet], chainFilter: UniverseChainId.Base }),
    ).toEqual({ chainId: UniverseChainId.Mainnet, chainToken: issuer.chainTokens[0] })
  })

  it('returns undefined when no deployment is on an enabled chain', () => {
    expect(resolvePrimaryChain({ issuer, enabledChainIds: [UniverseChainId.ArbitrumOne] })).toBeUndefined()
  })
})
