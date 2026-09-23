import type { Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { type OrderDirection } from '~/data/util'
import { ExpandableAssetTable } from '~/pages/Explore/rwa/table/ExpandableAssetTable'
import { useRwaExploreTableShell } from '~/pages/Explore/rwa/table/hooks/useRwaExploreTableShell'
import { useRwaTableFilterEmptyState } from '~/pages/Explore/rwa/table/hooks/useRwaTableFilterEmptyState'
import type { StocksSortMethod } from '~/pages/Explore/rwa/table/stocksTableSortStore'

export function RwaExploreTableShell({
  rows,
  isLoading,
  isError,
  enableSorting = false,
  sortMethod,
  sortAscending,
  orderDirection,
}: {
  rows: Rwa[]
  isLoading: boolean
  isError: boolean
  enableSorting?: boolean
  sortMethod?: StocksSortMethod
  sortAscending?: boolean
  orderDirection?: OrderDirection
}): JSX.Element {
  const { visibleRows, rankByAsset, loadMore } = useRwaExploreTableShell({
    rows,
    sortMethod: enableSorting ? sortMethod : undefined,
    sortAscending: enableSorting ? sortAscending : undefined,
  })

  const emptyState = useRwaTableFilterEmptyState(visibleRows.length === 0 && !isLoading && !isError)

  return (
    <ExpandableAssetTable
      assets={visibleRows}
      rankByAsset={rankByAsset}
      isLoading={isLoading}
      isError={isError}
      loadMore={loadMore}
      enableSorting={enableSorting}
      sortMethod={enableSorting ? sortMethod : undefined}
      orderDirection={enableSorting ? orderDirection : undefined}
      emptyState={emptyState}
    />
  )
}
