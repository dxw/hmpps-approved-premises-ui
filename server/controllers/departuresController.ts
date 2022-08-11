import type { Response, Request, RequestHandler } from 'express'
import type { DepartureDto } from 'approved-premises'

import { convertDateAndTimeInputsToIsoString } from '../utils/utils'
import DepartureService from '../services/departureService'
import PremisesService from '../services/premisesService'
import BookingService from '../services/bookingService'
import renderWithErrors from '../utils/validation'

export default class DeparturesController {
  constructor(
    private readonly departureService: DepartureService,
    private readonly premisesService: PremisesService,
    private readonly bookingService: BookingService,
  ) {}

  new(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { premisesId, bookingId } = req.params
      const booking = await this.bookingService.getBooking(premisesId, bookingId)
      const premisesSelectList = await this.premisesService.getPremisesSelectList()
      const referenceData = await this.departureService.getReferenceData()

      res.render('departures/new', { premisesId, booking, premisesSelectList, referenceData })
    }
  }

  create(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { premisesId, bookingId } = req.params
      const { dateTime } = convertDateAndTimeInputsToIsoString(req.body, 'dateTime')

      const departure = {
        ...req.body.departure,
        dateTime,
      } as DepartureDto

      try {
        const { id } = await this.departureService.createDeparture(premisesId, bookingId, departure)
        res.redirect(`/premises/${premisesId}/bookings/${bookingId}/departures/${id}/confirmation`)
      } catch (err) {
        const booking = await this.bookingService.getBooking(premisesId, bookingId)
        const premisesSelectList = await this.premisesService.getPremisesSelectList()
        const referenceData = await this.departureService.getReferenceData()

        renderWithErrors(req, res, err, 'departures/new', { premisesId, booking, premisesSelectList, referenceData })
      }
    }
  }

  confirm(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { premisesId, bookingId, departureId } = req.params

      const booking = await this.bookingService.getBooking(premisesId, bookingId)
      const departure = await this.departureService.getDeparture(premisesId, bookingId, departureId)

      return res.render(`departures/confirm`, {
        ...departure,
        name: booking.name,
        CRN: booking.CRN,
      })
    }
  }
}
