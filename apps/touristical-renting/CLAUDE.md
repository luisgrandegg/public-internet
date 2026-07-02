# CLAUDE.md — touristical-renting

> Rules scoped to `apps/touristical-renting/`. The root `CLAUDE.md` and `CONSTITUTION.md` apply globally on top of these.
> **This is the Stay platform** described in `CONSTITUTION.md` — commission-free tourist rental of flats, houses, and rooms.

---

## What this app does

Touristical Renting is a commission-free tourist accommodation marketplace. Hosts list properties (flats, houses, rooms). Guests search, enquire, and book. The platform charges nothing — no commission from hosts, no booking fees from guests. Revenue, if any, covers verified infrastructure costs only.

This is a direct functional replacement for AirBnB, built as public infrastructure for municipalities and cooperatives to own and operate.

---

## Constitution alignment

This app must satisfy all CONSTITUTION.md principles. The most relevant for this domain:

| Principle | What it means here |
|---|---|
| **No extraction** | Zero commission on bookings. No booking fees. No advertising. No upsells. |
| **No dark patterns** | No urgency copy ("Only 2 nights left!"). No pre-selected add-ons. No hidden cleaning fees revealed at checkout. |
| **Worker rights** | Hosts are rights-holders: transparent and predictable pay calculation, no arbitrary delisting without appeal. |
| **Federation-first** | Each deployment is a full standalone node. A city or cooperative can run their own instance. Nodes may federate to share discoverability. |
| **Accessibility-first** | WCAG AA minimum on every page and component. |

---

## Domain vocabulary

Use these terms consistently across code, copy, and comments. Never invent synonyms mid-feature.

| Term | Definition |
|---|---|
| **Property** | A physical accommodation unit — a flat, house, room, or any rentable space. Owned by a Host. |
| **Listing** | A Property made available for rental — includes description, photos, availability, and price. |
| **Host** | A user who owns one or more Properties and creates Listings. |
| **Guest** | A user who searches for and books Listings. |
| **Booking** | A confirmed reservation of a Listing by a Guest for a specific date range. |
| **Enquiry** | A pre-booking message from a Guest to a Host, before confirmation. |
| **Availability** | The calendar of dates on which a Listing can be booked. |
| **Price** | The nightly rate for a Listing. Always shown as the complete price — no hidden fees. If cleaning or linen fees exist, they are itemised before the Guest commits. |
| **Review** | Post-stay feedback. Both Host and Guest can review each other. Reviews are mutual and published simultaneously to prevent retaliatory behaviour. |
| **Node** | A single deployment of the platform, operated by a municipality, cooperative, or community. |

---

## Route structure

The app uses the Next.js App Router under `src/app/`. Plan routes here before adding pages.

| Route | Page | Status |
|---|---|---|
| `/` | Home — search entry point | Planned |
| `/listings` | Listing search results | Planned |
| `/listings/[id]` | Listing detail — photos, description, availability, price, host | Planned |
| `/listings/[id]/book` | Booking flow | Planned |
| `/bookings` | Guest's booking history | Planned |
| `/enquiries` | Guest's enquiries inbox — sent messages and host replies | Built |
| `/bookings/[id]` | Individual booking detail | Planned |
| `/host` | Host dashboard — listings, bookings, earnings | Planned |
| `/host/listings/new` | Create a new listing | Planned |
| `/host/listings/[id]/edit` | Edit an existing listing | Planned |
| `/profile` | User profile and settings | Planned |
| `/auth/signin` | Sign in | Planned |
| `/auth/signup` | Sign up | Planned |
| `/auth/forgot-password` | Request a password reset link | Built |
| `/auth/reset-password` | Choose a new password (from emailed reset link) | Built |

Before adding a new route, add it to this table with its status.

---

## Import rules

Always import components from the design system. Never create one-off styled wrappers.

```tsx
// ✅ Correct
import { Button, Card, Stack, Text } from '@public-internet/design-system'

// ❌ Never — relative cross-package import
import { Button } from '../../../packages/design-system/src/components/Button'

// ❌ Never — one-off local component that duplicates a design system primitive
const PrimaryButton = styled.button`background: var(--ds-color-brand-primary)`
```

If a UI requirement cannot be met with existing design system components, **flag the gap explicitly** and stop:

```tsx
// GAP: This requires a <DateRangePicker> component not yet in the design system.
// Recommend adding to backlog before proceeding.
```

---

## Backend and API

This app uses Next.js Route Handlers as its REST API. See `apps/CLAUDE.md § Full-Stack Rules` for the shared pattern.

### REST API surface for touristical-renting

