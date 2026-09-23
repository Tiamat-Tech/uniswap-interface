import { ApolloError } from '@apollo/client'
import { GqlResult } from '@universe/api'
import { useTokenProjectsWithoutBridgedNatives } from 'uniswap/src/features/dataApi/tokenProjects/tokenProjects'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { usePersistedError } from 'uniswap/src/features/dataApi/utils/usePersistedError'

// TokenProjects returns tokens on every network, so for native assets (ETH, SOL, BNB, ...)
// only their native representations are kept — bridged/wrapped copies on other networks
// would otherwise surface as common bases everywhere (e.g. wrapped SOL on EVM chains)
export function useCurrencies(currencyIds: string[]): GqlResult<CurrencyInfo[]> {
  const { data, loading, error, refetch } = useTokenProjectsWithoutBridgedNatives(currencyIds)
  const persistedError = usePersistedError(loading, error instanceof ApolloError ? error : undefined)

  return { data, loading, error: persistedError, refetch }
}
