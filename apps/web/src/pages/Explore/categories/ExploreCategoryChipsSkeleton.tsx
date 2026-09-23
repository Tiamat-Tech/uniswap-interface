import { Flex } from '@universe/mycelium'
import { LoadingBubble } from '~/components/Tokens/loading'

/** Approximate rendered widths of the default chip row (Popular + spotlit head), then the All chip. */
const CHIP_SKELETON_WIDTHS = [104, 96, 88, 120, 80]
const ALL_CHIP_SKELETON_WIDTH = 72
/** FilterChip's fixed height, so the row doesn't shift when the chips land. */
const CHIP_HEIGHT = '$spacing36'

function ChipSkeleton({ width }: { width: number }): JSX.Element {
  return <LoadingBubble round height={CHIP_HEIGHT} width={width} containerProps={{ width, flexShrink: 0 }} />
}

/** Placeholder for the Explore category chip row while the category set is still unknown. */
export function ExploreCategoryChipsSkeleton(): JSX.Element {
  return (
    <Flex row alignItems="center" gap="$spacing4">
      {CHIP_SKELETON_WIDTHS.map((width, index) => (
        <ChipSkeleton key={index} width={width} />
      ))}
      <Flex height="$spacing16" width={1} backgroundColor="$surface3" flexShrink={0} />
      <ChipSkeleton width={ALL_CHIP_SKELETON_WIDTH} />
    </Flex>
  )
}
