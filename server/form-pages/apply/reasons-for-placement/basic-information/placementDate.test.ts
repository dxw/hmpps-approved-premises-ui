import { add, sub } from 'date-fns'
import { itShouldHaveNextValue, itShouldHavePreviousValue } from '../../../shared-examples'
import { noticeTypeFromApplication } from '../../../../utils/applications/noticeTypeFromApplication'

import PlacementDate from './placementDate'
import { DateFormats } from '../../../../utils/dateUtils'
import { applicationFactory } from '../../../../testutils/factories'
import { retrieveOptionalQuestionResponseFromFormArtifact } from '../../../../utils/retrieveQuestionResponseFromFormArtifact'

const futureReleaseDate = DateFormats.dateObjToIsoDate(add(new Date(), { days: 5 }))
const pastReleaseDate = DateFormats.dateObjToIsoDate(sub(new Date(), { days: 5 }))

jest.mock('../../../../utils/applications/noticeTypeFromApplication')
jest.mock('../../../../utils/retrieveQuestionResponseFromFormArtifact', () => {
  return {
    retrieveOptionalQuestionResponseFromFormArtifact: jest.fn(() => futureReleaseDate),
  }
})

describe('PlacementDate', () => {
  const application = applicationFactory.build()

  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('constructor', () => {
    describe('when the release date is after the application is created', () => {
      it('sets the title and body with the release date as the default start date', () => {
        application.createdAt = DateFormats.dateObjToIsoDate(new Date())
        ;(
          retrieveOptionalQuestionResponseFromFormArtifact as jest.MockedFn<
            typeof retrieveOptionalQuestionResponseFromFormArtifact
          >
        ).mockReturnValue(futureReleaseDate)

        const page = new PlacementDate(
          {
            startDateSameAsReleaseDate: 'no',
            'startDate-year': '2020',
            'startDate-month': '12',
            'startDate-day': '1',
          },
          application,
        )

        expect(page.body).toEqual({
          startDateSameAsReleaseDate: 'no',
          'startDate-year': '2020',
          'startDate-month': '12',
          'startDate-day': '1',
          startDate: '2020-12-01',
        })

        expect(page.title).toEqual(
          `Is ${DateFormats.isoDateToUIDate(futureReleaseDate)} the date you want the placement to start?`,
        )
      })
    })

    describe('when the release date is the same day as the application is created', () => {
      it('sets the title and body with the release date as the default start date', () => {
        application.createdAt = DateFormats.dateObjToIsoDate(new Date())
        ;(
          retrieveOptionalQuestionResponseFromFormArtifact as jest.MockedFn<
            typeof retrieveOptionalQuestionResponseFromFormArtifact
          >
        ).mockReturnValue(application.createdAt)

        const page = new PlacementDate(
          {
            startDateSameAsReleaseDate: 'no',
            'startDate-year': '2020',
            'startDate-month': '12',
            'startDate-day': '1',
          },
          application,
        )

        expect(page.body).toEqual({
          startDateSameAsReleaseDate: 'no',
          'startDate-year': '2020',
          'startDate-month': '12',
          'startDate-day': '1',
          startDate: '2020-12-01',
        })

        expect(page.title).toEqual(
          `Is ${DateFormats.isoDateToUIDate(application.createdAt)} the date you want the placement to start?`,
        )
      })
    })

    describe('when the release date is before the application is created', () => {
      it('sets the title to ask for a specific release date', () => {
        application.createdAt = DateFormats.dateObjToIsoDate(new Date())
        ;(
          retrieveOptionalQuestionResponseFromFormArtifact as jest.MockedFn<
            typeof retrieveOptionalQuestionResponseFromFormArtifact
          >
        ).mockReturnValue(pastReleaseDate)

        const page = new PlacementDate(
          {
            startDateSameAsReleaseDate: 'no',
            'startDate-year': '2020',
            'startDate-month': '12',
            'startDate-day': '1',
          },
          application,
        )

        expect(page.body).toEqual({
          startDateSameAsReleaseDate: 'no',
          'startDate-year': '2020',
          'startDate-month': '12',
          'startDate-day': '1',
          startDate: '2020-12-01',
        })

        expect(page.title).toEqual('What date you want the placement to start?')
      })
    })

    describe('when there is no release date present in the application', () => {
      it('sets the title to ask for a specific release date', () => {
        ;(
          retrieveOptionalQuestionResponseFromFormArtifact as jest.MockedFn<
            typeof retrieveOptionalQuestionResponseFromFormArtifact
          >
        ).mockReturnValue(undefined)

        const page = new PlacementDate(
          {
            startDateSameAsReleaseDate: 'no',
            'startDate-year': '2020',
            'startDate-month': '12',
            'startDate-day': '1',
          },
          application,
        )

        expect(page.body).toEqual({
          startDateSameAsReleaseDate: 'no',
          'startDate-year': '2020',
          'startDate-month': '12',
          'startDate-day': '1',
          startDate: '2020-12-01',
        })

        expect(page.title).toEqual('What date you want the placement to start?')
      })
    })
  })

  describe('when the notice type is standard', () => {
    beforeEach(() => {
      ;(noticeTypeFromApplication as jest.Mock).mockReturnValue('standard')
    })

    itShouldHaveNextValue(new PlacementDate({}, application), 'placement-purpose')
  })

  describe('when the notice type is emergency', () => {
    beforeEach(() => {
      ;(noticeTypeFromApplication as jest.Mock).mockReturnValue('emergency')
    })

    itShouldHaveNextValue(new PlacementDate({}, application), 'reason-for-short-notice')
  })

  describe('when the notice type is short_notice', () => {
    beforeEach(() => {
      ;(noticeTypeFromApplication as jest.Mock).mockReturnValue('short_notice')
    })

    itShouldHaveNextValue(new PlacementDate({}, application), 'reason-for-short-notice')
  })

  describe('next', () => {
    it('should call noticeTypeFromApplication with the page body included in the application data', () => {
      const page = new PlacementDate(
        {
          startDateSameAsReleaseDate: 'no',
          'startDate-year': '2020',
          'startDate-month': '12',
          'startDate-day': '1',
        },
        application,
      )
      page.next()

      const { mock } = noticeTypeFromApplication as jest.Mock
      const applicationData = mock.calls[0][0].data

      expect(applicationData['basic-information']['placement-date']).toEqual(page.body)
    })
  })

  itShouldHavePreviousValue(new PlacementDate({}, application), 'release-date')

  describe('errors', () => {
    describe('when the release date is in the past', () => {
      it('should return an empty object if the placement date is populated', () => {
        ;(
          retrieveOptionalQuestionResponseFromFormArtifact as jest.MockedFn<
            typeof retrieveOptionalQuestionResponseFromFormArtifact
          >
        ).mockReturnValue(pastReleaseDate)
        const page = new PlacementDate(
          {
            'startDate-day': '1',
            'startDate-month': '1',
            'startDate-year': '2030',
          },
          application,
        )
        expect(page.errors()).toEqual({})
      })

      it('should return an error if the date is not populated', () => {
        ;(
          retrieveOptionalQuestionResponseFromFormArtifact as jest.MockedFn<
            typeof retrieveOptionalQuestionResponseFromFormArtifact
          >
        ).mockReturnValue(pastReleaseDate)
        const page = new PlacementDate({}, application)
        expect(page.errors()).toEqual({
          startDate: 'You must enter a start date',
        })
      })
    })

    describe('when the release date is in the future', () => {
      it('should return an empty object if the release date is the same as the start date', () => {
        ;(
          retrieveOptionalQuestionResponseFromFormArtifact as jest.MockedFn<
            typeof retrieveOptionalQuestionResponseFromFormArtifact
          >
        ).mockReturnValue(futureReleaseDate)
        const page = new PlacementDate(
          {
            startDateSameAsReleaseDate: 'yes',
          },
          application,
        )
        expect(page.errors()).toEqual({})
      })

      it('should return an error if the startDateSameAsReleaseDate field is not populated', () => {
        ;(
          retrieveOptionalQuestionResponseFromFormArtifact as jest.MockedFn<
            typeof retrieveOptionalQuestionResponseFromFormArtifact
          >
        ).mockReturnValue(futureReleaseDate)

        const page = new PlacementDate({}, application)
        expect(page.errors()).toEqual({
          startDateSameAsReleaseDate: 'You must specify if the start date is the same as the release date',
        })
      })
    })

    describe('if the start date is not the same as the release date', () => {
      it('should return an empty object if the date is specified', () => {
        const placementDate = add(new Date(), { days: 5 })
        const page = new PlacementDate(
          {
            startDateSameAsReleaseDate: 'no',
            ...DateFormats.dateObjectToDateInputs(placementDate, 'startDate'),
          },
          application,
        )
        expect(page.errors()).toEqual({})
      })

      it('should return an error if the date is not specified', () => {
        const page = new PlacementDate(
          {
            startDateSameAsReleaseDate: 'no',
          },
          application,
        )
        expect(page.errors()).toEqual({ startDate: 'You must enter a start date' })
      })

      it('should return an error if the date is invalid', () => {
        const page = new PlacementDate(
          {
            startDateSameAsReleaseDate: 'no',
            'startDate-year': '999999',
            'startDate-month': '99999',
            'startDate-day': '9999',
          },
          application,
        )
        expect(page.errors()).toEqual({ startDate: 'The start date is an invalid date' })
      })

      it('should return an error if the date is in the past', () => {
        const placementDate = sub(new Date(), { months: 5 })
        const page = new PlacementDate(
          {
            startDateSameAsReleaseDate: 'no',
            ...DateFormats.dateObjectToDateInputs(placementDate, 'startDate'),
          },
          application,
        )
        expect(page.errors()).toEqual({ startDate: 'The start date must not be in the past' })
      })

      it('should not return an error if the date is today', () => {
        const placementDate = new Date()
        const page = new PlacementDate(
          {
            startDateSameAsReleaseDate: 'no',
            ...DateFormats.dateObjectToDateInputs(placementDate, 'startDate'),
          },
          application,
        )
        expect(page.errors()).toEqual({})
      })
    })
  })

  describe('response', () => {
    describe('if the release date is in the future', () => {
      it('should return a translated version of the response when the start date is the same as the release date', () => {
        ;(
          retrieveOptionalQuestionResponseFromFormArtifact as jest.MockedFn<
            typeof retrieveOptionalQuestionResponseFromFormArtifact
          >
        ).mockReturnValue(futureReleaseDate)

        const page = new PlacementDate(
          {
            startDateSameAsReleaseDate: 'yes',
          },
          application,
        )

        expect(page.response()).toEqual({
          [page.title]: 'Yes',
        })
      })

      it('should return a translated version of the response when the start date is not the same as the release date', () => {
        ;(
          retrieveOptionalQuestionResponseFromFormArtifact as jest.MockedFn<
            typeof retrieveOptionalQuestionResponseFromFormArtifact
          >
        ).mockReturnValue(futureReleaseDate)

        const page = new PlacementDate(
          {
            startDateSameAsReleaseDate: 'no',
            'startDate-year': '2022',
            'startDate-month': '11',
            'startDate-day': '11',
          },
          application,
        )

        expect(page.response()).toEqual({
          [page.title]: 'No',
          'Placement Start Date': 'Friday 11 November 2022',
        })
      })
    })

    describe('if the release date is in the past', () => {
      it('should return a translated version of the placement start date', () => {
        ;(
          retrieveOptionalQuestionResponseFromFormArtifact as jest.MockedFn<
            typeof retrieveOptionalQuestionResponseFromFormArtifact
          >
        ).mockReturnValue(pastReleaseDate)

        const page = new PlacementDate(
          {
            'startDate-year': '2022',
            'startDate-month': '11',
            'startDate-day': '11',
          },
          application,
        )

        expect(page.response()).toEqual({
          'What date you want the placement to start?': 'Friday 11 November 2022',
        })
      })
    })
  })
})
