import { ApolloClient, from, HttpLink } from '@apollo/client'
import { isTestEnv } from '@universe/environment'
import { setupSharedApolloCache } from 'uniswap/src/data/graphql/cache'
import { getDatadogApolloLink } from 'utilities/src/logger/datadog/datadogLink'
import { getConfig } from '~/config'

const httpLink = new HttpLink({ uri: getConfig().awsApiEndpoint })
const datadogLink = getDatadogApolloLink()

export const apolloClient = new ApolloClient({
  // Off under test: the devtools-suggestion branch schedules a setTimeout that
  // re-reads `window` when it fires and never clears it (ApolloClient.js:143),
  // so a jsdom teardown that wins the race throws an uncaught
  // `ReferenceError: window is not defined` and fails the run even when every
  // test passed.
  connectToDevTools: !isTestEnv(),
  link: from([datadogLink, httpLink]),
  headers: {
    'Content-Type': 'application/json',
    Origin: 'https://app.uniswap.org',
  },
  cache: setupSharedApolloCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})
