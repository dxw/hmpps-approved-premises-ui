import type { Request, RequestHandler, Response } from 'express'

import type { NewCancellation } from '@approved-premises/api'

import { BookingService, CancellationService } from '../../services'
import { catchValidationErrorOrPropogate, fetchErrorsAndUserInput } from '../../utils/validation'
import { DateFormats } from '../../utils/dateUtils'

import paths from '../../paths/manage'

export default class CancellationsController {
  constructor(
    private readonly cancellationService: CancellationService,
    private readonly bookingService: BookingService,
  ) {}

  new(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { premisesId, bookingId } = req.params
      const { errors, errorSummary, userInput } = fetchErrorsAndUserInput(req)

      const booking = await this.bookingService.find(req.user.token, premisesId, bookingId)
      const cancellationReasons = await this.cancellationService.getCancellationReasons(req.user.token)
      let backLink: string

      if (userInput.backLink) {
        backLink = userInput.backLink as string
      } else if (req.headers.referer) {
        backLink = req.headers.referer
      } else {
        backLink = paths.bookings.show({ premisesId, bookingId })
      }

      res.render('cancellations/new', {
        premisesId,
        bookingId,
        booking,
        backLink,
        cancellationReasons,
        pageHeading: 'Confirm cancelled placement',
        errors,
        errorSummary,
        ...userInput,
      })
    }
  }

  create(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { premisesId, bookingId } = req.params
      const { date } = DateFormats.dateAndTimeInputsToIsoString(req.body, 'date')

      const cancellation = {
        ...req.body.cancellation,
        date,
      } as NewCancellation

      try {
        await this.cancellationService.createCancellation(req.user.token, premisesId, bookingId, cancellation)

        req.flash('success', 'Booking cancelled')
        res.redirect(req.body.backLink)
      } catch (err) {
        catchValidationErrorOrPropogate(
          req,
          res,
          err,
          paths.bookings.cancellations.new({
            bookingId,
            premisesId,
          }),
        )
      }
    }
  }
}
