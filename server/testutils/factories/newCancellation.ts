import { Factory } from 'fishery'
import { faker } from '@faker-js/faker/locale/en_GB'

import type { NewCancellation } from '@approved-premises/api'
import referenceDataFactory from './referenceData'
import { DateFormats } from '../../utils/dateUtils'

export default Factory.define<NewCancellation>(() => {
  const date = faker.date.soon()
  return {
    id: faker.string.uuid(),
    date: DateFormats.dateObjToIsoDate(faker.date.soon()),
    'date-day': date.getDate().toString(),
    'date-month': date.getMonth().toString(),
    'date-year': date.getFullYear().toString(),
    bookingId: faker.string.uuid(),
    reason: referenceDataFactory.cancellationReasons().build().id,
    notes: faker.lorem.sentence(),
  }
})
