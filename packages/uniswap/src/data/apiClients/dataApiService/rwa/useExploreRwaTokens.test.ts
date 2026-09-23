import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { UniverseChainId } from '@universe/chains'
import { useListCategoryTokensQuery } from 'uniswap/src/data/apiClients/dataApiService/rwa/listCategoryTokens'
import { useListRwaTokensQuery } from 'uniswap/src/data/apiClients/dataApiService/rwa/listRwaTokens'
import { useExploreRwaTokens } from 'uniswap/src/data/apiClients/dataApiService/rwa/useExploreRwaTokens'
import { renderHook } from 'uniswap/src/test/test-utils'

const { mockUseIsTokenCategoriesEnabled } = vi.hoisted(() => ({ mockUseIsTokenCategoriesEnabled: vi.fn() }))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useIsTokenCategoriesEnabled: mockUseIsTokenCategoriesEnabled,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/rwa/listRwaTokens', () => ({
  useListRwaTokensQuery: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/rwa/listCategoryTokens', () => ({
  useListCategoryTokensQuery: vi.fn(),
}))

const mockUseListRwaTokensQuery = vi.mocked(useListRwaTokensQuery)
const mockUseListCategoryTokensQuery = vi.mocked(useListCategoryTokensQuery)

const idleQuery = { data: undefined, isLoading: false, isError: false }

describe('useExploreRwaTokens', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseListRwaTokensQuery.mockReturnValue(idleQuery as never)
    mockUseListCategoryTokensQuery.mockReturnValue(idleQuery as never)
  })

  it('reads from category-filtered ListTokens v2 when token categories are on', () => {
    mockUseIsTokenCategoriesEnabled.mockReturnValue(true)

    renderHook(() => useExploreRwaTokens({ category: RwaCategory.COMMODITIES, chainIds: [UniverseChainId.Mainnet] }))

    expect(mockUseListCategoryTokensQuery).toHaveBeenCalledWith({
      categoryId: 'commodities',
      chainIds: [UniverseChainId.Mainnet],
      enabled: true,
    })
    expect(mockUseListRwaTokensQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('falls back to ListRwaTokens when token categories are off', () => {
    mockUseIsTokenCategoriesEnabled.mockReturnValue(false)

    renderHook(() => useExploreRwaTokens({ category: RwaCategory.COMMODITIES }))

    expect(mockUseListRwaTokensQuery).toHaveBeenCalledWith({
      category: RwaCategory.COMMODITIES,
      chainIds: [],
      includeSparkline1d: true,
      enabled: true,
    })
    expect(mockUseListCategoryTokensQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('surfaces the active source loading and error state', () => {
    mockUseIsTokenCategoriesEnabled.mockReturnValue(true)
    mockUseListCategoryTokensQuery.mockReturnValue({ ...idleQuery, isLoading: true } as never)
    mockUseListRwaTokensQuery.mockReturnValue({ ...idleQuery, isError: true } as never)

    const { result } = renderHook(() => useExploreRwaTokens({ category: RwaCategory.COMMODITIES }))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isError).toBe(false)
    expect(result.current.rows).toEqual([])
  })
})
