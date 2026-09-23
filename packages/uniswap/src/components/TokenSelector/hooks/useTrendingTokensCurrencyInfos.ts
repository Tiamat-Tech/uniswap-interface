import type { ConnectError } from '@connectrpc/connect'
import type { UseQueryResult } from '@tanstack/react-query'
import type { TokenRankingsResponse } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { ALL_NETWORKS_ARG, CustomRankingType } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { useCallback, useMemo } from 'react'
import {
  tokenRankingsStatToCurrencyInfo,
  useTokenRankingsQuery,
} from 'uniswap/src/data/apiClients/dataApiService/exploreV1/tokenRankings'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

export function useTrendingTokensCurrencyInfos(
  chainFilter: Maybe<UniverseChainId>,
  options: { skip?: boolean; chainIds?: UniverseChainId[] } = {},
): UseQueryResult<CurrencyInfo[], ConnectError> {
  const { skip, chainIds } = options

  const chainIdSet = useMemo(() => (chainIds ? new Set(chainIds) : undefined), [chainIds])
  // TanStack only re-runs `select` when its identity changes, so it must depend on what it closes over.
  const select = useCallback(
    (data: TokenRankingsResponse): CurrencyInfo[] => {
      const trendingTokens = data.tokenRankings[CustomRankingType.Trending]?.tokens ?? []
      return trendingTokens
        .map(tokenRankingsStatToCurrencyInfo)
        .filter((t): t is CurrencyInfo => Boolean(t))
        .filter((t) => (chainFilter ? true : (chainIdSet?.has(t.currency.chainId) ?? true)))
    },
    [chainFilter, chainIdSet],
  )

  return useTokenRankingsQuery({ chainId: chainFilter?.toString() ?? ALL_NETWORKS_ARG }, { enabled: !skip, select })
}
