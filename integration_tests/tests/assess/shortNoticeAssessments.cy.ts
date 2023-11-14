import { addDays } from 'date-fns'
import {
  applicationFactory,
  assessmentFactory,
  clarificationNoteFactory,
  documentFactory,
  userFactory,
} from '../../../server/testutils/factories'
import { DateFormats } from '../../../server/utils/dateUtils'

import { overwriteApplicationDocuments } from '../../../server/utils/assessments/documentUtils'
import { acceptanceData } from '../../../server/utils/assessments/acceptanceData'

import AssessHelper from '../../helpers/assess'
import { addResponseToFormArtifact, addResponsesToFormArtifact } from '../../../server/testutils/addToApplication'
import { ApprovedPremisesApplication as Application } from '../../../server/@types/shared/models/ApprovedPremisesApplication'

describe('Short notice assessments', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
  })

  beforeEach(() => {
    // Given I am logged in
    cy.signIn()
    // And there is a short notice application awaiting assessment
    cy.fixture('applicationData.json').then(applicationData => {
      const today = new Date()

      let application = applicationFactory.withFullPerson().build({ submittedAt: DateFormats.dateObjToIsoDate(today) })

      application.data = applicationData

      const tomorrow = addDays(new Date(), 1)

      application = addResponsesToFormArtifact(application, {
        task: 'basic-information',
        page: 'release-date',
        keyValuePairs: {
          ...DateFormats.dateObjectToDateInputs(tomorrow, 'releaseDate'),
          releaseDate: DateFormats.dateObjToIsoDate(tomorrow),
          knowReleaseDate: 'yes',
        },
      }) as Application

      application = addResponseToFormArtifact(application, {
        task: 'basic-information',
        page: 'reason-for-short-notice',
        key: 'reason',
        value: 'riskEscalated',
      }) as Application

      const clarificationNote = clarificationNoteFactory.build({ response: undefined })
      const assessment = assessmentFactory.build({
        decision: undefined,
        clarificationNotes: [clarificationNote],
        application,
      })

      assessment.application.data = application.data
      assessment.application.submittedAt = application.submittedAt

      assessment.data = {}
      const documents = documentFactory.buildList(1)
      assessment.application = overwriteApplicationDocuments(assessment.application, documents)
      const user = userFactory.build()

      const assessHelper = new AssessHelper(assessment, documents, user, clarificationNote)

      cy.wrap(assessment).as('assessment')
      cy.wrap(assessHelper).as('assessHelper')
    })
  })

  it('allows me to assess a short notice application', function test() {
    // Given there is a short notice application awaiting assessment
    this.assessHelper.setupStubs()

    // And I start an assessment
    this.assessHelper.startAssessment()

    // And I complete an assessment
    this.assessHelper.completeAssessment({ isShortNoticeApplication: true })

    // Then the API should have received the correct data
    cy.task('verifyAssessmentAcceptance', this.assessment).then(requests => {
      expect(requests).to.have.length(1)

      const body = JSON.parse(requests[0].body)
      expect(body).to.deep.equal(acceptanceData(this.assessHelper.assessment))
    })
  })
})
