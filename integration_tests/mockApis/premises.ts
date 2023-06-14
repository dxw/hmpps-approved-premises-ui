import type { Response, SuperAgentRequest } from 'superagent'

import type { BedOccupancyRange, Booking, DateCapacity, Premises, StaffMember } from '@approved-premises/api'

import { stubFor } from '../../wiremock'
import bookingStubs from './booking'
import paths from '../../server/paths/api'
import { createQueryString } from '../../server/utils/utils'

const stubPremises = (premises: Array<Premises>) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/premises',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: premises,
    },
  })

const stubSinglePremises = (premises: Premises) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/premises/${premises.id}`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: premises,
    },
  })

const stubPremisesCapacity = (args: { premisesId: string; dateCapacities: DateCapacity }) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/premises/${args.premisesId}/capacity`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: args.dateCapacities,
    },
  })

export default {
  stubPremises,
  stubSinglePremises: (premises: Premises): Promise<[Response, Response]> =>
    Promise.all([
      stubSinglePremises(premises),
      bookingStubs.stubBookingsForPremisesId({ premisesId: premises.id, bookings: [] }),
    ]),
  stubPremisesWithBookings: (args: { premises: Premises; bookings: Array<Booking> }): Promise<[Response, Response]> =>
    Promise.all([
      stubSinglePremises(args.premises),
      bookingStubs.stubBookingsForPremisesId({ premisesId: args.premises.id, bookings: args.bookings }),
    ]),
  stubPremisesCapacity,
  stubPremisesStaff: (args: { premisesId: string; staff: Array<StaffMember> }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        url: `/premises/${args.premisesId}/staff`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: args.staff,
      },
    }),
  stubPremisesOccupancy: (args: {
    premisesId: string
    startDate: string
    endDate: string
    premisesOccupancy: Array<BedOccupancyRange>
  }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        url: `${paths.premises.calendar({ premisesId: args.premisesId })}?${createQueryString({
          startDate: args.startDate,
          endDate: args.endDate,
        })}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: args.premisesOccupancy,
      },
    }),
}
