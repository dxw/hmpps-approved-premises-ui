import type { NextFunction, Request, Response } from 'express'
import { DeepMocked, createMock } from '@golevelup/ts-jest'

import type { ErrorsAndUserInput } from '@approved-premises/ui'

import CancellationService from '../../services/cancellationService'
import BookingService from '../../services/bookingService'
import CancellationsController from './cancellationsController'
import { catchValidationErrorOrPropogate, fetchErrorsAndUserInput } from '../../utils/validation'

import { bookingFactory, cancellationFactory, referenceDataFactory } from '../../testutils/factories'
import paths from '../../paths/manage'

jest.mock('../../utils/validation')

describe('cancellationsController', () => {
  const token = 'SOME_TOKEN'
  const backLink = 'http://localhost/some-path'

  const request: DeepMocked<Request> = createMock<Request>({ user: { token }, headers: { referer: backLink } })
  const response: DeepMocked<Response> = createMock<Response>({})
  const next: DeepMocked<NextFunction> = createMock<NextFunction>({})

  const premisesId = 'premisesId'
  const bookingId = 'bookingId'

  const booking = bookingFactory.build()
  const cancellationReasons = referenceDataFactory.buildList(4)

  const cancellationService = createMock<CancellationService>({})
  const bookingService = createMock<BookingService>({})

  const cancellationsController = new CancellationsController(cancellationService, bookingService)

  beforeEach(() => {
    bookingService.find.mockResolvedValue(booking)
    cancellationService.getCancellationReasons.mockResolvedValue(cancellationReasons)
  })

  describe('new', () => {
    it('should render the form', async () => {
      ;(fetchErrorsAndUserInput as jest.Mock).mockImplementation(() => {
        return { errors: {}, errorSummary: [], userInput: {} }
      })

      const requestHandler = cancellationsController.new()

      await requestHandler({ ...request, params: { premisesId, bookingId } }, response, next)

      expect(response.render).toHaveBeenCalledWith('cancellations/new', {
        premisesId,
        bookingId,
        booking,
        backLink,
        cancellationReasons,
        pageHeading: 'Confirm cancelled placement',
        errors: {},
        errorSummary: [],
      })

      expect(bookingService.find).toHaveBeenCalledWith(token, premisesId, bookingId)
      expect(cancellationService.getCancellationReasons).toHaveBeenCalledWith(token)
    })

    it('renders the form with errors and user input if an error has been sent to the flash', async () => {
      const errorsAndUserInput = createMock<ErrorsAndUserInput>({ userInput: { backLink: 'http://foo.com' } })

      ;(fetchErrorsAndUserInput as jest.Mock).mockReturnValue(errorsAndUserInput)

      const requestHandler = cancellationsController.new()

      await requestHandler({ ...request, params: { premisesId, bookingId } }, response, next)

      expect(response.render).toHaveBeenCalledWith('cancellations/new', {
        premisesId,
        bookingId,
        booking,
        backLink: 'http://foo.com',
        cancellationReasons,
        pageHeading: 'Confirm cancelled placement',
        errors: errorsAndUserInput.errors,
        errorSummary: errorsAndUserInput.errorSummary,
        ...errorsAndUserInput.userInput,
      })
    })

    it('sets a default backlink if the referrer is not present', async () => {
      ;(fetchErrorsAndUserInput as jest.Mock).mockImplementation(() => {
        return { errors: {}, errorSummary: [], userInput: {} }
      })

      const requestHandler = cancellationsController.new()

      await requestHandler({ ...request, params: { premisesId, bookingId }, headers: {} }, response, next)

      expect(response.render).toHaveBeenCalledWith('cancellations/new', {
        premisesId,
        bookingId,
        booking,
        backLink: paths.bookings.show({ premisesId, bookingId }),
        cancellationReasons,
        pageHeading: 'Confirm cancelled placement',
        errors: {},
        errorSummary: [],
      })
    })
  })

  describe('create', () => {
    it('creates a Cancellation and redirects to the confirmation page', async () => {
      const cancellation = cancellationFactory.build()

      cancellationService.createCancellation.mockResolvedValue(cancellation)

      const requestHandler = cancellationsController.create()

      request.params = {
        bookingId: 'bookingId',
        premisesId: 'premisesId',
      }

      request.body = {
        'date-year': 2022,
        'date-month': 12,
        'date-day': 11,
        backLink,
        cancellation: {
          notes: 'Some notes',
          reason: '8b2677dd-e5d4-407a-a8f8-e2035aec9227',
        },
      }

      await requestHandler(request, response, next)

      const expectedCancellation = {
        ...request.body.cancellation,
        date: '2022-12-11',
      }

      expect(cancellationService.createCancellation).toHaveBeenCalledWith(
        token,
        request.params.premisesId,
        request.params.bookingId,
        expectedCancellation,
      )

      expect(request.flash).toHaveBeenCalledWith('success', 'Booking cancelled')

      expect(response.redirect).toHaveBeenCalledWith(backLink)
    })

    it('should catch the validation errors when the API returns an error', async () => {
      const requestHandler = cancellationsController.create()

      request.params = {
        bookingId,
        premisesId,
      }

      const err = new Error()

      cancellationService.createCancellation.mockImplementation(() => {
        throw err
      })

      await requestHandler(request, response, next)

      expect(catchValidationErrorOrPropogate).toHaveBeenCalledWith(
        request,
        response,
        err,
        paths.bookings.cancellations.new({
          bookingId: request.params.bookingId,
          premisesId: request.params.premisesId,
        }),
      )
    })
  })
})
