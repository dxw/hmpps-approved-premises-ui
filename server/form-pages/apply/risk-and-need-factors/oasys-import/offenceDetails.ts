import type { DataServices, PersonRisksUI } from '@approved-premises/ui'

import type {
  ApprovedPremisesApplication,
  ArrayOfOASysOffenceDetailsQuestions,
  OASysSections,
} from '@approved-premises/api'

import TasklistPage from '../../../tasklistPage'

import { Page } from '../../../utils/decorators'
import { oasysImportReponse, sortOasysImportSummaries } from '../../../../utils/oasysImportUtils'
import { mapApiPersonRisksForUi } from '../../../../utils/utils'
import { DateFormats } from '../../../../utils/dateUtils'

type OffenceDetailsBody = {
  offenceDetailsAnswers: Array<string> | Record<string, string>
  offenceDetailsSummaries: ArrayOfOASysOffenceDetailsQuestions
}

@Page({
  name: 'offence-details',
  bodyProperties: ['offenceDetailsAnswers', 'offenceDetailsSummaries'],
})
export default class OffenceDetails implements TasklistPage {
  title = 'Edit risk information'

  offenceDetailsSummaries: OffenceDetailsBody['offenceDetailsSummaries']

  offenceDetailsAnswers: OffenceDetailsBody['offenceDetailsAnswers']

  risks: PersonRisksUI

  oasysCompleted: string

  constructor(public body: Partial<OffenceDetailsBody>) {}

  static async initialize(
    body: Record<string, unknown>,
    application: ApprovedPremisesApplication,
    token: string,
    dataServices: DataServices,
  ) {
    const oasysSections: OASysSections = await dataServices.personService.getOasysSections(
      token,
      application.person.crn,
    )

    const offenceDetails = sortOasysImportSummaries(oasysSections.offenceDetails)

    body.offenceDetailsSummaries = offenceDetails

    const page = new OffenceDetails(body)
    page.offenceDetailsSummaries = offenceDetails
    page.oasysCompleted = DateFormats.isoDateToUIDate(oasysSections?.dateCompleted || '')
    page.risks = mapApiPersonRisksForUi(application.risks)

    return page
  }

  previous() {
    return 'rosh-summary'
  }

  next() {
    return 'supporting-information'
  }

  response() {
    return oasysImportReponse(this.body.offenceDetailsAnswers, this.body.offenceDetailsSummaries)
  }

  errors() {
    return {}
  }
}
