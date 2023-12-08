import { SuperAgentRequest } from 'superagent'

import type { Booking } from '@approved-premises/api'

import { getMatchingRequests, stubFor } from './setup'
import { errorStub } from './utils'

export default {
  stubBookingExtensionCreate: (args: { premisesId: string; booking: Booking }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        url: `/premises/${args.premisesId}/bookings/${args.booking.id}/extensions`,
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: args.booking,
      },
    }),
  stubBookingExtensionErrors: (args: {
    premisesId: string
    bookingId: string
    params: Array<string>
  }): SuperAgentRequest =>
    stubFor(errorStub(args.params, `/premises/${args.premisesId}/bookings/${args.bookingId}/extensions`)),
  verifyBookingExtensionCreate: async (args: { premisesId: string; bookingId: string }) =>
    (
      await getMatchingRequests({
        method: 'POST',
        url: `/premises/${args.premisesId}/bookings/${args.bookingId}/extensions`,
      })
    ).body.requests,
}
