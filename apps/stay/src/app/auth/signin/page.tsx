import { isGoogleAuthEnabled } from '@public-internet/node-auth'
import { SignInForm } from './SignInForm'

// Server component: reads the node's env to decide whether the optional
// Google strategy is offered (ADR-007 — per-node, never required).
export default function SignInPage() {
  return <SignInForm googleEnabled={isGoogleAuthEnabled()} />
}
