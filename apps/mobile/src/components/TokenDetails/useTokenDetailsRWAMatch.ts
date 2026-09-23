import { GraphQLApi } from '@universe/api'
import { useMemo } from 'react'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { findRWAMatch, type RWACandidate, type RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import { useRWAWhitelist } from 'uniswap/src/features/rwa/useRWAWhitelist'
import { isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'

export function useTokenDetailsRWAMatch(): RWAMatch | undefined {
  const rwaWhitelist = useRWAWhitelist()
  const { address, chainId, currencyId } = useTokenDetailsContext()

  const { data } = GraphQLApi.useTokenDetailsScreenQuery({
    variables: {
      ...currencyIdToContractInput(currencyId),
      multichain: true,
    },
    fetchPolicy: 'cache-only',
  })

  const rwaCandidates = useMemo<RWACandidate[]>(() => {
    const candidates: RWACandidate[] = []
    if (!isNativeCurrencyAddress(chainId, address)) {
      candidates.push({ chainId, address })
    }

    for (const token of data?.token?.project?.tokens ?? []) {
      const projectTokenChainId = fromGraphQLChain(token.chain)
      if (projectTokenChainId && token.address) {
        candidates.push({ chainId: projectTokenChainId, address: token.address })
      }
    }

    return candidates
  }, [address, chainId, data?.token?.project?.tokens])

  return useMemo(() => findRWAMatch({ rwaWhitelist, candidates: rwaCandidates }), [rwaCandidates, rwaWhitelist])
}
