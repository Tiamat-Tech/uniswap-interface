import { Experiments, Layers, TokenCategoriesProperties } from '@universe/gating/src/experiments'
import { useExperimentValueFromLayer, useStatsigClientStatus } from '@universe/gating/src/hooks'

/**
 * Token categories arm of the Discovery layer. Read through the layer (not the experiment) so the
 * exposure is attributed to whichever experiment currently owns the param, and users bucketed into a
 * sibling experiment in the layer get the layer default (off).
 */
function useIsTokenCategoriesEnabled(): boolean {
  return useExperimentValueFromLayer<typeof Layers.Discovery, Experiments.TokenCategories, boolean>({
    layerName: Layers.Discovery,
    param: TokenCategoriesProperties.TokenCategoriesEnabled,
    defaultValue: false,
  })
}

function useIsTokenCategoriesEnabledWithLoading(): { value: boolean; isLoading: boolean } {
  const { isStatsigLoading } = useStatsigClientStatus()
  const value = useIsTokenCategoriesEnabled()
  return { value, isLoading: isStatsigLoading }
}

export { useIsTokenCategoriesEnabled, useIsTokenCategoriesEnabledWithLoading }
