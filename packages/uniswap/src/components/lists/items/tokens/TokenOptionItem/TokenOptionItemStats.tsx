import { Flex, Text } from '@universe/mycelium'
import { Trans, useTranslation } from 'react-i18next'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

/** "$1.2M vol" subline label, shared by token and RWA rows so both format it identically. */
export function useSearchVolumeLabel(volume1dUsd: number | undefined): string | undefined {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  return volume1dUsd != null
    ? t('search.results.stats.volume', { volume: convertFiatAmountFormatted(volume1dUsd, NumberType.FiatTokenStats) })
    : undefined
}

/** `isPriceFloor`: a grouped RWA row whose price is the lowest across its issuers, shown as "from $X". */
export function TokenOptionItemStats({
  priceUsd,
  pricePercentChange1d,
  isPriceFloor = false,
}: {
  priceUsd: number
  pricePercentChange1d?: number
  isPriceFloor?: boolean
}): JSX.Element {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const price = convertFiatAmountFormatted(priceUsd, NumberType.FiatTokenPrice)

  return (
    <Flex alignItems="flex-end">
      {isPriceFloor ? (
        <Text variant="body2" color="$neutral3" numberOfLines={1}>
          <Trans
            i18nKey="search.results.stats.fromPrice"
            values={{ price }}
            components={{ price: <Text variant="body2" color="$neutral1" /> }}
          />
        </Text>
      ) : (
        <Text variant="body2" color="$neutral1">
          {price}
        </Text>
      )}
      {pricePercentChange1d != null && (
        <RelativeChange alignRight semanticColor change={pricePercentChange1d} arrowSize="$icon.12" variant="body3" />
      )}
    </Flex>
  )
}
