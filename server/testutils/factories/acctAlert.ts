import type { PersonAcctAlert } from '@approved-premises/api'

import { Factory } from 'fishery'
import { faker } from '@faker-js/faker/locale/en_GB'

import { DateFormats } from '../../utils/dateUtils'

export default Factory.define<PersonAcctAlert>(() => ({
  alertId: faker.datatype.number(),
  dateCreated: DateFormats.dateObjToIsoDate(faker.date.past()),
  dateExpires: DateFormats.dateObjToIsoDate(faker.date.future()),
  comment: faker.lorem.sentence(),
  expired: faker.datatype.boolean(),
  active: faker.datatype.boolean(),
}))