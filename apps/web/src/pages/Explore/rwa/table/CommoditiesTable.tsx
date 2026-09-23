import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useMemo } from 'react'
import { useExploreRwaTokens } from 'uniswap/src/data/apiClients/dataApiService/rwa/useExploreRwaTokens'
import type { RwaChainScope } from '~/pages/Explore/rwa/table/RwaCategoryTable'
import { RwaExploreTableShell } from '~/pages/Explore/rwa/table/RwaExploreTableShell'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

/** Commodities category table — flat rows from category-filtered ListTokens v2 behind the token categories flag, else ListRwaTokens. */
export function CommoditiesTable({ chainScope }: { chainScope?: RwaChainScope } = {}): JSX.Element {
  const urlChainId = useChainIdFromUrlParam()
  const chainId = chainScope ? chainScope.chainId : urlChainId
  const chainIds = useMemo(() => (chainId ? [chainId] : []), [chainId])
  const { rows, isLoading, isError } = useExploreRwaTokens({ category: RwaCategory.COMMODITIES, chainIds })

  return <RwaExploreTableShell rows={rows} isLoading={isLoading} isError={isError} />
}
