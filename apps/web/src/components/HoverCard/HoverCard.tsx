import { TouchableArea, useIsTouchDevice } from '@universe/mycelium'
import type { ComponentProps, ReactNode } from 'react'
import { useCallback, useRef, useState } from 'react'
import { AdaptiveWebPopoverContent, Popover } from 'ui/src'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { useShadowPropsMedium } from 'ui/src/theme/shadows'
import { useFocusOpen } from '~/components/HoverCard/useFocusOpen'
import { useCloseOnOutsideScroll } from '~/hooks/useCloseOnOutsideScroll'

const POPOVER_HORIZONTAL_PADDING = 16

// Module-level constant — Popover memoizes its floating context on the `hoverable` reference
const HOVERABLE_PROPS = { delay: { open: 300 } }

export type HoverCardPlacement = ComponentProps<typeof Popover>['placement']

/** Keeps presses inside the card (and on its trigger) from reaching the row/cell that hosts it. */
export const stopPressEventPropagation = {
  onPressIn: (e: { stopPropagation: () => void }) => e.stopPropagation(),
  onPressOut: (e: { stopPropagation: () => void }) => e.stopPropagation(),
  onPress: (e: { stopPropagation: () => void }) => e.stopPropagation(),
}

export interface HoverCardTriggerHoverProps {
  onMouseEnter: () => void
  onMouseLeave: () => void
}

export interface HoverCardState {
  isOpen: boolean
  isFocusOpen: boolean
  /** Latched on first open so consumers can defer their fetches until the card is actually used. */
  hasOpenIntent: boolean
  close: () => void
  onOpenChange: (open: boolean) => void
  triggerHoverProps: HoverCardTriggerHoverProps
}

/**
 * Hover-open (with the Popover's delay) merged with list-focus open. A `rearmKey` (the wrapped row's identity,
 * e.g. currency id) change counts as a fresh focus edge, so a dismissed card re-opens for a new result at the same row.
 */
export function useHoverCardState({
  isFocused,
  rearmKey,
}: {
  isFocused?: boolean
  rearmKey: string | undefined
}): HoverCardState {
  // `HoverCard` never renders the popover on touch, but list focus still latches intent (SearchV2UI auto-focuses
  // the first row on wide touch viewports), so gate both legs here or consumers fetch for a card that can't show.
  const isTouchDevice = useIsTouchDevice()
  const [isHoverOpen, setIsHoverOpen] = useState(false)
  const [hasOpenIntent, setHasOpenIntent] = useState(false)
  const latchOpenIntent = useCallback((): void => setHasOpenIntent(true), [])
  const openFromHover = useCallback((): void => setIsHoverOpen(true), [])
  const { isFocusOpen, closeFocusOpen, triggerHoverProps } = useFocusOpen({
    isFocused: Boolean(isFocused),
    rearmKey,
    onOpen: latchOpenIntent,
    onHandOffToHover: openFromHover,
  })

  // Every close path clears both legs, or a focus-opened card can't be dismissed.
  const close = useCallback((): void => {
    setIsHoverOpen(false)
    closeFocusOpen()
  }, [closeFocusOpen])

  const onOpenChange = useCallback(
    (open: boolean): void => {
      if (open) {
        setIsHoverOpen(true)
        setHasOpenIntent(true)
      } else {
        close()
      }
    },
    [close],
  )

  return {
    isOpen: !isTouchDevice && (isHoverOpen || isFocusOpen),
    isFocusOpen,
    hasOpenIntent: !isTouchDevice && hasOpenIntent,
    close,
    onOpenChange,
    triggerHoverProps,
  }
}

/**
 * Body width that keeps the popover a `widthOffset` gap from the viewport edge when it floats beside a
 * centered container (e.g. the search modal).
 */
export function useHoverCardMaxContentWidth({
  containerWidth,
  widthOffset,
}: {
  containerWidth?: number
  widthOffset?: number
}): number | undefined {
  const { fullWidth: windowWidth } = useDeviceDimensions()
  return containerWidth !== undefined
    ? (windowWidth - containerWidth) / 2 - (widthOffset ?? 0) * 2 - POPOVER_HORIZONTAL_PADDING * 2
    : undefined
}

interface HoverCardProps {
  isOpen: boolean
  isFocusOpen?: boolean
  onOpenChange: (open: boolean) => void
  triggerHoverProps?: HoverCardTriggerHoverProps
  placement?: HoverCardPlacement
  offset?: number
  children: ReactNode
  content: ReactNode
}

/** Popover shell shared by the hover cards. Consumers own the open state via `useHoverCardState` to gate fetches on it. */
export function HoverCard({
  isOpen,
  isFocusOpen = false,
  onOpenChange,
  triggerHoverProps,
  placement = 'bottom-start',
  offset,
  children,
  content,
}: HoverCardProps): JSX.Element {
  const popoverContentRef = useRef<HTMLDivElement>(null)
  const shadowProps = useShadowPropsMedium()
  const isTouchDevice = useIsTouchDevice()

  const close = useCallback((): void => onOpenChange(false), [onOpenChange])
  // A focus-opened card is anchored to list focus, not the pointer: the list scrolls to keep the focused row
  // visible, and the card re-anchors to it rather than treating that scroll as a dismissal.
  useCloseOnOutsideScroll({ contentRef: popoverContentRef, isOpen: isOpen && !isFocusOpen, onClose: close })

  if (isTouchDevice) {
    return <>{children}</>
  }

  return (
    <Popover
      hoverable={HOVERABLE_PROPS}
      open={isOpen}
      placement={placement}
      offset={offset}
      stayInFrame
      allowFlip
      onOpenChange={onOpenChange}
    >
      <Popover.Trigger>
        <TouchableArea variant="unstyled" activeOpacity={1} {...stopPressEventPropagation} {...triggerHoverProps}>
          {children}
        </TouchableArea>
      </Popover.Trigger>
      <AdaptiveWebPopoverContent
        ref={popoverContentRef}
        // A focus-open is not a hover-open to the popover, so its focus trap would pull DOM focus into the card and
        // the search input's own focus() would then dismiss it as a focus-out.
        disableFocusScope
        isOpen={isOpen}
        placement={placement}
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        p="$spacing16"
        overflow="hidden"
        {...shadowProps}
        {...stopPressEventPropagation}
      >
        {content}
      </AdaptiveWebPopoverContent>
    </Popover>
  )
}
