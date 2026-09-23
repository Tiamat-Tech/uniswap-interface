import { renderHook } from '@testing-library/react-native'
import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { useTokenDetailsRWAMatch } from 'src/components/TokenDetails/useTokenDetailsRWAMatch'
import { useRWAWhitelist } from 'uniswap/src/features/rwa/useRWAWhitelist'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import type { MockedFunction } from 'vitest'

vi.mock('@universe/api', async () => {
  const actual = await vi.importActual<typeof import('@universe/api')>('@universe/api')
  return {
    ...actual,
    GraphQLApi: {
      ...actual.GraphQLApi,
      useTokenDetailsScreenQuery: vi.fn(),
    },
  }
})

vi.mock('src/components/TokenDetails/TokenDetailsContext', () => ({
  useTokenDetailsContext: vi.fn(),
}))

vi.mock('uniswap/src/features/rwa/useRWAWhitelist', () => ({
  useRWAWhitelist: vi.fn(),
}))

const TOKEN_ADDRESS = '0x1111111111111111111111111111111111111111'
const SIBLING_TOKEN_ADDRESS = '0x2222222222222222222222222222222222222222'

const mockUseTokenDetailsContext = useTokenDetailsContext as MockedFunction<typeof useTokenDetailsContext>
const mockUseRWAWhitelist = useRWAWhitelist as MockedFunction<typeof useRWAWhitelist>
const mockUseTokenDetailsScreenQuery = GraphQLApi.useTokenDetailsScreenQuery as MockedFunction<
  typeof GraphQLApi.useTokenDetailsScreenQuery
>

const SIBLING_RWA_TOKEN = {
  chainId: UniverseChainId.Polygon,
  address: SIBLING_TOKEN_ADDRESS,
  issuer: 'issuer',
  name: 'RWA Asset',
  symbol: 'RWA',
  logoUrl: 'https://example.com/rwa.png',
}

const RWA_ASSET = {
  symbol: 'RWA',
  name: 'RWA Asset',
  icon: 'https://example.com/rwa.png',
  category: RwaCategory.STOCKS,
  tokens: [SIBLING_RWA_TOKEN],
}

describe(useTokenDetailsRWAMatch, () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseTokenDetailsContext.mockReturnValue({
      address: TOKEN_ADDRESS,
      chainId: UniverseChainId.Mainnet,
      currencyId: buildCurrencyId(UniverseChainId.Mainnet, TOKEN_ADDRESS),
    } as ReturnType<typeof useTokenDetailsContext>)
    mockUseTokenDetailsScreenQuery.mockReturnValue({
      data: {
        token: {
          project: {
            tokens: [
              { chain: GraphQLApi.Chain.Ethereum, address: TOKEN_ADDRESS },
              { chain: GraphQLApi.Chain.Polygon, address: SIBLING_TOKEN_ADDRESS },
            ],
          },
        },
      },
    } as ReturnType<typeof GraphQLApi.useTokenDetailsScreenQuery>)
    mockUseRWAWhitelist.mockReturnValue([RWA_ASSET])
  })

  it('matches a project sibling contract against the RWA whitelist', () => {
    const { result } = renderHook(() => useTokenDetailsRWAMatch())

    expect(result.current).toEqual({ asset: RWA_ASSET, token: SIBLING_RWA_TOKEN })
  })

  it('matches the TDP token itself ahead of its project siblings', () => {
    const mainnetToken = { ...SIBLING_RWA_TOKEN, chainId: UniverseChainId.Mainnet, address: TOKEN_ADDRESS }
    const mainnetAsset = { ...RWA_ASSET, tokens: [mainnetToken, SIBLING_RWA_TOKEN] }
    mockUseRWAWhitelist.mockReturnValue([mainnetAsset])

    const { result } = renderHook(() => useTokenDetailsRWAMatch())

    expect(result.current).toEqual({ asset: mainnetAsset, token: mainnetToken })
  })

  it('returns undefined when no candidate matches the whitelist', () => {
    mockUseRWAWhitelist.mockReturnValue([])

    const { result } = renderHook(() => useTokenDetailsRWAMatch())

    expect(result.current).toBeUndefined()
  })
})
