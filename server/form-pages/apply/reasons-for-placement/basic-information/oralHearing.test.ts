import { itShouldHaveNextValue, itShouldHavePreviousValue } from '../../../shared-examples'

import OralHearing from './oralHearing'
import applicationFactory from '../../../../testutils/factories/application'
import personFactory from '../../../../testutils/factories/person'

describe('OralHearing', () => {
  const person = personFactory.build({ name: 'John Wayne' })
  const application = applicationFactory.build({ person })

  describe('body', () => {
    it('should set the body', () => {
      const page = new OralHearing(
        {
          knowOralHearingDate: 'yes',
          'oralHearingDate-year': '2022',
          'oralHearingDate-month': '3',
          'oralHearingDate-day': '3',
        },
        application,
      )

      expect(page.body).toEqual({
        knowOralHearingDate: 'yes',
        'oralHearingDate-year': '2022',
        'oralHearingDate-month': '3',
        'oralHearingDate-day': '3',
        oralHearingDate: '2022-03-03',
      })
    })
  })

  describe('title', () => {
    it('shold add the name of the person', () => {
      const page = new OralHearing({}, application)

      expect(page.title).toEqual('Do you know John Wayne’s oral hearing date?')
    })
  })

  itShouldHaveNextValue(new OralHearing({}, application), '')
  itShouldHavePreviousValue(new OralHearing({}, application), 'release-date')

  describe('errors', () => {
    describe('if the user knows the oral hearing date', () => {
      it('should return an empty object if the user knows the release date and specifies the date', () => {
        const page = new OralHearing(
          {
            knowOralHearingDate: 'yes',
            'oralHearingDate-year': '2022',
            'oralHearingDate-month': '3',
            'oralHearingDate-day': '3',
          },
          application,
        )
        expect(page.errors()).toEqual({})
      })

      it('should return an error if the date is not populated', () => {
        const page = new OralHearing(
          {
            knowOralHearingDate: 'yes',
          },
          application,
        )
        expect(page.errors()).toEqual({ oralHearingDate: 'You must specify the oral hearing date' })
      })

      it('should return an error if the date is invalid', () => {
        const page = new OralHearing(
          {
            knowOralHearingDate: 'yes',
            'oralHearingDate-year': '99',
            'oralHearingDate-month': '99',
            'oralHearingDate-day': '99',
          },
          application,
        )
        expect(page.errors()).toEqual({ oralHearingDate: 'The oral hearing date is an invalid date' })
      })
    })

    it('should return an empty object if the user does not know the release date', () => {
      const page = new OralHearing(
        {
          knowOralHearingDate: 'no',
        },
        application,
      )
      expect(page.errors()).toEqual({})
    })

    it('should return an error if the knowOralHearingDate field is not populated', () => {
      const page = new OralHearing({}, application)
      expect(page.errors()).toEqual({ knowOralHearingDate: 'You must specify if you know the oral hearing date' })
    })
  })

  describe('response', () => {
    it('should return a translated version of the response when the user does not know the oral hearing date', () => {
      const page = new OralHearing(
        {
          knowOralHearingDate: 'no',
        },
        application,
      )

      expect(page.response()).toEqual({
        [page.title]: 'No',
      })
    })

    it('should return a translated version of the response when the start date is not the same as the release date', () => {
      const page = new OralHearing(
        {
          knowOralHearingDate: 'yes',
          'oralHearingDate-year': '2022',
          'oralHearingDate-month': '11',
          'oralHearingDate-day': '11',
        },
        application,
      )

      expect(page.response()).toEqual({
        [page.title]: 'Yes',
        'Oral Hearing Date': 'Friday 11 November 2022',
      })
    })
  })
})