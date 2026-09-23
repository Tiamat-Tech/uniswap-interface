import { useApolloClient } from '@apollo/client'
import { useIsFocused } from '@react-navigation/native'
import { useQueryClient } from '@tanstack/react-query'
import { GQLQueries } from '@universe/api'
import { refetchGatedFeatures } from '@universe/compliance'
import { useHeartbeatCoordinator } from 'src/utils/useHeartbeatCoordinator'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

/**
 * Drives synchronized refresh loops for TDP data: a 60-second full refresh covering token
 * stats, price history, and earn vaults/positions, plus regional availability for RWA pages.
 * A 30-second price-only refresh of TokenPriceHistory runs in between so the header/spot price
 * doesn't lag behind the full tick.
 * Zerion-backed queries (balances/GetPortfolio) are intentionally not on the tick, to limit
 * Zerion call volume.
 * On the full tick, price refetches only after everything else has settled — each query
 * updates its own Apollo/React Query consumers as soon as its own network response lands,
 * so racing them concurrently made the header price animate at a slightly different moment
 * each cycle depending on which request happened to finish first. Fetching price last makes
 * its update land at a consistent point in the tick instead.
 * Only the focused TDP ticks: TDP→TDP navigation pushes new instances that all stay mounted,
 * and `apollo.refetchQueries` is client-global, so N unfocused coordinators would each refetch
 * all N screens' queries every tick. While another TDP is focused, its global refetch keeps
 * the unfocused screens' queries fresh; when focus was on a non-TDP screen nothing ticks, so
 * the coordinator fires an immediate full refresh on focus regain to cover pop-back.
 */
export function useMobileTDPHeartbeatCoordinator(isRWA: boolean): void {
  const apollo = useApolloClient()
  const queryClient = useQueryClient()
  const activeAddress = useActiveAccountAddress()
  const isFocused = useIsFocused()

  const priceRefresh = async (): Promise<void> => {
    await apollo.refetchQueries({ include: [GQLQueries.TokenPriceHistory] })
  }

  const refresh = async (): Promise<void> => {
    const otherTasks: Promise<unknown>[] = [apollo.refetchQueries({ include: [GQLQueries.TokenDetailsScreen] })]

    if (isRWA) {
      otherTasks.push(refetchGatedFeatures(queryClient))
    }

    if (activeAddress) {
      otherTasks.push(
        queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.DataApiService, 'listEarnVaults'], type: 'active' }),
        queryClient.refetchQueries({
          queryKey: [ReactQueryCacheKey.DataApiService, 'listEarnPositions'],
          type: 'active',
        }),
      )
    }

    // Wait for everything else first, then refresh price last so its animation always
    // fires at the same point in the tick instead of racing the other requests.
    await Promise.allSettled(otherTasks)
    await apollo.refetchQueries({ include: [GQLQueries.TokenPriceHistory] })
  }

  useHeartbeatCoordinator({ refresh, priceRefresh, enabled: isFocused })
}
