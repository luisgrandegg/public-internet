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
      title: 'Touristical Renting API',
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
          },
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
    ],
  },
  // Using glob pattern — swagger-jsdoc resolves from cwd (app root).
  // Note: Next.js [param] directory names contain brackets which break glob character classes,
  // so we use ** and exclude the auth catch-all and docs route.
  apis: ['./src/app/api/**/route.ts'],
}

const spec = swaggerJsdoc(options)

const outDir = join(root, 'src', 'lib')
writeFileSync(join(outDir, 'openapi.json'), JSON.stringify(spec, null, 2), 'utf8')

console.log('✓ openapi.json written to src/lib/openapi.json')
console.log(`  ${Object.keys(spec.paths ?? {}).length} paths documented`)
