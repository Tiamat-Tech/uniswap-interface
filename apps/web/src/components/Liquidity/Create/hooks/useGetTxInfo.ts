import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { DYNAMIC_FEE_DATA, PositionState } from 'components/Liquidity/Create/types'
import { useCreatePositionDependentAmountFallback } from 'components/Liquidity/hooks/useDependentAmountFallback'
import { getTokenOrZeroAddress, validateCurrencyInput } from 'components/Liquidity/utils/currency'
import { getProtocolItems } from 'components/Liquidity/utils/protocolVersion'
import { useCreateLiquidityContext } from 'pages/CreatePosition/CreateLiquidityContextProvider'
import { useEffect, useMemo, useState } from 'react'
import { PositionField } from 'types/position'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useCheckLpApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckLpApprovalQuery'
import { useCreateLpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useCreateLpPositionCalldataQuery'
import {
  CheckApprovalLPRequest,
  CheckApprovalLPResponse,
  CreateLPPositionRequest,
  CreateLPPositionResponse,
  IndependentToken,
} from 'uniswap/src/data/tradingApi/__generated__'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { useTransactionGasFee, useUSDCurrencyAmountOfGasFee } from 'uniswap/src/features/gas/hooks'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTransactionSettingsStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { CreatePositionTxAndGasInfo, LiquidityTransactionType } from 'uniswap/src/features/transactions/liquidity/types'
import { getErrorMessageToDisplay, parseErrorMessageTitle } from 'uniswap/src/features/transactions/liquidity/utils'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { PermitMethod } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { validatePermit, validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

/**
 * @internal - exported for testing
 */
export function generateAddLiquidityApprovalParams({
  address,
  protocolVersion,
  displayCurrencies,
  currencyAmounts,
  generatePermitAsTransaction,
}: {
  address?: string
  protocolVersion: ProtocolVersion
  displayCurrencies: { [field in PositionField]: Maybe<Currency> }
  currencyAmounts?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
  generatePermitAsTransaction?: boolean
}): CheckApprovalLPRequest | undefined {
  const apiProtocolItems = getProtocolItems(protocolVersion)

  if (
    !address ||
    !apiProtocolItems ||
    !currencyAmounts?.TOKEN0 ||
    !currencyAmounts.TOKEN1 ||
    !validateCurrencyInput(displayCurrencies)
  ) {
    return undefined
  }

  return {
    simulateTransaction: true,
    walletAddress: address,
    chainId: currencyAmounts.TOKEN0.currency.chainId,
    protocol: apiProtocolItems,
    token0: getTokenOrZeroAddress(displayCurrencies.TOKEN0),
    token1: getTokenOrZeroAddress(displayCurrencies.TOKEN1),
    amount0: currencyAmounts.TOKEN0.quotient.toString(),
    amount1: currencyAmounts.TOKEN1.quotient.toString(),
    generatePermitAsTransaction: protocolVersion === ProtocolVersion.V4 ? generatePermitAsTransaction : undefined,
  } satisfies CheckApprovalLPRequest
}

/**
 * @internal - exported for testing
 */
export function generateCreateCalldataQueryParams({
  protocolVersion,
  creatingPoolOrPair,
  account,
  approvalCalldata,
  positionState,
  ticks,
  poolOrPair,
  displayCurrencies,
  currencyAmounts,
  independentField,
  slippageTolerance,
}: {
  protocolVersion: ProtocolVersion
  creatingPoolOrPair: boolean | undefined
  account?: AccountDetails
  approvalCalldata?: CheckApprovalLPResponse
  positionState: PositionState
  ticks: [Maybe<number>, Maybe<number>]
  poolOrPair: V3Pool | V4Pool | Pair | undefined
  displayCurrencies: { [field in PositionField]: Maybe<Currency> }
  currencyAmounts?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
  independentField: PositionField
  slippageTolerance?: number
}): CreateLPPositionRequest | undefined {
  const apiProtocolItems = getProtocolItems(protocolVersion)

  if (
    !account?.address ||
    !apiProtocolItems ||
    !currencyAmounts?.TOKEN0 ||
    !currencyAmounts.TOKEN1 ||
    !validateCurrencyInput(displayCurrencies)
  ) {
    return undefined
  }

  const {
    token0Approval,
    token1Approval,
    positionTokenApproval,
    permitData,
    token0PermitTransaction,
    token1PermitTransaction,
  } = approvalCalldata ?? {}

  if (protocolVersion === ProtocolVersion.V2) {
    if (protocolVersion !== positionState.protocolVersion) {
      return undefined
    }

    const pair = poolOrPair

    if (!pair || !displayCurrencies.TOKEN0 || !displayCurrencies.TOKEN1) {
      return undefined
    }

    const independentToken =
      independentField === PositionField.TOKEN0 ? IndependentToken.TOKEN_0 : IndependentToken.TOKEN_1
    const dependentField = independentField === PositionField.TOKEN0 ? PositionField.TOKEN1 : PositionField.TOKEN0
    const independentAmount = currencyAmounts[independentField]
    const dependentAmount = currencyAmounts[dependentField]

    return {
      simulateTransaction: !(
        permitData ||
        token0PermitTransaction ||
        token1PermitTransaction ||
        token0Approval ||
        token1Approval ||
        positionTokenApproval
      ),
      protocol: apiProtocolItems,
      walletAddress: account.address,
      chainId: currencyAmounts.TOKEN0.currency.chainId,
      independentAmount: independentAmount?.quotient.toString(),
      independentToken,
      defaultDependentAmount: dependentAmount?.quotient.toString(),
      slippageTolerance,
      position: {
        pool: {
          token0: getTokenOrZeroAddress(displayCurrencies.TOKEN0),
          token1: getTokenOrZeroAddress(displayCurrencies.TOKEN1),
        },
      },
    } satisfies CreateLPPositionRequest
  }

  if (protocolVersion !== positionState.protocolVersion) {
    return undefined
  }

  const pool = poolOrPair as V4Pool | V3Pool | undefined
  if (!pool || !displayCurrencies.TOKEN0 || !displayCurrencies.TOKEN1) {
    return undefined
  }

  const tickLower = ticks[0]
  const tickUpper = ticks[1]

  if (tickLower === undefined || tickUpper === undefined) {
    return undefined
  }

  const initialPrice = creatingPoolOrPair ? pool.sqrtRatioX96.toString() : undefined
  const tickSpacing = pool.tickSpacing

  const independentToken =
    independentField === PositionField.TOKEN0 ? IndependentToken.TOKEN_0 : IndependentToken.TOKEN_1
  const dependentField = independentField === PositionField.TOKEN0 ? PositionField.TOKEN1 : PositionField.TOKEN0
  const independentAmount = currencyAmounts[independentField]
  const dependentAmount = currencyAmounts[dependentField]

  return {
    simulateTransaction: !(
      permitData ||
      token0PermitTransaction ||
      token1PermitTransaction ||
      token0Approval ||
      token1Approval ||
      positionTokenApproval
    ),
    protocol: apiProtocolItems,
    walletAddress: account.address,
    chainId: currencyAmounts.TOKEN0.currency.chainId,
    independentAmount: independentAmount?.quotient.toString(),
    independentToken,
    initialDependentAmount: initialPrice && dependentAmount?.quotient.toString(), // only set this if there is an initialPrice
    initialPrice,
    slippageTolerance,
    position: {
      tickLower: tickLower ?? undefined,
      tickUpper: tickUpper ?? undefined,
      pool: {
        tickSpacing,
        token0: getTokenOrZeroAddress(displayCurrencies.TOKEN0),
        token1: getTokenOrZeroAddress(displayCurrencies.TOKEN1),
        fee: positionState.fee.isDynamic ? DYNAMIC_FEE_DATA.feeAmount : positionState.fee.feeAmount,
        hooks: positionState.hook,
      },
    },
  } satisfies CreateLPPositionRequest
}

/**
 * @internal - exported for testing
 */
export function generateCreatePositionTxRequest({
  protocolVersion,
  approvalCalldata,
  createCalldata,
  createCalldataQueryParams,
  currencyAmounts,
  poolOrPair,
}: {
  protocolVersion: ProtocolVersion
  approvalCalldata?: CheckApprovalLPResponse
  createCalldata?: CreateLPPositionResponse
  createCalldataQueryParams?: CreateLPPositionRequest
  currencyAmounts?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
  poolOrPair: Pair | undefined
}): CreatePositionTxAndGasInfo | undefined {
  if (!createCalldata || !currencyAmounts?.TOKEN0 || !currencyAmounts.TOKEN1) {
    return undefined
  }

  const validatedApprove0Request = validateTransactionRequest(approvalCalldata?.token0Approval)
  if (approvalCalldata?.token0Approval && !validatedApprove0Request) {
    return undefined
  }

  const validatedApprove1Request = validateTransactionRequest(approvalCalldata?.token1Approval)
  if (approvalCalldata?.token1Approval && !validatedApprove1Request) {
    return undefined
  }

  const validatedRevoke0Request = validateTransactionRequest(approvalCalldata?.token0Cancel)
  if (approvalCalldata?.token0Cancel && !validatedRevoke0Request) {
    return undefined
  }

  const validatedRevoke1Request = validateTransactionRequest(approvalCalldata?.token1Cancel)
  if (approvalCalldata?.token1Cancel && !validatedRevoke1Request) {
    return undefined
  }

  const validatedPermitRequest = validatePermit(approvalCalldata?.permitData)
  if (approvalCalldata?.permitData && !validatedPermitRequest) {
    return undefined
  }

  const validatedToken0PermitTransaction = validateTransactionRequest(approvalCalldata?.token0PermitTransaction)
  const validatedToken1PermitTransaction = validateTransactionRequest(approvalCalldata?.token1PermitTransaction)

  const txRequest = validateTransactionRequest(createCalldata.create)
  if (!txRequest && !(validatedToken0PermitTransaction || validatedToken1PermitTransaction)) {
    // Allow missing txRequest if mismatched (unsigned flow using token0PermitTransaction/2)
    return undefined
  }

  const queryParams: CreateLPPositionRequest | undefined =
    protocolVersion === ProtocolVersion.V4
      ? { ...createCalldataQueryParams, batchPermitData: validatedPermitRequest }
      : createCalldataQueryParams

  return {
    type: LiquidityTransactionType.Create,
    unsigned: Boolean(validatedPermitRequest),
    protocolVersion,
    createPositionRequestArgs: queryParams,
    action: {
      type: LiquidityTransactionType.Create,
      currency0Amount: currencyAmounts.TOKEN0,
      currency1Amount: currencyAmounts.TOKEN1,
      liquidityToken: protocolVersion === ProtocolVersion.V2 ? poolOrPair?.liquidityToken : undefined,
    },
    approveToken0Request: validatedApprove0Request,
    approveToken1Request: validatedApprove1Request,
    txRequest,
    approvePositionTokenRequest: undefined,
    revokeToken0Request: validatedRevoke0Request,
    revokeToken1Request: validatedRevoke1Request,
    permit: validatedPermitRequest ? { method: PermitMethod.TypedData, typedData: validatedPermitRequest } : undefined,
    token0PermitTransaction: validatedToken0PermitTransaction,
    token1PermitTransaction: validatedToken1PermitTransaction,
    positionTokenPermitTransaction: undefined,
  } satisfies CreatePositionTxAndGasInfo
}

export function useGetTxInfo({
  hasInputError,
  invalidRange,
  displayCurrencies,
  currencyAmounts,
}: {
  hasInputError: boolean
  invalidRange: boolean
  displayCurrencies: { [field in PositionField]: Maybe<Currency> }
  currencyAmounts?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
}) {
  const account = useWallet().evmAccount
  const {
    currentTransactionStep,
    positionState,
    protocolVersion,
    creatingPoolOrPair,
    ticks,
    poolOrPair,
    depositState,
    setError,
    setRefetch,
  } = useCreateLiquidityContext()
  const { customDeadline, customSlippageTolerance } = useTransactionSettingsStore((s) => ({
    customDeadline: s.customDeadline,
    customSlippageTolerance: s.customSlippageTolerance,
  }))
  const generatePermitAsTransaction = useUniswapContext().getCanSignPermits?.(poolOrPair?.chainId)

  const [hasCreateErrorResponse, setHasCreateErrorResponse] = useState(false)

  const addLiquidityApprovalParams = useMemo(() => {
    return generateAddLiquidityApprovalParams({
      address: account?.address,
      protocolVersion,
      displayCurrencies,
      currencyAmounts,
      generatePermitAsTransaction,
    })
  }, [account?.address, protocolVersion, displayCurrencies, currencyAmounts, generatePermitAsTransaction])

  const {
    data: approvalCalldata,
    error: approvalError,
    isLoading: approvalLoading,
    refetch: approvalRefetch,
  } = useCheckLpApprovalQuery({
    params: addLiquidityApprovalParams,
    staleTime: 5 * ONE_SECOND_MS,
    retry: false,
    enabled: !!addLiquidityApprovalParams && !hasInputError && !hasCreateErrorResponse && !invalidRange,
  })

  if (approvalError) {
    const message = parseErrorMessageTitle(approvalError, { defaultTitle: 'unknown CheckLpApprovalQuery' })
    logger.error(message, {
      tags: { file: 'CreateLiquidityContextProvider', function: 'useEffect' },
    })
  }

  const gasFeeToken0USD = useUSDCurrencyAmountOfGasFee(poolOrPair?.chainId, approvalCalldata?.gasFeeToken0Approval)
  const gasFeeToken1USD = useUSDCurrencyAmountOfGasFee(poolOrPair?.chainId, approvalCalldata?.gasFeeToken1Approval)
  const gasFeeToken0PermitUSD = useUSDCurrencyAmountOfGasFee(poolOrPair?.chainId, approvalCalldata?.gasFeeToken0Permit)
  const gasFeeToken1PermitUSD = useUSDCurrencyAmountOfGasFee(poolOrPair?.chainId, approvalCalldata?.gasFeeToken1Permit)

  const createCalldataQueryParams = useMemo(() => {
    return generateCreateCalldataQueryParams({
      account,
      approvalCalldata,
      positionState,
      protocolVersion,
      creatingPoolOrPair,
      displayCurrencies,
      ticks,
      poolOrPair,
      currencyAmounts,
      independentField: depositState.exactField,
      slippageTolerance: customSlippageTolerance,
    })
  }, [
    account,
    approvalCalldata,
    currencyAmounts,
    creatingPoolOrPair,
    ticks,
    poolOrPair,
    positionState,
    depositState.exactField,
    customSlippageTolerance,
    displayCurrencies,
    protocolVersion,
  ])

  const isUserCommittedToCreate =
    currentTransactionStep?.step.type === TransactionStepType.IncreasePositionTransaction ||
    currentTransactionStep?.step.type === TransactionStepType.IncreasePositionTransactionAsync

  const isQueryEnabled =
    !isUserCommittedToCreate &&
    !hasInputError &&
    !hasCreateErrorResponse &&
    !approvalLoading &&
    !approvalError &&
    !invalidRange &&
    Boolean(approvalCalldata) &&
    Boolean(createCalldataQueryParams)

  const {
    data: createCalldata,
    error: createError,
    refetch: createRefetch,
  } = useCreateLpPositionCalldataQuery({
    params: createCalldataQueryParams,
    deadlineInMinutes: customDeadline,
    refetchInterval: hasCreateErrorResponse ? false : 5 * ONE_SECOND_MS,
    retry: false,
    enabled: isQueryEnabled,
  })

  useEffect(() => {
    setHasCreateErrorResponse(!!createError)
    setError(getErrorMessageToDisplay({ approvalError, calldataError: createError }))
    setRefetch(() => (approvalError ? approvalRefetch : createError ? createRefetch : undefined)) // this must set it as a function otherwise it will actually call createRefetch immediately
  }, [
    approvalError,
    createError,
    createCalldataQueryParams,
    addLiquidityApprovalParams,
    setError,
    setRefetch,
    createRefetch,
    approvalRefetch,
  ])

  if (createError) {
    const message = parseErrorMessageTitle(createError, { defaultTitle: 'unknown CreateLpPositionCalldataQuery' })
    logger.error(message, {
      tags: { file: 'CreateLiquidityContextProvider', function: 'useEffect' },
    })

    if (createCalldataQueryParams) {
      sendAnalyticsEvent(InterfaceEventName.CreatePositionFailed, {
        message,
        ...createCalldataQueryParams,
      })
    }
  }

  const dependentAmountFallback = useCreatePositionDependentAmountFallback(
    createCalldataQueryParams,
    isQueryEnabled && Boolean(createError),
  )

  const actualGasFee = createCalldata?.gasFee
  const needsApprovals = !!(
    approvalCalldata?.token0Approval ||
    approvalCalldata?.token1Approval ||
    approvalCalldata?.token0Cancel ||
    approvalCalldata?.token1Cancel ||
    approvalCalldata?.token0PermitTransaction ||
    approvalCalldata?.token1PermitTransaction
  )
  const { value: calculatedGasFee } = useTransactionGasFee({
    tx: createCalldata?.create,
    skip: !!actualGasFee || needsApprovals,
  })
  const increaseGasFeeUsd = useUSDCurrencyAmountOfGasFee(
    toSupportedChainId(createCalldata?.create?.chainId) ?? undefined,
    actualGasFee || calculatedGasFee,
  )

  const totalGasFee = useMemo(() => {
    const fees = [gasFeeToken0USD, gasFeeToken1USD, increaseGasFeeUsd, gasFeeToken0PermitUSD, gasFeeToken1PermitUSD]
    return fees.reduce((total, fee) => {
      if (fee && total) {
        return total.add(fee)
      }
      return total || fee
    })
  }, [gasFeeToken0USD, gasFeeToken1USD, increaseGasFeeUsd, gasFeeToken0PermitUSD, gasFeeToken1PermitUSD])

  const txInfo = useMemo(() => {
    return generateCreatePositionTxRequest({
      protocolVersion,
      approvalCalldata,
      createCalldata,
      createCalldataQueryParams,
      currencyAmounts,
      poolOrPair: protocolVersion === ProtocolVersion.V2 ? poolOrPair : undefined,
    })
  }, [approvalCalldata, createCalldata, createCalldataQueryParams, currencyAmounts, poolOrPair, protocolVersion])

  return {
    txInfo,
    gasFeeEstimateUSD: totalGasFee,
    error: getErrorMessageToDisplay({ approvalError, calldataError: createError }),
    dependentAmount: createError && dependentAmountFallback ? dependentAmountFallback : createCalldata?.dependentAmount,
  }
}
