import type { TaskListErrors, YesOrNo } from '@approved-premises/ui'
import ReasonForShortNotice, {
  ShortNoticeReasons,
  shortNoticeReasons,
} from '../../../apply/reasons-for-placement/basic-information/reasonForShortNotice'
import { DateFormats } from '../../../../utils/dateUtils'
import { ApprovedPremisesAssessment as Assessment } from '../../../../@types/shared'

import { Page } from '../../../utils/decorators'

import TasklistPage from '../../../tasklistPage'
import { responsesForYesNoAndCommentsSections } from '../../../utils/index'
import { retrieveOptionalQuestionResponseFromFormArtifact } from '../../../../utils/retrieveQuestionResponseFromFormArtifact'
import { arrivalDateFromApplication } from '../../../../utils/applications/arrivalDateFromApplication'
import { suitabilityAssessmentAdjacentPage } from '../../../../utils/assessments/suitabilityAssessmentAdjacentPage'

export type ApplicationTimelinessSection = {
  agreeWithShortNoticeReason: string
}

export type ApplicationDetails = {
  applicationDate: string
  lateApplicationReason: string
  arrivalDate: string
}

@Page({
  name: 'application-timeliness',
  bodyProperties: ['agreeWithShortNoticeReason', 'agreeWithShortNoticeReasonComments', 'reasonForLateApplication'],
})
export default class ApplicationTimeliness implements TasklistPage {
  name = 'application-timeliness' as const

  title = 'Application timeliness'

  question = `Do you agree with the applicant's reason for submission outside of National Standards timescales?`

  reasonForLateApplicationQuestion = 'What is the reason for the late application?'

  applicationDetails: ApplicationDetails

  reasonsForLateApplicationReasons = Object.keys(shortNoticeReasons).map(key => ({
    text: shortNoticeReasons[key],
    value: key,
  }))

  constructor(
    public body: {
      agreeWithShortNoticeReason: YesOrNo
      agreeWithShortNoticeReasonComments?: string
      reasonForLateApplication: ShortNoticeReasons
    },
    private readonly assessment: Assessment,
  ) {
    this.applicationDetails = this.retrieveShortNoticeApplicationDetails()
  }

  retrieveShortNoticeApplicationDetails(): ApplicationDetails {
    const applicationDate = DateFormats.isoDateToUIDate(this.assessment.application.submittedAt, { format: 'short' })
    const lateApplicationReasonId = retrieveOptionalQuestionResponseFromFormArtifact(
      this.assessment.application,
      ReasonForShortNotice,
      'reason',
    )
    const arrivalDate = arrivalDateFromApplication(this.assessment.application)

    const lateApplicationReason = lateApplicationReasonId
      ? shortNoticeReasons[lateApplicationReasonId]
      : 'None supplied'

    return {
      applicationDate,
      lateApplicationReason,
      arrivalDate: arrivalDate ? DateFormats.isoDateToUIDate(arrivalDate, { format: 'short' }) : 'None supplied',
    }
  }

  previous() {
    return suitabilityAssessmentAdjacentPage(this.assessment, this.name, { returnPreviousPage: true })
  }

  next() {
    return suitabilityAssessmentAdjacentPage(this.assessment, this.name)
  }

  response() {
    const response = {
      ...responsesForYesNoAndCommentsSections({ agreeWithShortNoticeReason: this.question }, this.body),
    }

    if (this.body.agreeWithShortNoticeReason === 'no') {
      response[this.reasonForLateApplicationQuestion] =
        shortNoticeReasons[this.body.reasonForLateApplication] || 'No reason supplied'
    }

    return response
  }

  errors() {
    const errors: TaskListErrors<this> = {}

    if (!this.body.agreeWithShortNoticeReason)
      errors.agreeWithShortNoticeReason = `You must confirm if you agree with the applicant's reason for submission outside of National Standards timescales`

    if (this.body.agreeWithShortNoticeReason === 'no') {
      if (!this.body.agreeWithShortNoticeReasonComments)
        errors.agreeWithShortNoticeReasonComments = 'You must provide details to support the decision'

      if (!this.body.reasonForLateApplication)
        errors.reasonForLateApplication = 'You must provide a reason for the late application'
    }

    return errors
  }
}
