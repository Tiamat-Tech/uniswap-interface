import { TokenRankingsResponse, TokenRankingsStat } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { ALL_NETWORKS_ARG, CustomRankingType, SharedQueryClient } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { useTrendingTokensCurrencyInfos } from 'uniswap/src/components/TokenSelector/hooks/useTrendingTokensCurrencyInfos'
import { renderHook, waitFor } from 'uniswap/src/test/test-utils'

const { mockTokenRankings } = vi.hoisted(() => ({
  mockTokenRankings: vi.fn(),
}))

// Route the real hook through an in-memory transport so TanStack's `select` memoization is exercised for real.
vi.mock('uniswap/src/data/transport', async (importOriginal) => {
  const { createRouterTransport } = await import('@connectrpc/connect')
  const { ExploreStatsService } = await import('@uniswap/client-explore/dist/uniswap/explore/v1/service_connect')
  return {
    ...(await importOriginal<typeof import('uniswap/src/data/transport')>()),
    uniswapGetTransport: createRouterTransport(({ service }) => {
      service(ExploreStatsService, { tokenRankings: mockTokenRankings })
    }),
  }
})

const mainnetStat = new TokenRankingsStat({
  chain: 'ETHEREUM',
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  name: 'USD Coin',
  symbol: 'USDC',
  decimals: 6,
})

const arbitrumStat = new TokenRankingsStat({
  chain: 'ARBITRUM',
  address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  name: 'USD Coin',
  symbol: 'USDC',
  decimals: 6,
})

function createResponse(trendingStats: TokenRankingsStat[]): TokenRankingsResponse {
  return new TokenRankingsResponse({
    tokenRankings: { [CustomRankingType.Trending]: { tokens: trendingStats } },
  })
}

function chainIdsOf(result: { data?: { currency: { chainId: number } }[] }): number[] {
  return result.data?.map((info) => info.currency.chainId) ?? []
}

describe('useTrendingTokensCurrencyInfos', () => {
  beforeEach(() => {
    mockTokenRankings.mockReset()
    mockTokenRankings.mockResolvedValue(createResponse([mainnetStat, arbitrumStat]))
    SharedQueryClient.clear()
  })

  it('should request ALL_NETWORKS when there is no chain filter', async () => {
    const { result } = renderHook(() => useTrendingTokensCurrencyInfos(null))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(mockTokenRankings).toHaveBeenCalledWith(
      expect.objectContaining({ chainId: ALL_NETWORKS_ARG }),
      expect.anything(),
    )
    expect(chainIdsOf(result.current)).toEqual([UniverseChainId.Mainnet, UniverseChainId.ArbitrumOne])
  })

  it('should request the filtered chain and skip the chainIds filter', async () => {
    const { result } = renderHook(() =>
      useTrendingTokensCurrencyInfos(UniverseChainId.ArbitrumOne, { chainIds: [UniverseChainId.Mainnet] }),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(mockTokenRankings).toHaveBeenCalledWith(
      expect.objectContaining({ chainId: UniverseChainId.ArbitrumOne.toString() }),
      expect.anything(),
    )
    expect(chainIdsOf(result.current)).toEqual([UniverseChainId.Mainnet, UniverseChainId.ArbitrumOne])
  })

  it('should not fetch when skip is true', () => {
    const { result } = renderHook(() => useTrendingTokensCurrencyInfos(null, { skip: true }))

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
    expect(mockTokenRankings).not.toHaveBeenCalled()
  })

  it('should re-filter cached data when chainIds changes without refetching', async () => {
    const { result, rerender } = renderHook(
      (chainIds: UniverseChainId[]) => useTrendingTokensCurrencyInfos(null, { chainIds }),
      { initialProps: [[UniverseChainId.Mainnet]] },
    )

    await waitFor(() => {
      expect(chainIdsOf(result.current)).toEqual([UniverseChainId.Mainnet])
    })

    rerender([[UniverseChainId.Mainnet, UniverseChainId.ArbitrumOne]])

    await waitFor(() => {
      expect(chainIdsOf(result.current)).toEqual([UniverseChainId.Mainnet, UniverseChainId.ArbitrumOne])
    })
    expect(mockTokenRankings).toHaveBeenCalledTimes(1)
  })
})
