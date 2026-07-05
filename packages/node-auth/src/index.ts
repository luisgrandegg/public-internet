// Server entry (ADR-007). The browser client lives behind the separate
// '@public-internet/node-auth/client' export path — mirroring how better-auth
// itself splits server and client — so importing this barrel from a client
// component never drags server-only code into the bundle.
export {
  createNodeAuth,
  isGoogleAuthEnabled,
  toNextJsHandler,
} from './server'
export type {
  NodeAuthAdditionalUserFields,
  NodeAuthDatabase,
  NodeAuthEmailProvider,
  NodeAuthOptions,
} from './server'
