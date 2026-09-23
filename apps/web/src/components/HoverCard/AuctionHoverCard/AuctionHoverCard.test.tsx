import { UniverseChainId } from '@universe/chains'
import { logger } from 'utilities/src/logger/logger'
import {
  AuctionHoverCard,
  type AuctionHoverCardAuction,
} from '~/components/HoverCard/AuctionHoverCard/AuctionHoverCard'
import { POPUP_MEDIUM_DISMISS_MS } from '~/components/Popups/constants'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'
import { fireEvent, render, screen, waitFor } from '~/test-utils/render'

const mockNavigate = vi.fn()

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}))

const useAuctionHoverCardData = vi.fn((_params: unknown) => ({
  fdvUsd: undefined,
  pricePercentChange: undefined,
  priceData: [],
  committedVolumeUsd: undefined,
  bidCount: undefined,
  loading: false,
}))

vi.mock('~/components/HoverCard/AuctionHoverCard/useAuctionHoverCardData', () => ({
  useAuctionHoverCardData: (params: unknown) => useAuctionHoverCardData(params),
}))

vi.mock('~/components/HoverCard/AuctionHoverCard/AuctionHoverCardContent', () => ({
  AuctionHoverCardContent: ({ onCopy, onExpand }: { onCopy?: () => void; onExpand: () => void }) => (
    <div data-testid="auction-hover-card-content" data-can-copy={onCopy !== undefined}>
      <button onClick={onExpand}>Expand</button>
    </div>
  ),
}))

let isTouchDevice = false
vi.mock('@universe/mycelium', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium')>()),
  useIsTouchDevice: () => isTouchDevice,
}))

beforeEach(() => {
  isTouchDevice = false
  useAuctionHoverCardData.mockClear()
  mockNavigate.mockClear()
})

describe('AuctionHoverCard navigation', () => {
  beforeEach(() => {
    vi.spyOn(logger, 'warn').mockImplementation(() => {})
    vi.spyOn(popupRegistry, 'addPopup').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('opens the normalized auction URL and calls onNavigate when expanded', () => {
    const onNavigate = vi.fn()
    render(
      <AuctionHoverCard auction={auction} onNavigate={onNavigate} isFocused>
        <div>row</div>
      </AuctionHoverCard>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Expand' }))

    expect(mockNavigate).toHaveBeenCalledWith('/explore/auctions/ethereum/0x9084cb9a700a52909cbef3113db8bac01c01efd6')
    expect(onNavigate).toHaveBeenCalledOnce()
    expect(popupRegistry.addPopup).not.toHaveBeenCalled()
  })

  it('shows the navigation error instead of opening a malformed auction address', () => {
    render(
      <AuctionHoverCard auction={{ ...auction, auctionAddress: `0x${'g'.repeat(40)}` }} isFocused>
        <div>row</div>
      </AuctionHoverCard>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Expand' }))

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(popupRegistry.addPopup).toHaveBeenCalledWith(
      { type: PopupType.Error, error: 'Unable to open auction' },
      'auction-navigation-error',
      POPUP_MEDIUM_DISMISS_MS,
    )
  })
})

const auction: AuctionHoverCardAuction = {
  chainId: UniverseChainId.Mainnet,
  auctionAddress: '0x9084CB9a700a52909Cbef3113dB8BaC01C01EfD6',
  tokenAddress: '0x9999B7E3cc6979223Ff1aF980b7D8B90B75d9999',
  tokenSymbol: 'FOO',
  tokenName: 'Foo',
  tokenLogoUrl: undefined,
  committedVolumeUsd: 188_800,
  uniqueBidderCount: 982,
}

function renderCard(isFocused: boolean) {
  return render(
    <AuctionHoverCard auction={auction} isFocused={isFocused}>
      <div>row</div>
    </AuctionHoverCard>,
  )
}

describe('AuctionHoverCard focus-open', () => {
  it('stays closed without hover or focus', () => {
    renderCard(false)
    expect(screen.queryByTestId('auction-hover-card-content')).not.toBeInTheDocument()
  })

  it('opens immediately when mounted focused (auto-focused first result)', () => {
    renderCard(true)
    expect(screen.getByTestId('auction-hover-card-content')).toBeInTheDocument()
  })

  it('opens when focus arrives and closes when it leaves (arrow-key nav)', async () => {
    const { rerender } = renderCard(false)
    expect(screen.queryByTestId('auction-hover-card-content')).not.toBeInTheDocument()

    rerender(
      <AuctionHoverCard auction={auction} isFocused>
        <div>row</div>
      </AuctionHoverCard>,
    )
    expect(screen.getByTestId('auction-hover-card-content')).toBeInTheDocument()

    rerender(
      <AuctionHoverCard auction={auction} isFocused={false}>
        <div>row</div>
      </AuctionHoverCard>,
    )
    // The popup unmounts once its exit transition settles, which resolves asynchronously.
    await waitFor(() => expect(screen.queryByTestId('auction-hover-card-content')).not.toBeInTheDocument())
  })

  it('offers copy only when the row carries a token address', () => {
    const { rerender } = renderCard(true)
    expect(screen.getByTestId('auction-hover-card-content')).toHaveAttribute('data-can-copy', 'true')

    rerender(
      <AuctionHoverCard auction={{ ...auction, tokenAddress: '' }} isFocused>
        <div>row</div>
      </AuctionHoverCard>,
    )
    expect(screen.getByTestId('auction-hover-card-content')).toHaveAttribute('data-can-copy', 'false')
  })

  it('latches fetch intent once focus opens the card', () => {
    renderCard(true)
    expect(useAuctionHoverCardData).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: true }))
  })

  // The popover never renders on touch, but a wide touch viewport still auto-focuses the first result.
  it('neither opens nor fetches on a touch device, even when focused', () => {
    isTouchDevice = true
    renderCard(true)
    expect(screen.queryByTestId('auction-hover-card-content')).not.toBeInTheDocument()
    expect(useAuctionHoverCardData).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('leaves a pointer-driven focus to the hover delay (no immediate open while the trigger is hovered)', () => {
    const { rerender } = renderCard(false)
    fireEvent.mouseEnter(screen.getByText('row'))

    rerender(
      <AuctionHoverCard auction={auction} isFocused>
        <div>row</div>
      </AuctionHoverCard>,
    )
    expect(screen.queryByTestId('auction-hover-card-content')).not.toBeInTheDocument()
  })
})
