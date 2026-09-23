import { SharedEventName } from '@uniswap/analytics-events'
import { Flex } from '@universe/mycelium'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import type { RankedTokenCardItem } from 'uniswap/src/data/apiClients/dataApiService/utils/rankedTokenCardItem'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useEvent } from 'utilities/src/react/hooks'
import { TokenCardCarousel } from '~/components/TokenCardCarousel/TokenCardCarousel'
import { useCarouselLayout } from '~/components/TokenCardCarousel/useCarouselLayout'
import { useHorizontalSnapCarousel } from '~/components/TokenCardCarousel/useHorizontalSnapCarousel'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { getExploreTrendingTableURL, scrollToExploreTokenSection } from '~/pages/Explore/categories/useExploreCategory'
import { AssetShelfHeader } from '~/pages/Explore/rwa/shelf/AssetShelfHeader'
import { TrendingShelfTokenCard } from '~/pages/Explore/trending/TrendingShelfTokenCard'
import {
  TRENDING_CAROUSEL_TOKEN_COUNT,
  useTrendingCarouselTokens,
} from '~/pages/Explore/trending/useTrendingCarouselTokens'

export function TrendingShelf(): JSX.Element | null {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tokens, isLoading } = useTrendingCarouselTokens()
  const layoutRef = useRef<HTMLDivElement>(null)
  const { cardWidth, fadeWidth, showArrowButtons } = useCarouselLayout(layoutRef)

  const carousel = useHorizontalSnapCarousel({
    cardWidth,
    itemCount: tokens.length,
    isLoading,
  })

  const onViewAll = useEvent((): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.ExploreTrendingViewAll,
      token_list_length: tokens.length,
    })
    navigate(getExploreTrendingTableURL())
    requestAnimationFrame(() => {
      scrollToExploreTokenSection()
    })
  })

  const onTokenClick = useEvent((token: RankedTokenCardItem): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.ExploreTrendingCarousel,
      token_address: token.address,
      token_symbol: token.symbol,
      token_list_length: tokens.length,
    })
  })

  if (!isLoading && tokens.length === 0) {
    return null
  }

  return (
    <Flex width="100%" maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT} mx="auto" gap="$spacing12">
      <AssetShelfHeader title={t('common.trending')} onViewAll={onViewAll} />
      <Flex ref={layoutRef} width="100%">
        <TokenCardCarousel
          items={tokens}
          getItemKey={(item) => item.key}
          renderItem={(item) => (
            <TrendingShelfTokenCard token={item} cardWidth={cardWidth} onTokenClick={onTokenClick} />
          )}
          isLoading={isLoading}
          skeletonCount={TRENDING_CAROUSEL_TOKEN_COUNT}
          skeletonLayout="horizontal"
          carousel={carousel}
          cardWidth={cardWidth}
          fadeWidth={fadeWidth}
          showArrowButtons={showArrowButtons}
        />
      </Flex>
    </Flex>
  )
}
