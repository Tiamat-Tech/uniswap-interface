import { Flex, Text } from '@universe/mycelium'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { useExpandRWASiblingHandler } from 'uniswap/src/features/rwa/hooks/useExpandRWASiblingHandler'
import { useRWAIssuerMarketData } from 'uniswap/src/features/rwa/useRWAIssuerMarketData'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { IssuerTokenCard } from '~/pages/TokenDetails/components/rwa/IssuerTokenCard'
import { useTDPRWAMatch } from '~/pages/TokenDetails/hooks/useTDPRWAMatch'

const COLLAPSED_VISIBLE_COUNT = 2

export function MoreWaysToTrade(): JSX.Element | null {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const rwaMatch = useTDPRWAMatch()
  const otherIssuerTokens = useMemo(
    () => rwaMatch?.asset.tokens.filter((token) => token.issuer !== rwaMatch.token.issuer) ?? [],
    [rwaMatch],
  )
  const getMarketData = useRWAIssuerMarketData(otherIssuerTokens)
  const onToggleExpanded = useExpandRWASiblingHandler({
    rwaMatch,
    variantCount: otherIssuerTokens.length,
    isExpanded,
    setIsExpanded,
  })

  if (!rwaMatch || otherIssuerTokens.length === 0) {
    return null
  }

  const companyName = rwaMatch.asset.name
  const useExpando = otherIssuerTokens.length > COLLAPSED_VISIBLE_COUNT
  const visibleTokens =
    useExpando && !isExpanded ? otherIssuerTokens.slice(0, COLLAPSED_VISIBLE_COUNT) : otherIssuerTokens
  const hiddenCount = otherIssuerTokens.length - COLLAPSED_VISIBLE_COUNT

  return (
    <Flex gap="$gap16" testID={TestID.TokenDetailsRWAMoreWaysToTrade}>
      <Text variant="heading3">{t('tdp.rwa.moreTokens', { company: companyName })}</Text>
      <Flex row flexWrap="wrap" gap="$gap12" $md={{ flexDirection: 'column' }}>
        {visibleTokens.map((token) => (
          <Flex
            key={`${token.chainId}-${token.address}`}
            flexGrow={1}
            flexBasis="48%"
            minWidth={0}
            maxWidth="49%"
            $md={{ flexGrow: 0, flexBasis: 'auto', maxWidth: '100%' }}
          >
            <IssuerTokenCard token={token} assetName={companyName} marketData={getMarketData(token)} />
          </Flex>
        ))}
      </Flex>
      {useExpando && (
        <ExpandoRow
          isExpanded={isExpanded}
          label={isExpanded ? t('common.button.showLess') : t('tdp.rwa.moreTokensCount', { count: hiddenCount })}
          onPress={onToggleExpanded}
        />
      )}
    </Flex>
  )
}
