import type { ObjectWithDateParts, TaskListErrors, YesOrNo } from '@approved-premises/ui'
import { ApprovedPremisesApplication } from '../../../../@types/shared'
import { sentenceCase } from '../../../../utils/utils'
import { Page } from '../../../utils/decorators'

import TasklistPage from '../../../tasklistPage'
import { DateFormats } from '../../../../utils/dateUtils'
import { retrieveOptionalQuestionResponseFromApplicationOrAssessment } from '../../../../utils/retrieveQuestionResponseFromApplicationOrAssessment'
import AccessNeeds from './accessNeeds'

export type AccessNeedsFurtherQuestionsBody = {
  needsWheelchair: YesOrNo
  mobilityNeeds: string
  visualImpairment: string
  isPersonPregnant?: YesOrNo
  otherPregnancyConsiderations: string
  childRemoved?: YesOrNo | 'decisionPending'
} & ObjectWithDateParts<'expectedDeliveryDate'>

@Page({
  name: 'access-needs-further-questions',
  bodyProperties: [
    'needsWheelchair',
    'mobilityNeeds',
    'visualImpairment',
    'isPersonPregnant',
    'childRemoved',
    'expectedDeliveryDate',
    'expectedDeliveryDate-year',
    'expectedDeliveryDate-month',
    'expectedDeliveryDate-day',
    'otherPregnancyConsiderations',
  ],
})
export default class AccessNeedsFurtherQuestions implements TasklistPage {
  title = 'Access, cultural and healthcare needs'

  questions = {
    wheelchair: `Does ${this.application.person.name} require a wheelchair accessible room?`,
    mobilityNeeds: 'Mobility needs',
    visualImpairment: 'Visual Impairment',
    isPersonPregnant: 'Is this person pregnant?',
    expectedDeliveryDate: 'What is their expected date of delivery?',
    otherPregnancyConsiderations: 'Are there any other considerations',
    childRemoved: 'Will the child be removed at birth?',
  }

  yesToPregnancyHealthcareQuestion: boolean = this.answeredYesToPregnancyHealthcareQuestion()

  constructor(
    private _body: Partial<AccessNeedsFurtherQuestionsBody>,
    private readonly application: ApprovedPremisesApplication,
  ) {}

  public set body(value: Partial<AccessNeedsFurtherQuestionsBody>) {
    if (value.isPersonPregnant === 'yes') {
      this._body = {
        ...value,
        'expectedDeliveryDate-year': value['expectedDeliveryDate-year'] as string,
        'expectedDeliveryDate-month': value['expectedDeliveryDate-month'] as string,
        'expectedDeliveryDate-day': value['expectedDeliveryDate-day'] as string,
        expectedDeliveryDate: DateFormats.dateAndTimeInputsToIsoString(
          value as ObjectWithDateParts<'expectedDeliveryDate'>,
          'expectedDeliveryDate',
        ).expectedDeliveryDate,
      }
    }
  }

  public get body(): AccessNeedsFurtherQuestionsBody {
    return this._body as AccessNeedsFurtherQuestionsBody
  }

  previous() {
    return 'access-needs'
  }

  next() {
    return 'covid'
  }

  answeredYesToPregnancyHealthcareQuestion() {
    return retrieveOptionalQuestionResponseFromApplicationOrAssessment(
      this.application,
      AccessNeeds,
      'additionalNeeds',
    ).includes('pregnancy')
  }

  response() {
    const response = {
      [this.questions.wheelchair]: sentenceCase(this.body.needsWheelchair),
      [this.questions.mobilityNeeds]: this.body.mobilityNeeds,
      [this.questions.visualImpairment]: this.body.visualImpairment,
    }

    if (this.answeredYesToPregnancyHealthcareQuestion()) {
      response[this.questions.isPersonPregnant] = sentenceCase(this.body.isPersonPregnant)
      response[this.questions.expectedDeliveryDate] = DateFormats.isoDateToUIDate(this.body.expectedDeliveryDate)
      response[this.questions.otherPregnancyConsiderations] = this.body.otherPregnancyConsiderations
      response[this.questions.childRemoved] = sentenceCase(this.body.childRemoved)
    }

    return response
  }

  errors() {
    const errors: TaskListErrors<this> = {}

    if (!this.body.needsWheelchair) {
      errors.needsWheelchair = 'You must confirm the need for a wheelchair'
    }

    if (!this.body.isPersonPregnant) {
      errors.isPersonPregnant = 'You must confirm if the person is pregnant'
    }

    if (this.body.isPersonPregnant === 'yes') {
      if (!this.body.expectedDeliveryDate) {
        errors.expectedDeliveryDate = 'You must enter the expected delivery date'
      }
      if (!this.body.childRemoved) {
        errors.childRemoved = 'You must confirm if the child will be removed at birth'
      }
    }

    return errors
  }
}