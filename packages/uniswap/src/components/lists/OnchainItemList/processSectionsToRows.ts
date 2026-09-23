import { OnchainItemListOption } from 'uniswap/src/components/lists/items/types'
import type { ItemRowInfo, SectionRowInfo } from 'uniswap/src/components/lists/OnchainItemList/OnchainItemList'
import {
  getSectionHeaderRowKey,
  getSectionItemRowKey,
  getSectionRowId,
} from 'uniswap/src/components/lists/OnchainItemList/rowKeys'
import { type OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'

export enum ProcessedRowType {
  Header = 'header',
  Item = 'item',
}

export type ProcessedRow =
  | { type: ProcessedRowType.Header; data: SectionRowInfo }
  | { type: ProcessedRowType.Item; data: ItemRowInfo<OnchainItemListOption> }

/** Header-row payload shared by the web and native legs, so a new section field is threaded in one place. */
export function toSectionHeaderProps<T extends OnchainItemListOption>(
  section: OnchainItemSection<T>,
): SectionRowInfo['section'] {
  return {
    sectionKey: section.sectionKey,
    sectionRowId: getSectionRowId(section),
    rightElement: section.rightElement,
    endElement: section.endElement,
    name: section.name,
    sectionHeader: section.sectionHeader,
    sectionHeaderHeight: section.sectionHeaderHeight,
    icon: section.icon,
    onPress: section.onPress,
  }
}

/**
 * Flattens sections into the row array the virtualized list renders.
 *
 * Pass the previous result as `previousRows` to keep row objects referentially stable: a row whose
 * inputs did not change comes back as the same object. Legend List memoizes a mounted cell on its
 * row object, so without this every refetch that rebuilds `sections` re-rendered every visible row.
 */
export function processSectionsToRows({
  sections,
  expandedItems,
  keyExtractor,
  previousRows,
}: {
  sections: OnchainItemSection<OnchainItemListOption>[]
  expandedItems?: string[]
  keyExtractor?: (item: OnchainItemListOption, index: number) => string
  previousRows?: ProcessedRow[]
}): ProcessedRow[] {
  const previousByKey = new Map<string, ProcessedRow>()
  for (const row of previousRows ?? []) {
    previousByKey.set(getProcessedRowKey(row, keyExtractor), row)
  }

  const result: ProcessedRow[] = []
  let rowIndex = 0

  for (const section of sections) {
    const headerRow: ProcessedRow = { type: ProcessedRowType.Header, data: { section: toSectionHeaderProps(section) } }
    result.push(reuseIfEqual(headerRow, previousByKey.get(getProcessedRowKey(headerRow, keyExtractor))))
    rowIndex++

    let itemIndex = 0
    for (const item of section.data) {
      const index = itemIndex++
      const itemRow: ProcessedRow = {
        type: ProcessedRowType.Item,
        data: {
          item,
          section,
          index,
          rowIndex: rowIndex++,
          expanded: expandedItems?.includes(keyExtractor?.(item, index) ?? '') ?? false,
        },
      }
      result.push(reuseIfEqual(itemRow, previousByKey.get(getProcessedRowKey(itemRow, keyExtractor))))
    }
  }

  return result
}

/** Same identity the list keys rows by, so a reused row also keeps its cell. */
export function getProcessedRowKey(
  row: ProcessedRow,
  keyExtractor?: (item: OnchainItemListOption, index: number) => string,
): string {
  switch (row.type) {
    case ProcessedRowType.Header:
      return getSectionHeaderRowKey(row.data.section.sectionRowId)
    case ProcessedRowType.Item:
      return getSectionItemRowKey({
        sectionRowId: getSectionRowId(row.data.section),
        itemKey: keyExtractor?.(row.data.item, row.data.index),
        index: row.data.index,
      })
    default:
      return ''
  }
}

function reuseIfEqual(next: ProcessedRow, previous: ProcessedRow | undefined): ProcessedRow {
  if (!previous || previous.type !== next.type) {
    return next
  }
  if (next.type === ProcessedRowType.Item && previous.type === ProcessedRowType.Item) {
    const a = next.data
    const b = previous.data
    // `rowIndex` is part of the row's data, so a reused row must not carry a stale one. The cost is that a
    // section arriving above (e.g. Recents) re-renders the rows below it once; rows rebuilt in place — the
    // refetch case this exists for — keep their identity.
    return a.item === b.item &&
      a.section === b.section &&
      a.index === b.index &&
      a.rowIndex === b.rowIndex &&
      a.expanded === b.expanded
      ? previous
      : next
  }
  if (next.type === ProcessedRowType.Header && previous.type === ProcessedRowType.Header) {
    const a = next.data.section
    const b = previous.data.section
    return (Object.keys(a) as (keyof typeof a)[]).every((field) => a[field] === b[field]) ? previous : next
  }
  return next
}

/**
 * Inverse of {@link processSectionsToRows}' flattening: folds a SectionList-style (section, item)
 * address into an index in the flat row array, where every section contributes a header row ahead of
 * its items.
 *
 * `itemIndex` follows React Native's `SectionList.scrollToLocation`, which measures from the
 * section's header rather than from its first item: `itemIndex: 0` addresses the header, `1` the
 * first item. (RN's own math gives it away — its sticky-header branch reads the header's position as
 * `index - itemIndex`.) Matching it keeps this leg in step with `OnchainItemList.web`
 */
export function toFlatRowIndex({
  sections,
  sectionIndex,
  itemIndex,
}: {
  sections: OnchainItemSection<OnchainItemListOption>[]
  sectionIndex: number
  itemIndex: number
}): number {
  let index = 0

  for (let i = 0; i < sectionIndex; i++) {
    // 1 header + that section's items
    index += 1 + (sections[i]?.data.length ?? 0)
  }

  // No offset for the target section's own header: itemIndex is measured from it.
  return index + itemIndex
}
