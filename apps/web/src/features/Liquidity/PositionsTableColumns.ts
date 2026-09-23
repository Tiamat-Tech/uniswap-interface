import type { AppTFunction } from 'utilities/src/i18n/types'

export type ColumnId = 'pool' | 'position' | 'distribution' | 'liquidity' | 'fees' | 'apr' | 'created' | 'menu'

export type SortDirection = 'asc' | 'desc'

// Server-side sort fields for GetWalletPositions. distribution/liquidity/created_at are wired;
// fees/apr are rendered as sortable but no-op until the backend serves those values.
export type PositionSortField = 'distribution' | 'liquidity' | 'created_at' | 'fees' | 'apr'

export interface PositionSort {
  field: PositionSortField
  direction: SortDirection
}

export const NOOP_SORT_FIELDS: readonly PositionSortField[] = ['fees', 'apr']

export function getColumnLabel(id: ColumnId, t: AppTFunction): string {
  switch (id) {
    case 'pool':
      return t('liquidityPool.positions.table.column.pool')
    case 'position':
      return t('liquidityPool.positions.table.column.position')
    case 'distribution':
      return t('liquidityPool.positions.table.column.distribution')
    case 'liquidity':
      return t('common.value')
    case 'fees':
      return t('liquidityPool.positions.table.column.fees')
    case 'apr':
      return t('liquidityPool.positions.table.column.apr')
    case 'created':
      return t('liquidityPool.positions.table.column.created')
    case 'menu':
      return ''
    default:
      return id satisfies never
  }
}
