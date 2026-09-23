import { MOCK_TOKEN_CATEGORIES } from 'uniswap/src/data/apiClients/dataApiService/categories/mockTokenCategories'
import { findTrendingCategory } from 'uniswap/src/features/tokenCategories/findTrendingCategory'

describe(findTrendingCategory, () => {
  it('resolves the Trending category from the mock ListCategories response', () => {
    const trending = findTrendingCategory(MOCK_TOKEN_CATEGORIES)
    expect(trending?.name).toBe('Trending')
  })

  it('returns undefined for missing input', () => {
    expect(findTrendingCategory(undefined)).toBeUndefined()
    expect(findTrendingCategory([])).toBeUndefined()
  })
})
