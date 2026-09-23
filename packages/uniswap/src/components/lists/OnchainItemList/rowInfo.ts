import isArray from 'lodash/isArray'
import type { Key } from 'react'
import { OnchainItemListOption } from 'uniswap/src/components/lists/items/types'
import {
  ItemRowInfo,
  OnchainItemListProps,
  SectionRowInfo,
} from 'uniswap/src/components/lists/OnchainItemList/OnchainItemList'

type OnchainItemListRowInfo = {
  key: Key | undefined
  measurementKey: string
}
export type ListSectionRowInfo<T extends OnchainItemListOption> = SectionRowInfo &
  OnchainItemListRowInfo &
  Pick<OnchainItemListProps<T>, 'renderSectionHeader'>
export type ListItemRowInfo<T extends OnchainItemListOption> = ItemRowInfo<T> &
  OnchainItemListRowInfo &
  Pick<OnchainItemListProps<T>, 'renderItem'>

export type OnchainItemListData<T extends OnchainItemListOption> = ListItemRowInfo<T> | ListSectionRowInfo<T>

export function isSectionHeader<T extends OnchainItemListOption>(
  rowInfo: OnchainItemListData<T>,
): rowInfo is ListSectionRowInfo<T> {
  return !('renderItem' in rowInfo)
}

export function isHorizontalTokenRowInfo<T extends OnchainItemListOption>(rowInfo: OnchainItemListData<T>): boolean {
  const isHeader = isSectionHeader(rowInfo)
  return !isHeader && isArray(rowInfo.item)
}

export function isDynamicHeightRowInfo<T extends OnchainItemListOption>(rowInfo: OnchainItemListData<T>): boolean {
  if (isHorizontalTokenRowInfo(rowInfo)) {
    return true
  }
  // Rows that opt into dynamic height via `rowLayout` (e.g. expandable collections) are measured at runtime;
  // fixed rows are not. Keeping fixed rows off the dynamic path avoids a needless ResizeObserver +
  // per-commit getBoundingClientRect.
  return !isSectionHeader(rowInfo) && !isArray(rowInfo.item) && rowInfo.item.rowLayout?.dynamicHeight === true
}

/** Section headers and horizontal rows (recent-search pills) have no focus state. */
export function isFocusableRowInfo<T extends OnchainItemListOption>(rowInfo: OnchainItemListData<T>): boolean {
  return !isSectionHeader(rowInfo) && !isHorizontalTokenRowInfo(rowInfo)
}

/** Nearest focusable row at or past `from`, walking in `direction`; undefined when there is none. */
export function findFocusableRowIndex<T extends OnchainItemListOption>({
  items,
  from,
  direction,
}: {
  items: OnchainItemListData<T>[]
  from: number
  direction: 1 | -1
}): number | undefined {
  for (let index = from; index >= 0 && index < items.length; index += direction) {
    const rowInfo = items[index]
    if (rowInfo && isFocusableRowInfo(rowInfo)) {
      return index
    }
  }
  return undefined
}

export function getFirstFocusableRowIndex<T extends OnchainItemListOption>(
  items: OnchainItemListData<T>[],
): number | undefined {
  return findFocusableRowIndex({ items, from: 0, direction: 1 })
}
