import { HistoryDuration, TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { useListTokenGroupsQuery } from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/useListTokenGroupsQuery'
import { renderHook, waitFor } from 'uniswap/src/test/test-utils'

const { mockUseEnabledChains } = vi.hoisted(() => ({ mockUseEnabledChains: vi.fn() }))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: { listTokenGroups: vi.fn() },
}))

const mockListTokenGroups = vi.mocked(dataApiServiceClientV2.listTokenGroups)

describe('useListTokenGroupsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseEnabledChains.mockReturnValue({ chains: [UniverseChainId.Mainnet, UniverseChainId.Base] })
    mockListTokenGroups.mockResolvedValue({ tokenGroups: [] } as never)
  })

  it('requests the category with explicit chainIds, volume sort, and a required sparkline duration', async () => {
    renderHook(() => useListTokenGroupsQuery({ categoryId: 'stocks', chainIds: [UniverseChainId.Base] }))

    await waitFor(() => expect(mockListTokenGroups).toHaveBeenCalledTimes(1))
    expect(mockListTokenGroups).toHaveBeenCalledWith(
      expect.objectContaining({
        chainIds: [UniverseChainId.Base],
        filter: { categoryIds: ['stocks'] },
        sort: { orderBy: TokensOrderBy.VOLUME_1D, ascending: false },
        sparklineDuration: HistoryDuration.DAY,
      }),
    )
  })

  it('falls back to the enabled chains when no chainIds are given', async () => {
    renderHook(() => useListTokenGroupsQuery({ categoryId: 'etfs', chainIds: [] }))

    await waitFor(() => expect(mockListTokenGroups).toHaveBeenCalledTimes(1))
    expect(mockListTokenGroups).toHaveBeenCalledWith(
      expect.objectContaining({ chainIds: [UniverseChainId.Mainnet, UniverseChainId.Base] }),
    )
  })

  it('does not fetch without a category id or when disabled', () => {
    renderHook(() => useListTokenGroupsQuery({ categoryId: undefined, chainIds: [UniverseChainId.Mainnet] }))
    renderHook(() => useListTokenGroupsQuery({ categoryId: 'stocks', chainIds: [], enabled: false }))

    expect(mockListTokenGroups).not.toHaveBeenCalled()
  })
})
