import { getBlockaidScanTransactionResponseSchema } from '@universe/api/src/clients/blockaid/types'
import { describe, expect, it } from 'vitest'

describe('getBlockaidScanTransactionResponseSchema', () => {
  it('preserves NFT approval scope and exposure details', () => {
    const result = getBlockaidScanTransactionResponseSchema().parse({
      block: '1',
      chain: 'ethereum',
      simulation: {
        status: 'Success',
        assets_diffs: {},
        transaction_actions: ['approval'],
        total_usd_diff: {},
        exposures: {},
        total_usd_exposure: {},
        address_details: {},
        account_summary: {
          assets_diffs: [],
          traces: [],
          total_usd_diff: { in: '0', out: '0', total: '0' },
          total_usd_exposure: {},
          exposures: [
            {
              asset_type: 'ERC721',
              asset: {
                type: 'ERC721',
                address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
                symbol: 'BAYC',
              },
              spenders: {
                '0xa77ac4e2a77ac4e2a77ac4e2a77ac4e2a77ac4e2': {
                  exposure: [{ token_id: '8817', arbitrary_collection_token: false }],
                  is_approved_for_all: false,
                },
              },
            },
            {
              asset_type: 'ERC1155',
              asset: {
                type: 'ERC1155',
                address: '0x495f947276749ce646f68ac8c248420045cb7b5e',
                name: 'Collection',
              },
              spenders: {
                '0xa77ac4e2a77ac4e2a77ac4e2a77ac4e2a77ac4e2': {
                  exposure: [{ token_id: '42', value: '1', arbitrary_collection_token: false }],
                  is_approved_for_all: true,
                },
              },
            },
          ],
        },
      },
    })

    const [erc721, erc1155] = result.simulation?.status === 'Success' ? result.simulation.account_summary.exposures : []
    const erc721Spender = erc721?.spenders['0xa77ac4e2a77ac4e2a77ac4e2a77ac4e2a77ac4e2']
    const erc1155Spender = erc1155?.spenders['0xa77ac4e2a77ac4e2a77ac4e2a77ac4e2a77ac4e2']

    expect(erc721Spender).toMatchObject({
      is_approved_for_all: false,
      exposure: [{ token_id: '8817', arbitrary_collection_token: false }],
    })
    expect(erc1155Spender).toMatchObject({
      is_approved_for_all: true,
      exposure: [{ token_id: '42', value: '1', arbitrary_collection_token: false }],
    })
  })
})
