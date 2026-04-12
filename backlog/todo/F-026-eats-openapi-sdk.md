# F-026 — Eats: OpenAPI spec annotation and SDK generation

## Summary

Once all business API routes (F-016 through F-024) are implemented, this feature annotates every Route Handler with `@swagger` JSDoc, regenerates `openapi.json`, and regenerates the `eats-sdk` typed resource classes. This is a housekeeping feature that must be done before any consumer of the SDK can be written.

## What this feature includes

1. Add `@swagger` JSDoc to every `GET`, `POST`, `PATCH`, `DELETE` export in `src/app/api/**/route.ts`
2. Run `pnpm --filter @public-internet/eats generate:spec` — verify output at `src/lib/openapi.json`
3. Run `pnpm --filter @public-internet/eats-sdk generate` — regenerate `packages/eats-sdk/src/generated/`
4. Build and type-check both packages: `pnpm --filter @public-internet/eats type-check` and `pnpm --filter @public-internet/eats-sdk type-check`

## Annotation rules (from `apps/CLAUDE.md`)

- `operationId` follows `<resource>_<method>` pattern: e.g. `restaurants_list`, `orders_create`
- All schemas must reference `components/schemas` — never inline
- Authenticated endpoints must declare `security: [{ sessionCookie: [] }]`
- All schemas are already defined in `scripts/generate-spec.mjs`

## Acceptance criteria

- [ ] Every Route Handler export has a `@swagger` annotation
- [ ] `openapi.json` contains a path entry for all 17 business endpoints
- [ ] `pnpm --filter @public-internet/eats-sdk generate` produces non-placeholder files in `src/generated/`
- [ ] `EatsSDK` class has typed methods for all resources: `sdk.restaurants`, `sdk.orders`, `sdk.courier`, `sdk.restaurant`
- [ ] `pnpm --filter @public-internet/eats-sdk type-check` passes
- [ ] `GET /api/docs` returns the populated spec

## Notes

- This feature depends on F-016–F-024 being merged first
- Do not edit files in `packages/eats-sdk/src/generated/` manually — they are always overwritten by the generator
- The `generate-spec.mjs` schemas were written during bootstrapping and may need minor updates to match the final route shapes
