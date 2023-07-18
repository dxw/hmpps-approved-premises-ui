/* eslint-disable import/no-duplicates */

import type { ObjectWithDateParts } from '@approved-premises/ui'

import isPast from 'date-fns/isPast'
import differenceInDays from 'date-fns/differenceInDays'
import formatDistanceStrict from 'date-fns/formatDistanceStrict'

import {
  DateFormats,
  InvalidDateStringError,
  dateAndTimeInputsAreValidDates,
  dateIsBlank,
  dateIsInThePast,
  uiDateOrDateEmptyMessage,
} from './dateUtils'

jest.mock('date-fns/isPast')
jest.mock('date-fns/formatDistanceStrict')
jest.mock('date-fns/differenceInDays')

describe('DateFormats', () => {
  describe('convertIsoToDateObj', () => {
    it('converts a ISO8601 date string', () => {
      const date = '2022-11-11T00:00:00.000Z'

      expect(DateFormats.isoToDateObj(date)).toEqual(new Date(2022, 10, 11))
    })

    it('raises an error if the date is not a valid ISO8601 date string', () => {
      const date = '23/11/2022'

      expect(() => DateFormats.isoToDateObj(date)).toThrow(new InvalidDateStringError(`Invalid Date: ${date}`))
    })

    it('raises an error if the date is not a date string', () => {
      const date = 'NOT A DATE'

      expect(() => DateFormats.isoToDateObj(date)).toThrow(new InvalidDateStringError(`Invalid Date: ${date}`))
    })
  })

  describe('isoDateToUIDate', () => {
    it('converts a ISO8601 date string to a GOV.UK formatted date', () => {
      const date = '2022-11-11T00:00:00.000Z'

      expect(DateFormats.isoDateToUIDate(date)).toEqual('Friday 11 November 2022')
    })

    it('converts a ISO8601 date string to a short format date', () => {
      const date = '2022-11-11T00:00:00.000Z'

      expect(DateFormats.isoDateToUIDate(date, { format: 'short' })).toEqual('11/11/2022')
    })

    it('raises an error if the date is not a valid ISO8601 date string', () => {
      const date = '23/11/2022'

      expect(() => DateFormats.isoDateToUIDate(date)).toThrow(new InvalidDateStringError(`Invalid Date: ${date}`))
    })

    it('raises an error if the date is not a date string', () => {
      const date = 'NOT A DATE'

      expect(() => DateFormats.isoDateToUIDate(date)).toThrow(new InvalidDateStringError(`Invalid Date: ${date}`))
    })
  })

  describe('isoDateTimeToUIDateTime', () => {
    it('converts a ISO8601 date string to a GOV.UK formatted date', () => {
      const date = '2022-11-11T10:00:00.000Z'

      expect(DateFormats.isoDateTimeToUIDateTime(date)).toEqual('11 Nov 2022, 10:00')
    })

    it('raises an error if the date is not a valid ISO8601 date string', () => {
      const date = '23/11/2022'

      expect(() => DateFormats.isoDateTimeToUIDateTime(date)).toThrow(
        new InvalidDateStringError(`Invalid Date: ${date}`),
      )
    })

    it('raises an error if the date is not a date string', () => {
      const date = 'NOT A DATE'

      expect(() => DateFormats.isoDateTimeToUIDateTime(date)).toThrow(
        new InvalidDateStringError(`Invalid Date: ${date}`),
      )
    })
  })

  describe('convertDateAndTimeInputsToIsoString', () => {
    it('converts a date object', () => {
      const obj: ObjectWithDateParts<'date'> = {
        'date-year': '2022',
        'date-month': '12',
        'date-day': '11',
      }

      const result = DateFormats.dateAndTimeInputsToIsoString(obj, 'date')

      expect(result.date).toEqual('2022-12-11')
    })

    it('pads the months and days', () => {
      const obj: ObjectWithDateParts<'date'> = {
        'date-year': '2022',
        'date-month': '1',
        'date-day': '1',
      }

      const result = DateFormats.dateAndTimeInputsToIsoString(obj, 'date')

      expect(result.date).toEqual('2022-01-01')
    })

    it('returns the date with a time if passed one', () => {
      const obj: ObjectWithDateParts<'date'> = {
        'date-year': '2022',
        'date-month': '1',
        'date-day': '1',
        'date-time': '12:35',
      }

      const result = DateFormats.dateAndTimeInputsToIsoString(obj, 'date')

      expect(result.date).toEqual('2022-01-01T12:35:00.000Z')
    })

    it('returns an empty string when given empty strings as input', () => {
      const obj: ObjectWithDateParts<'date'> = {
        'date-year': '',
        'date-month': '',
        'date-day': '',
      }

      const result = DateFormats.dateAndTimeInputsToIsoString(obj, 'date')

      expect(result.date).toBeUndefined()
    })

    it('returns an invalid ISO string when given invalid strings as input', () => {
      const obj: ObjectWithDateParts<'date'> = {
        'date-year': 'twothousandtwentytwo',
        'date-month': '20',
        'date-day': 'foo',
      }

      const result = DateFormats.dateAndTimeInputsToIsoString(obj, 'date')

      expect(result.date.toString()).toEqual('twothousandtwentytwo-20-oo')
    })

    it('returns an invalid ISO string when given all 0s as inputs', () => {
      const obj: ObjectWithDateParts<'date'> = {
        'date-year': '0000',
        'date-month': '00',
        'date-day': '00',
      }

      const result = DateFormats.dateAndTimeInputsToIsoString(obj, 'date')

      expect(result.date.toString()).toEqual('0000-00-00')
    })
  })

  describe('dateAndTimeInputsToUiDate', () => {
    it('converts a date and time input object to a human readable date', () => {
      const dateTimeInputs = DateFormats.dateObjectToDateInputs(new Date('2022-11-11T10:00:00.000Z'), 'key')

      expect(DateFormats.dateAndTimeInputsToUiDate(dateTimeInputs, 'key')).toEqual('Friday 11 November 2022')
    })

    it('throws an error if an object without date inputs for the key is entered', () => {
      expect(() => DateFormats.dateAndTimeInputsToUiDate({}, 'key')).toThrow(InvalidDateStringError)
    })
  })

  describe('differenceInDays', () => {
    it('calls the date-fns functions and returns the results as an object', () => {
      const date1 = new Date(2023, 3, 12)
      const date2 = new Date(2023, 3, 11)
      ;(formatDistanceStrict as jest.Mock).mockReturnValue('1 day')
      ;(differenceInDays as jest.Mock).mockReturnValue(1)

      expect(DateFormats.differenceInDays(date1, date2)).toEqual({
        ui: '1 day',
        number: 1,
      })
      expect(formatDistanceStrict).toHaveBeenCalledWith(date1, date2, { unit: 'day' })
      expect(differenceInDays).toHaveBeenCalledWith(date1, date2)
    })
  })

  describe('formatDuration', () => {
    it('formats a duration with the given unit', () => {
      expect(DateFormats.formatDuration({ days: '4', weeks: '7' })).toEqual('7 weeks, 4 days')
    })
  })
})

