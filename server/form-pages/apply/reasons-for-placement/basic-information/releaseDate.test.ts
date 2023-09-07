import { add, sub } from 'date-fns'
import { DateFormats } from '../../../../utils/dateUtils'
import { itShouldHaveNextValue, itShouldHavePreviousValue } from '../../../shared-examples'

import ReleaseDate from './releaseDate'
import { applicationFactory } from '../../../../testutils/factories'

describe('ReleaseDate', () => {
  const application = applicationFactory.build()

  describe('body', () => {
    it('should set the body', () => {
      const page = new ReleaseDate(
        {
          knowReleaseDate: 'yes',
          'releaseDate-year': '2022',
          'releaseDate-month': '3',
          'releaseDate-day': '3',
        },
        application,
        'previousPage',
      )

      expect(page.body).toEqual({
        knowReleaseDate: 'yes',
        'releaseDate-year': '2022',
        'releaseDate-month': '3',
        'releaseDate-day': '3',
        releaseDate: '2022-03-03',
      })
    })
  })

  describe('when knowReleaseDate is set to yes', () => {
    itShouldHaveNextValue(new ReleaseDate({ knowReleaseDate: 'yes' }, application, 'somePage'), 'placement-date')
  })

  describe('when knowReleaseDate is set to no', () => {
    itShouldHaveNextValue(new ReleaseDate({ knowReleaseDate: 'no' }, application, 'somePage'), 'oral-hearing')
  })

  describe("previous returns the value passed into the previousPage parameter of the object's constructor", () => {
    itShouldHavePreviousValue(new ReleaseDate({}, application, 'previousPage'), 'previousPage')
  })

  describe('errors', () => {
    describe('if the user knows the release date', () => {
      it('should return an empty object if the date is specified', () => {
        const releaseDate = add(new Date(), { days: 5 })
        const page = new ReleaseDate(
          {
            knowReleaseDate: 'yes',
            ...DateFormats.dateObjectToDateInputs(releaseDate, 'releaseDate'),
          },
          application,
          'somePage',
        )
        expect(page.errors()).toEqual({})
      })

      it('should return an error if the date is not populated', () => {
        const page = new ReleaseDate(
          {
            knowReleaseDate: 'yes',
          },
          application,
          'somePage',
        )
        expect(page.errors()).toEqual({ releaseDate: 'You must specify the release date' })
      })

      it('should return an error if the date is invalid', () => {
        const page = new ReleaseDate(
          {
            knowReleaseDate: 'yes',
            'releaseDate-year': '99',
            'releaseDate-month': '99',
            'releaseDate-day': '99',
          },
          application,
          'somePage',
        )
        expect(page.errors()).toEqual({ releaseDate: 'The release date is an invalid date' })
      })

      it('should return an error if the date is in the past', () => {
        const releaseDate = sub(new Date(), { days: 5 })
        const page = new ReleaseDate(
          {
            knowReleaseDate: 'yes',
            ...DateFormats.dateObjectToDateInputs(releaseDate, 'releaseDate'),
          },
          application,
          'somePage',
        )
        expect(page.errors()).toEqual({ releaseDate: 'The release date must not be in the past' })
      })
    })

    it('should return an empty object if the user does not know the release date', () => {
      const page = new ReleaseDate(
        {
          knowReleaseDate: 'no',
        },
        application,
        'somePage',
      )
      expect(page.errors()).toEqual({})
    })

    it('should return an error if the knowReleaseDate field is not populated', () => {
      const page = new ReleaseDate({}, application, 'somePage')
      expect(page.errors()).toEqual({ knowReleaseDate: 'You must specify if you know the release date' })
    })
  })

  describe('response', () => {
    it('should return a translated version of the response when the user does not know the release date', () => {
      const page = new ReleaseDate(
        {
          knowReleaseDate: 'no',
        },
        application,
        'somePage',
      )

      expect(page.response()).toEqual({
        [page.title]: 'No',
      })
    })

    it('should return a translated version of the response when the user knows the release date', () => {
      const page = new ReleaseDate(
        {
          knowReleaseDate: 'yes',
          'releaseDate-year': '2022',
          'releaseDate-month': '11',
          'releaseDate-day': '11',
        },
        application,
        'somePage',
      )

      expect(page.response()).toEqual({
        [page.title]: 'Yes',
        'Release Date': 'Friday 11 November 2022',
      })
    })
  })
})
