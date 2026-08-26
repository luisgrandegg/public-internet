/**
 * Generates openapi.json from swagger-jsdoc annotations in route files.
 * Run: node scripts/generate-spec.mjs
 * Output: src/lib/openapi.json
 */
import swaggerJsdoc from 'swagger-jsdoc'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Stay API',
      version: '1.0.0',
      description:
        'Commission-free tourist rental REST API. All prices are in cents (integer) unless noted.',
      contact: { name: 'public-internet', url: 'https://github.com/public-internet' },
    },
    servers: [
      {
        url: '{baseUrl}',
        variables: { baseUrl: { default: 'http://localhost:3000', description: 'Base server URL' } },
      },
    ],
    components: {
      securitySchemes: {
        sessionCookie: {
          type: 'apiKey',
          in: 'cookie',
          name: 'better-auth.session_token',
          description: 'Session cookie set by better-auth on sign-in',
        },
      },
      schemas: {
        NodeVersion: {
          type: 'object',
          description:
            'The release of the node software this deployment was built from (ADR-008).',
          properties: {
            app: { type: 'string', example: 'stay', description: 'Which platform this node runs' },
            version: {
              type: 'string',
              example: '0.4.0',
              description:
                "The node's release. '0.0.0-dev' means the app was built outside a release build.",
            },
          },
          required: ['app', 'version'],
        },
        PropertyType: {
          type: 'string',
          enum: ['flat', 'house', 'room', 'studio'],
          description: 'Type of rental property',
        },
        PhotoInput: {
          type: 'object',
          required: ['url'],
          properties: {
            url: { type: 'string', format: 'uri', description: 'Publicly accessible photo URL' },
            alt: { type: 'string', default: '', description: 'Accessible alt text' },
          },
        },
        Photo: {
          type: 'object',
          required: ['id', 'url', 'alt', 'listingId'],
          properties: {
            id: { type: 'string' },
            url: { type: 'string', format: 'uri' },
            alt: { type: 'string' },
            listingId: { type: 'string' },
          },
        },
        HostSummary: {
          type: 'object',
          required: ['id', 'name'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            image: { type: 'string', nullable: true },
          },
        },
        HostSummaryWithCreatedAt: {
          allOf: [
            { $ref: '#/components/schemas/HostSummary' },
            {
              type: 'object',
              properties: {
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          ],
        },
        GuestSummary: {
          type: 'object',
          required: ['id', 'name', 'email'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
        },
        ListingSummary: {
          type: 'object',
          required: ['id', 'title', 'nightlyRate'],
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            nightlyRate: { type: 'integer', description: 'Nightly rate in cents' },
          },
        },
        Listing: {
          type: 'object',
          required: [
            'id', 'title', 'description', 'propertyType', 'city', 'country',
            'lat', 'lng', 'nightlyRate', 'maxGuests', 'bedrooms', 'bathrooms',
            'hostId', 'photos', 'host', 'createdAt', 'updatedAt',
          ],
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            propertyType: { $ref: '#/components/schemas/PropertyType' },
            city: { type: 'string' },
            country: { type: 'string' },
            lat: { type: 'number' },
            lng: { type: 'number' },
            nightlyRate: { type: 'integer', description: 'Nightly rate in cents. Display as (nightlyRate / 100).toFixed(2)' },
            maxGuests: { type: 'integer' },
            bedrooms: { type: 'integer' },
            bathrooms: { type: 'integer' },
            hostId: { type: 'string' },
            photos: { type: 'array', items: { $ref: '#/components/schemas/Photo' } },
            host: { $ref: '#/components/schemas/HostSummary' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            rating: {
              type: 'number',
              nullable: true,
              description: 'Average rating (1–5) across published reviews. Null when the listing has no published reviews. Present on list responses (listings_list).',
            },
            reviewCount: {
              type: 'integer',
              description: 'Number of published reviews. Present on list responses (listings_list).',
            },
          },
        },
        HostListing: {
          allOf: [
            { $ref: '#/components/schemas/Listing' },
            {
              type: 'object',
              properties: {
                _count: {
                  type: 'object',
                  properties: { bookings: { type: 'integer' } },
                },
              },
            },
          ],
        },
        PaymentStatus: {
          type: 'string',
          enum: ['PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED'],
          description:
            "Payment settlement status (ADR-006). Offline payments are created SUCCEEDED; online payments start PENDING and are confirmed by the provider's webhook.",
        },
        Payment: {
          type: 'object',
          description:
            "Payment record accompanying every booking (ADR-006). provider is the PaymentProvider id (e.g. 'stripe') for payments settled online via the provider's hosted checkout, or 'offline' when settled directly with the host (pay at the property).",
          required: ['id', 'bookingId', 'provider', 'status', 'amount', 'currency', 'createdAt', 'updatedAt'],
          properties: {
            id: { type: 'string' },
            bookingId: { type: 'string' },
            provider: {
              type: 'string',
              example: 'stripe',
              description: "PaymentProvider id ('stripe', a custom id, …) or 'offline'",
            },
            status: { $ref: '#/components/schemas/PaymentStatus' },
            amount: {
              type: 'integer',
              description: 'Amount in cents — exactly the pre-confirmation total. Never recomputed.',
            },
            currency: { type: 'string', example: 'eur' },
            providerSessionId: {
              type: 'string',
              nullable: true,
              description: "The provider's hosted checkout session id",
            },
            providerPaymentReference: {
              type: 'string',
              nullable: true,
              description: "The provider's settlement reference (e.g. a Stripe payment intent id), set when the payment succeeds",
            },
            providerCheckoutUrl: {
              type: 'string',
              format: 'uri',
              nullable: true,
              description: 'Hosted checkout URL stored at creation so a pending payment can be resumed',
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Booking: {
          type: 'object',
          required: [
            'id', 'listingId', 'guestId', 'checkIn', 'checkOut',
            'totalCost', 'createdAt', 'updatedAt', 'listing', 'guest',
          ],
          properties: {
            id: { type: 'string' },
            listingId: { type: 'string' },
            guestId: { type: 'string' },
            checkIn: { type: 'string', format: 'date-time' },
            checkOut: { type: 'string', format: 'date-time' },
            totalCost: { type: 'integer', description: 'Total booking cost in cents' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            listing: {
              allOf: [
                { $ref: '#/components/schemas/ListingSummary' },
                { type: 'object', properties: { photos: { type: 'array', items: { $ref: '#/components/schemas/Photo' } } } },
              ],
            },
            guest: { $ref: '#/components/schemas/GuestSummary' },
            payment: {
              nullable: true,
              allOf: [{ $ref: '#/components/schemas/Payment' }],
              description: 'The 1:1 payment record for this booking (ADR-006).',
            },
          },
        },
        BookingCreated: {
          description:
            "Response of bookings_create: the booking plus its payment record. checkoutUrl is the configured payment provider's hosted checkout URL to redirect the guest to, or null (offline settlement).",
          allOf: [
            { $ref: '#/components/schemas/Booking' },
            {
              type: 'object',
              required: ['checkoutUrl'],
              properties: {
                checkoutUrl: { type: 'string', format: 'uri', nullable: true },
              },
            },
          ],
        },
        CreateListingInput: {
          type: 'object',
          required: ['title', 'description', 'propertyType', 'city', 'country', 'nightlyRate', 'maxGuests', 'bedrooms', 'bathrooms', 'photos'],
          properties: {
            title: { type: 'string', minLength: 5, maxLength: 120 },
            description: { type: 'string', minLength: 20, maxLength: 2000 },
            propertyType: { $ref: '#/components/schemas/PropertyType' },
            city: { type: 'string' },
            country: { type: 'string' },
            lat: { type: 'number', default: 0 },
            lng: { type: 'number', default: 0 },
            nightlyRate: { type: 'number', description: 'Nightly rate in euros (float). Service converts to cents.' },
            maxGuests: { type: 'integer', minimum: 1, maximum: 50 },
            bedrooms: { type: 'integer', minimum: 0, maximum: 50 },
            bathrooms: { type: 'integer', minimum: 1, maximum: 50 },
            photos: { type: 'array', minItems: 1, items: { $ref: '#/components/schemas/PhotoInput' } },
          },
        },
        UpdateListingInput: {
          type: 'object',
          description: 'All fields are optional. Only provided fields are updated.',
          properties: {
            title: { type: 'string', minLength: 5, maxLength: 120 },
            description: { type: 'string', minLength: 20, maxLength: 2000 },
            propertyType: { $ref: '#/components/schemas/PropertyType' },
            city: { type: 'string' },
            country: { type: 'string' },
            lat: { type: 'number' },
            lng: { type: 'number' },
            nightlyRate: { type: 'number', description: 'Nightly rate in euros (float).' },
            maxGuests: { type: 'integer', minimum: 1, maximum: 50 },
            bedrooms: { type: 'integer', minimum: 0, maximum: 50 },
            bathrooms: { type: 'integer', minimum: 1, maximum: 50 },
            photos: { type: 'array', minItems: 1, items: { $ref: '#/components/schemas/PhotoInput' } },
          },
        },
        BookingPaymentResume: {
          type: 'object',
          description:
            "Response of bookings_pay: a live hosted-checkout URL for the booking's pending online payment. The session is resumed when still open, or freshly created when the stored one expired.",
          required: ['checkoutUrl'],
          properties: {
            checkoutUrl: {
              type: 'string',
              format: 'uri',
              description: "The payment provider's hosted checkout URL to redirect the guest to",
            },
          },
        },
        CreateBookingInput: {
          type: 'object',
          required: ['listingId', 'checkIn', 'checkOut'],
          properties: {
            listingId: { type: 'string' },
            checkIn: { type: 'string', format: 'date', description: 'ISO date YYYY-MM-DD' },
            checkOut: { type: 'string', format: 'date', description: 'ISO date YYYY-MM-DD. Must be after checkIn.' },
          },
        },
        PaginatedListings: {
          type: 'object',
          required: ['listings', 'total', 'page', 'limit'],
          properties: {
            listings: { type: 'array', items: { $ref: '#/components/schemas/Listing' } },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
          },
        },
        UserProfile: {
          type: 'object',
          required: ['id', 'name', 'email', 'isHost', 'createdAt'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            image: { type: 'string', format: 'uri', nullable: true },
            isHost: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        UserProfileSummary: {
          type: 'object',
          required: ['id', 'name', 'email', 'isHost'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            image: { type: 'string', format: 'uri', nullable: true },
            isHost: { type: 'boolean' },
          },
        },
        UpdateProfileInput: {
          type: 'object',
          description: 'All fields are optional. Only provided fields are updated.',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 120 },
            image: { type: 'string', format: 'uri', description: 'Public avatar URL' },
          },
        },
        UserDataExport: {
          type: 'object',
          required: ['user', 'listings', 'bookings'],
          properties: {
            user: { $ref: '#/components/schemas/UserProfile' },
            listings: { type: 'array', items: { $ref: '#/components/schemas/Listing' } },
            bookings: { type: 'array', items: { $ref: '#/components/schemas/Booking' } },
          },
        },
        Enquiry: {
          type: 'object',
          required: ['id', 'listingId', 'guestId', 'hostId', 'message', 'createdAt'],
          properties: {
            id: { type: 'string' },
            listingId: { type: 'string' },
            guestId: { type: 'string' },
            hostId: { type: 'string' },
            message: { type: 'string' },
            reply: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            repliedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        GuestEnquiry: {
          description:
            "An enquiry as seen by the guest who sent it, including the listing it concerns. reply and repliedAt are null until the host replies.",
          allOf: [
            { $ref: '#/components/schemas/Enquiry' },
            {
              type: 'object',
              required: ['listing'],
              properties: {
                listing: {
                  type: 'object',
                  required: ['id', 'title'],
                  properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                  },
                },
              },
            },
          ],
        },
        Review: {
          type: 'object',
          required: ['id', 'bookingId', 'listingId', 'authorId', 'targetId', 'targetRole', 'rating', 'body', 'submittedAt'],
          properties: {
            id: { type: 'string' },
            bookingId: { type: 'string' },
            listingId: { type: 'string' },
            authorId: { type: 'string' },
            targetId: { type: 'string' },
            targetRole: { type: 'string', enum: ['guest', 'host'] },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            body: { type: 'string' },
            submittedAt: { type: 'string', format: 'date-time' },
            publishedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        CreateReviewInput: {
          type: 'object',
          required: ['targetId', 'targetRole', 'rating', 'body'],
          properties: {
            targetId: { type: 'string' },
            targetRole: { type: 'string', enum: ['guest', 'host'] },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            body: { type: 'string', minLength: 10, maxLength: 2000 },
          },
        },
        AvailabilityBlock: {
          type: 'object',
          required: ['id', 'listingId', 'startDate', 'endDate', 'createdAt'],
          properties: {
            id: { type: 'string' },
            listingId: { type: 'string' },
            startDate: { type: 'string', format: 'date-time', description: 'First blocked day (inclusive)' },
            endDate: { type: 'string', format: 'date-time', description: 'First available day after the block (exclusive)' },
            reason: { type: 'string', nullable: true, description: 'Optional host-facing note, e.g. "Personal use"' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateAvailabilityBlockInput: {
          type: 'object',
          required: ['startDate', 'endDate'],
          properties: {
            startDate: { type: 'string', format: 'date', description: 'ISO date YYYY-MM-DD — first blocked day (inclusive)' },
            endDate: { type: 'string', format: 'date', description: 'ISO date YYYY-MM-DD — first available day after the block (exclusive). Must be after startDate.' },
            reason: { type: 'string', maxLength: 200, description: 'Optional host-facing note' },
          },
        },
        FavoriteStatus: {
          type: 'object',
          required: ['listingId', 'favorited'],
          properties: {
            listingId: { type: 'string' },
            favorited: { type: 'boolean' },
          },
        },
        ApiError: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'object',
              required: ['code', 'message'],
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string' },
                fields: {
                  type: 'object',
                  additionalProperties: { type: 'string' },
                  description: 'Per-field validation errors',
                },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'listings', description: 'Listing discovery and management' },
      { name: 'bookings', description: 'Booking management' },
      { name: 'host', description: 'Host dashboard operations' },
      { name: 'users', description: 'User profile and account management' },
      { name: 'enquiries', description: 'Guest-to-host messaging' },
      { name: 'reviews', description: 'Mutual review system' },
      { name: 'favorites', description: 'Saved listings (wishlist)' },
      { name: 'webhooks', description: 'Inbound webhooks from the configured payment provider (provider-authenticated, e.g. signature-verified — no session auth)' },
    ],
  },
  // Using absolute paths so the script can be run from any directory.
  // Note: Next.js [param] directory names contain brackets which break glob character classes,
  // so we use ** and exclude the auth catch-all and docs route.
  apis: [join(root, 'src/app/api/**/route.ts')],
}

const spec = swaggerJsdoc(options)

const outDir = join(root, 'src', 'lib')
writeFileSync(join(outDir, 'openapi.json'), JSON.stringify(spec, null, 2), 'utf8')

console.log('✓ openapi.json written to src/lib/openapi.json')
console.log(`  ${Object.keys(spec.paths ?? {}).length} paths documented`)
