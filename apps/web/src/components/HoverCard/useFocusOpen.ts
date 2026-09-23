import { useCallback, useState } from 'react'

/**
 * Opens on the rising edge of `isFocused` unless the pointer is on the trigger (that focus is hover-driven and keeps
 * the delay). `onHandOffToHover` fires when the pointer reaches a focus-opened trigger so the card outlives list focus.
 * A change of `rearmKey` (the wrapped token) counts as a fresh edge, so a dismissed card re-opens for a new result set
 * that lands at the same still-focused row.
 */
export function useFocusOpen({
  isFocused,
  rearmKey,
  onOpen,
  onHandOffToHover,
}: {
  isFocused: boolean
  rearmKey: unknown
  onOpen: () => void
  onHandOffToHover: () => void
}): {
  isFocusOpen: boolean
  closeFocusOpen: () => void
  triggerHoverProps: { onMouseEnter: () => void; onMouseLeave: () => void }
} {
  const [isTriggerHovered, setIsTriggerHovered] = useState(false)
  const [isFocusOpen, setIsFocusOpen] = useState(false)
  // Starts false so a trigger mounted already-focused registers as a rising edge.
  const [prevIsFocused, setPrevIsFocused] = useState(false)
  const [prevRearmKey, setPrevRearmKey] = useState(rearmKey)
  const rearmed = rearmKey !== prevRearmKey
  if (rearmed) {
    setPrevRearmKey(rearmKey)
  }
  if (isFocused !== (rearmed ? false : prevIsFocused)) {
    setPrevIsFocused(isFocused)
    const shouldOpen = isFocused && !isTriggerHovered
    setIsFocusOpen(shouldOpen)
    if (shouldOpen) {
      onOpen()
    }
  }

  const closeFocusOpen = useCallback((): void => setIsFocusOpen(false), [])

  const onMouseEnter = useCallback((): void => {
    setIsTriggerHovered(true)
    if (isFocusOpen) {
      onHandOffToHover()
    }
  }, [isFocusOpen, onHandOffToHover])
  const onMouseLeave = useCallback((): void => setIsTriggerHovered(false), [])

  return { isFocusOpen, closeFocusOpen, triggerHoverProps: { onMouseEnter, onMouseLeave } }
}
