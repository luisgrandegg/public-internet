export type { EmailProvider } from './types'
export { StubEmailProvider } from './stub'

import { StubEmailProvider } from './stub'

// Swap StubEmailProvider for a real implementation when a mail provider is configured.
export const emailProvider = new StubEmailProvider()
