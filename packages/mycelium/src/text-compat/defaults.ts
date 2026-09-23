/**
 * The legacy Text defaults, platformless so both legs resolve them identically
 * (and so the export-parity pin can hold without the native leg importing the
 * DOM one).
 */
import type { TextCompatProps } from './props'

/**
 * Inject only the defaults the caller didn't set. A plain spread would keep a
 * caller-supplied `variant` at the default's key position (object spread
 * updates the value but keeps the first-insertion slot), erasing the authored
 * fontWeight/variant order Tamagui's insertion-ordered merge resolves winners
 * from (see `fontWeightWinsOverVariant`, INFRA-3457).
 */
function mergeDefaults(defaults: TextCompatProps, props: TextCompatProps): TextCompatProps {
  const missing: Record<string, unknown> = {}
  for (const key of Object.keys(defaults) as (keyof TextCompatProps)[]) {
    if (!(key in props)) {
      missing[key] = defaults[key]
    }
  }
  return { ...missing, ...props }
}

/**
 * The legacy Text defaults: variant body2 (styled defaultVariants) and color
 * $neutral1 — user props override both. In loading state the text renders
 * transparent at opacity 0 under the placeholder bar. Exported so the
 * workbench safelist generator compiles the exact classNames the component
 * renders.
 */
export function resolveTextCompatDefaults({
  loading,
  props,
}: {
  loading: boolean | 'no-shimmer'
  props: TextCompatProps
}): TextCompatProps {
  return loading !== false
    ? mergeDefaults({ variant: 'body2', color: '$transparent', opacity: 0 }, props)
    : mergeDefaults({ variant: 'body2', color: '$neutral1' }, props)
}
