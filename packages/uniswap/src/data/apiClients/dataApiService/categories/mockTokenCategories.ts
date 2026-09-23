import { UniverseChainId } from '@universe/chains'
import {
  DAI as DAI_TOKEN,
  UNI as UNI_TOKENS,
  USDC_MAINNET,
  USDT as USDT_TOKEN,
  WBTC as WBTC_TOKEN,
} from 'uniswap/src/constants/tokens'
import { UniswapStaticUrls } from 'uniswap/src/constants/urls'
import { TokenCategory, TokenCategoryClass, TokenCategoryTopToken } from 'uniswap/src/features/tokenCategories/types'

function mainnetToken(address: string, symbol: string): TokenCategoryTopToken {
  return {
    chainId: 1,
    address,
    symbol,
    logoUrl: `${UniswapStaticUrls.uniswapAssetsBlockchainsBaseUrl}/ethereum/assets/${address}/logo.png`,
  }
}

const WETH = mainnetToken('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 'WETH')
const WBTC = mainnetToken(WBTC_TOKEN.address, 'WBTC')
const USDC = mainnetToken(USDC_MAINNET.address, 'USDC')
const USDT = mainnetToken(USDT_TOKEN.address, 'USDT')
const DAI = mainnetToken(DAI_TOKEN.address, 'DAI')
const UNI = mainnetToken(UNI_TOKENS[UniverseChainId.Mainnet].address, 'UNI')
const AAVE = mainnetToken('0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', 'AAVE')
const LINK = mainnetToken('0x514910771AF9Ca656af840dff83E8264EcF986CA', 'LINK')
const PEPE = mainnetToken('0x6982508145454Ce325dDbE47a25d4ec3d2311933', 'PEPE')
const SHIB = mainnetToken('0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', 'SHIB')

function placeholderToken(index: number, symbol: string): TokenCategoryTopToken {
  return {
    chainId: 1,
    address: `0x${String(index).padStart(40, '0')}`,
    symbol,
    logoUrl: `https://example.com/logos/${symbol.toLowerCase()}.png`,
  }
}

type MockCategoryInput = {
  id: string
  name: string
  description: string
  categoryClass: TokenCategoryClass
  tokenCount: number
  priceChange24hPct: number
  volume1d: number
  topTokens: TokenCategoryTopToken[]
}

function mockCategory({
  id,
  name,
  description,
  categoryClass,
  tokenCount,
  priceChange24hPct,
  volume1d,
  topTokens,
}: MockCategoryInput): TokenCategory {
  return {
    id,
    name,
    description,
    categoryClass,
    stats: {
      tokenCount,
      priceChange24hPct,
      volume1h: volume1d / 24,
      volume1d,
      volume1w: volume1d * 7,
      volume1m: volume1d * 30,
      volume1y: volume1d * 365,
      fdv: volume1d * 40,
    },
    topTokens,
  }
}

export const MOCK_TOKEN_CATEGORIES: TokenCategory[] = [
  mockCategory({
    id: 'popular',
    name: 'Popular',
    description: 'The most swapped tokens on Uniswap over the last day.',
    categoryClass: TokenCategoryClass.Market,
    tokenCount: 100,
    priceChange24hPct: 2.14,
    volume1d: 1_800_000_000,
    topTokens: [WETH, USDC, WBTC],
  }),
  mockCategory({
    id: 'trending',
    name: 'Trending',
    description: 'Tokens with the fastest-growing swap volume right now.',
    categoryClass: TokenCategoryClass.Market,
    tokenCount: 100,
    priceChange24hPct: 6.32,
    volume1d: 940_000_000,
    topTokens: [PEPE, UNI, LINK],
  }),
  mockCategory({
    id: 'recently-launched',
    name: 'New',
    description: 'Recently launched tokens gaining their first traction.',
    categoryClass: TokenCategoryClass.Market,
    tokenCount: 50,
    priceChange24hPct: 11.87,
    volume1d: 120_000_000,
    topTokens: [placeholderToken(1, 'NEWA'), placeholderToken(2, 'NEWB'), placeholderToken(3, 'NEWC')],
  }),
  mockCategory({
    id: 'top-gainers',
    name: 'Top Gainers',
    description: 'The biggest price increases over the last day.',
    categoryClass: TokenCategoryClass.Market,
    tokenCount: 100,
    priceChange24hPct: 18.45,
    volume1d: 310_000_000,
    topTokens: [PEPE, SHIB, LINK],
  }),
  mockCategory({
    id: 'top-losers',
    name: 'Top Losers',
    description: 'The biggest price decreases over the last day.',
    categoryClass: TokenCategoryClass.Market,
    tokenCount: 100,
    priceChange24hPct: -12.63,
    volume1d: 280_000_000,
    topTokens: [SHIB, AAVE, UNI],
  }),
  mockCategory({
    id: 'low-volatility',
    name: 'Low Volatility',
    description: 'Tokens with the steadiest prices over the last month.',
    categoryClass: TokenCategoryClass.Market,
    tokenCount: 100,
    priceChange24hPct: 0.42,
    volume1d: 650_000_000,
    topTokens: [USDC, USDT, DAI],
  }),
  mockCategory({
    id: 'high-volatility',
    name: 'High Volatility',
    description: 'Tokens with the largest price swings over the last month.',
    categoryClass: TokenCategoryClass.Market,
    tokenCount: 100,
    priceChange24hPct: -8.91,
    volume1d: 240_000_000,
    topTokens: [PEPE, SHIB, placeholderToken(4, 'VOLT')],
  }),
  mockCategory({
    id: 'majors',
    name: 'Majors',
    description: 'The largest and most established crypto assets.',
    categoryClass: TokenCategoryClass.Asset,
    tokenCount: 100,
    priceChange24hPct: 1.76,
    volume1d: 2_400_000_000,
    topTokens: [WETH, WBTC, UNI],
  }),
  mockCategory({
    id: 'stablecoins',
    name: 'Stablecoins',
    description: 'Tokens designed to hold a stable value, typically pegged to the US dollar.',
    categoryClass: TokenCategoryClass.Asset,
    tokenCount: 37,
    priceChange24hPct: 0.01,
    volume1d: 3_100_000_000,
    topTokens: [USDC, USDT, DAI],
  }),
  mockCategory({
    id: 'stocks',
    name: 'Stocks',
    description: 'Tokenized shares of publicly traded companies.',
    categoryClass: TokenCategoryClass.Asset,
    tokenCount: 62,
    priceChange24hPct: 0.94,
    volume1d: 85_000_000,
    topTokens: [placeholderToken(5, 'TSLAon'), placeholderToken(6, 'AAPLon'), placeholderToken(7, 'NVDAon')],
  }),
  mockCategory({
    id: 'commodities',
    name: 'Commodities',
    description: 'Tokenized exposure to physical goods like gold and silver.',
    categoryClass: TokenCategoryClass.Asset,
    tokenCount: 12,
    priceChange24hPct: 0.38,
    volume1d: 22_000_000,
    topTokens: [placeholderToken(8, 'XAUon'), placeholderToken(9, 'XAGon'), placeholderToken(10, 'OILon')],
  }),
  mockCategory({
    id: 'etfs',
    name: 'ETFs',
    description: 'Tokenized exchange-traded funds tracking baskets of assets.',
    categoryClass: TokenCategoryClass.Asset,
    tokenCount: 22,
    priceChange24hPct: 0.67,
    volume1d: 31_000_000,
    topTokens: [placeholderToken(11, 'SPYon'), placeholderToken(12, 'QQQon'), placeholderToken(13, 'VTIon')],
  }),
  mockCategory({
    id: 'ai-agents',
    name: 'Agents',
    description: 'Tokens powering autonomous AI agent platforms and economies.',
    categoryClass: TokenCategoryClass.Sector,
    tokenCount: 17,
    priceChange24hPct: 9.28,
    volume1d: 96_000_000,
    topTokens: [placeholderToken(14, 'AGNT'), placeholderToken(15, 'AIXB'), placeholderToken(16, 'FETA')],
  }),
  mockCategory({
    id: 'defi',
    name: 'DeFi',
    description: 'Tokens powering decentralized finance protocols like lending, trading, and derivatives.',
    categoryClass: TokenCategoryClass.Sector,
    tokenCount: 38,
    priceChange24hPct: 4.07,
    volume1d: 410_000_000,
    topTokens: [UNI, AAVE, LINK],
  }),
  mockCategory({
    id: 'ai-infra',
    name: 'Tech & AI',
    description: 'Tokens from projects building infrastructure, compute, and AI applications.',
    categoryClass: TokenCategoryClass.Sector,
    tokenCount: 21,
    priceChange24hPct: 5.53,
    volume1d: 150_000_000,
    topTokens: [LINK, placeholderToken(17, 'RNDR'), placeholderToken(18, 'GRT')],
  }),
  mockCategory({
    id: 'gaming',
    name: 'Gaming',
    description: 'Tokens from blockchain games and gaming ecosystems.',
    categoryClass: TokenCategoryClass.Sector,
    tokenCount: 27,
    priceChange24hPct: -2.19,
    volume1d: 74_000_000,
    topTokens: [placeholderToken(19, 'IMX'), placeholderToken(20, 'GALA'), placeholderToken(21, 'SAND')],
  }),
]
