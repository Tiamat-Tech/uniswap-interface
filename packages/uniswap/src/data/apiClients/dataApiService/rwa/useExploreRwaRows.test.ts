import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { UniverseChainId } from '@universe/chains'
import { useListRankedRwasQuery } from 'uniswap/src/data/apiClients/dataApiService/rwa/listRankedRwas'
import { useExploreRwaRows } from 'uniswap/src/data/apiClients/dataApiService/rwa/useExploreRwaRows'
import { useListTokenGroupsQuery } from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/useListTokenGroupsQuery'
import { renderHook } from 'uniswap/src/test/test-utils'

const { mockUseIsTokenCategoriesEnabled } = vi.hoisted(() => ({ mockUseIsTokenCategoriesEnabled: vi.fn() }))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useIsTokenCategoriesEnabled: mockUseIsTokenCategoriesEnabled,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/rwa/listRankedRwas', () => ({
  useListRankedRwasQuery: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/tokenGroups/useListTokenGroupsQuery', () => ({
  useListTokenGroupsQuery: vi.fn(),
}))

const mockUseListRankedRwasQuery = vi.mocked(useListRankedRwasQuery)
const mockUseListTokenGroupsQuery = vi.mocked(useListTokenGroupsQuery)

const idleQuery = { data: undefined, isLoading: false, isError: false, refetch: vi.fn() }

describe('useExploreRwaRows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseListRankedRwasQuery.mockReturnValue(idleQuery as never)
    mockUseListTokenGroupsQuery.mockReturnValue(idleQuery as never)
  })

  it('reads from ListTokenGroups by category id when token categories are on', () => {
    mockUseIsTokenCategoriesEnabled.mockReturnValue(true)

    renderHook(() => useExploreRwaRows({ category: RwaCategory.STOCKS, chainIds: [UniverseChainId.Mainnet] }))

    expect(mockUseListTokenGroupsQuery).toHaveBeenCalledWith({
      categoryId: 'stocks',
      chainIds: [UniverseChainId.Mainnet],
      enabled: true,
    })
    expect(mockUseListRankedRwasQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('falls back to ListRankedRwas when token categories are off', () => {
    mockUseIsTokenCategoriesEnabled.mockReturnValue(false)

    renderHook(() => useExploreRwaRows({ category: RwaCategory.ETFS }))

    expect(mockUseListRankedRwasQuery).toHaveBeenCalledWith({
      category: RwaCategory.ETFS,
      chainIds: [],
      includeSparkline1d: true,
      enabled: true,
    })
    expect(mockUseListTokenGroupsQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('surfaces the active source loading and error state', () => {
    mockUseIsTokenCategoriesEnabled.mockReturnValue(true)
    mockUseListTokenGroupsQuery.mockReturnValue({ ...idleQuery, isLoading: true } as never)
    mockUseListRankedRwasQuery.mockReturnValue({ ...idleQuery, isError: true } as never)

    const { result } = renderHook(() => useExploreRwaRows({ category: RwaCategory.COMMODITIES }))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isError).toBe(false)
    expect(result.current.rows).toEqual([])
  })
})
