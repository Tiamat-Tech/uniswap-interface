import { ENTRY_GATEWAY_API_BASE_URLS } from '@universe/api/src/clients/base/urls'
import { getConfig } from '@universe/config'
import { getCurrentEnv } from '@universe/environment'

/**
 * Socket opens against the entry gateway — the session cookie is host-only on that domain,
 * and the gateway authenticates and proxies through to the websockets service.
 */
export function getWebSocketUrl(): string {
  const config = getConfig()

  // Vercel can't proxy WS, so previews connect directly and fall back to REST pricing.
  if (config.enableEntryGatewayProxy && !config.isVercelEnvironment) {
    return '/ws'
  }

  const environment = getCurrentEnv({ isVercelEnvironment: config.isVercelEnvironment })
  return `${ENTRY_GATEWAY_API_BASE_URLS[environment].replace('https:', 'wss:')}/ws`
}
