// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/eats-sdk generate
import type { ApiClient } from '../client.js'
import { CourierDeliveriesResource } from './courier-deliveries.resource.js'
import { OrdersReviewResource } from './orders-review.resource.js'
import { OrdersResource } from './orders.resource.js'
import { RestaurantMenuResource } from './restaurant-menu.resource.js'
import { RestaurantOrdersResource } from './restaurant-orders.resource.js'
import { RestaurantRestaurantsMenuResource } from './restaurant-restaurants-menu.resource.js'
import { RestaurantRestaurantsResource } from './restaurant-restaurants.resource.js'
import { RestaurantsMenuResource } from './restaurants-menu.resource.js'
import { RestaurantsReviewsResource } from './restaurants-reviews.resource.js'
import { RestaurantsResource } from './restaurants.resource.js'
import { RestaurantsCategoriesResource } from './restaurants-categories.resource.js'
import { WebhooksPaymentsResource } from './webhooks-payments.resource.js'

export class EatsSDK {
  readonly ordersReview: OrdersReviewResource
  readonly orders: OrdersResource
  readonly restaurantsMenu: RestaurantsMenuResource
  readonly restaurantsReviews: RestaurantsReviewsResource
  readonly restaurants: RestaurantsResource
  readonly restaurantsCategories: RestaurantsCategoriesResource
  readonly webhooksPayments: WebhooksPaymentsResource
  readonly courier: {
    deliveries: CourierDeliveriesResource
  }
  readonly restaurant: {
    menu: RestaurantMenuResource
    orders: RestaurantOrdersResource
    restaurantsMenu: RestaurantRestaurantsMenuResource
    restaurants: RestaurantRestaurantsResource
  }

  constructor(client: ApiClient) {
    this.ordersReview = new OrdersReviewResource(client)
    this.orders = new OrdersResource(client)
    this.restaurantsMenu = new RestaurantsMenuResource(client)
    this.restaurantsReviews = new RestaurantsReviewsResource(client)
    this.restaurants = new RestaurantsResource(client)
    this.restaurantsCategories = new RestaurantsCategoriesResource(client)
    this.webhooksPayments = new WebhooksPaymentsResource(client)
    this.courier = {
      deliveries: new CourierDeliveriesResource(client),
    }
    this.restaurant = {
      menu: new RestaurantMenuResource(client),
      orders: new RestaurantOrdersResource(client),
      restaurantsMenu: new RestaurantRestaurantsMenuResource(client),
      restaurants: new RestaurantRestaurantsResource(client),
    }
  }
}