| Method | Path | Auth required | Description |
|---|---|---|---|
| `POST` | `/api/auth/sign-up` | No | Create account; sets session cookie |
| `POST` | `/api/auth/sign-in` | No | Authenticate; sets session cookie |
| `POST` | `/api/auth/sign-out` | Yes | Destroy session |
| `POST` | `/api/auth/forgot-password` | No | Send reset email (always 204 to prevent enumeration) |
| `GET` | `/api/listings` | No | List listings; supports `?location`, `?propertyType`, `?minPrice`, `?maxPrice`, `?checkIn`, `?checkOut`, `?guests`, `?page` |
| `POST` | `/api/listings` | Yes (Host) | Create a listing |
| `GET` | `/api/listings/:id` | No | Get single listing |
| `PATCH` | `/api/listings/:id` | Yes (owner) | Update listing |
| `DELETE` | `/api/listings/:id` | Yes (owner) | Delete listing |
| `POST` | `/api/bookings` | Yes (Guest) | Create a booking |
| `GET` | `/api/bookings/:id` | Yes (owner) | Get booking detail |
| `GET` | `/api/enquiries` | Yes (Guest) | List the signed-in guest's enquiries with host replies |
| `GET` | `/api/host/listings` | Yes (Host) | List host's own listings |
| `GET` | `/api/host/bookings` | Yes (Host) | List bookings for host's listings |

### Prisma schema (initial entities)

```prisma
model User {
  id           String    @id @default(cuid())
  name         String
  email        String    @unique
  passwordHash String
  isHost       Boolean   @default(false)
  createdAt    DateTime  @default(now())
  listings     Listing[]
  bookings     Booking[]
  sessions     Session[]
}

model Listing {
  id           String   @id @default(cuid())
  title        String
  description  String
  propertyType String   // 'flat' | 'house' | 'room' | 'studio'
  city         String
  country      String
  lat          Float
  lng          Float
  nightlyRate  Int      // cents — avoids floating-point rounding in money
  maxGuests    Int
  bedrooms     Int
  bathrooms    Int
  photos       Photo[]
  host         User     @relation(fields: [hostId], references: [id])
  hostId       String
  bookings     Booking[]
  createdAt    DateTime @default(now())
}

model Photo {
  id        String  @id @default(cuid())
  url       String
  alt       String
  listing   Listing @relation(fields: [listingId], references: [id])
  listingId String
}

model Booking {
  id        String   @id @default(cuid())
  listing   Listing  @relation(fields: [listingId], references: [id])
  listingId String
  guest     User     @relation(fields: [guestId], references: [id])
  guestId   String
  checkIn   DateTime
  checkOut  DateTime
  totalCost Int      // cents
  createdAt DateTime @default(now())
}

model Session {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

> **Note:** `nightlyRate` and `totalCost` are stored in cents (integer) to avoid floating-point rounding errors. Always display as `€${(amount / 100).toFixed(2)}`.

### Required environment variables

```bash
# .env.example
DATABASE_URL="postgresql://user:password@localhost:5432/touristical_renting"
BETTER_AUTH_SECRET="<random 32-char secret>"
NEXT_PUBLIC_API_BASE="http://localhost:3000"
```

---

## Data rules

- Every price shown to a user must be the **total price** — nightly rate × nights + all itemised fees. Never reveal additional fees after the Guest has started the booking flow.
- Availability data must be fetched fresh at booking time — never trust a cached calendar for the final availability check.
- Host earnings must show the full calculation: `(nightly rate × nights) - infrastructure fee (if any)`. No surprises.
- Reviews are published simultaneously for both parties — never show one party's review before the other has submitted or the review window closes.

---

## Accessibility rules

These are binding, not aspirational.

- Every interactive element must be keyboard-reachable and have a visible focus state.
- Every image must have a descriptive `alt` attribute. Decorative images use `alt=""`.
- Price and availability information must not rely on colour alone — use text labels.
- Date pickers and calendars must be operable with keyboard navigation.
- Form error messages must be associated with their input via `aria-describedby`.

---

## What not to build

The following patterns are explicitly forbidden by CONSTITUTION.md and must never be implemented:

- Commission taken from Hosts or booking fees charged to Guests
- Urgency or scarcity copy ("Only 1 left!", "3 people are looking at this right now")
- Pre-selected add-ons or opt-out checkboxes
- Prices revealed for the first time at the final checkout step
- Algorithms that rank listings based on paid promotion
- Features that make it harder for a Host to leave the platform or export their listing data
- Any feature that requires a central authority — every feature must work on a standalone node
