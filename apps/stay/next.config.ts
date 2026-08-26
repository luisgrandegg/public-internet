import type { NextConfig } from 'next'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// The release this node is running (ADR-008). The versioned artifact is the
// repository, so the single source of truth is the root package.json — read at
// build time and inlined, since NEXT_PUBLIC_* cannot be changed after a build.
const rootPackageJson = JSON.parse(
  readFileSync(join(process.cwd(), '..', '..', 'package.json'), 'utf8'),
) as { version: string }

const nextConfig: NextConfig = {
  transpilePackages: ['@public-internet/design-system'],
  env: {
    NEXT_PUBLIC_APP_VERSION:
      process.env.NEXT_PUBLIC_APP_VERSION ?? rootPackageJson.version,
  },
}

export default nextConfig
