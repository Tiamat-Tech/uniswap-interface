import {
  HistoryDuration as LiquidityHistoryDuration,
  PoolProtocol,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { GraphQLApi } from '@universe/api'
import type { UniverseChainId } from '@universe/chains'

/** Query vars the Pool Details Page charts pass to the liquidity-service pool-history hooks. */
export type PDPChartQueryVars = {
  addressOrId?: string
  chainId: UniverseChainId
  duration: GraphQLApi.HistoryDuration
  isV2: boolean
  isV3: boolean
  isV4: boolean
}

// Shared request mappers for the liquidity-service pool history endpoints (GetPoolHistoryPrice /
// GetPoolHistoryVolume), which both take a PoolReference + HistoryDuration.

export function toLiquidityHistoryDuration(duration: GraphQLApi.HistoryDuration): LiquidityHistoryDuration {
  switch (duration) {
    case GraphQLApi.HistoryDuration.Hour:
      return LiquidityHistoryDuration.HOUR
    case GraphQLApi.HistoryDuration.Day:
      return LiquidityHistoryDuration.DAY
    case GraphQLApi.HistoryDuration.Week:
      return LiquidityHistoryDuration.WEEK
    case GraphQLApi.HistoryDuration.Month:
      return LiquidityHistoryDuration.MONTH
    case GraphQLApi.HistoryDuration.Year:
      return LiquidityHistoryDuration.YEAR
    case GraphQLApi.HistoryDuration.Max:
      return LiquidityHistoryDuration.MAX
    default:
      return LiquidityHistoryDuration.DAY
  }
}

export function versionFromVars({ isV2, isV3, isV4 }: PDPChartQueryVars): PoolProtocol | undefined {
  if (isV4) {
    return PoolProtocol.V4
  }
  if (isV3) {
    return PoolProtocol.V3
  }
  if (isV2) {
    return PoolProtocol.V2
  }
  return undefined
}
