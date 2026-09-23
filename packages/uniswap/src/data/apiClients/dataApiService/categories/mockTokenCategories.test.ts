import { MOCK_TOKEN_CATEGORIES } from 'uniswap/src/data/apiClients/dataApiService/categories/mockTokenCategories'

const SLUG_PATTERN = /^[a-z0-9-]+$/

describe('MOCK_TOKEN_CATEGORIES', () => {
  it('uses unique slug ids, matching the backend id format', () => {
    const ids = MOCK_TOKEN_CATEGORIES.map((category) => category.id)
    expect(new Set(ids).size).toBe(ids.length)
    ids.forEach((id) => expect(id).toMatch(SLUG_PATTERN))
  })
})
