import { ListTransactionsResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { SpamCode as RestSpamCode } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { Token } from '@uniswap/sdk-core'
import dayjs from 'dayjs'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import {
  Amount,
  Chain,
  Currency,
  FeedTransactionListQuery,
  TransactionStatus as RemoteTransactionStatus,
  TransactionType as RemoteTransactionType,
  TokenStandard,
  TransactionListQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { FORMAT_DATE_MONTH, FORMAT_DATE_MONTH_YEAR, LocalizedDayjs } from 'uniswap/src/features/language/localizedDayjs'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  TransactionDetails,
  TransactionDetailsType,
  TransactionListQueryResponse,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyIdToVisibility, NFTKeyToVisibility } from 'uniswap/src/features/visibility/slice'
import { CurrencyId } from 'uniswap/src/types/currency'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { getIsNftHidden } from 'wallet/src/features/nfts/utils'
import { extractOnRampTransactionDetails } from 'wallet/src/features/transactions/history/conversion/extractFiatOnRampTransactionDetails'
import extractRestOnChainTransactionDetails from 'wallet/src/features/transactions/history/conversion/extractOnChainTransactionDetails'
import extractRestFiatOnRampDetails from 'wallet/src/features/transactions/history/conversion/extractRestFiatOnRampDetails'
import extractRestUniswapXOrderDetails from 'wallet/src/features/transactions/history/conversion/extractRestUniswapXOrderDetails'
import extractTransactionDetails from 'wallet/src/features/transactions/history/conversion/extractTransactionDetails'
import { extractUniswapXOrderDetails } from 'wallet/src/features/transactions/history/conversion/extractUniswapXOrderDetails'

export interface AllFormattedTransactions {
  todayTransactionList: TransactionDetails[]
  yesterdayTransactionList: TransactionDetails[]
  // Maps year <-> TransactionSummaryInfo[] for all months before current month
  priorByMonthTransactionList: Record<string, TransactionDetails[]>
  pending: TransactionDetails[]
}

export function formatTransactionsByDate(
  transactions: TransactionDetails[] | undefined,
  localizedDayjs: LocalizedDayjs,
): AllFormattedTransactions {
  // timestamp in ms for start of time periods
  const msTimestampCutoffToday = dayjs().startOf('day').valueOf()
  const msTimestampCutoffYesterday = dayjs().subtract(1, 'day').startOf('day').valueOf()
  const msTimestampCutoffYear = dayjs().startOf('year').valueOf()

  // Segment by time periods.
  const [pending, todayTransactionList, yesterdayTransactionList, olderThan24HTransactionList] = (
    transactions ?? []
  ).reduce<[TransactionDetails[], TransactionDetails[], TransactionDetails[], TransactionDetails[]]>(
    (accum, item) => {
      if (
        // Want all incomplete transactions
        item.status === TransactionStatus.Pending ||
        item.status === TransactionStatus.Cancelling ||
        item.status === TransactionStatus.Replacing
      ) {
        accum[0].push(item)
      } else if (item.addedTime >= msTimestampCutoffToday) {
        // Today's transactions
        accum[1].push(item)
      } else if (item.addedTime >= msTimestampCutoffYesterday) {
        // Yesterday's transactions
        accum[2].push(item)
      } else {
        // Older than yesterday
        accum[3].push(item)
      }
      return accum
    },
    [[], [], [], []],
  )

  const pendingSorted = pending.sort((a, b) => {
    // sort based on timestamp if a UniswapxX order is present, since pending UniswapX orders do not have a nonce.
    if (isUniswapX(a) || isUniswapX(b)) {
      return b.addedTime - a.addedTime
    }

    // sort based on nonce if available, highest nonce first for reverse chronological order.
    const nonceA = a.options.request.nonce
    const nonceB = b.options.request.nonce
    return nonceA && nonceB ? (nonceA < nonceB ? 1 : -1) : 1
  })

  // For all transactions before yesterday, group by month
  const priorByMonthTransactionList = olderThan24HTransactionList.reduce(
    (accum: Record<string, TransactionDetails[]>, item) => {
      const isPreviousYear = item.addedTime < msTimestampCutoffYear
      const key = localizedDayjs(item.addedTime)
        // If in a previous year, append year to key string, else just use month
        // This key is used as the section title in TransactionList
        .format(isPreviousYear ? FORMAT_DATE_MONTH_YEAR : FORMAT_DATE_MONTH)
        .toString()
      const currentMonthList = accum[key] ?? []
      currentMonthList.push(item)
      accum[key] = currentMonthList
      return accum
    },
    {},
  )

  return {
    pending: pendingSorted,
    todayTransactionList,
    yesterdayTransactionList,
    priorByMonthTransactionList,
  }
}

function isNftTransactionHidden({
  parsed,
  nftVisibility,
  isSpam = false,
}: {
  parsed: TransactionDetails | null
  nftVisibility?: NFTKeyToVisibility
  isSpam?: boolean
}): boolean {
  if (parsed?.typeInfo && 'nftSummaryInfo' in parsed.typeInfo && nftVisibility) {
    const nftSummaryInfo = parsed.typeInfo.nftSummaryInfo

    return nftSummaryInfo
      ? getIsNftHidden({
          contractAddress: nftSummaryInfo.address,
          tokenId: nftSummaryInfo.tokenId,
          isSpam,
          nftVisibility,
        })
      : false
  }
  return false
}

/**
 * Transforms api txn data to formatted TransactionDetails array
 * @param data Transaction history data response
 */
export function parseDataResponseToTransactionDetails({
  data,
  hideSpamTokens,
  nftVisibility,
  tokenVisibilityOverrides,
}: {
  data: TransactionListQuery
  hideSpamTokens: boolean
  nftVisibility?: NFTKeyToVisibility
  tokenVisibilityOverrides?: CurrencyIdToVisibility
}): TransactionDetails[] | undefined {
  if (data.portfolios?.[0]?.assetActivities) {
    return data.portfolios[0].assetActivities.reduce((accum: TransactionDetails[], t) => {
      if (t?.details.__typename === TransactionDetailsType.Transaction) {
        const parsed = extractTransactionDetails(t as TransactionListQueryResponse)
        const isSpam = parsed?.typeInfo.isSpam
        const currencyId = extractCurrencyIdFromTx(parsed)
        const spamOverride = currencyId ? tokenVisibilityOverrides?.[currencyId]?.isVisible : false
        const isNFTSpam = isNftTransactionHidden({ parsed, nftVisibility, isSpam })

        if (parsed && !(hideSpamTokens && isSpam && !spamOverride) && !isNFTSpam) {
          accum.push(parsed)
        }
      } else if (t?.details.__typename === TransactionDetailsType.OnRamp) {
        const parsed = extractOnRampTransactionDetails(t as TransactionListQueryResponse)
        if (parsed) {
          accum.push(parsed)
        }
      } else if (t?.details.__typename === TransactionDetailsType.UniswapXOrder) {
        const parsed = extractUniswapXOrderDetails(t as TransactionListQueryResponse)
        if (parsed) {
          accum.push(parsed)
        }
      }

      return accum
    }, [])
  }
  return undefined
}

/**
 * Transforms api txn data to formatted TransactionDetails array
 * @param data Feed transaction history data response
 */
export function parseDataResponseToFeedTransactionDetails(
  data: FeedTransactionListQuery,
  hideSpamTokens?: boolean,
): TransactionDetails[] | undefined {
  const allTransactions: TransactionDetails[] = []

  for (const portfolio of data.portfolios ?? []) {
    if (portfolio?.assetActivities) {
      const transactions = portfolio.assetActivities.reduce((accum: TransactionDetails[], t) => {
        if (t?.details.__typename === TransactionDetailsType.Transaction) {
          const parsed = extractTransactionDetails(t as TransactionListQueryResponse)
          const isSpam = parsed?.typeInfo.isSpam

          if (parsed && !(hideSpamTokens && isSpam)) {
            accum.push({ ...parsed, ownerAddress: portfolio.ownerAddress })
          }
        }
        return accum
      }, [])
      allTransactions.push(...transactions)
    }
  }

  const sortedTransactions = allTransactions.sort((a, b) => b.addedTime - a.addedTime)

  return sortedTransactions
}

/**
 * Constructs a CurrencyAmount based on asset details and quantity. Checks if token is native
 * or ERC20 to determine decimal amount.
 * @param tokenStandard token standard type from api query
 * @param quantity // formatted amount of asset transferred
 * @param decimals // decimals ((optional) if native token)
 * @returns
 */
export function deriveCurrencyAmountFromAssetResponse({
  tokenStandard,
  chain,
  address,
  decimals,
  quantity,
}: {
  tokenStandard: TokenStandard
  chain: Chain
  address: Maybe<string>
  decimals: Maybe<number>
  quantity: string
}): string {
  const chainId = fromGraphQLChain(chain)
  if (!chainId) {
    return ''
  }

  const currency =
    tokenStandard === TokenStandard.Native
      ? nativeOnChain(chainId)
      : address && decimals
        ? new Token(chainId, address, decimals)
        : undefined

  const currencyAmount = getCurrencyAmount({
    value: quantity,
    valueType: ValueType.Exact,
    currency,
  })

  return currencyAmount?.quotient.toString() ?? ''
}

/**
 * Parses an asset from API and returns either the token address or native currency address
 * for the involved asset.
 * @returns Token address, custom native address or null
 */
export function getAddressFromAsset({
  tokenStandard,
  chain,
  address,
}: {
  tokenStandard: TokenStandard
  chain: Chain | undefined
  address: Maybe<string>
}): Maybe<string> {
  const supportedChainId = fromGraphQLChain(chain)
  if (!supportedChainId) {
    return null
  }
  if (tokenStandard === TokenStandard.Native) {
    return getNativeAddress(supportedChainId)
  }
  return address
}

/**
 *
 * @param transactedValue Transacted value amount from TokenTransfer API response
 * @returns parsed USD value as a number if currency is of type USD
 */
export function parseUSDValueFromAssetChange(transactedValue: Maybe<Partial<Amount>>): number | undefined {
  return transactedValue?.currency === Currency.Usd ? transactedValue.value ?? undefined : undefined
}

function extractCurrencyIdFromTx(transaction: TransactionDetails | null): CurrencyId | undefined {
  if (!transaction) {
    return undefined
  }

  if (
    transaction.typeInfo.type === TransactionType.Approve ||
    transaction.typeInfo.type === TransactionType.Send ||
    transaction.typeInfo.type === TransactionType.Receive
  ) {
    return buildCurrencyId(transaction.chainId, transaction.typeInfo.tokenAddress)
  }

  if (transaction.typeInfo.type === TransactionType.Swap) {
    // We only care about output currency because that's the net new asset
    return transaction.typeInfo.outputCurrencyId
  }

  return undefined
}

// eslint-disable-next-line consistent-return
export function remoteTxStatusToLocalTxStatus(
  type: RemoteTransactionType,
  status: RemoteTransactionStatus,
): TransactionStatus {
  switch (status) {
    case RemoteTransactionStatus.Failed:
      if (type === RemoteTransactionType.Cancel) {
        return TransactionStatus.FailedCancel
      }
      return TransactionStatus.Failed
    case RemoteTransactionStatus.Pending:
      if (type === RemoteTransactionType.Cancel) {
        return TransactionStatus.Cancelling
      }
      return TransactionStatus.Pending
    case RemoteTransactionStatus.Confirmed:
      if (type === RemoteTransactionType.Cancel) {
        return TransactionStatus.Canceled
      }
      return TransactionStatus.Success
  }
}

export enum RestTransactionType {
  OnChain = 'onChain',
  UniswapX = 'uniswapX',
  FiatOnRamp = 'fiatOnRamp',
}

export function parseRestResponseToTransactionDetails({
  data,
  hideSpamTokens,
  nftVisibility,
  tokenVisibilityOverrides,
}: {
  data: ListTransactionsResponse
  hideSpamTokens: boolean
  nftVisibility?: NFTKeyToVisibility
  tokenVisibilityOverrides?: CurrencyIdToVisibility
}): TransactionDetails[] | undefined {
  return data.transactions.reduce((accum: TransactionDetails[], transaction) => {
    switch (transaction.transaction.case) {
      case RestTransactionType.OnChain: {
        const parsed = extractRestOnChainTransactionDetails(transaction.transaction.value)
        const isSpam = parsed?.typeInfo.isSpam
        const currencyId = extractCurrencyIdFromTx(parsed)
        const spamOverride = currencyId ? tokenVisibilityOverrides?.[currencyId]?.isVisible : false
        const isNFTSpam = isNftTransactionHidden({ parsed, nftVisibility, isSpam })
        if (parsed && !(hideSpamTokens && isSpam && !spamOverride) && !isNFTSpam) {
          accum.push(parsed)
        }
        break
      }
      case RestTransactionType.UniswapX: {
        const parsed = extractRestUniswapXOrderDetails(transaction.transaction.value)
        if (parsed) {
          accum.push(parsed)
        }
        break
      }
      case RestTransactionType.FiatOnRamp: {
        const parsed = extractRestFiatOnRampDetails(transaction.transaction.value)
        if (parsed) {
          accum.push(parsed)
        }
        break
      }
    }
    return accum
  }, [])
}

/**
 * Determines if a token is spam based on REST API spam codes
 */
export function isRestTokenSpam(spamCode?: RestSpamCode): boolean {
  return spamCode === RestSpamCode.SPAM || spamCode === RestSpamCode.SPAM_URL
}
