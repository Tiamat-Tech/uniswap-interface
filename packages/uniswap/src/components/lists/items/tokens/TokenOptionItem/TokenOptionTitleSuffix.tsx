import { Text } from '@universe/mycelium'
import type { ReactNode } from 'react'

/** Token row `titleSuffix`: dimmed issuer label, then category pill. Undefined when empty so the title stays plain. */
export function tokenOptionTitleSuffix({
  issuerLabel,
  categoryTag,
}: {
  issuerLabel?: string
  categoryTag?: ReactNode
}): JSX.Element | undefined {
  if (!issuerLabel && !categoryTag) {
    return undefined
  }
  return (
    <>
      {issuerLabel && (
        <Text variant="body3" color="$neutral3" numberOfLines={1} flexShrink={0}>
          {issuerLabel}
        </Text>
      )}
      {categoryTag}
    </>
  )
}
