import type { DataServices, TaskListErrors, YesOrNo } from '@approved-premises/ui'
import type { ApprovedPremisesAssessment as Assessment, User } from '@approved-premises/api'

import { Page } from '../../../utils/decorators'
import { sentenceCase } from '../../../../utils/utils'

import TasklistPage from '../../../tasklistPage'

@Page({ name: 'sufficientInformation', bodyProperties: ['sufficientInformation'] })
export default class SufficientInformation implements TasklistPage {
  name = 'sufficient-information'

  title = 'Is there enough information in the application to make a decision?'

  user: User

  constructor(public body: { sufficientInformation?: YesOrNo }) {}

  static async initialize(
    body: Record<string, unknown>,
    assessment: Assessment,
    token: string,
    dataServices: DataServices,
  ) {
    const user = await dataServices.userService.getUserById(token, assessment.application.createdByUserId)

    const page = new SufficientInformation(body)
    page.user = user

    return page
  }

  previous() {
    return 'dashboard'
  }

  next() {
    return ''
  }

  response() {
    return {
      [`${this.title}`]: sentenceCase(this.body.sufficientInformation),
    }
  }

  errors() {
    const errors: TaskListErrors<this> = {}

    if (!this.body.sufficientInformation)
      errors.sufficientInformation =
        'You must confirm if there is enough information in the application to make a decision'

    return errors
  }
}