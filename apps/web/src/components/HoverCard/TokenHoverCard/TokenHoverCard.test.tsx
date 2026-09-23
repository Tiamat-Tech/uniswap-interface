import { ETH_CURRENCY_INFO, ARBITRUM_DAI_CURRENCY_INFO } from 'uniswap/src/test/fixtures/wallet/currencies'
import { TokenHoverCard } from '~/components/HoverCard/TokenHoverCard/TokenHoverCard'
import { act, fireEvent, render, screen, waitFor } from '~/test-utils/render'

vi.mock('~/hooks/useTokenPriceChartData', () => ({
  useTokenPriceChartData: () => ({ entries: [], loading: false }),
}))

vi.mock('~/components/HoverCard/HoverCardContent', () => ({
  getHoverCardContentWidth: () => 240,
}))

vi.mock('~/components/HoverCard/TokenHoverCard/TokenHoverCardContent', () => ({
  TokenHoverCardContent: () => <div data-testid="hover-card-content" />,
  TokenHoverCardPlaceholder: () => <div data-testid="hover-card-placeholder" />,
}))

vi.mock('~/components/HoverCard/TokenHoverCard/useTokenHoverCardMultichainCopy', () => ({
  useTokenHoverCardMultichainCopy: () => ({
    viewIndex: 0,
    animationType: 'forward',
    orderedMultichainEntries: [],
    resetView: vi.fn(),
    goBack: vi.fn(),
    handleCopy: vi.fn(),
    handleCopyMultichainAddress: vi.fn(),
  }),
}))

vi.mock('@universe/mycelium', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium')>()),
  useIsTouchDevice: () => false,
}))

function renderCard(isFocused: boolean) {
  return render(
    <TokenHoverCard currencyInfo={ETH_CURRENCY_INFO} isFocused={isFocused}>
      <div>row</div>
    </TokenHoverCard>,
  )
}

// The popup unmounts once its exit transition settles, which resolves asynchronously.
async function expectCardClosed(): Promise<void> {
  await waitFor(() => expect(screen.queryByTestId('hover-card-content')).not.toBeInTheDocument())
}

describe('TokenHoverCard focus-open', () => {
  it('stays closed without hover or focus', () => {
    renderCard(false)
    expect(screen.queryByTestId('hover-card-content')).not.toBeInTheDocument()
  })

  it('opens immediately when mounted focused (auto-focused first result)', () => {
    renderCard(true)
    expect(screen.getByTestId('hover-card-content')).toBeInTheDocument()
  })

  it('opens when focus arrives and closes when it leaves (arrow-key nav)', async () => {
    const { rerender } = renderCard(false)
    expect(screen.queryByTestId('hover-card-content')).not.toBeInTheDocument()

    rerender(
      <TokenHoverCard currencyInfo={ETH_CURRENCY_INFO} isFocused>
        <div>row</div>
      </TokenHoverCard>,
    )
    expect(screen.getByTestId('hover-card-content')).toBeInTheDocument()

    rerender(
      <TokenHoverCard currencyInfo={ETH_CURRENCY_INFO} isFocused={false}>
        <div>row</div>
      </TokenHoverCard>,
    )
    await expectCardClosed()
  })

  it('keeps a focus-opened card open through the list scrolling the focused row into view', async () => {
    renderCard(true)
    expect(screen.getByTestId('hover-card-content')).toBeInTheDocument()

    // Give a would-be close its async unmount window before asserting the card is still there.
    await act(async () => {
      fireEvent.scroll(document)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(screen.getByTestId('hover-card-content')).toBeInTheDocument()
  })

  it('closes a focus-opened card on Escape while the row stays focused', async () => {
    renderCard(true)
    expect(screen.getByTestId('hover-card-content')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    await expectCardClosed()
  })

  it('re-opens a dismissed card when a new result lands at the still-focused row', async () => {
    const { rerender } = renderCard(true)
    fireEvent.keyDown(document, { key: 'Escape' })
    await expectCardClosed()

    rerender(
      <TokenHoverCard currencyInfo={ARBITRUM_DAI_CURRENCY_INFO} isFocused>
        <div>row</div>
      </TokenHoverCard>,
    )
    expect(screen.getByTestId('hover-card-content')).toBeInTheDocument()
  })

  it('stays dismissed when the same token re-renders at the still-focused row', async () => {
    const { rerender } = renderCard(true)
    fireEvent.keyDown(document, { key: 'Escape' })
    await expectCardClosed()

    rerender(
      <TokenHoverCard currencyInfo={{ ...ETH_CURRENCY_INFO }} isFocused>
        <div>row</div>
      </TokenHoverCard>,
    )
    expect(screen.queryByTestId('hover-card-content')).not.toBeInTheDocument()
  })

  it('leaves a pointer-driven focus to the hover delay (no immediate open while the trigger is hovered)', () => {
    const { rerender } = renderCard(false)
    fireEvent.mouseEnter(screen.getByText('row'))

    rerender(
      <TokenHoverCard currencyInfo={ETH_CURRENCY_INFO} isFocused>
        <div>row</div>
      </TokenHoverCard>,
    )
    expect(screen.queryByTestId('hover-card-content')).not.toBeInTheDocument()
  })
})
