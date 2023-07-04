import type { DataServices, OasysPage, PersonRisksUI } from '@approved-premises/ui'

import type { ApprovedPremisesApplication, ArrayOfOASysSupportingInformationQuestions } from '@approved-premises/api'

import { Page } from '../../../utils/decorators'
import { fetchOptionalOasysSections, getOasysSections, oasysImportReponse } from '../../../../utils/oasysImportUtils'

type SupportingInformationBody = {
  supportingInformationAnswers: Record<string, string>
  supportingInformationSummaries: ArrayOfOASysSupportingInformationQuestions
}

@Page({
  name: 'supporting-information',
  bodyProperties: ['supportingInformationAnswers', 'supportingInformationSummaries'],
})
export default class SupportingInformation implements OasysPage {
  title = 'Edit risk information'

  supportingInformationSummaries: SupportingInformationBody['supportingInformationSummaries']

  supportingInformationAnswers: SupportingInformationBody['supportingInformationAnswers']

  oasysCompleted: string

  risks: PersonRisksUI

  oasysSuccess: boolean

  constructor(public body: Partial<SupportingInformationBody>) {}

  static async initialize(
    body: Record<string, unknown>,
    application: ApprovedPremisesApplication,
    token: string,
    dataServices: DataServices,
  ) {
    return getOasysSections(body, application, token, dataServices, SupportingInformation, {
      sectionName: 'supportingInformation',
      summaryKey: 'supportingInformationSummaries',
      answerKey: 'supportingInformationAnswers',
      selectedSections: fetchOptionalOasysSections(application),
    })
  }

  previous() {
    return 'offence-details'
  }

  next() {
    return 'risk-management-plan'
  }

  response() {
    return oasysImportReponse(this.body.supportingInformationAnswers, this.body.supportingInformationSummaries)
  }

  errors() {
    return {}
  }
}
