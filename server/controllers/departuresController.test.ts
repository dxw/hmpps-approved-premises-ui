import type { Request, Response, NextFunction } from 'express'
import { createMock, DeepMocked } from '@golevelup/ts-jest'
import type { ErrorsAndUserInput } from 'approved-premises'

import DepartureService, { DepartureReferenceData } from '../services/departureService'
import DeparturesController from './departuresController'
import { PremisesService } from '../services'
import BookingService from '../services/bookingService'
import departureFactory from '../testutils/factories/departure'
import bookingFactory from '../testutils/factories/booking'
import { catchValidationErrorOrPropogate, fetchErrorsAndUserInput } from '../utils/validation'

jest.mock('../utils/validation')

describe('DeparturesController', () => {
  let request: DeepMocked<Request> = createMock<Request>({})
  const response: DeepMocked<Response> = createMock<Response>({})
  const next: DeepMocked<NextFunction> = createMock<NextFunction>({})

  let departuresController: DeparturesController
  let departureService: DeepMocked<DepartureService>
  let premisesService: DeepMocked<PremisesService>
  let bookingService: DeepMocked<BookingService>

  beforeEach(() => {
    jest.resetAllMocks()
    request = createMock<Request>({})
    departureService = createMock<DepartureService>({})
    premisesService = createMock<PremisesService>({})
    bookingService = createMock<BookingService>({})
    departuresController = new DeparturesController(departureService, premisesService, bookingService)
  })

  describe('new', () => {
    const booking = bookingFactory.build()
    const bookingId = 'bookingId'
    const premisesId = 'premisesId'

    beforeEach(() => {
      premisesService.getPremisesSelectList.mockResolvedValue([{ value: 'id', text: 'name' }])
      bookingService.getBooking.mockResolvedValue(booking)
    })

    it('renders the form', async () => {
      const referenceData = createMock<DepartureReferenceData>()
      departureService.getReferenceData.mockResolvedValue(referenceData)
      ;(fetchErrorsAndUserInput as jest.Mock).mockReturnValue({ errors: {}, errorSummary: [], userInput: {} })

      const requestHandler = departuresController.new()

      request.params = {
        bookingId,
        premisesId,
      }

      await requestHandler(request, response, next)

      expect(premisesService.getPremisesSelectList).toHaveBeenCalled()
      expect(bookingService.getBooking).toHaveBeenCalledWith('premisesId', 'bookingId')
      expect(response.render).toHaveBeenCalledWith('departures/new', {
        premisesId,
        booking,
        premisesSelectList: [
          {
            text: 'name',
            value: 'id',
          },
        ],
        referenceData,
        errorSummary: [],
        errors: {},
      })
    })

    it('renders the form with errors', async () => {
      const referenceData = createMock<DepartureReferenceData>()
      const errorsAndUserInput = createMock<ErrorsAndUserInput>()

      departureService.getReferenceData.mockResolvedValue(referenceData)
      ;(fetchErrorsAndUserInput as jest.Mock).mockReturnValue(errorsAndUserInput)

      const requestHandler = departuresController.new()

      request.params = {
        bookingId,
        premisesId,
      }

      await requestHandler(request, response, next)

      expect(premisesService.getPremisesSelectList).toHaveBeenCalled()
      expect(bookingService.getBooking).toHaveBeenCalledWith('premisesId', 'bookingId')
      expect(response.render).toHaveBeenCalledWith('departures/new', {
        premisesId,
        booking,
        premisesSelectList: [
          {
            text: 'name',
            value: 'id',
          },
        ],
        referenceData,
        errorSummary: errorsAndUserInput.errorSummary,
        errors: errorsAndUserInput.errors,
        ...errorsAndUserInput.userInput,
      })
    })
  })

  describe('create', () => {
    it('creates an Departure and redirects to the confirmation page', async () => {
      const departure = departureFactory.build()
      departureService.createDeparture.mockResolvedValue(departure)

      const requestHandler = departuresController.create()

      request.params = {
        bookingId: 'bookingId',
        premisesId: 'premisesId',
      }

      request.body = {
        'dateTime-year': 2022,
        'dateTime-month': 12,
        'dateTime-day': 11,
        'dateTime-time': '12:35',
        departure: {
          notes: 'Some notes',
          reason: 'Bed withdrawn',
          moveOnCategory: 'Custody',
          destinationProvider: 'London',
          destinationAp: 'Some AP',
          name: 'John Doe',
          CRN: 'A123456',
        },
      }

      await requestHandler(request, response, next)

      const expectedDeparture = {
        ...request.body.departure,
        dateTime: new Date(2022, 11, 11, 12, 35).toISOString(),
      }

      expect(departureService.createDeparture).toHaveBeenCalledWith(
        request.params.premisesId,
        request.params.bookingId,
        expectedDeparture,
      )

      expect(response.redirect).toHaveBeenCalledWith(
        `/premises/premisesId/bookings/bookingId/departures/${departure.id}/confirmation`,
      )
    })

    it('should catch the validation errors when the API returns an error', async () => {
      const requestHandler = departuresController.create()

      const premisesId = 'premisesId'

      request.params = {
        bookingId: 'bookingId',
        premisesId,
      }

      const err = new Error()

      departureService.createDeparture.mockImplementation(() => {
        throw err
      })

      await requestHandler(request, response, next)

      expect(catchValidationErrorOrPropogate).toHaveBeenCalledWith(
        request,
        response,
        err,
        `/premises/${request.params.premisesId}/bookings/${request.params.bookingId}/departures/new`,
      )
    })
  })

  describe('confirm', () => {
    it('renders the confirmation page', async () => {
      const booking = bookingFactory.build()
      bookingService.getBooking.mockResolvedValue(booking)

      const departure = departureFactory.build()
      departureService.getDeparture.mockResolvedValue(departure)

      const premisesId = 'premisesId'
      const bookingId = 'bookingId'
      const requestHandler = departuresController.confirm()

      request.params = {
        premisesId,
        bookingId,
        departureId: departure.id,
      }

      await requestHandler(request, response, next)

      expect(departureService.getDeparture).toHaveBeenCalledWith(premisesId, bookingId, departure.id)
      expect(bookingService.getBooking).toHaveBeenCalledWith(premisesId, bookingId)
      expect(response.render).toHaveBeenCalledWith('departures/confirm', {
        ...departure,
        name: booking.name,
        CRN: booking.CRN,
      })
    })
  })
})
