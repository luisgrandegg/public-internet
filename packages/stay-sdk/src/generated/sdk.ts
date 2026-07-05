// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/stay-sdk generate
import type { ApiClient } from '../client.js'
import { BookingsPayResource } from './bookings-pay.resource.js'
import { BookingsReviewResource } from './bookings-review.resource.js'
import { BookingsResource } from './bookings.resource.js'
import { EnquiriesResource } from './enquiries.resource.js'
import { FavoritesResource } from './favorites.resource.js'
import { HostBookingsResource } from './host-bookings.resource.js'
import { HostEnquiriesReplyResource } from './host-enquiries-reply.resource.js'
import { HostEnquiriesResource } from './host-enquiries.resource.js'
import { HostListingsAvailabilityBlocksResource } from './host-listings-availability-blocks.resource.js'
import { HostListingsResource } from './host-listings.resource.js'
import { ListingsAvailabilityResource } from './listings-availability.resource.js'
import { ListingsEnquiriesResource } from './listings-enquiries.resource.js'
import { ListingsFavoriteResource } from './listings-favorite.resource.js'
import { ListingsReviewsResource } from './listings-reviews.resource.js'
import { ListingsResource } from './listings.resource.js'
import { UsersMeBecomeHostResource } from './users-me-become-host.resource.js'
import { UsersMeExportResource } from './users-me-export.resource.js'
import { UsersMeResource } from './users-me.resource.js'
import { WebhooksPaymentsResource } from './webhooks-payments.resource.js'

export class StaySDK {
  readonly bookingsPay: BookingsPayResource
  readonly bookingsReview: BookingsReviewResource
  readonly bookings: BookingsResource
  readonly enquiries: EnquiriesResource
  readonly favorites: FavoritesResource
  readonly listingsAvailability: ListingsAvailabilityResource
  readonly listingsEnquiries: ListingsEnquiriesResource
  readonly listingsFavorite: ListingsFavoriteResource
  readonly listingsReviews: ListingsReviewsResource
  readonly listings: ListingsResource
  readonly usersMeBecomeHost: UsersMeBecomeHostResource
  readonly usersMeExport: UsersMeExportResource
  readonly usersMe: UsersMeResource
  readonly webhooksPayments: WebhooksPaymentsResource
  readonly host: {
    bookings: HostBookingsResource
    enquiriesReply: HostEnquiriesReplyResource
    enquiries: HostEnquiriesResource
    listingsAvailabilityBlocks: HostListingsAvailabilityBlocksResource
    listings: HostListingsResource
  }

  constructor(client: ApiClient) {
    this.bookingsPay = new BookingsPayResource(client)
    this.bookingsReview = new BookingsReviewResource(client)
    this.bookings = new BookingsResource(client)
    this.enquiries = new EnquiriesResource(client)
    this.favorites = new FavoritesResource(client)
    this.listingsAvailability = new ListingsAvailabilityResource(client)
    this.listingsEnquiries = new ListingsEnquiriesResource(client)
    this.listingsFavorite = new ListingsFavoriteResource(client)
    this.listingsReviews = new ListingsReviewsResource(client)
    this.listings = new ListingsResource(client)
    this.usersMeBecomeHost = new UsersMeBecomeHostResource(client)
    this.usersMeExport = new UsersMeExportResource(client)
    this.usersMe = new UsersMeResource(client)
    this.webhooksPayments = new WebhooksPaymentsResource(client)
    this.host = {
      bookings: new HostBookingsResource(client),
      enquiriesReply: new HostEnquiriesReplyResource(client),
      enquiries: new HostEnquiriesResource(client),
      listingsAvailabilityBlocks: new HostListingsAvailabilityBlocksResource(client),
      listings: new HostListingsResource(client),
    }
  }
}
