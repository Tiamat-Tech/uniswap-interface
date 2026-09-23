import { Experiments, Layers, V2EndpointsSearchProperties } from '@universe/gating/src/experiments'
import { useExperimentValueFromLayer } from '@universe/gating/src/hooks'

/** Search V2 endpoints arm of the Discovery layer; see `useIsTokenCategoriesEnabled` for why it reads via the layer. */
function useIsV2EndpointsSearchEnabled(): boolean {
  return useExperimentValueFromLayer<typeof Layers.Discovery, Experiments.V2EndpointsSearch, boolean>({
    layerName: Layers.Discovery,
    param: V2EndpointsSearchProperties.V2EndpointsSearchEnabled,
    defaultValue: false,
  })
}

export { useIsV2EndpointsSearchEnabled }
