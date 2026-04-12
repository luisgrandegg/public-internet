# F-007 — Listing search page with map (touristical-renting)

## Summary

The primary discovery surface. Split layout: filter sidebar on the left, listing cards grid + Leaflet map on the right. Filters are URL-driven (searchParams) so searches are bookmarkable and the back button works correctly.

## Layout

```
┌─────────────┬────────────────────────────┐
│ Filters     │  Leaflet Map               │
│ (sidebar)   │  (OpenStreetMap tiles)     │
│             ├────────────────────────────┤
│             │  Listing cards grid        │
└─────────────┴────────────────────────────┘
```

## Server / Client architecture

- `listings/page.tsx` — Server Component. Reads `searchParams`, filters mock data, passes result to `<ListingsClientShell>`.
- `ListingsClientShell` — Client Component. Owns `hoveredListingId` state. Coordinates card hover → map marker popup.
- `FiltersSidebar` — Client Component. Calls `router.push()` with new URL on filter change. No local filter state persisted.
- `ListingsMap` — Client-only via `dynamic(() => import('./ListingsMap'), { ssr: false })`.
- `ListingCard` — Client Component (needs hover callbacks).

## Map

- Library: `react-leaflet` + `leaflet` (open source, no API key, no proprietary dependency)
- Tile layer: OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`)
- Attribution: "© OpenStreetMap contributors" (rendered by Leaflet automatically)
- Each listing → one `<Marker>` with `<Popup>` showing title + price
- Hover on card → corresponding popup opens on map (via `markersRef`)

## Listing card

- Photo with descriptive `alt` text
- `<Badge>` for property type
- City with `<Icon name="map-pin">`
- Star rating or "No reviews yet" (never colour-only)
- Price: `€X / night — total price` (label is constitutionally required — no fee reveals later)
- No urgency copy ("Only 2 left!" is explicitly forbidden)

## Acceptance criteria

- [x] Filters update the URL and trigger a server-side re-filter (no stale cache)
- [x] Map loads client-side only (no SSR errors)
- [x] Hovering a listing card opens the corresponding map popup
- [x] Every listing card price shows "total price" label
- [x] Map attribution rendered per OSM licence requirements
- [x] No scarcity/urgency signals anywhere
- [x] Map loading state is accessible (`role="status"`, `aria-label`)
- [x] `pnpm type-check` and `pnpm lint` pass

## Dependencies to add

```json
"react-leaflet": "^4.2.1",
"leaflet": "^1.9.4",
"@types/leaflet": "^1.9.14"
```

## Design system gaps required

- `Select` (currently native `<select>` with GAP comment)
- `CheckboxGroup` (currently native `<input type="checkbox">` with GAP comment)

## Status

Planned — not yet implemented.

---

## Completed

**Completed:** 2026-04-12
**PR:** feature/touristical-renting-bootstrap (pending)
**Commit:** (see branch HEAD)
**Audit:** pnpm type-check and lint pass
**Notes:** Full listings search page with Leaflet map using OpenStreetMap tiles. Server Component page filters by location, propertyType, minPrice, maxPrice from searchParams. ListingsClientShell owns hoveredListingId state. Map is SSR-disabled via dynamic import with accessible loading placeholder. Leaflet icon webpack fix applied. GAP comment on native select in FiltersSidebar.
