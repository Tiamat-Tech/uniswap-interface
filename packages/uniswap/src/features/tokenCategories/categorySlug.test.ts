import { MOCK_TOKEN_CATEGORIES } from 'uniswap/src/data/apiClients/dataApiService/categories/mockTokenCategories'
import { findTokenCategoryBySlug } from 'uniswap/src/features/tokenCategories/categorySlug'

describe(findTokenCategoryBySlug, () => {
  it('resolves a slug case-insensitively', () => {
    const category = findTokenCategoryBySlug({ categories: MOCK_TOKEN_CATEGORIES, slug: 'Stocks' })
    expect(category?.name).toBe('Stocks')
  })

  it('returns undefined for unknown or missing slugs', () => {
    expect(findTokenCategoryBySlug({ categories: MOCK_TOKEN_CATEGORIES, slug: 'not-a-category' })).toBeUndefined()
    expect(findTokenCategoryBySlug({ categories: MOCK_TOKEN_CATEGORIES, slug: undefined })).toBeUndefined()
  })
})
