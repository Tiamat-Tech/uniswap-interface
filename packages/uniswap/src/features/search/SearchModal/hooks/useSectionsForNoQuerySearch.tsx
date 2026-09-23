import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { ExploreStatsResponse, PoolStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { ALL_NETWORKS_ARG } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { GatedFeature, useIsFeatureGated } from '@universe/compliance'
import { isMobileApp, isWebApp, isWebPlatform } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendUp } from 'ui/src/components/icons/TrendUp'
import { usePoolStatsToPoolOptions } from 'uniswap/src/components/lists/items/pools/usePoolStatsToPoolOptions'
import type { SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { useFavoriteWalletOptions } from 'uniswap/src/components/lists/items/wallets/useFavoriteWalletOptions'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { useMultichainSearchResultsToOptions } from 'uniswap/src/components/TokenSelector/hooks/useMultichainSearchResultsToOptions'
import { useTrendingTokensCurrencyInfos } from 'uniswap/src/components/TokenSelector/hooks/useTrendingTokensCurrencyInfos'
import { useExploreStatsQuery } from 'uniswap/src/data/apiClients/dataApiService/exploreV1/exploreStats'
import { useListRankedRwasQuery } from 'uniswap/src/data/apiClients/dataApiService/rwa/listRankedRwas'
import { mapRankedRwaList } from 'uniswap/src/data/apiClients/dataApiService/rwa/mapRankedRwa'
import { useTopAuctionOptions } from 'uniswap/src/features/dataApi/searchAuctions'
import {
  NUMBER_OF_RESULTS_LONG,
  NUMBER_OF_RESULTS_MEDIUM,
  NUMBER_OF_RESULTS_SHORT,
  NUMBER_OF_SPOTLIT_CATEGORY_TOKENS_ALL_TAB,
  NUMBER_OF_SPOTLIT_CATEGORY_TOKENS_TOKENS_TAB,
} from 'uniswap/src/features/search/SearchModal/constants'
import { useRecentSearchSection } from 'uniswap/src/features/search/SearchModal/hooks/useRecentSearchSection'
import { useSearchMultichainListTokens } from 'uniswap/src/features/search/SearchModal/hooks/useSearchMultichainListTokens'
import type { SearchModalSectionResult } from 'uniswap/src/features/search/SearchModal/hooks/useSectionsForSearchResultsUtils'
import {
  useSpotlitCategorySections,
  type SpotlitCategorySectionsResult,
} from 'uniswap/src/features/search/SearchModal/hooks/useSpotlitCategorySections'
import { buildNoQueryRwaCollectionOptions } from 'uniswap/src/features/search/SearchModal/stocks/noQueryStocks'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { noop } from 'utilities/src/react/noop'
import { holdQueryResult } from 'utilities/src/reactQuery/holdQueryResult'
import type { DerivedQueryResult } from 'utilities/src/reactQuery/types'

// Stable element identity so the stocks section memo (and the sibling memoizedNewTag) isn't busted every render.
const STOCKS_SECTION_ICON = <TrendUp color="$neutral2" size="$icon.16" />

export interface NoQuerySearchSections extends SearchModalSectionResult {
  skeletonPillCount: number
}

type NoQueryTabResult = SearchModalSectionResult & { isInitialLoading: boolean }

type TokenShelfState = Omit<SearchModalSectionResult, 'data'> & {
  isInitialLoading: boolean
  sections: OnchainItemSection<SearchModalOption>[] | undefined
}

/** Spotlit categories when enabled, else the legacy Trending/Stocks pair (`sections` undefined). */
function selectTokenShelfState({
  spotlit,
  legacy,
}: {
  spotlit: SpotlitCategorySectionsResult
  legacy: Omit<TokenShelfState, 'sections'>
}): TokenShelfState {
  return spotlit.enabled
    ? {
        sections: spotlit.sections,
        isLoading: spotlit.isLoading,
        isInitialLoading: spotlit.isInitialLoading,
        error: null,
        refetch: spotlit.refetch,
      }
    : { ...legacy, sections: undefined }
}

/** Both paths fall back to an empty list, so `data` is always present. */
type TrendingTokenResults = Omit<DerivedQueryResult<SearchModalOption[]>, 'data'> & {
  data: SearchModalOption[]
  /** First load only, unlike `isLoading`, which also covers background refetches. */
  isInitialLoading: boolean
}

/**
 * Trending token options for the no-query state, collapsing the flat (single-chain) and multichain
 * paths into one query-like result. Only the path selected by `isMultichainPath` is fetched.
 */
function useTrendingTokenResults({
  chainFilter,
  isMultichainPath,
  pageSize,
  skip,
}: {
  chainFilter: UniverseChainId | null
  isMultichainPath: boolean
  pageSize: number
  skip: boolean
}): TrendingTokenResults {
  const {
    data: tokens,
    error: flatTokensError,
    refetch: refetchFlatTokens,
    isLoading: flatTokensInitialLoading,
    isFetching: flatTokensFetching,
  } = useTrendingTokensCurrencyInfos(chainFilter, { skip: skip || isMultichainPath })

  const {
    data: multichainResults,
    error: multichainTokensError,
    refetch: refetchMultichainTokens,
    isLoading: multichainTokensInitialLoading,
    isFetching: multichainTokensFetching,
  } = useSearchMultichainListTokens({ pageSize, skip: skip || !isMultichainPath })

  const flatTokenOptions = useCurrencyInfosToTokenOptions({ currencyInfos: tokens })
  const multichainTokenOptions = useMultichainSearchResultsToOptions({ results: multichainResults })

  // Background refetches count as loading on both paths so the retry button shows a spinner after an error:
  // once a query has errored it is no longer pending, so `isLoading` stays false for the duration of the retry.
  const flatTokensLoading = flatTokensInitialLoading || flatTokensFetching
  const multichainTokensLoading = multichainTokensInitialLoading || multichainTokensFetching

  return {
    data: isMultichainPath ? (multichainTokenOptions ?? []) : (flatTokenOptions ?? []),
    error: isMultichainPath ? multichainTokensError : flatTokensError,
    isLoading: isMultichainPath ? multichainTokensLoading : flatTokensLoading,
    isInitialLoading: isMultichainPath ? multichainTokensInitialLoading : flatTokensInitialLoading,
    refetch: isMultichainPath ? refetchMultichainTokens : refetchFlatTokens,
  }
}

export function useSectionsForNoQuerySearch({
  chainFilter,
  activeTab,
  auctionSearchEnabled = false,
}: {
  chainFilter: UniverseChainId | null
  activeTab: SearchTab
  auctionSearchEnabled?: boolean
}): NoQuerySearchSections {
  const { t } = useTranslation()
  const isSearchV2UIEnabled = useFeatureFlag(FeatureFlags.SearchV2UI)
  // The "Stocks by 24H volume" section renders unless the caller's region is RWA-blocked; hidden while the
  // region is pending so blocked users never see it flash. Grouping/recents-tagging are not region-gated.
  const stocksSectionEnabled = !useIsFeatureGated(GatedFeature.ISSUER_SPECIFIC_RWA, { pendingValue: true })

  const { sections: recentSearchSection, skeletonPillCount } = useRecentSearchSection({ chainFilter, activeTab })

  const isMultichainPath = chainFilter === null

  // Spotlit categories replace the Trending + Stocks shelves on the All/Tokens tabs; flag off leaves them untouched.
  const isTokenTab = activeTab === SearchTab.Tokens || activeTab === SearchTab.All
  const spotlit = useSpotlitCategorySections({
    chainFilter,
    tokenCount:
      activeTab === SearchTab.All
        ? NUMBER_OF_SPOTLIT_CATEGORY_TOKENS_ALL_TAB
        : NUMBER_OF_SPOTLIT_CATEGORY_TOKENS_TOKENS_TAB,
    skip: !isTokenTab,
  })

  const numberOfTrendingTokens =
    activeTab === SearchTab.All
      ? isMobileApp
        ? NUMBER_OF_RESULTS_MEDIUM
        : NUMBER_OF_RESULTS_SHORT
      : NUMBER_OF_RESULTS_LONG
  const skipTrendingTokensQuery = !isTokenTab || spotlit.enabled

  const {
    data: trendingTokenOptions,
    error: tokensError,
    isLoading: loadingTokens,
    isInitialLoading: trendingTokensInitialLoading,
    refetch: refetchTokens,
  } = useTrendingTokenResults({
    chainFilter,
    isMultichainPath,
    pageSize: numberOfTrendingTokens,
    skip: skipTrendingTokensQuery,
  })

  const trendingTokenSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.TrendingTokens,
    options: trendingTokenOptions.slice(0, numberOfTrendingTokens),
  })

  // Top tokenized stocks for the empty (no-query) state. Error is non-blocking: the section is simply omitted when
  // empty, and the error never surfaces as the modal's error. The shelf uses the app's default enabled-chains
  // policy (testnet-aware) and intentionally does not mirror the grouping index's includeTestnets.
  const chainIds = chainFilter != null ? [chainFilter] : []
  const { data: rankedRwaData, isLoading: rankedRwaLoading } = useListRankedRwasQuery({
    category: RwaCategory.STOCKS,
    chainIds,
    includeSparkline1d: false,
    enabled: stocksSectionEnabled && !spotlit.enabled,
  })
  const stockOptions = useMemo(
    () =>
      rankedRwaData
        ? buildNoQueryRwaCollectionOptions({
            rwas: mapRankedRwaList({ response: rankedRwaData, category: RwaCategory.STOCKS }),
          })
        : [],
    [rankedRwaData],
  )
  const memoizedNewTag = useMemo(() => <NewTag />, [])
  const stocksSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.Stocks,
    name: t('tokens.selector.section.stocks'),
    options: stockOptions,
    rightElement: memoizedNewTag,
    icon: STOCKS_SECTION_ICON,
  })

  // Load trending pools by 24H volume
  const numberOfTrendingPools = activeTab === SearchTab.All ? NUMBER_OF_RESULTS_SHORT : NUMBER_OF_RESULTS_LONG
  const poolQueryVariables = useMemo(
    () => ({
      input: { chainId: chainFilter ? chainFilter.toString() : ALL_NETWORKS_ARG },
      enabled: isWebPlatform && (activeTab === SearchTab.All || activeTab === SearchTab.Pools),
      select: (data: ExploreStatsResponse): PoolStats[] | undefined =>
        data.stats?.poolStats
          .sort((a, b) => (b.volume1Day?.value ?? 0) - (a.volume1Day?.value ?? 0)) // Sort by 24h volume
          .slice(0, numberOfTrendingPools),
    }),
    [activeTab, chainFilter, numberOfTrendingPools],
  )
  const {
    data: topPools,
    isLoading: topPoolsLoading,
    error: topPoolsError,
    refetch: refetchPools,
  } = useExploreStatsQuery<PoolStats[] | undefined>(poolQueryVariables)
  const trendingPoolOptions = usePoolStatsToPoolOptions(topPools)
  const trendingPoolSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.TrendingPools,
    options: trendingPoolOptions,
  })

  const skipFavoriteWallets = activeTab !== SearchTab.Wallets && !(isWebApp && activeTab === SearchTab.All)
  const favoriteWalletsOptions = useFavoriteWalletOptions({ skip: skipFavoriteWallets })
  const favoriteWalletsSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.FavoriteWallets,
    options: favoriteWalletsOptions,
  })

  // Load top auctions (sorted by committed volume)
  const skipTopAuctionsQuery =
    !auctionSearchEnabled || !isWebApp || (activeTab !== SearchTab.Auctions && activeTab !== SearchTab.All)
  const {
    data: topAuctionOptions,
    isLoading: topAuctionsLoading,
    error: topAuctionsError,
    refetch: refetchTopAuctions,
  } = useTopAuctionOptions({
    chainFilter,
    skip: skipTopAuctionsQuery,
    size: activeTab === SearchTab.All ? NUMBER_OF_RESULTS_SHORT : NUMBER_OF_RESULTS_LONG,
  })
  const topAuctionsSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.TopAuctions,
    options: auctionSearchEnabled ? (topAuctionOptions ?? []) : [],
  })

  const stockSections = useMemo(
    () => (stocksSectionEnabled ? (stocksSection ?? []) : []),
    [stocksSectionEnabled, stocksSection],
  )
  const tokenShelf = selectTokenShelfState({
    spotlit,
    legacy: {
      isLoading: loadingTokens,
      isInitialLoading: trendingTokensInitialLoading || (stocksSectionEnabled && rankedRwaLoading),
      error: tokensError,
      refetch: refetchTokens,
    },
  })
  const tokenShelfSections = useMemo(
    () => tokenShelf.sections ?? [...stockSections, ...(trendingTokenSection ?? [])],
    [tokenShelf.sections, stockSections, trendingTokenSection],
  )
  const tokenSections = useMemo(
    () => [...(recentSearchSection ?? []), ...tokenShelfSections],
    [recentSearchSection, tokenShelfSections],
  )
  const poolSections = useMemo(
    () => [...(recentSearchSection ?? []), ...(trendingPoolSection ?? [])],
    [recentSearchSection, trendingPoolSection],
  )
  const walletSections = useMemo(
    () => [...(recentSearchSection ?? []), ...(favoriteWalletsSection ?? [])],
    [recentSearchSection, favoriteWalletsSection],
  )
  const auctionSections = useMemo(
    () => [...(recentSearchSection ?? []), ...(topAuctionsSection ?? [])],
    [recentSearchSection, topAuctionsSection],
  )
  const allSections = useMemo(
    () =>
      isWebPlatform
        ? [
            ...(recentSearchSection ?? []),
            ...tokenShelfSections,
            ...(trendingPoolSection ?? []),
            ...(favoriteWalletsSection ?? []),
            ...(topAuctionsSection ?? []),
          ]
        : [...(recentSearchSection ?? []), ...tokenShelfSections],
    [favoriteWalletsSection, recentSearchSection, tokenShelfSections, topAuctionsSection, trendingPoolSection],
  )
  const poolsLoading = topPoolsLoading || Boolean(topPools?.length && !trendingPoolOptions.length)
  const poolsInitialLoading = isWebPlatform && topPoolsLoading
  const auctionsLoading = auctionSearchEnabled && isWebApp && topAuctionsLoading
  const auctionsError = auctionSearchEnabled ? topAuctionsError : null
  const {
    isInitialLoading: tokensInitialLoading,
    isLoading: tokensLoading,
    error: tokensShelfError,
    refetch: refetchTokensShelf,
  } = tokenShelf

  const tabResult = useMemo((): NoQueryTabResult => {
    switch (activeTab) {
      case SearchTab.Tokens:
        return {
          data: tokenSections,
          isLoading: tokensLoading,
          isInitialLoading: tokensInitialLoading,
          error: tokensShelfError,
          refetch: refetchTokensShelf,
        }
      case SearchTab.Pools:
        return {
          data: poolSections,
          isLoading: poolsLoading,
          isInitialLoading: poolsInitialLoading,
          error: topPoolsError,
          refetch: refetchPools,
        }
      case SearchTab.Wallets:
        return {
          data: walletSections,
          isLoading: false,
          isInitialLoading: false,
          error: null,
          refetch: noop,
        }
      case SearchTab.Auctions:
        return {
          data: auctionSections,
          isLoading: auctionsLoading,
          isInitialLoading: auctionsLoading,
          error: auctionsError,
          refetch: refetchTopAuctions,
        }
      default:
      case SearchTab.All:
        return {
          data: allSections,
          isLoading: tokensLoading,
          // Web's All tab also renders pools and auctions; holding on trending alone would shift the pane as they land.
          isInitialLoading: tokensInitialLoading || poolsInitialLoading || auctionsLoading,
          error: tokensShelfError,
          refetch: refetchTokensShelf,
        }
    }
  }, [
    activeTab,
    allSections,
    auctionSections,
    auctionsError,
    auctionsLoading,
    poolSections,
    poolsLoading,
    poolsInitialLoading,
    topPoolsError,
    tokensLoading,
    tokensInitialLoading,
    refetchPools,
    refetchTokensShelf,
    refetchTopAuctions,
    tokensShelfError,
    tokenSections,
    walletSections,
  ])

  return useMemo((): NoQuerySearchSections => {
    const { isInitialLoading, ...result } = tabResult
    return { ...holdQueryResult({ result, hold: isSearchV2UIEnabled && isInitialLoading }), skeletonPillCount }
  }, [tabResult, isSearchV2UIEnabled, skeletonPillCount])
}
