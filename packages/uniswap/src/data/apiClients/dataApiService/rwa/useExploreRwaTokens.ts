import type { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { useMemo } from 'react'
import { useListCategoryTokensQuery } from 'uniswap/src/data/apiClients/dataApiService/rwa/listCategoryTokens'
import { useListRwaTokensQuery } from 'uniswap/src/data/apiClients/dataApiService/rwa/listRwaTokens'
import { mapRankedMultichainTokenList } from 'uniswap/src/data/apiClients/dataApiService/rwa/mapRankedMultichainTokenRwa'
import { mapRwaTokenList } from 'uniswap/src/data/apiClients/dataApiService/rwa/mapRwaToken'
import type { Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { RWA_CATEGORY_IDS } from 'uniswap/src/features/tokenCategories/rwaCategoryBridge'

/**
 * Flat Commodities rows (one per token, as on prod today). Sourced from v2 ListTokens filtered by category id
 * when token categories are on, otherwise from v1 ListRwaTokens. Deliberately not ListTokenGroups and typed
 * to Commodities only: Stocks/ETFs group by underlying via `useExploreRwaRows`, and a grouped category routed
 * here would silently flatten. Falls back to v1 if the category has no bridged id so a misconfiguration fails
 * visibly rather than as an empty table with no request.
 */
export function useExploreRwaTokens({
  category,
  chainIds = [],
  enabled = true,
}: {
  category: RwaCategory.COMMODITIES
  chainIds?: number[]
  enabled?: boolean
}): { rows: Rwa[]; isLoading: boolean; isError: boolean } {
  const categoryId = RWA_CATEGORY_IDS[category]
  const isV2Source = useIsTokenCategoriesEnabled() && categoryId !== undefined

  const categoryTokensQuery = useListCategoryTokensQuery({
    categoryId,
    chainIds,
    enabled: enabled && isV2Source,
  })
  const rwaTokensQuery = useListRwaTokensQuery({
    category,
    chainIds,
    includeSparkline1d: true,
    enabled: enabled && !isV2Source,
  })

  const rows = useMemo(
    () => (isV2Source ? mapRankedMultichainTokenList(categoryTokensQuery.data) : mapRwaTokenList(rwaTokensQuery.data)),
    [isV2Source, categoryTokensQuery.data, rwaTokensQuery.data],
  )

  const { isLoading, isError } = isV2Source ? categoryTokensQuery : rwaTokensQuery

  return { rows, isLoading, isError }
}
