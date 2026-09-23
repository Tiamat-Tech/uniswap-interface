import { useMemo } from 'react'
import { findRWAMatch, type RWACandidate, type RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import { useRWAWhitelist } from 'uniswap/src/features/rwa/useRWAWhitelist'

export function useRWAMatch({ candidates }: { candidates: RWACandidate[] }): RWAMatch | undefined {
  const rwaWhitelist = useRWAWhitelist()

  return useMemo(() => findRWAMatch({ rwaWhitelist, candidates }), [candidates, rwaWhitelist])
}
