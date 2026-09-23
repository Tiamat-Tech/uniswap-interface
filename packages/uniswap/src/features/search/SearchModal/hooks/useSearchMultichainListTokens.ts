import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { ListTokensResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { HistoryDuration, TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { dataApiMultichainTokenToSearchResult } from 'uniswap/src/data/apiClients/dataApiService/utils/dataApiMultichainToken'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { MultichainSearchResult } from 'uniswap/src/features/dataApi/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

function selectMultichainSearchResults(data: ListTokensResponse): MultichainSearchResult[] {
  return data.multichainTokens
    .map((token) => dataApiMultichainTokenToSearchResult(token))
    .filter((r): r is MultichainSearchResult => r !== undefined)
}

/**
 * Fetches tokens from the ListTokens API with multichain grouping.
 * Returns MultichainSearchResult[] for use in the search modal's no-query state.
 */
export function useSearchMultichainListTokens({
  pageSize,
  skip,
}: {
  pageSize: number
  skip: boolean
}): UseQueryResult<MultichainSearchResult[]> {
  const { chains: enabledChainIds } = useEnabledChains()

  return useQuery({
    queryKey: [
      ReactQueryCacheKey.DataApiService,
      'listTokens',
      'v2',
      { chainIds: enabledChainIds, pageSize, orderBy: TokensOrderBy.VOLUME_1D, ascending: false },
    ] as const,
    queryFn: () =>
      dataApiServiceClientV2.listTokens({
        chainIds: enabledChainIds,
        page: { pageSize },
        // TODO(CONS-1396): update to TRENDING order when available
        sort: { orderBy: TokensOrderBy.VOLUME_1D, ascending: false },
        // Required by BE — UNSPECIFIED is rejected, mirrors apps/web's listTokensService.ts.
        sparklineDuration: HistoryDuration.DAY,
      }),
    select: selectMultichainSearchResults,
    enabled: !skip,
  })
}
