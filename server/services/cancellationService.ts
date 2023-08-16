import type { ReferenceData } from '@approved-premises/ui'
import type { Cancellation, NewCancellation } from '@approved-premises/api'
import type { BookingClient, ReferenceDataClient, RestClientBuilder } from '../data'

export default class CancellationService {
  constructor(
    private readonly bookingClientFactory: RestClientBuilder<BookingClient>,
    private readonly referenceDataClientFactory: RestClientBuilder<ReferenceDataClient>,
  ) {}

  async createCancellation(
    token: string,
    premisesId: string,
    bookingId: string,
    cancellation: NewCancellation,
  ): Promise<Cancellation> {
    const bookingClient = this.bookingClientFactory(token)

    const confirmedCancellation = await bookingClient.cancel(premisesId, bookingId, cancellation)

    return confirmedCancellation
  }

  async getCancellationReasons(token: string): Promise<Array<ReferenceData>> {
    const referenceDataClient = this.referenceDataClientFactory(token)

    const reasons = await referenceDataClient.getReferenceData('cancellation-reasons')

    return reasons.filter(r => r.isActive) as Array<ReferenceData>
  }
}
