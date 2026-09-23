import { useIsFocused } from '@react-navigation/native'
import { renderHook } from '@testing-library/react'
import { useMobileTDPHeartbeatCoordinator } from 'src/screens/TokenDetailsScreen/useMobileTDPHeartbeatCoordinator'
import { useHeartbeatCoordinator } from 'src/utils/useHeartbeatCoordinator'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

const mockApolloRefetchQueries = vi.fn().mockResolvedValue(undefined)
const mockQueryClientRefetchQueries = vi.fn().mockResolvedValue(undefined)
const mockQueryClient = { refetchQueries: mockQueryClientRefetchQueries }
const mockRefetchGatedFeatures = vi.hoisted(() => vi.fn())

vi.mock('@apollo/client', () => ({
  useApolloClient: () => ({ refetchQueries: mockApolloRefetchQueries }),
}))

vi.mock('@react-navigation/native', () => ({
  useIsFocused: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => mockQueryClient,
}))

vi.mock('@universe/compliance', () => ({
  refetchGatedFeatures: mockRefetchGatedFeatures,
}))

vi.mock('wallet/src/features/wallet/hooks', () => ({
  useActiveAccountAddress: vi.fn(),
}))

vi.mock('src/utils/useHeartbeatCoordinator', () => ({
  useHeartbeatCoordinator: vi.fn(),
}))

const mockUseIsFocused = vi.mocked(useIsFocused)
const mockUseActiveAccountAddress = vi.mocked(useActiveAccountAddress)
const mockUseHeartbeatCoordinator = vi.mocked(useHeartbeatCoordinator)

function createDeferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })
  return { promise, resolve }
}

describe('useMobileTDPHeartbeatCoordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApolloRefetchQueries.mockReset().mockResolvedValue(undefined)
    mockQueryClientRefetchQueries.mockReset().mockResolvedValue(undefined)
    mockRefetchGatedFeatures.mockReset().mockResolvedValue(undefined)
    mockUseActiveAccountAddress.mockReturnValue(null)
    mockUseIsFocused.mockReturnValue(true)
  })

  it('passes refresh callbacks through to the shared coordinator, enabled while focused', () => {
    renderHook(() => useMobileTDPHeartbeatCoordinator(false))

    expect(mockUseHeartbeatCoordinator).toHaveBeenCalledWith(
      expect.objectContaining({ refresh: expect.any(Function), priceRefresh: expect.any(Function), enabled: true }),
    )
  })

  it('disables the coordinator when the screen is unfocused, so stacked TDPs do not multiply refetches', () => {
    mockUseIsFocused.mockReturnValue(false)
    renderHook(() => useMobileTDPHeartbeatCoordinator(false))

    expect(mockUseHeartbeatCoordinator).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('refetches token stats and price history, but not Zerion-backed balances, on refresh', async () => {
    mockUseActiveAccountAddress.mockReturnValue('0xabc')
    renderHook(() => useMobileTDPHeartbeatCoordinator(false))

    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await refresh()

    expect(mockApolloRefetchQueries).toHaveBeenCalledWith({ include: ['TokenDetailsScreen'] })
    expect(mockApolloRefetchQueries).toHaveBeenCalledWith({ include: ['TokenPriceHistory'] })
    expect(mockQueryClientRefetchQueries).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: [ReactQueryCacheKey.GetPortfolio] }),
    )
  })

  it('refetches price only after everything else has settled', async () => {
    mockUseActiveAccountAddress.mockReturnValue('0xabc')
    const tokenDetails = createDeferred<void>()
    const gatedFeatures = createDeferred<void>()
    const earnQueries = createDeferred<void>()
    mockApolloRefetchQueries.mockImplementation(({ include }: { include: string[] }) => {
      if (include[0] === 'TokenDetailsScreen') {
        return tokenDetails.promise
      }
      return Promise.resolve(undefined)
    })
    mockRefetchGatedFeatures.mockReturnValue(gatedFeatures.promise)
    mockQueryClientRefetchQueries.mockReturnValue(earnQueries.promise)

    renderHook(() => useMobileTDPHeartbeatCoordinator(true))

    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    const refreshPromise = refresh()

    expect(mockApolloRefetchQueries).not.toHaveBeenCalledWith({ include: ['TokenPriceHistory'] })

    tokenDetails.resolve(undefined)
    gatedFeatures.resolve(undefined)
    earnQueries.resolve(undefined)
    await refreshPromise

    expect(mockApolloRefetchQueries).toHaveBeenLastCalledWith({ include: ['TokenPriceHistory'] })
  })

  it('only refetches token price history on priceRefresh', async () => {
    mockUseActiveAccountAddress.mockReturnValue('0xabc')
    renderHook(() => useMobileTDPHeartbeatCoordinator(false))

    const { priceRefresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await priceRefresh?.()

    expect(mockApolloRefetchQueries).toHaveBeenCalledWith({ include: ['TokenPriceHistory'] })
    expect(mockApolloRefetchQueries).toHaveBeenCalledTimes(1)
    expect(mockQueryClientRefetchQueries).not.toHaveBeenCalled()
  })

  it('skips region gating and earn queries for a non-RWA token with no active address', async () => {
    mockUseActiveAccountAddress.mockReturnValue(null)
    renderHook(() => useMobileTDPHeartbeatCoordinator(false))

    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await refresh()

    expect(mockRefetchGatedFeatures).not.toHaveBeenCalled()
    expect(mockQueryClientRefetchQueries).not.toHaveBeenCalled()
  })

  it('refetches region gating for an RWA token', async () => {
    renderHook(() => useMobileTDPHeartbeatCoordinator(true))

    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await refresh()

    expect(mockRefetchGatedFeatures).toHaveBeenCalledExactlyOnceWith(mockQueryClient)
  })

  it('refetches earn vaults and positions when there is an active address', async () => {
    mockUseActiveAccountAddress.mockReturnValue('0xabc')
    renderHook(() => useMobileTDPHeartbeatCoordinator(false))

    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await refresh()

    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith({
      queryKey: [ReactQueryCacheKey.DataApiService, 'listEarnVaults'],
      type: 'active',
    })
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith({
      queryKey: [ReactQueryCacheKey.DataApiService, 'listEarnPositions'],
      type: 'active',
    })
  })
})
