import { memo } from 'react'
import { CategoryTagPill } from 'uniswap/src/features/tokenCategories/CategoryTagPill'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'

export const TokenCategoryTag = memo(function TokenCategoryTag({ category }: { category: TokenCategory }): JSX.Element {
  return <CategoryTagPill label={category.name} />
})
