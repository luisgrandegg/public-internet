// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/touristical-renting-sdk generate
import type { ApiClient } from '../client.js'
import { BookingsResource } from './bookings.resource.js'
import { HostBookingsResource } from './host-bookings.resource.js'
import { HostListingsResource } from './host-listings.resource.js'
import { ListingsResource } from './listings.resource.js'
import { UsersMeBecomeHostResource } from './users-me-become-host.resource.js'
import { UsersMeExportResource } from './users-me-export.resource.js'
import { UsersMeResource } from './users-me.resource.js'

export class TouristicalRentingSDK {
  readonly bookings: BookingsResource
  readonly listings: ListingsResource
  readonly usersMeBecomeHost: UsersMeBecomeHostResource
  readonly usersMeExport: UsersMeExportResource
  readonly usersMe: UsersMeResource
  readonly host: {
    bookings: HostBookingsResource
    listings: HostListingsResource
  }

  constructor(client: ApiClient) {
    this.bookings = new BookingsResource(client)
    this.listings = new ListingsResource(client)
    this.usersMeBecomeHost = new UsersMeBecomeHostResource(client)
    this.usersMeExport = new UsersMeExportResource(client)
    this.usersMe = new UsersMeResource(client)
    this.host = {
      bookings: new HostBookingsResource(client),
      listings: new HostListingsResource(client),
    }
  }
}
