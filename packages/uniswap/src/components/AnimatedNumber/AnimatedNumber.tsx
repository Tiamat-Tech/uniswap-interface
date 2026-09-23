import type { ColorTokens, FontVariantToken } from '@universe/mycelium'
import type { AnimatedNumberDirection } from 'uniswap/src/components/AnimatedNumber/types'
export type { AnimatedCharStylesType, AnimatedFontStylesType } from 'uniswap/src/components/AnimatedNumber/styles'
export { AnimatedCharStyles, AnimatedFontStyles } from 'uniswap/src/components/AnimatedNumber/styles'

export type AnimatedNumberProps = {
  loadingPlaceholderText?: string
  loading?: boolean | 'no-shimmer'
  value?: string
  numericValue?: number
  colorIndicationDuration?: number
  shouldFadeDecimals?: boolean
  warmLoading?: boolean
  /**
   * Renders the value static. List rows pass `isMobileApp`: each animated number costs ~6
   * Reanimated shared values and 4 Animated.Text nodes per character plus its own SVG gradient,
   * and a list keeps dozens mounted at once (Explore holds ~57 rows, the Home token list ~41),
   * which native cannot absorb — it terminates the process. Web and extension keep animating.
   * Rows can animate again once the native renderer no longer scales per row: no per-number SVG,
   * and digit slots mounted lazily.
   */
  disableAnimations?: boolean
  /** Overrides the computed up/down change direction (and its color) — e.g. for values like elapsed time that should always read as increasing. */
  forceDirection?: AnimatedNumberDirection
  /** Override text direction for digit stagger. Defaults to `i18next.dir() === 'rtl'`. */
  isRightToLeft?: boolean
  textVariant?: FontVariantToken
  color?: ColorTokens
  EndElement?: JSX.Element
  endElementGap?: number
  alignRight?: boolean
  containerTestID?: string
  ellipsis?: boolean
}

export default function AnimatedNumber(_props: AnimatedNumberProps): JSX.Element {
  throw new Error('AnimatedNumber: Implemented in .native.tsx and .web.tsx')
}
