import { GqlResult } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { useCallback } from 'react'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { type PortfolioBalancesResult } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { useTrendingTokensCurrencyInfos } from 'uniswap/src/components/TokenSelector/hooks/useTrendingTokensCurrencyInfos'

export function useTrendingTokensOptions({
  chainFilter,
  chainIds,
  portfolioData,
}: {
  chainFilter: Maybe<UniverseChainId>
  chainIds?: UniverseChainId[]
  portfolioData: PortfolioBalancesResult
}): GqlResult<TokenOption[] | undefined> {
  const {
    data: portfolioBalancesById,
    error: portfolioBalancesByIdError,
    refetch: portfolioBalancesByIdRefetch,
    loading: loadingPortfolioBalancesById,
  } = portfolioData

  const {
    data: tokens,
    error: tokensError,
    refetch: refetchTokens,
    isLoading: tokensInitialLoading,
    isFetching: tokensFetching,
  } = useTrendingTokensCurrencyInfos(chainFilter, { chainIds })
  // Background refetches count as loading here so the retry button shows a spinner after an error.
  const loadingTokens = tokensInitialLoading || tokensFetching

  const tokenOptions = useCurrencyInfosToTokenOptions({ currencyInfos: tokens, portfolioBalancesById })

  const refetch = useCallback(() => {
    portfolioBalancesByIdRefetch?.()
    void refetchTokens()
  }, [portfolioBalancesByIdRefetch, refetchTokens])

  const error =
    (!portfolioBalancesById ? portfolioBalancesByIdError : undefined) ||
    (!tokenOptions ? (tokensError ?? undefined) : undefined)

  return {
    data: tokenOptions,
    refetch,
    error,
    loading: loadingPortfolioBalancesById || loadingTokens,
  }
}
