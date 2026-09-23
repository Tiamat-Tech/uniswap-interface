import type { TFunction } from 'i18next'
import { MOCK_TOKEN_CATEGORIES } from 'uniswap/src/data/apiClients/dataApiService/categories/mockTokenCategories'
import { getRelatedTokensTitle } from 'uniswap/src/features/tokenCategories/getRelatedTokensTitle'
import { isKnownTokenCategoryId } from 'uniswap/src/features/tokenCategories/knownTokenCategoryIds'
import { TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'

const t = ((key: string, options?: { category?: string }) =>
  options?.category ? `${key}:${options.category}` : key) as unknown as TFunction

describe(getRelatedTokensTitle, () => {
  it('has a singular key for every mock category', () => {
    for (const category of MOCK_TOKEN_CATEGORIES) {
      expect(getRelatedTokensTitle({ t, category })).not.toContain('fallback')
    }
  })

  it('knows every mock category id', () => {
    for (const category of MOCK_TOKEN_CATEGORIES) {
      expect(isKnownTokenCategoryId(category.id)).toBe(true)
    }
  })

  it('falls back to the plural name for unknown ids', () => {
    const category = {
      id: 'memes',
      name: 'Memes',
      description: '',
      categoryClass: TokenCategoryClass.Sector,
      topTokens: [],
    }
    expect(getRelatedTokensTitle({ t, category })).toBe('tdp.relatedTokens.single.fallback:Memes')
  })
})
