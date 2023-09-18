import { Factory } from 'fishery'
import { faker } from '@faker-js/faker/locale/en_GB'

import type {
  ApprovedPremisesUser as User,
  UserQualification,
  ApprovedPremisesUserRole as UserRole,
} from '@approved-premises/api'

export default Factory.define<User>(() => ({
  name: faker.person.fullName(),
  deliusUsername: faker.internet.userName(),
  email: faker.internet.email(),
  telephoneNumber: faker.phone.number(),
  roles: roleFactory.buildList(Math.floor(Math.random() * 10)),
  qualifications: qualificationFactory.buildList(Math.floor(Math.random() * 2)),
  id: faker.string.uuid(),
  region: faker.helpers.arrayElement([{ id: faker.string.uuid(), name: faker.location.county() }]),
  service: 'ApprovedPremises',
}))

const roleFactory = Factory.define<UserRole>(() =>
  faker.helpers.arrayElement([
    'assessor',
    'matcher',
    'manager',
    'workflow_manager',
    'applicant',
    'role_admin',
    'report_viewer',
    'excluded_from_assess_allocation',
    'excluded_from_match_allocation',
    'excluded_from_placement_application_allocation',
  ]),
)

const qualificationFactory = Factory.define<UserQualification>(() =>
  faker.helpers.arrayElement(['pipe', 'emergency', 'esap', 'lao', 'womens']),
)
