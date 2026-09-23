import { mapRankedMultichainTokenList } from 'uniswap/src/data/apiClients/dataApiService/rwa/mapRankedMultichainTokenRwa'
import { createRankedMultichainToken } from 'uniswap/src/test/fixtures/dataApi/rankedMultichainToken'

describe('mapRankedMultichainTokenList', () => {
  it('maps each token to a single-issuer flat row', () => {
    const rows = mapRankedMultichainTokenList({
      multichainTokens: [
        createRankedMultichainToken({
          symbol: 'PAXG',
          name: 'Paxos Gold',
          price: 4347.76,
          volume1d: 1000,
          addresses: {
            '1': '0x1111111111111111111111111111111111111111',
            '137': '0x2222222222222222222222222222222222222222',
          },
        }),
      ],
    } as never)

    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual(
      expect.objectContaining({ symbol: 'PAXG', name: 'Paxos Gold', priceUsd: 4347.76, volume24hUsd: 1000 }),
    )
    expect(rows[0]?.issuerTokens).toHaveLength(1)
    expect(rows[0]?.issuerTokens[0]?.chainTokens.map((c) => c.chainId)).toEqual([1, 137])
  })

  it('drops tokens without a symbol or addresses', () => {
    const rows = mapRankedMultichainTokenList({
      multichainTokens: [createRankedMultichainToken({ symbol: '', addresses: {} })],
    } as never)
    expect(rows).toEqual([])
  })
})
