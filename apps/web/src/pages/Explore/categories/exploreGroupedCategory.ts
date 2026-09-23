import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import {
  getRwaCategoryForTokenCategory,
  RWA_CATEGORY_IDS,
} from 'uniswap/src/features/tokenCategories/rwaCategoryBridge'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { ExploreCategory } from '~/pages/Explore/categories/useExploreCategory'

/** Explore categories that render grouped-ticker tables instead of the standard ranked token list. */
export const GROUPED_EXPLORE_CATEGORIES = [
  ExploreCategory.Stocks,
  ExploreCategory.Commodities,
  ExploreCategory.Etfs,
] as const satisfies readonly ExploreCategory[]

// The bridge ids and the static grouped ids are the same slugs by contract; this map is the
// flag-off/loading detection path, derived from the bridge so the two can't drift.
const RWA_CATEGORY_BY_STATIC_ID = new Map(
  Object.entries(RWA_CATEGORY_IDS).map(([rwaCategory, id]) => [id, Number(rwaCategory) as RwaCategory]),
)

/**
 * Resolves the grouped-table RwaCategory for the selected Explore category id, or UNSPECIFIED for
 * flat categories. Categories in the fetched list resolve via the bridge; ids the bridge doesn't
 * recognize (or that are missing from the list) fall back to the static grouped set so flag-off
 * rendering and static deep links behave as today — and so a fetched stocks/etfs can never drop
 * the legal disclaimer without a client-side change to this map.
 */
export function resolveGroupedRwaCategory({
  categoryId,
  categories,
}: {
  categoryId: string
  categories: TokenCategory[]
}): RwaCategory {
  const match = categories.find((category) => category.id === categoryId)
  if (match) {
    const bridged = getRwaCategoryForTokenCategory(match)
    if (bridged !== RwaCategory.UNSPECIFIED) {
      return bridged
    }
  }
  return RWA_CATEGORY_BY_STATIC_ID.get(categoryId) ?? RwaCategory.UNSPECIFIED
}

/** Grouped categories served by ListRankedRwas (the endpoint swap-out point); Commodities rides its own v1 read. */
export function isRankedRwaCategory(rwaCategory: RwaCategory): rwaCategory is RwaCategory.STOCKS | RwaCategory.ETFS {
  return rwaCategory === RwaCategory.STOCKS || rwaCategory === RwaCategory.ETFS
}

/**
 * Stocks and ETFs carry the legal disclaimer; Commodities and flat categories don't. Kept separate
 * from isRankedRwaCategory so narrowing that for an endpoint migration can't drop legal copy.
 */
export function showsRwaDisclaimer(rwaCategory: RwaCategory): boolean {
  return rwaCategory === RwaCategory.STOCKS || rwaCategory === RwaCategory.ETFS
}
