import type { UniverseChainId } from '@universe/chains'
import { pickDisplayChainToken } from 'uniswap/src/data/apiClients/dataApiService/rwa/pickPrimaryChainToken'
import type { ChainToken, IssuerToken } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'

export type ResolvedPrimaryChain = {
  chainToken: ChainToken
  chainId: UniverseChainId
}

export function resolvePrimaryChain({
  issuer,
  enabledChainIds,
  chainFilter,
}: {
  issuer: IssuerToken
  enabledChainIds: readonly UniverseChainId[]
  chainFilter?: UniverseChainId
}): ResolvedPrimaryChain | undefined {
  const chainToken = pickDisplayChainToken({ chainTokens: issuer.chainTokens, enabledChainIds, chainFilter })
  const chainId = chainToken && toSupportedChainId(chainToken.chainId)
  return chainToken && chainId ? { chainToken, chainId } : undefined
}
