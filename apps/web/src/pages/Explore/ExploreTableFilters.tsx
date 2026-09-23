import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import {
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { VolumeTimeFrameSelector } from '~/features/Explore/VolumeTimeFrameSelector'
import { PoolsFilter } from '~/features/Liquidity/PoolsFilter/PoolsFilter'
import { TableNetworkFilter } from '~/pages/Explore/NetworkFilter'
import { ExploreProtocolFilter } from '~/pages/Explore/ProtocolFilter'
import { SearchBar } from '~/pages/Explore/SearchBar'
import { ExploreTab } from '~/types/explore'

/**
 * Filter controls in the Explore tables toolbar. On the Pools tab with the `AdvancedPoolsFiltering`
 * flag on, this collapses to the shared {@link PoolsFilter} (search + Filter modal); otherwise it
 * renders the existing per-tab network / protocol / search controls.
 */
export function ExploreTableFilters({
  currentKey,
  tabSupportedNetworks,
}: {
  currentKey: ExploreTab
  tabSupportedNetworks: UniverseChainId[]
}): JSX.Element {
  const isAdvancedPoolsFilteringEnabled = useFeatureFlag(FeatureFlags.AdvancedPoolsFiltering)
  const poolsFilter = useExploreTablesFilterStore((s) => s.poolsFilter)
  // Published by the Pools table from its loaded rows (see ExploreTopPoolTableContent).
  const poolsAprRange = useExploreTablesFilterStore((s) => s.poolsAprRange)
  const { setPoolsFilter } = useExploreTablesFilterStoreActions()

  if (currentKey === ExploreTab.Pools && isAdvancedPoolsFilteringEnabled) {
    return (
      <PoolsFilter
        search={<SearchBar tab={currentKey} />}
        value={poolsFilter}
        onApply={setPoolsFilter}
        aprRange={poolsAprRange}
        networks={tabSupportedNetworks}
      />
    )
  }

  return (
    <>
      {currentKey !== ExploreTab.Toucan && <TableNetworkFilter networks={tabSupportedNetworks} />}
      {currentKey === ExploreTab.Tokens && <VolumeTimeFrameSelector />}
      {currentKey === ExploreTab.Pools && <ExploreProtocolFilter />}
      {currentKey !== ExploreTab.Toucan && <SearchBar tab={currentKey} />}
    </>
  )
}
