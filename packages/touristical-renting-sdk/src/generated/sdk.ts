// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/touristical-renting-sdk generate
import type { ApiClient } from '../client.js'
import { BookingsReviewResource } from './bookings-review.resource.js'
import { BookingsResource } from './bookings.resource.js'
import { HostBookingsResource } from './host-bookings.resource.js'
import { HostEnquiriesReplyResource } from './host-enquiries-reply.resource.js'
import { HostEnquiriesResource } from './host-enquiries.resource.js'
import { HostListingsResource } from './host-listings.resource.js'
import { ListingsAvailabilityResource } from './listings-availability.resource.js'
import { ListingsEnquiriesResource } from './listings-enquiries.resource.js'
import { ListingsReviewsResource } from './listings-reviews.resource.js'
import { ListingsResource } from './listings.resource.js'
import { UsersMeBecomeHostResource } from './users-me-become-host.resource.js'
import { UsersMeExportResource } from './users-me-export.resource.js'
import { UsersMeResource } from './users-me.resource.js'

export class TouristicalRentingSDK {
  readonly bookingsReview: BookingsReviewResource
  readonly bookings: BookingsResource
  readonly listingsAvailability: ListingsAvailabilityResource
  readonly listingsEnquiries: ListingsEnquiriesResource
  readonly listingsReviews: ListingsReviewsResource
  readonly listings: ListingsResource
  readonly usersMeBecomeHost: UsersMeBecomeHostResource
  readonly usersMeExport: UsersMeExportResource
  readonly usersMe: UsersMeResource
  readonly host: {
    bookings: HostBookingsResource
    enquiriesReply: HostEnquiriesReplyResource
    enquiries: HostEnquiriesResource
    listings: HostListingsResource
  }

  constructor(client: ApiClient) {
    this.bookingsReview = new BookingsReviewResource(client)
    this.bookings = new BookingsResource(client)
    this.listingsAvailability = new ListingsAvailabilityResource(client)
    this.listingsEnquiries = new ListingsEnquiriesResource(client)
    this.listingsReviews = new ListingsReviewsResource(client)
    this.listings = new ListingsResource(client)
    this.usersMeBecomeHost = new UsersMeBecomeHostResource(client)
    this.usersMeExport = new UsersMeExportResource(client)
    this.usersMe = new UsersMeResource(client)
    this.host = {
      bookings: new HostBookingsResource(client),
      enquiriesReply: new HostEnquiriesReplyResource(client),
      enquiries: new HostEnquiriesResource(client),
      listings: new HostListingsResource(client),
    }
  }
}
