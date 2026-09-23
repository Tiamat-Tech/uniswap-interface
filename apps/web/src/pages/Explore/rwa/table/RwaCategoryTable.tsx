import type { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { useExploreRwaRows } from 'uniswap/src/data/apiClients/dataApiService/rwa/useExploreRwaRows'
import { RwaExploreTableShell } from '~/pages/Explore/rwa/table/RwaExploreTableShell'
import {
  StocksTableSortStoreContextProvider,
  useStocksTableSortSelection,
} from '~/pages/Explore/rwa/table/stocksTableSortStore'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

/**
 * Chain scope for hosts without a chain URL param (e.g. category details). Presence of the object
 * is the override signal, so `{ chainId: undefined }` means all networks — distinct from omitting
 * the prop, which defers to the Explore URL param.
 */
export interface RwaChainScope {
  chainId: UniverseChainId | undefined
}

interface RwaCategoryTableProps {
  category: RwaCategory
  enableSorting?: boolean
  chainScope?: RwaChainScope
}

function useRwaCategoryTableRows({ category, chainScope }: { category: RwaCategory; chainScope?: RwaChainScope }): {
  rows: ReturnType<typeof useExploreRwaRows>['rows']
  isLoading: boolean
  isError: boolean
} {
  const urlChainId = useChainIdFromUrlParam()
  const chainId = chainScope ? chainScope.chainId : urlChainId
  const chainIds = useMemo(() => (chainId ? [chainId] : []), [chainId])
  return useExploreRwaRows({ category, chainIds })
}

function SortableRwaCategoryTable({ category, chainScope }: Omit<RwaCategoryTableProps, 'enableSorting'>): JSX.Element {
  const { rows, isLoading, isError } = useRwaCategoryTableRows({ category, chainScope })
  const { sortMethod, sortAscending, orderDirection } = useStocksTableSortSelection()

  return (
    <RwaExploreTableShell
      rows={rows}
      isLoading={isLoading}
      isError={isError}
      enableSorting
      sortMethod={sortMethod}
      sortAscending={sortAscending}
      orderDirection={orderDirection}
    />
  )
}

function NonSortableRwaCategoryTable({
  category,
  chainScope,
}: Omit<RwaCategoryTableProps, 'enableSorting'>): JSX.Element {
  const { rows, isLoading, isError } = useRwaCategoryTableRows({ category, chainScope })

  return <RwaExploreTableShell rows={rows} isLoading={isLoading} isError={isError} />
}

/** RWA category table — parent asset rows expand to per-issuer breakdown. */
export function RwaCategoryTable({ category, enableSorting = false, chainScope }: RwaCategoryTableProps): JSX.Element {
  if (enableSorting) {
    return (
      <StocksTableSortStoreContextProvider>
        <SortableRwaCategoryTable category={category} chainScope={chainScope} />
      </StocksTableSortStoreContextProvider>
    )
  }

  return <NonSortableRwaCategoryTable category={category} chainScope={chainScope} />
}
