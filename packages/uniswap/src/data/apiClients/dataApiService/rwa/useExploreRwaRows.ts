import type { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { useMemo } from 'react'
import { useListRankedRwasQuery } from 'uniswap/src/data/apiClients/dataApiService/rwa/listRankedRwas'
import { mapRankedRwaList } from 'uniswap/src/data/apiClients/dataApiService/rwa/mapRankedRwa'
import type { Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { mapRankedTokenGroupList } from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/mapRankedTokenGroup'
import { useListTokenGroupsQuery } from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/useListTokenGroupsQuery'
import { RWA_CATEGORY_IDS } from 'uniswap/src/features/tokenCategories/rwaCategoryBridge'

/**
 * Grouped rows for an Explore RWA category. Sourced from v2 ListTokenGroups when token categories
 * are on, otherwise from the v1 ListRankedRwas endpoint; both map onto the same `Rwa` row shape so
 * the tables don't know which served them.
 */
export function useExploreRwaRows({
  category,
  chainIds = [],
  enabled = true,
}: {
  category: RwaCategory
  chainIds?: number[]
  enabled?: boolean
}): { rows: Rwa[]; isLoading: boolean; isError: boolean; refetch: () => Promise<unknown> } {
  const isTokenGroupsSource = useIsTokenCategoriesEnabled()

  const groupsQuery = useListTokenGroupsQuery({
    categoryId: RWA_CATEGORY_IDS[category],
    chainIds,
    enabled: enabled && isTokenGroupsSource,
  })
  const rankedRwasQuery = useListRankedRwasQuery({
    category,
    chainIds,
    includeSparkline1d: true,
    enabled: enabled && !isTokenGroupsSource,
  })

  const rows = useMemo(
    () =>
      isTokenGroupsSource
        ? mapRankedTokenGroupList({ response: groupsQuery.data, category })
        : mapRankedRwaList({ response: rankedRwasQuery.data, category }),
    [isTokenGroupsSource, groupsQuery.data, rankedRwasQuery.data, category],
  )

  const { isLoading, isError, refetch } = isTokenGroupsSource ? groupsQuery : rankedRwasQuery

  return { rows, isLoading, isError, refetch }
}
