import { useQuery } from '@tanstack/react-query'
import { GqlResult } from '@universe/api'
import { normalizeTokenAddressForCache, UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { getCommonBase } from 'uniswap/src/constants/routing'
import {
  getGetTokenQueryOptions,
  getGetTokensQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { restV2TokenToCurrencyInfo } from 'uniswap/src/features/dataApi/utils/restV2TokenToCurrencyInfo'
import {
  buildNativeCurrencyId,
  buildWrappedNativeCurrencyId,
  currencyIdToAddress,
  currencyIdToChain,
} from 'uniswap/src/utils/currencyId'

function useCurrencyInfoQuery(
  _currencyId?: string,
  options?: { refetch?: boolean; skip?: boolean },
): { currencyInfo: Maybe<CurrencyInfo>; loading: boolean; error?: Error } {
  const restParams = useMemo(
    () => (_currencyId ? currencyIdToRestContractInput(_currencyId) : undefined),
    [_currencyId],
  )
  const restQueryResult = useQuery(
    getGetTokenQueryOptions({
      params: restParams,
      enabled: !!restParams && !options?.skip,
    }),
  )

  const currencyInfo = useMemo(() => {
    if (!_currencyId) {
      return undefined
    }

    const chainId = currencyIdToChain(_currencyId)
    let address: Address | undefined
    try {
      address = currencyIdToAddress(_currencyId)
    } catch (_error) {
      return undefined
    }

    const restToken = restQueryResult.data?.token
    const logoUrlOverride = restToken?.project?.logoUrl

    if (chainId && address) {
      const commonBase = getCommonBase(chainId, address)
      if (commonBase) {
        // Creating new object to avoid error "Cannot assign to read only property"
        const copyCommonBase = { ...commonBase }
        // Related to TODO(WEB-5111)
        // Some common base images are broken so this'll ensure we read from uniswap images.
        // Native currencies are excluded: their commonBase logo is our own maintained static
        // asset, never the "broken image" case this override exists for — and backend project
        // metadata for the native placeholder address (0xeee/0x0) isn't reliable enough to trust.
        if (logoUrlOverride && !commonBase.currency.isNative) {
          copyCommonBase.logoUrl = logoUrlOverride
        }
        copyCommonBase.currencyId = _currencyId

        return copyCommonBase
      }
    }

    return restToken && restV2TokenToCurrencyInfo(restToken)
  }, [_currencyId, restQueryResult.data?.token])

  return {
    currencyInfo,
    loading: restQueryResult.isLoading,
    error: restQueryResult.error ?? undefined,
  }
}

// GetTokensResponse is best-effort: the response may omit unfound tokens or return them out
// of order, so results must be matched back to the request by chainId+address.
function restTokenKey(chainId: number, address: string): string {
  return `${chainId}-${normalizeTokenAddressForCache(address)}`
}

function useRestCurrencyInfos(
  currencyIds: string[],
  options?: { skip?: boolean },
): { data: Maybe<CurrencyInfo>[]; loading: boolean; error?: Error } {
  // Resolved once and reused for both the request and response-matching below, so the native
  // currency's REST-wire address (e.g. 0x0, which can differ from the currencyId's own address)
  // can't drift between the two.
  const restContracts = useMemo(() => currencyIds.map((id) => currencyIdToRestContractInput(id)), [currencyIds])
  const restParams = useMemo(() => ({ tokens: restContracts }), [restContracts])

  const queryResult = useQuery(
    getGetTokensQueryOptions({
      params: restParams,
      enabled: !options?.skip && !!currencyIds.length,
    }),
  )

  const data = useMemo(() => {
    const tokenByKey = new Map(
      (queryResult.data?.tokens ?? []).map((token) => [restTokenKey(token.chainId, token.address), token]),
    )

    return restContracts.map(({ chainId, address }) => {
      const token = tokenByKey.get(restTokenKey(chainId, address))
      return token && restV2TokenToCurrencyInfo(token)
    })
  }, [restContracts, queryResult.data?.tokens])

  return { data, loading: queryResult.isLoading, error: queryResult.error ?? undefined }
}

export function useCurrencyInfo(
  _currencyId?: string,
  options?: { refetch?: boolean; skip?: boolean },
): Maybe<CurrencyInfo> {
  const { currencyInfo } = useCurrencyInfoQuery(_currencyId, options)
  return currencyInfo
}

export function useCurrencyInfoWithLoading(
  _currencyId?: string,
  options?: { refetch?: boolean; skip?: boolean },
): {
  currencyInfo: Maybe<CurrencyInfo>
  loading: boolean
  error?: Error
} {
  return useCurrencyInfoQuery(_currencyId, options)
}

export function useCurrencyInfos(
  _currencyIds: string[],
  options?: { refetch?: boolean; skip?: boolean },
): Maybe<CurrencyInfo>[] {
  const { data } = useRestCurrencyInfos(_currencyIds, { skip: options?.skip })
  return data
}

export function useCurrencyInfosWithLoading(
  _currencyIds: string[],
  options?: { refetch?: boolean; skip?: boolean },
): GqlResult<CurrencyInfo[]> {
  const restResult = useRestCurrencyInfos(_currencyIds, { skip: options?.skip })

  return useMemo(() => {
    return {
      data: restResult.data.filter((currencyInfo): currencyInfo is CurrencyInfo => !!currencyInfo),
      loading: restResult.loading,
      error: restResult.error,
    }
  }, [restResult.data, restResult.loading, restResult.error])
}

export function useNativeCurrencyInfo(chainId: UniverseChainId): Maybe<CurrencyInfo> {
  const nativeCurrencyId = buildNativeCurrencyId(chainId)
  return useCurrencyInfo(nativeCurrencyId)
}

export function useWrappedNativeCurrencyInfo(chainId: UniverseChainId): Maybe<CurrencyInfo> {
  const wrappedCurrencyId = buildWrappedNativeCurrencyId(chainId)
  return useCurrencyInfo(wrappedCurrencyId)
}
