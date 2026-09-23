import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { areEvmAddressesEqual, UniverseChainId } from '@universe/chains'
import { Flex, iconSizes, type ModifierPressProps, Text } from '@universe/mycelium'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import Badge from 'uniswap/src/components/badge/Badge'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { FocusedRowControl, OptionItem } from 'uniswap/src/components/lists/items/OptionItem'
import {
  PoolContextMenuAction,
  PoolOptionItemContextMenu,
} from 'uniswap/src/components/lists/items/pools/PoolOptionItemContextMenu'
import { UniswapBuiltHookMark } from 'uniswap/src/components/logos/UniswapBuiltHookMark'
import { BIPS_BASE, ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DYNAMIC_FEE_AMOUNT } from 'uniswap/src/constants/pools'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getHookRegistryKey, useHookRegistryMap } from 'uniswap/src/features/poolHooks/hooks/useHookRegistryMap'
import { useUniswapHookProvenance } from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ellipseMiddle, shortenAddress } from 'utilities/src/addresses'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

interface PoolOptionItemProps extends ModifierPressProps {
  token0CurrencyInfo: CurrencyInfo
  token1CurrencyInfo: CurrencyInfo
  poolId: string
  chainId: UniverseChainId
  onPress: () => void
  protocolVersion: ProtocolVersion
  hookAddress?: string
  feeTier: number
  focusedRowControl?: FocusedRowControl
  rightElement?: JSX.Element
}

function PoolOptionItemInner({
  token0CurrencyInfo,
  token1CurrencyInfo,
  poolId,
  chainId,
  onPress,
  protocolVersion,
  hookAddress,
  feeTier,
  focusedRowControl,
  rightElement,
  modifierPressHref,
  onModifierPress,
}: PoolOptionItemProps): JSX.Element {
  const { t } = useTranslation()
  const poolName = `${token0CurrencyInfo.currency.symbol}/${token1CurrencyInfo.currency.symbol}`
  const getUniswapHookProvenance = useUniswapHookProvenance()

  // A zero hook address means "no hook" (the search/stats payloads don't all filter it out upstream).
  const poolHookAddress = hookAddress && !areEvmAddressesEqual(hookAddress, ZERO_ADDRESS) ? hookAddress : undefined
  const hookRegistry = useHookRegistryMap({ chainId, enabled: !!poolHookAddress })
  const hookName = poolHookAddress
    ? hookRegistry?.get(getHookRegistryKey({ chainId, hookAddress: poolHookAddress }))?.name
    : undefined
  // Registry membership alone isn't Uniswap authorship — a third-party hook can be registry-known too.
  // The mark only appears when the provenance config actually attributes this hook to Uniswap, matching
  // the pool detail page's split (`LiquidityPositionInfoBadges`/`useUniswapHookProvenance`).
  const isUniswapBuiltHook =
    !!poolHookAddress && getUniswapHookProvenance({ chainId, address: poolHookAddress }) !== undefined

  const optionItem = (
    <OptionItem
      image={
        <SplitLogo
          size={iconSizes.icon40}
          inputCurrencyInfo={token0CurrencyInfo}
          outputCurrencyInfo={token1CurrencyInfo}
          chainId={chainId}
        />
      }
      title={poolName}
      subtitle={
        <Text color="$neutral2" numberOfLines={1} variant="body3">
          {protocolVersion !== ProtocolVersion.V4
            ? shortenAddress({ address: poolId })
            : ellipseMiddle({ str: poolId, charsStart: 6 })}
        </Text>
      }
      badge={
        <Flex row gap="$spacing2" alignItems="center">
          <Badge size="small" placement="start">
            {ProtocolVersion[protocolVersion].toLowerCase()}
          </Badge>
          {poolHookAddress ? (
            // A raw-address fallback, and a registry-known hook Uniswap didn't build or configure,
            // both get no mark — matching the detail page's Uniswap-built-vs-not split.
            <Badge
              testID={TestID.PoolOptionItemHookBadge}
              size="small"
              placement="middle"
              icon={hookName && isUniswapBuiltHook ? <UniswapBuiltHookMark /> : undefined}
              {...(hookName && { maxWidth: 160, numberOfLines: 1 })}
            >
              {hookName || shortenAddress({ address: poolHookAddress, chars: 4 })}
            </Badge>
          ) : null}
          <Badge size="small" placement="end">
            {/* v4 dynamic-fee pools arrive with the DYNAMIC_FEE_AMOUNT sentinel in fee_tier, which
                would otherwise format as ~838%. The search payload carries no isDynamic flag. */}
            {feeTier === DYNAMIC_FEE_AMOUNT ? t('common.dynamic') : `${feeTier / BIPS_BASE}%`}
          </Badge>
        </Flex>
      }
      focusedRowControl={focusedRowControl}
      rightElement={rightElement}
      modifierPressHref={modifierPressHref}
      onPress={onPress}
      onModifierPress={onModifierPress}
    />
  )
  const { value: isContextMenuOpen, setFalse: closeContextMenu, setTrue: openContextMenu } = useBooleanState(false)

  return (
    <PoolOptionItemContextMenu
      actions={[PoolContextMenuAction.CopyAddress, PoolContextMenuAction.Share]}
      isOpen={isContextMenuOpen}
      closeMenu={closeContextMenu}
      openMenu={openContextMenu}
      poolId={poolId}
      chainId={chainId}
      protocolVersion={protocolVersion}
    >
      {optionItem}
    </PoolOptionItemContextMenu>
  )
}

export const PoolOptionItem = memo(PoolOptionItemInner)
