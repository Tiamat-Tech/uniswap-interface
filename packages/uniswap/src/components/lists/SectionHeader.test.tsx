import { Text } from '@universe/mycelium'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { SectionHeader } from 'uniswap/src/components/lists/SectionHeader'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { render } from 'uniswap/src/test/test-utils'

describe('SectionHeader Stocks', () => {
  it('renders the Stocks title', () => {
    const { getByText } = render(<SectionHeader sectionKey={OnchainItemSectionName.Stocks} />)
    expect(getByText('Stocks')).toBeDefined()
  })

  it('renders the rightElement (NewTag) and mounts the header with the stocks testID', () => {
    const { getByText, getByTestId } = render(
      <SectionHeader sectionKey={OnchainItemSectionName.Stocks} rightElement={<NewTag />} />,
    )
    expect(getByTestId(`${TestID.SectionHeaderPrefix}stocks`)).toBeDefined()
    // The test i18n harness renders translation keys verbatim, so NewTag's `t('common.new')` shows as the key.
    expect(getByText('common.new')).toBeDefined()
  })
})

describe('SectionHeader SuggestedTokens', () => {
  // nativeRowLayout gives this header a fixed size of 0, so it is positioned as a zero-height row until it mounts.
  // If the header ever renders something it will pop to its real height on layout — break here first instead.
  // `sectionHeader` is the input that would most plausibly do that, so it is pinned along with name/rightElement.
  it('renders nothing, even with a name, a rightElement and a custom sectionHeader passed', () => {
    const { queryByTestId, queryByText } = render(
      <SectionHeader
        sectionKey={OnchainItemSectionName.SuggestedTokens}
        name="Suggested"
        rightElement={<NewTag />}
        sectionHeader={<Text>custom header</Text>}
      />,
    )
    expect(queryByTestId(`${TestID.SectionHeaderPrefix}suggestedTokens`)).toBeNull()
    expect(queryByText('Suggested')).toBeNull()
    expect(queryByText('common.new')).toBeNull()
    expect(queryByText('custom header')).toBeNull()
  })
})
