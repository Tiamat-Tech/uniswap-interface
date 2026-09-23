import type { ChartPoint } from 'uniswap/src/components/charts/computeChartPaths'

export enum TokenCategoryClass {
  Market = 'market',
  Asset = 'asset',
  Sector = 'sector',
}

export interface TokenCategoryTopToken {
  chainId: number
  address: string
  symbol: string
  logoUrl: string
}

export interface TokenCategoryStats {
  tokenCount: number
  priceChange24hPct: number
  volume1h: number
  volume1d: number
  volume1w: number
  volume1m: number
  volume1y: number
  fdv?: number
  marketCap?: number
}

export interface TokenCategory {
  id: string
  name: string
  description: string
  categoryClass: TokenCategoryClass
  stats?: TokenCategoryStats
  topTokens: TokenCategoryTopToken[]
}

export interface TokenCategoryDetail {
  category: TokenCategory
  /** Timestamps in ms epoch. Served when the request sets include_charts. */
  volumeSeries: ChartPoint[]
  fdvSeries: ChartPoint[]
}
