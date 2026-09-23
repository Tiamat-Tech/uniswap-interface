import { SharedEventName } from '@uniswap/analytics-events'
import { Flex } from '@universe/mycelium'
import { useEffect, useState } from 'react'
import { FILTER_CHIP_FADE_MS, FilterChip } from 'uniswap/src/components/FilterChip/FilterChip'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ExploreCategoryChipOption } from '~/pages/Explore/categories/exploreCategoryChipOptions'

const CHIP_FADE_MS = FILTER_CHIP_FADE_MS
const CHIP_FADE_TRANSITION = `opacity ${CHIP_FADE_MS}ms ease`

// TODO(CONS-2740): point the Explore/Launches filter rows at FilterChip directly and drop this alias.
export { FilterChip as ExploreFilterChip }

interface ExploreCategoryChipsProps {
  options: ExploreCategoryChipOption[]
  value: string
  onChange: (category: string) => void
  /** Fade-swaps the last option (the flex slot): fade out the current chip, then fade in the new one. */
  fadeSwapLastOption?: boolean
}

function CategoryChip({
  option,
  value,
  onChange,
}: {
  option: ExploreCategoryChipOption
  value: string
  onChange: (category: string) => void
}): JSX.Element {
  const active = option.id === value
  const Icon = option.icon
  return (
    <FilterChip
      active={active}
      label={option.label}
      renderIcon={Icon ? (color) => <Icon size="$icon.16" color={color} /> : undefined}
      onPress={() => {
        if (active) {
          return
        }
        sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
          element: ElementName.ExploreRwaCategoryView,
          tab: option.id,
        })
        onChange(option.id)
      }}
    />
  )
}

/** Defers option swaps by one fade: the outgoing chip stays rendered while faded out, then the new one fades in. */
function useFadeSwappedOption(option: ExploreCategoryChipOption): {
  displayedOption: ExploreCategoryChipOption
  faded: boolean
} {
  const [displayedOption, setDisplayedOption] = useState(option)
  const [faded, setFaded] = useState(false)

  useEffect(() => {
    if (option.id === displayedOption.id) {
      setDisplayedOption(option)
      setFaded(false)
      return undefined
    }
    setFaded(true)
    const timeout = setTimeout(() => {
      setDisplayedOption(option)
      setFaded(false)
    }, CHIP_FADE_MS)
    return () => clearTimeout(timeout)
  }, [option, displayedOption.id])

  return { displayedOption, faded }
}

function FlexSlotChip({
  option,
  value,
  onChange,
}: {
  option: ExploreCategoryChipOption
  value: string
  onChange: (category: string) => void
}): JSX.Element {
  const { displayedOption, faded } = useFadeSwappedOption(option)
  return (
    <Flex
      opacity={faded ? 0 : 1}
      pointerEvents={faded ? 'none' : 'auto'}
      $platform-web={{ transition: CHIP_FADE_TRANSITION }}
    >
      <CategoryChip option={displayedOption} value={value} onChange={onChange} />
    </Flex>
  )
}

/** Category filter chips above the Explore token table (static set, or ListCategories-driven behind the flag). */
export function ExploreCategoryChips({
  options,
  value,
  onChange,
  fadeSwapLastOption = false,
}: ExploreCategoryChipsProps): JSX.Element {
  return (
    <Flex row alignItems="center" $platform-web={{ transition: CHIP_FADE_TRANSITION }}>
      {options.map((option, index) =>
        fadeSwapLastOption && index === options.length - 1 ? (
          <FlexSlotChip key="flex-slot" option={option} value={value} onChange={onChange} />
        ) : (
          <CategoryChip key={option.id} option={option} value={value} onChange={onChange} />
        ),
      )}
    </Flex>
  )
}
