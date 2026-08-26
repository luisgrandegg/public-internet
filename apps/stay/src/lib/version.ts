/**
 * The release this node is running (ADR-008).
 *
 * `NEXT_PUBLIC_APP_VERSION` is injected at build time from the root
 * package.json by next.config.ts. It falls back to `0.0.0-dev` for a local
 * dev server started outside that build, which is a legitimate state — not
 * an error to surface.
 */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0-dev'

/** Stable identifier for this platform, so /api/version is self-describing. */
export const APP_NAME = 'stay'
