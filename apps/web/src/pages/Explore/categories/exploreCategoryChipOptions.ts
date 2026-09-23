import type { TFunction } from 'i18next'
import { useEffect, useState } from 'react'
import type { GeneratedIcon } from 'ui/src'
import { Briefcase } from 'ui/src/components/icons/Briefcase'
import { Etf } from 'ui/src/components/icons/Etf'
import { Nut } from 'ui/src/components/icons/Nut'
import { Ranking } from 'ui/src/components/icons/Ranking'
import { getTokenCategoryIcon } from 'uniswap/src/features/tokenCategories/categoryIcons'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { ExploreCategory } from '~/pages/Explore/categories/useExploreCategory'

/**
 * Non-Popular categories spotlit as chips by default; the remainder live in the All dropdown.
 * The spotlit set is the head of the ordered list, so the token_categories_order Statsig config
 * controls both which categories get a chip and their order.
 */
const SPOTLIT_CHIP_COUNT = 4

export interface ExploreCategoryChipOption {
  id: string
  label: string
  icon?: GeneratedIcon
}

function toChipOption(category: TokenCategory): ExploreCategoryChipOption {
  return { id: category.id, label: category.name, icon: getTokenCategoryIcon(category) }
}

/** Popular is the paramless default, not a BE category, and always owns the first slot. */
function getPopularChipOption(t: TFunction): ExploreCategoryChipOption {
  return { id: ExploreCategory.Popular, label: t('common.popular'), icon: Ranking }
}

function getSpotlitCategories(categories: TokenCategory[]): TokenCategory[] {
  // Popular owns the first slot, so a fetched `popular` category must not claim a spotlit one too.
  return categories.filter((category) => category.id !== ExploreCategory.Popular).slice(0, SPOTLIT_CHIP_COUNT)
}

/** Ids in the default chip row (Popular + spotlit head); a selection outside this set claims the flex slot. */
function getSpotlitCategoryIds(categories: TokenCategory[]): ReadonlySet<string> {
  return new Set<string>([ExploreCategory.Popular, ...getSpotlitCategories(categories).map((category) => category.id)])
}

/**
 * Remembers the most recent non-spotlit selection so the flex slot keeps showing it after moving
 * back to a spotlit category, only ceding the slot to the next non-spotlit selection.
 */
export function useFlexSlotCategoryId({
  categories,
  selectedCategoryId,
}: {
  categories: TokenCategory[]
  selectedCategoryId: string
}): string | undefined {
  const [flexSlotCategoryId, setFlexSlotCategoryId] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (!getSpotlitCategoryIds(categories).has(selectedCategoryId)) {
      setFlexSlotCategoryId(selectedCategoryId)
    }
  }, [categories, selectedCategoryId])
  return flexSlotCategoryId
}

/** The pre-token-categories chip set: the flag-off render, and the fallback when ListCategories fails or is empty. */
export function getStaticCategoryChipOptions(t: TFunction): ExploreCategoryChipOption[] {
  return [
    getPopularChipOption(t),
    { id: ExploreCategory.Stocks, label: t('common.stocks'), icon: Briefcase },
    { id: ExploreCategory.Commodities, label: t('common.commodities'), icon: Nut },
    { id: ExploreCategory.Etfs, label: t('common.etfs'), icon: Etf },
  ]
}

/**
 * Chip options from the fetched category list: Popular first (default, not a BE category), then the
 * spotlit head of the ordered list. The last spotlit slot is a flex slot: a non-spotlit selection
 * (deep link or the All dropdown) takes it over, and `flexSlotCategoryId` keeps the most recent one
 * there after moving back to a spotlit category, so the row always shows the same number of chips.
 */
export function deriveCategoryChipOptions({
  categories,
  selectedCategoryId,
  flexSlotCategoryId,
  t,
}: {
  categories: TokenCategory[]
  selectedCategoryId?: string
  /** The most recent non-spotlit selection (see useFlexSlotCategoryId). */
  flexSlotCategoryId?: string
  t: TFunction
}): ExploreCategoryChipOption[] {
  const options = [getPopularChipOption(t), ...getSpotlitCategories(categories).map(toChipOption)]

  // The current selection wins the flex slot over the persisted id so the active category always has a chip.
  for (const candidateId of [selectedCategoryId, flexSlotCategoryId]) {
    if (candidateId === undefined || options.some((option) => option.id === candidateId)) {
      continue
    }
    const fetched = categories.find((category) => category.id === candidateId)
    // Static ids stay valid deep links even when the response omits them, so the selected chip
    // must fall back to the static option rather than leaving the row with no active chip.
    const fallback = getStaticCategoryChipOptions(t).find((option) => option.id === candidateId)
    const candidate = fetched ? toChipOption(fetched) : fallback
    if (candidate) {
      if (options.length <= SPOTLIT_CHIP_COUNT) {
        options.push(candidate)
      } else if (options[options.length - 1]?.id !== selectedCategoryId) {
        // A persisted id never displaces the selected chip when the selection holds the last slot.
        options[options.length - 1] = candidate
      }
      break
    }
  }

  return options
}
