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
      title: 'Eats API',
      version: '1.0.0',
      description:
        'Commission-free food delivery REST API. All prices are in cents (integer) unless noted. ' +
        'The platform charges a flat infrastructure fee per order — never a percentage commission.',
      contact: { name: 'public-internet', url: 'https://github.com/public-internet' },
    },
    servers: [
      {
        url: '{baseUrl}',
        variables: { baseUrl: { default: 'http://localhost:3001', description: 'Base server URL' } },
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
            app: { type: 'string', example: 'eats', description: 'Which platform this node runs' },
            version: {
              type: 'string',
              example: '0.4.0',
              description:
                "The node's release. '0.0.0-dev' means the app was built outside a release build.",
            },
          },
          required: ['app', 'version'],
        },
        OrderStatus: {
          type: 'string',
          enum: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'IN_DELIVERY', 'DELIVERED', 'CANCELLED'],
          description: 'Lifecycle status of an order',
        },
        DeliveryStatus: {
          type: 'string',
          enum: ['UNASSIGNED', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'FAILED'],
          description: 'Lifecycle status of a delivery',
        },
        RestaurantSummary: {
          type: 'object',
          required: ['id', 'name', 'city'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            city: { type: 'string' },
            imageUrl: { type: 'string', nullable: true },
          },
        },
        Restaurant: {
          type: 'object',
          required: ['id', 'name', 'description', 'address', 'city', 'country', 'lat', 'lng', 'isActive', 'ownerId', 'createdAt', 'updatedAt'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            address: { type: 'string' },
            city: { type: 'string' },
            country: { type: 'string' },
            lat: { type: 'number' },
            lng: { type: 'number' },
            phone: { type: 'string', nullable: true },
            imageUrl: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            ownerId: { type: 'string' },
            avgRating: {
              type: 'number',
              nullable: true,
              description: 'Average review rating (1–5) rounded to one decimal, or null when the restaurant has no reviews',
            },
            reviewCount: {
              type: 'integer',
              description: 'Number of verified-order reviews for this restaurant',
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateRestaurantInput: {
          type: 'object',
          required: ['name', 'description', 'address', 'city', 'country'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 120 },
            description: { type: 'string', minLength: 10, maxLength: 1000 },
            address: { type: 'string' },
            city: { type: 'string' },
            country: { type: 'string' },
            lat: { type: 'number', default: 0 },
            lng: { type: 'number', default: 0 },
            phone: { type: 'string' },
            imageUrl: { type: 'string', format: 'uri' },
          },
        },
        UpdateRestaurantInput: {
          type: 'object',
          description: 'All fields are optional. Only provided fields are updated.',
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 120 },
            description: { type: 'string', minLength: 10, maxLength: 1000 },
            address: { type: 'string' },
            city: { type: 'string' },
            country: { type: 'string' },
            lat: { type: 'number' },
            lng: { type: 'number' },
            phone: { type: 'string', nullable: true, description: 'Send null or an empty string to clear the stored phone number' },
            imageUrl: { type: 'string', format: 'uri', nullable: true, description: 'Send null or an empty string to clear the stored image URL' },
            isActive: { type: 'boolean' },
          },
        },
        MenuItem: {
          type: 'object',
          required: ['id', 'name', 'description', 'price', 'category', 'isAvailable', 'restaurantId', 'createdAt', 'updatedAt'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'integer', description: 'Price in cents. Display as (price / 100).toFixed(2)' },
            category: { type: 'string' },
            isAvailable: { type: 'boolean' },
            restaurantId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateMenuItemInput: {
          type: 'object',
          required: ['name', 'description', 'price', 'category'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 120 },
            description: { type: 'string', minLength: 5, maxLength: 500 },
            price: { type: 'number', description: 'Price in euros (float). Service converts to cents.' },
            category: { type: 'string' },
          },
        },
        UpdateMenuItemInput: {
          type: 'object',
          description: 'All fields are optional. Only provided fields are updated.',
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 120 },
            description: { type: 'string', minLength: 5, maxLength: 500 },
            price: { type: 'number', description: 'Price in euros (float).' },
            category: { type: 'string' },
            isAvailable: { type: 'boolean' },
          },
        },
        OrderItemInput: {
          type: 'object',
          required: ['menuItemId', 'quantity'],
          properties: {
            menuItemId: { type: 'string' },
            quantity: { type: 'integer', minimum: 1 },
          },
        },
        PaymentStatus: {
          type: 'string',
          enum: ['PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED'],
          description: 'Lifecycle status of a payment (ADR-006). Only the provider-authenticated webhook (POST /api/webhooks/payments) moves an online payment to SUCCEEDED.',
        },
        Payment: {
          type: 'object',
          required: ['id', 'orderId', 'provider', 'status', 'amount', 'currency', 'createdAt', 'updatedAt'],
          description: 'One payment per order (ADR-006). provider "offline" documents direct settlement (pay on delivery) — a first-class commission-free mode, not a stub.',
          properties: {
            id: { type: 'string' },
            orderId: { type: 'string' },
            provider: { type: 'string', description: 'PaymentProvider id that created this payment (e.g. "stripe"), or "offline" for direct settlement' },
            status: { $ref: '#/components/schemas/PaymentStatus' },
            amount: { type: 'integer', description: 'Amount in cents — exactly the pre-confirmation totalCost. Never recomputed after creation.' },
            currency: { type: 'string', description: 'ISO currency code, default "eur"' },
            providerSessionId: { type: 'string', nullable: true, description: 'Provider checkout session id — set only for online payments' },
            providerPaymentReference: { type: 'string', nullable: true, description: "Provider's durable payment reference, set by the payment.succeeded webhook event" },
            providerCheckoutUrl: { type: 'string', nullable: true, description: 'Hosted checkout URL for completing a PENDING online payment' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        OrderItem: {
          type: 'object',
          required: ['id', 'orderId', 'menuItemId', 'quantity', 'unitPrice'],
          properties: {
            id: { type: 'string' },
            orderId: { type: 'string' },
            menuItemId: { type: 'string' },
            nameSnapshot: { type: 'string', nullable: true, description: 'Menu item name snapshotted at order time' },
            quantity: { type: 'integer' },
            unitPrice: { type: 'integer', description: 'Unit price in cents, snapshotted at order time' },
          },
        },
        Order: {
          type: 'object',
          required: ['id', 'status', 'customerId', 'restaurantId', 'items', 'itemsCost', 'infrastructureFee', 'totalCost', 'deliveryAddress', 'createdAt', 'updatedAt'],
          properties: {
            id: { type: 'string' },
            status: { $ref: '#/components/schemas/OrderStatus' },
            customerId: { type: 'string' },
            restaurantId: { type: 'string' },
            restaurant: { $ref: '#/components/schemas/RestaurantSummary' },
            items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
            delivery: {
              allOf: [{ $ref: '#/components/schemas/Delivery' }],
              nullable: true,
              description: 'Delivery record for the order, when one exists',
            },
            payment: {
              allOf: [{ $ref: '#/components/schemas/Payment' }],
              nullable: true,
              description: 'Payment record for the order (ADR-006). Null only on orders created before payments existed.',
            },
            itemsCost: { type: 'integer', description: 'Sum of all item costs in cents' },
            infrastructureFee: { type: 'integer', description: 'Flat infrastructure fee in cents — transparent and published. Not a commission.' },
            totalCost: { type: 'integer', description: 'Total cost in cents = itemsCost + infrastructureFee. Complete price — no hidden fees.' },
            deliveryAddress: { type: 'string' },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CheckoutResume: {
          type: 'object',
          required: ['checkoutUrl'],
          description: 'Live hosted-checkout URL for completing a PENDING online payment (POST /api/orders/{id}/pay). The amount behind the URL is exactly the original order total — never recomputed.',
          properties: {
            checkoutUrl: {
              type: 'string',
              description: 'Provider-hosted checkout URL to redirect the customer to',
            },
          },
        },
        PlacedOrder: {
          description: 'Order as returned from placement. On a node with an online payment provider configured checkoutUrl points to the hosted checkout page; on an offline node it is null and the payment is already SUCCEEDED.',
          allOf: [
            { $ref: '#/components/schemas/Order' },
            {
              type: 'object',
              required: ['checkoutUrl'],
              properties: {
                checkoutUrl: {
                  type: 'string',
                  nullable: true,
                  description: "Provider-hosted checkout URL to redirect the customer to, or null in offline-settlement mode",
                },
              },
            },
          ],
        },
        CreateOrderInput: {
          type: 'object',
          required: ['restaurantId', 'items', 'deliveryAddress'],
          properties: {
            restaurantId: { type: 'string' },
            items: { type: 'array', minItems: 1, items: { $ref: '#/components/schemas/OrderItemInput' } },
            deliveryAddress: { type: 'string' },
            notes: { type: 'string' },
          },
        },
        Delivery: {
          type: 'object',
          required: ['id', 'orderId', 'status', 'basePay', 'distancePay', 'createdAt', 'updatedAt'],
          properties: {
            id: { type: 'string' },
            orderId: { type: 'string' },
            courierId: { type: 'string', nullable: true },
            status: { $ref: '#/components/schemas/DeliveryStatus' },
            basePay: { type: 'integer', description: 'Base pay in cents — flat per-delivery amount shown to courier before accepting' },
            distancePay: { type: 'integer', description: 'Distance pay in cents — per-km rate × estimated km shown to courier before accepting' },
            pickedUpAt: { type: 'string', format: 'date-time', nullable: true },
            deliveredAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        MenuCategories: {
          type: 'object',
          required: ['categories'],
          properties: {
            categories: {
              type: 'array',
              items: { type: 'string' },
              description: 'Distinct categories of available menu items across active restaurants, sorted alphabetically',
            },
          },
        },
        Review: {
          type: 'object',
          required: ['id', 'orderId', 'restaurantId', 'authorId', 'rating', 'body', 'createdAt'],
          properties: {
            id: { type: 'string' },
            orderId: { type: 'string', description: 'The delivered order this review belongs to — one review per order' },
            restaurantId: { type: 'string' },
            authorId: { type: 'string' },
            author: {
              type: 'object',
              required: ['name'],
              properties: { name: { type: 'string' } },
              description: 'The reviewing customer',
            },
            rating: { type: 'integer', minimum: 1, maximum: 5, description: 'Star rating from 1 to 5' },
            body: { type: 'string', description: 'Optional free-text feedback — empty string when the customer left none' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateReviewInput: {
          type: 'object',
          required: ['rating'],
          properties: {
            rating: { type: 'integer', minimum: 1, maximum: 5, description: 'Star rating from 1 to 5' },
            body: { type: 'string', maxLength: 2000, description: 'Optional free-text feedback' },
          },
        },
        PaginatedReviews: {
          type: 'object',
          required: ['reviews', 'total', 'page', 'limit'],
          properties: {
            reviews: { type: 'array', items: { $ref: '#/components/schemas/Review' } },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
          },
        },
        PaginatedRestaurants: {
          type: 'object',
          required: ['restaurants', 'total', 'page', 'limit'],
          properties: {
            restaurants: { type: 'array', items: { $ref: '#/components/schemas/Restaurant' } },
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
      { name: 'restaurants', description: 'Restaurant discovery' },
      { name: 'menu', description: 'Menu item browsing' },
      { name: 'orders', description: 'Order placement and tracking' },
      { name: 'reviews', description: 'Verified-order restaurant reviews and ratings' },
      { name: 'courier', description: 'Courier delivery operations' },
      { name: 'restaurant-owner', description: 'Restaurant owner management operations' },
      { name: 'webhooks', description: 'Provider webhook receivers — called by external services, not SDK consumers' },
    ],
  },
  // Using glob pattern — swagger-jsdoc resolves from cwd (app root).
  apis: ['./src/app/api/**/route.ts'],
}

const spec = swaggerJsdoc(options)

const outDir = join(root, 'src', 'lib')
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'openapi.json'), JSON.stringify(spec, null, 2), 'utf8')

console.log('✓ openapi.json written to src/lib/openapi.json')
console.log(`  ${Object.keys(spec.paths ?? {}).length} paths documented`)
