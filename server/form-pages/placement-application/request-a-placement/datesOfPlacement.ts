import { weeksToDays } from 'date-fns'
import type { ObjectWithDateParts, TaskListErrors } from '@approved-premises/ui'

import TasklistPage from '../../tasklistPage'
import { Page } from '../../utils/decorators'
import { DateFormats, dateAndTimeInputsAreValidDates } from '../../../utils/dateUtils'

type DateOfPlacementFromUi = {
  durationDays: string
  durationWeeks: string
} & ObjectWithDateParts<'arrivalDate'>

export type DateofPlacement = {
  duration: string
  durationDays: string
  durationWeeks: string
} & ObjectWithDateParts<'arrivalDate'>

export type Body = {
  datesOfPlacement: Array<DateOfPlacementFromUi>
}

@Page({
  name: 'dates-of-placement',
  bodyProperties: ['datesOfPlacement'],
})
export default class DatesOfPlacement implements TasklistPage {
  title = 'Dates of placement'

  questions = {
    arrivalDate: 'When will the person arrive?',
    duration: 'How long should the Approved Premises placement last?',
  }

  constructor(private _body: Body) {}

  get body() {
    return this._body as Body
  }

  set body(value: Body) {
    const validatedInputs = this.validateInputs(value.datesOfPlacement)

    const mappedInputs = this.mapDateInputs(validatedInputs)

    this._body = {
      datesOfPlacement: mappedInputs,
    } as Body
  }

  previous() {
    return 'same-ap'
  }

  next() {
    return 'updates-to-application'
  }

  response() {
    const result = this.body.datesOfPlacement.map(date => {
      return {
        [this.questions.arrivalDate]: DateFormats.isoDateToUIDate(date.arrivalDate),
        [this.questions.duration]: DateFormats.formatDuration({
          weeks: date.durationWeeks,
          days: date.durationDays,
        }),
      }
    })

    return { 'Dates of placement': result }
  }

  errors() {
    const errors: TaskListErrors<this> = {}

    if (this.body.datesOfPlacement.length === 0) {
      errors[`datesOfPlacement_${this.body.datesOfPlacement.length}_arrivalDate`] =
        'You must enter a date for the placement'
      errors[`datesOfPlacement_${this.body.datesOfPlacement.length}_duration`] =
        'You must enter a duration for the placement'
    }

    this.body.datesOfPlacement.forEach((date, index) => {
      if (!dateAndTimeInputsAreValidDates(date, 'arrivalDate')) {
        errors[`datesOfPlacement_${index}_arrivalDate`] = 'You must state a valid arrival date'
      }

      if (
        !this.lengthInDays(date.durationWeeks, date.durationDays) ||
        this.lengthInDays(date.durationWeeks, date.durationDays) === '0'
      ) {
        errors[`datesOfPlacement_${index}_duration`] = 'You must state the duration of the placement'
      }
    })

    return errors
  }

  private lengthInDays(durationWeeks: string, durationDays: string): string | undefined {
    if (durationWeeks || durationDays) {
      const lengthOfStayWeeksInDays = weeksToDays(Number(durationWeeks))
      const totalLengthInDays = lengthOfStayWeeksInDays + Number(durationDays)

      return String(totalLengthInDays)
    }

    return undefined
  }

  private validateInputs(datesArr: Array<DateOfPlacementFromUi> | undefined) {
    return (datesArr || []).filter(dates => {
      const result =
        dateAndTimeInputsAreValidDates(dates, 'arrivalDate') ||
        Boolean(dates.durationWeeks) ||
        Boolean(dates.durationDays)

      return result
    })
  }

  private mapDateInputs(dates: Array<DateOfPlacementFromUi>): Array<DateOfPlacementFromUi> {
    const result = dates.map(date => {
      return {
        ...date,
        duration: this.lengthInDays(date.durationWeeks, date.durationDays),
        durationDays: date.durationDays,
        durationWeeks: date.durationWeeks,
        ...DateFormats.dateAndTimeInputsToIsoString(date, 'arrivalDate'),
      }
    })

    return result
  }
}
