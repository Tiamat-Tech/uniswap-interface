import { SearchModalListSkeleton } from 'uniswap/src/features/search/SearchModal/SearchModalListSkeleton'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { render } from 'uniswap/src/test/test-utils'

describe(SearchModalListSkeleton, () => {
  it('reserves one placeholder per recent the history holds', () => {
    const { getAllByTestId } = render(<SearchModalListSkeleton pillCount={4} />)

    expect(getAllByTestId(TestID.SearchRecentPillSkeleton)).toHaveLength(4)
  })

  it('drops the pill row when there are no recents to reserve space for', () => {
    const { queryAllByTestId } = render(<SearchModalListSkeleton />)

    expect(queryAllByTestId(TestID.SearchRecentPillSkeleton)).toHaveLength(0)
  })
})
