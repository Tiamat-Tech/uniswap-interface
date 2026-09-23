import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { CategoryDefinitionTooltipContent } from '~/components/CategoryDefinitionCard/CategoryDefinitionTooltipContent'
import { fireEvent, render, screen } from '~/test-utils/render'

const trending = tokenCategory({
  id: 'trending',
  name: 'Trending',
  description: 'Tokens with 1D price gain and 1D volume at least 3x higher than 7D average.',
})

describe('CategoryDefinitionTooltipContent', () => {
  it('renders the description only when there is no "View all" handler', () => {
    render(<CategoryDefinitionTooltipContent category={trending} />)
    expect(screen.getByText(trending.description)).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.CategoryDefinitionViewAll)).not.toBeInTheDocument()
  })

  it('renders "View all" and forwards its click', () => {
    const onPressViewAll = vi.fn()
    render(<CategoryDefinitionTooltipContent category={trending} onPressViewAll={onPressViewAll} />)
    fireEvent.click(screen.getByTestId(TestID.CategoryDefinitionViewAll))
    expect(onPressViewAll).toHaveBeenCalledTimes(1)
  })
})
