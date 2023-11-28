import type { TaskListErrors } from '@approved-premises/ui'
import { ApprovedPremisesApplication as Application, SentenceTypeOption } from '@approved-premises/api'
import { Page } from '../../../utils/decorators'

import TasklistPage from '../../../tasklistPage'
import {
  adjacentPageFromSentenceType,
  sentenceTypes,
} from '../../../../utils/applications/adjacentPageFromSentenceType'

@Page({ name: 'sentence-type', bodyProperties: ['sentenceType'] })
export default class SentenceType implements TasklistPage {
  title = 'Which of the following best describes the sentence type the person is on?'

  constructor(
    readonly body: { sentenceType?: SentenceTypeOption },
    readonly application: Application,
  ) {}

  response() {
    return { [this.title]: sentenceTypes[this.body.sentenceType] }
  }

  previous() {
    return 'end-dates'
  }

  next() {
    return adjacentPageFromSentenceType(this.body.sentenceType)
  }

  errors() {
    const errors: TaskListErrors<this> = {}

    if (!this.body.sentenceType) {
      errors.sentenceType = 'You must choose a sentence type'
    }

    return errors
  }

  items(conditionalHtml: string) {
    return Object.keys(sentenceTypes).map(key => {
      return {
        value: key,
        text: sentenceTypes[key],
        checked: this.body.sentenceType === key,
        conditional: { html: key === 'nonStatutory' ? conditionalHtml : '' },
      }
    })
  }
}
