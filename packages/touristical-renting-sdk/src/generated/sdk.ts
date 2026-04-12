// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/touristical-renting-sdk generate
import type { ApiClient } from '../client.js'
import { BookingsResource } from './bookings.resource.js'
import { HostBookingsResource } from './host-bookings.resource.js'
import { HostListingsResource } from './host-listings.resource.js'
import { ListingsResource } from './listings.resource.js'

export class TouristicalRentingSDK {
  readonly bookings: BookingsResource
  readonly listings: ListingsResource
  readonly host: {
    bookings: HostBookingsResource
    listings: HostListingsResource
  }

  constructor(client: ApiClient) {
    this.bookings = new BookingsResource(client)
    this.listings = new ListingsResource(client)
    this.host = {
      bookings: new HostBookingsResource(client),
      listings: new HostListingsResource(client),
    }
  }
}
