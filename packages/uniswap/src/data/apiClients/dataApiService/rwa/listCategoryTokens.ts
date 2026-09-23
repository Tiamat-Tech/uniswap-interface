import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { ListTokensResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { HistoryDuration, TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

// Single page, no cursor: matches ListTokenGroups and the un-paged v1 ListRwaTokens this replaces. RWA categories
// are a handful of tokens (Commodities is 4 today), so the first page is the whole list.
const CATEGORY_TOKENS_PAGE_SIZE = 100

/** v2 ListTokens filtered to one category: the flat (ungrouped) token list for an RWA category such as commodities. */
export function useListCategoryTokensQuery({
  categoryId,
  chainIds,
  enabled = true,
}: {
  categoryId: string | undefined
  chainIds: number[]
  enabled?: boolean
}): UseQueryResult<ListTokensResponse> {
  const { chains: enabledChainIds } = useEnabledChains()
  const resolvedChainIds = chainIds.length > 0 ? chainIds : enabledChainIds

  return useQuery({
    queryKey: [ReactQueryCacheKey.DataApiService, 'listTokens', 'category', categoryId, resolvedChainIds],
    queryFn: () =>
      dataApiServiceClientV2.listTokens({
        chainIds: resolvedChainIds,
        filter: { categoryIds: categoryId ? [categoryId] : [], applyTopLevelFilters: true },
        sort: { orderBy: TokensOrderBy.VOLUME_1D, ascending: false },
        page: { pageSize: CATEGORY_TOKENS_PAGE_SIZE },
        // Required by BE — UNSPECIFIED is rejected.
        sparklineDuration: HistoryDuration.DAY,
      }),
    enabled: enabled && Boolean(categoryId) && resolvedChainIds.length > 0,
    staleTime: 5 * ONE_MINUTE_MS,
    gcTime: 30 * ONE_MINUTE_MS,
    retry: 2,
  })
}
