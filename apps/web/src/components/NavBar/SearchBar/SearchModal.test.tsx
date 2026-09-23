import type { PropsWithChildren } from 'react'
import { SearchModal } from '~/components/NavBar/SearchBar/SearchModal'
import { mockMediaSize } from '~/test-utils/mockMediaSize'
import { render, screen } from '~/test-utils/render'

vi.mock('@universe/mycelium/theme-hooks-compat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/mycelium/theme-hooks-compat')>()
  return {
    ...actual,
    useMedia: vi.fn(),
  }
})

vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children }: PropsWithChildren) => children,
}))

vi.mock('uniswap/src/components/modals/ScrollLock', () => ({
  useUpdateScrollLock: vi.fn(),
}))

vi.mock('uniswap/src/components/network/NetworkFilter', () => ({
  NetworkFilter: () => null,
}))

vi.mock('uniswap/src/features/search/SearchModal/SearchModalNoQueryList', () => ({
  SearchModalNoQueryList: () => null,
}))

vi.mock('uniswap/src/features/search/SearchModal/SearchModalResultsList', () => ({
  SearchModalResultsList: () => null,
}))

vi.mock('~/hooks/useModalState', () => ({
  useModalState: () => ({ isOpen: true, toggleModal: vi.fn() }),
}))

describe('SearchModal', () => {
  beforeEach(() => {
    mockMediaSize('xxxl')
  })

  it.each([
    { isEnabled: true, expectedTabs: ['All', 'Tokens', 'Pools', 'Auctions', 'Wallets'] },
    { isEnabled: false, expectedTabs: ['All', 'Tokens', 'Pools', 'Wallets'] },
  ])(
    'renders the search field and ordered tabs when auction search enabled is $isEnabled',
    ({ isEnabled, expectedTabs }) => {
      render(<SearchModal isAuctionSearchEnabled={isEnabled} />)

      expect(screen.getByPlaceholderText('Search by name, symbol, or address')).toBeInTheDocument()
      expect(screen.getAllByText(/^(All|Tokens|Pools|Auctions|Wallets)$/).map((tab) => tab.textContent)).toEqual(
        expectedTabs,
      )
    },
  )

  it('uses the short placeholder on small viewports, where the long copy clips', () => {
    mockMediaSize('sm')

    render(<SearchModal isAuctionSearchEnabled={false} />)

    expect(screen.getByPlaceholderText('Search Uniswap')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Search by name, symbol, or address')).not.toBeInTheDocument()
  })
})
