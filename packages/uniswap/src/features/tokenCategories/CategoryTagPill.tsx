import { Flex, Text } from '@universe/mycelium'

/** Where a row renders its category pill: at the right edge (before any right element) or beside the name. */
export type CategoryTagPlacement = 'right' | 'title'

export function CategoryTagPill({ label }: { label: string }): JSX.Element {
  return (
    <Flex
      row
      alignItems="center"
      flexShrink={0}
      px="$spacing6"
      py="$spacing2"
      borderWidth="$spacing1"
      borderColor="$surface3"
      borderRadius="$roundedFull"
    >
      <Text color="$neutral2" variant="body4" numberOfLines={1}>
        {label}
      </Text>
    </Flex>
  )
}
