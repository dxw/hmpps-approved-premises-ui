import type {
  Arrival,
  Booking,
  Cancellation,
  Departure,
  Extension,
  NewCas1Arrival as NewArrival,
  NewBedMove,
  NewBooking,
  NewCancellation,
  NewDateChange,
  NewDeparture,
  NewExtension,
  NewNonarrival,
  Nonarrival,
} from '@approved-premises/api'
import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import paths from '../paths/api'

export default class BookingClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('bookingClient', config.apis.approvedPremises as ApiConfig, token)
  }

  async create(premisesId: string, data: NewBooking): Promise<Booking> {
    return (await this.restClient.post({ path: this.bookingsPath(premisesId), data })) as Booking
  }

  async find(premisesId: string, bookingId: string): Promise<Booking> {
    return (await this.restClient.get({ path: this.bookingPath(premisesId, bookingId) })) as Booking
  }

  async allBookingsForPremisesId(premisesId: string): Promise<Array<Booking>> {
    return (await this.restClient.get({ path: this.bookingsPath(premisesId) })) as Array<Booking>
  }

  async extendBooking(premisesId: string, bookingId: string, bookingExtension: NewExtension): Promise<Extension> {
    return (await this.restClient.post({
      path: `/premises/${premisesId}/bookings/${bookingId}/extensions`,
      data: bookingExtension,
    })) as Extension
  }

  async markAsArrived(premisesId: string, bookingId: string, arrival: NewArrival): Promise<Arrival> {
    const response = await this.restClient.post({
      path: `${this.bookingPath(premisesId, bookingId)}/arrivals`,
      data: arrival,
    })

    return response as Arrival
  }

  async cancel(premisesId: string, bookingId: string, cancellation: NewCancellation): Promise<Cancellation> {
    const response = await this.restClient.post({
      path: `${this.bookingPath(premisesId, bookingId)}/cancellations`,
      data: cancellation,
    })

    return response as Cancellation
  }

  async markDeparture(premisesId: string, bookingId: string, departure: NewDeparture): Promise<Departure> {
    const response = await this.restClient.post({
      path: `${this.bookingPath(premisesId, bookingId)}/departures`,
      data: departure,
    })

    return response as Departure
  }

  async markNonArrival(premisesId: string, bookingId: string, nonArrival: NewNonarrival): Promise<Nonarrival> {
    const response = await this.restClient.post({
      path: `${this.bookingPath(premisesId, bookingId)}/non-arrivals`,
      data: nonArrival,
    })

    return response as Nonarrival
  }

  async moveBooking(premisesId: string, bookingId: string, move: NewBedMove): Promise<void> {
    await this.restClient.post({
      path: paths.premises.bookings.move({ premisesId, bookingId }),
      data: move,
    })
  }

  async changeDates(premisesId: string, bookingId: string, dateChange: NewDateChange): Promise<void> {
    await this.restClient.post({
      path: paths.premises.bookings.dateChange({ premisesId, bookingId }),
      data: dateChange,
    })
  }

  private bookingsPath(premisesId: string): string {
    return `/premises/${premisesId}/bookings`
  }

  private bookingPath(premisesId: string, bookingId: string): string {
    return [this.bookingsPath(premisesId), bookingId].join('/')
  }
}
