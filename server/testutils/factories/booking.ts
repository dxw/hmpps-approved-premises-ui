import { Factory } from 'fishery'
import { faker } from '@faker-js/faker/locale/en_GB'
import { addDays, startOfToday } from 'date-fns'

import type { Booking } from '@approved-premises/api'
import arrivalFactory from './arrival'
import departureFactory from './departure'
import personFactory from './person'
import { DateFormats } from '../../utils/dateUtils'
import cancellationFactory from './cancellation'

const today = DateFormats.dateObjToIsoDate(startOfToday())
const soon = () =>
  DateFormats.dateObjToIsoDate(faker.date.soon(5, addDays(new Date(new Date().setHours(0, 0, 0, 0)), 1)))
const past = () => DateFormats.dateObjToIsoDate(faker.date.past())
const future = () => DateFormats.dateObjToIsoDate(faker.date.future())
class BookingFactory extends Factory<Booking> {
  arrivingToday() {
    return this.params({
      arrivalDate: today,
      status: 'awaiting-arrival',
    })
  }

  arrivedToday() {
    return this.params({
      arrivalDate: today,
      status: 'arrived',
    })
  }

  arrived() {
    return this.params({
      arrivalDate: past(),
      departureDate: future(),
      status: 'arrived',
    })
  }

  notArrived() {
    return this.params({
      arrivalDate: past(),
      departureDate: future(),
      status: 'not-arrived',
    })
  }

  departingToday() {
    return this.params({
      arrivalDate: past(),
      departureDate: today,
      status: 'arrived',
    })
  }

  departedToday() {
    return this.params({
      arrivalDate: past(),
      departureDate: today,
      status: 'departed',
    })
  }

  arrivingSoon() {
    return this.params({
      arrivalDate: soon(),
      departureDate: future(),
      status: 'awaiting-arrival',
    })
  }

  cancelledWithFutureArrivalDate() {
    return this.params({
      arrivalDate: soon(),
      departureDate: future(),
      status: 'cancelled',
    })
  }

  departingSoon() {
    return this.params({
      departureDate: soon(),
      arrivalDate: past(),
      status: 'arrived',
    })
  }
}

export default BookingFactory.define(() => {
  const arrivalDate = DateFormats.dateObjToIsoDate(faker.date.soon())
  const departureDate = DateFormats.dateObjToIsoDate(faker.date.future())
  return {
    person: personFactory.build(),
    arrivalDate,
    originalArrivalDate: arrivalDate,
    departureDate,
    originalDepartureDate: departureDate,
    name: `${faker.name.firstName()} ${faker.name.lastName()}`,
    id: faker.datatype.uuid(),
    status: 'awaiting-arrival' as const,
    arrival: arrivalFactory.build(),
    departure: departureFactory.build(),
    extensions: [],
    serviceName: 'approved-premises' as const,
    createdAt: DateFormats.dateObjToIsoDateTime(faker.date.past()),
    cancellations: cancellationFactory.buildList(1),
    departures: departureFactory.buildList(1),
  }
})
