import { Flex } from '@universe/mycelium'
import { Skeleton } from 'ui/src'
import { PILL_HEIGHT } from 'uniswap/src/features/search/SearchModal/RecentSearchPills/Pill'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

// A typical symbol label's width; the real pills size to their text.
const PILL_WIDTH = 96

export function RecentSearchPillsSkeleton({ count }: { count: number }): JSX.Element | null {
  if (count <= 0) {
    return null
  }

  return (
    <Skeleton>
      <Flex pl="$spacing20" pr="$spacing12" py="$spacing4">
        <Flex row gap="$spacing8" overflow="hidden">
          {Array.from({ length: count }, (_, index) => (
            <Flex
              key={index}
              backgroundColor="$surface3"
              borderRadius="$rounded32"
              height={PILL_HEIGHT}
              shrink={false}
              testID={TestID.SearchRecentPillSkeleton}
              width={PILL_WIDTH}
            />
          ))}
        </Flex>
      </Flex>
    </Skeleton>
  )
}
