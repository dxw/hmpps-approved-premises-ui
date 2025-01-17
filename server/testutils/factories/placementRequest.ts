import { Factory } from 'fishery'
import { faker } from '@faker-js/faker/locale/en_GB'
import { PlacementRequest } from '../../@types/shared'
import { DateFormats } from '../../utils/dateUtils'
import { fullPersonFactory, restrictedPersonFactory } from './person'
import risksFactory from './risks'
import userFactory from './user'
import bookingSummary from './bookingSummary'

export const placementRequestFactory = Factory.define<PlacementRequest>(() => {
  const essentialCriteria = faker.helpers.arrayElements(placementCriteria)
  const desirableCriteria = essentialCriteria.filter(criteria => !essentialCriteria.includes(criteria))
  return {
    id: faker.string.uuid(),
    gender: faker.helpers.arrayElement(['male', 'female']),
    type: faker.helpers.arrayElement(['normal', 'pipe', 'esap', 'rfap']),
    expectedArrival: DateFormats.dateObjToIsoDate(faker.date.soon()),
    duration: faker.number.int({ min: 1, max: 12 }),
    location: 'NE1',
    radius: faker.number.int({ min: 1, max: 50 }),
    essentialCriteria,
    desirableCriteria,
    mentalHealthSupport: faker.datatype.boolean(),
    person: faker.helpers.arrayElement([fullPersonFactory.build(), restrictedPersonFactory.build()]),
    risks: risksFactory.build(),
    applicationId: faker.string.uuid(),
    assessmentId: faker.string.uuid(),
    releaseType: faker.helpers.arrayElement(['licence', 'rotl', 'hdc', 'pss', 'in_community']),
    status: faker.helpers.arrayElement(['notMatched', 'unableToMatch', 'matched']),
    assessmentDecision: faker.helpers.arrayElement(['accepted' as const, 'rejected' as const]),
    applicationDate: DateFormats.dateObjToIsoDateTime(faker.date.soon()),
    assessmentDate: DateFormats.dateObjToIsoDateTime(faker.date.soon()),
    assessor: userFactory.build(),
    isParole: false,
    booking: bookingSummary.build({}),
  }
})

export const placementRequestWithFullPersonFactory = Factory.define<PlacementRequest>(() => {
  return { ...placementRequestFactory.build(), person: fullPersonFactory.build() }
})

export const placementCriteria = [
  'isPIPE',
  'isESAP',
  'isSemiSpecialistMentalHealth',
  'isRecoveryFocussed',
  'isSuitableForVulnerable',
  'acceptsSexOffenders',
  'acceptsChildSexOffenders',
  'acceptsNonSexualChildOffenders',
  'acceptsHateCrimeOffenders',
  'isWheelchairDesignated',
  'isSingle',
  'isStepFreeDesignated',
  'isCatered',
  'isGroundFloor',
  'hasEnSuite',
  'isSuitedForSexOffenders',
  'isArsonSuitable',
] as const
