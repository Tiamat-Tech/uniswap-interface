import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { ListTokenGroupsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { HistoryDuration, TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

const TOKEN_GROUPS_PAGE_SIZE = 100

/**
 * v2 ListTokenGroups: ranked groupings (all issuers' tokenizations of one underlying) for a grouped
 * category such as stocks/etfs/commodities. Replaces the v1 ListRankedRwas source on Explore.
 */
export function useListTokenGroupsQuery({
  categoryId,
  chainIds,
  enabled = true,
}: {
  categoryId: string | undefined
  chainIds: number[]
  enabled?: boolean
}): UseQueryResult<ListTokenGroupsResponse> {
  const { chains: enabledChainIds } = useEnabledChains()
  const resolvedChainIds = chainIds.length > 0 ? chainIds : enabledChainIds

  return useQuery({
    queryKey: [ReactQueryCacheKey.DataApiService, 'listTokenGroups', categoryId, resolvedChainIds],
    queryFn: () =>
      dataApiServiceClientV2.listTokenGroups({
        chainIds: resolvedChainIds,
        filter: { categoryIds: categoryId ? [categoryId] : [] },
        sort: { orderBy: TokensOrderBy.VOLUME_1D, ascending: false },
        page: { pageSize: TOKEN_GROUPS_PAGE_SIZE },
        sparklineDuration: HistoryDuration.DAY,
      }),
    enabled: enabled && Boolean(categoryId) && resolvedChainIds.length > 0,
    staleTime: 5 * ONE_MINUTE_MS,
    gcTime: 30 * ONE_MINUTE_MS,
    retry: 2,
  })
}
