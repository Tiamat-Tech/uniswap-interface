import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { TokenCategory, TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'
import { describe, expect, it } from 'vitest'
import {
  isRankedRwaCategory,
  resolveGroupedRwaCategory,
  showsRwaDisclaimer,
} from '~/pages/Explore/categories/exploreGroupedCategory'

function makeCategory(id: string, categoryClass: TokenCategoryClass): TokenCategory {
  return { id, name: id, description: '', categoryClass, topTokens: [] }
}

const CATEGORIES = [
  makeCategory('stocks', TokenCategoryClass.Asset),
  makeCategory('etfs', TokenCategoryClass.Asset),
  makeCategory('commodities', TokenCategoryClass.Asset),
  makeCategory('stablecoins', TokenCategoryClass.Asset),
  makeCategory('trending', TokenCategoryClass.Market),
  makeCategory('defi', TokenCategoryClass.Sector),
]

describe('resolveGroupedRwaCategory', () => {
  it('maps fetched asset categories with RWA data to their grouped RwaCategory', () => {
    expect(resolveGroupedRwaCategory({ categoryId: 'stocks', categories: CATEGORIES })).toBe(RwaCategory.STOCKS)
    expect(resolveGroupedRwaCategory({ categoryId: 'etfs', categories: CATEGORIES })).toBe(RwaCategory.ETFS)
    expect(resolveGroupedRwaCategory({ categoryId: 'commodities', categories: CATEGORIES })).toBe(
      RwaCategory.COMMODITIES,
    )
  })

  it('resolves fetched categories without RWA data to UNSPECIFIED (flat table), asset class included', () => {
    expect(resolveGroupedRwaCategory({ categoryId: 'stablecoins', categories: CATEGORIES })).toBe(
      RwaCategory.UNSPECIFIED,
    )
    expect(resolveGroupedRwaCategory({ categoryId: 'trending', categories: CATEGORIES })).toBe(RwaCategory.UNSPECIFIED)
    expect(resolveGroupedRwaCategory({ categoryId: 'defi', categories: CATEGORIES })).toBe(RwaCategory.UNSPECIFIED)
  })

  it('falls back to the static grouped set when the category is not in the fetched list', () => {
    expect(resolveGroupedRwaCategory({ categoryId: 'stocks', categories: [] })).toBe(RwaCategory.STOCKS)
    expect(resolveGroupedRwaCategory({ categoryId: 'etfs', categories: [] })).toBe(RwaCategory.ETFS)
    expect(resolveGroupedRwaCategory({ categoryId: 'commodities', categories: [] })).toBe(RwaCategory.COMMODITIES)
  })

  it('resolves unknown and default ids to UNSPECIFIED', () => {
    expect(resolveGroupedRwaCategory({ categoryId: 'popular', categories: [] })).toBe(RwaCategory.UNSPECIFIED)
    expect(resolveGroupedRwaCategory({ categoryId: 'popular', categories: CATEGORIES })).toBe(RwaCategory.UNSPECIFIED)
    expect(resolveGroupedRwaCategory({ categoryId: 'gaming', categories: [] })).toBe(RwaCategory.UNSPECIFIED)
  })
})

describe('isRankedRwaCategory', () => {
  it('identifies stocks and etfs as ListRankedRwas-served; commodities and flat are not', () => {
    expect(isRankedRwaCategory(RwaCategory.STOCKS)).toBe(true)
    expect(isRankedRwaCategory(RwaCategory.ETFS)).toBe(true)
    expect(isRankedRwaCategory(RwaCategory.COMMODITIES)).toBe(false)
    expect(isRankedRwaCategory(RwaCategory.UNSPECIFIED)).toBe(false)
  })
})

describe('showsRwaDisclaimer', () => {
  it('shows the disclaimer for stocks and etfs only', () => {
    expect(showsRwaDisclaimer(RwaCategory.STOCKS)).toBe(true)
    expect(showsRwaDisclaimer(RwaCategory.ETFS)).toBe(true)
    expect(showsRwaDisclaimer(RwaCategory.COMMODITIES)).toBe(false)
    expect(showsRwaDisclaimer(RwaCategory.UNSPECIFIED)).toBe(false)
  })
})