describe('uiDateOrDateEmptyMessage', () => {
  it('if the date is undefined it returns the message', () => {
    const object: Record<string, undefined> = {
      shouldBeADate: undefined,
    }

    expect(uiDateOrDateEmptyMessage(object, 'shouldBeADate', () => 'string')).toEqual('No date supplied')
  })

  it('if the date is null it returns the message', () => {
    const object: Record<string, undefined> = {
      shouldBeADate: null,
    }

    expect(uiDateOrDateEmptyMessage(object, 'shouldBeADate', () => 'string')).toEqual('No date supplied')
  })

  it('if the date is defined it returns the date formatted using the format function', () => {
    const object: Record<string, string> = {
      aDate: DateFormats.dateObjToIsoDate(new Date(2023, 3, 12)),
    }

    expect(uiDateOrDateEmptyMessage(object, 'aDate', DateFormats.isoDateToUIDate)).toEqual(
      DateFormats.dateObjtoUIDate(new Date(2023, 3, 12)),
    )
  })

  it('returns the message if the key is present in the object but undefined', () => {
    const object: Record<string, string> = {
      aDate: undefined,
    }

    expect(uiDateOrDateEmptyMessage(object, 'aDate', DateFormats.isoDateToUIDate)).toEqual('No date supplied')
  })
})

describe('dateAndTimeInputsAreValidDates', () => {
  it('returns true when the date is valid', () => {
    const obj: ObjectWithDateParts<'date'> = {
      'date-year': '2022',
      'date-month': '12',
      'date-day': '11',
    }

    const result = dateAndTimeInputsAreValidDates(obj, 'date')

    expect(result).toEqual(true)
  })

  it('returns false when the date is invalid', () => {
    const obj: ObjectWithDateParts<'date'> = {
      'date-year': '99',
      'date-month': '99',
      'date-day': '99',
    }

    const result = dateAndTimeInputsAreValidDates(obj, 'date')

    expect(result).toEqual(false)
  })

  it('returns false when the year is not 4 digits', () => {
    const obj: ObjectWithDateParts<'date'> = {
      'date-year': '22',
      'date-month': '12',
      'date-day': '11',
    }

    const result = dateAndTimeInputsAreValidDates(obj, 'date')

    expect(result).toEqual(false)
  })
})

describe('dateIsBlank', () => {
  it('returns false if the date is not blank', () => {
    const date: ObjectWithDateParts<'field'> = {
      'field-day': '12',
      'field-month': '1',
      'field-year': '2022',
    }

    expect(dateIsBlank(date, 'field')).toEqual(false)
  })

  it('returns true if the date is blank', () => {
    const date: ObjectWithDateParts<'field'> = {
      'field-day': '',
      'field-month': '',
      'field-year': '',
    }

    expect(dateIsBlank(date, 'field')).toEqual(true)
  })

  it('ignores irrelevant fields', () => {
    const date: ObjectWithDateParts<'field'> & ObjectWithDateParts<'otherField'> = {
      'field-day': '12',
      'field-month': '1',
      'field-year': '2022',
      'otherField-day': undefined,
      'otherField-month': undefined,
      'otherField-year': undefined,
    }

    expect(dateIsBlank(date, 'field')).toEqual(false)
  })
})

describe('dateIsInThePast', () => {
  it('returns true if the date is in the past', () => {
    ;(isPast as jest.Mock).mockReturnValue(true)

    expect(dateIsInThePast('2020-01-01')).toEqual(true)
  })

  it('returns false if the date is not in the past', () => {
    ;(isPast as jest.Mock).mockReturnValue(false)

    expect(dateIsInThePast('2020-01-01')).toEqual(false)
  })
})
