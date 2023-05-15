import { Factory } from 'fishery'
import { faker } from '@faker-js/faker/locale/en_GB'

import type { StaffMember } from '@approved-premises/api'

export default Factory.define<StaffMember>(() => ({
  id: faker.number.int(),
  name: faker.person.fullName(),
  code: faker.string.uuid(),
  keyWorker: faker.datatype.boolean(),
}))
