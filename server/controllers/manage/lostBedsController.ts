import type { Request, RequestHandler, Response } from 'express'

import type { NewLostBed, UpdateLostBed } from '@approved-premises/api'
import LostBedService from '../../services/lostBedService'
import {
  catchValidationErrorOrPropogate,
  fetchErrorsAndUserInput,
  generateConflictErrorAndRedirect,
} from '../../utils/validation'
import paths from '../../paths/manage'
import { DateFormats } from '../../utils/dateUtils'

export default class LostBedsController {
  constructor(private readonly lostBedService: LostBedService) {}

  new(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { premisesId, bedId } = req.params
      const { errors, errorSummary, userInput, errorTitle } = fetchErrorsAndUserInput(req)

      const lostBedReasons = await this.lostBedService.getReferenceData(req.user.token)

      res.render('lostBeds/new', {
        premisesId,
        bedId,
        lostBedReasons,
        errors,
        errorSummary,
        errorTitle,
        ...userInput,
      })
    }
  }

  create(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { premisesId, bedId } = req.params

      const { startDate } = DateFormats.dateAndTimeInputsToIsoString(req.body, 'startDate')
      const { endDate } = DateFormats.dateAndTimeInputsToIsoString(req.body, 'endDate')

      const lostBed: NewLostBed = {
        ...req.body.lostBed,
        bedId,
        startDate,
        endDate,
        serviceName: 'approved-premises',
      }

      try {
        await this.lostBedService.createLostBed(req.user.token, premisesId, lostBed)

        req.flash('success', 'Lost bed logged')
        return res.redirect(paths.premises.show({ premisesId }))
      } catch (err) {
        const redirectPath = paths.lostBeds.new({ premisesId, bedId })

        if (err.status === 409 && 'data' in err) {
          return generateConflictErrorAndRedirect(
            req,
            res,
            premisesId,
            bedId,
            ['startDate', 'endDate'],
            err,
            redirectPath,
          )
        }

        return catchValidationErrorOrPropogate(req, res, err, redirectPath)
      }
    }
  }

  index(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { premisesId } = req.params

      const lostBeds = await this.lostBedService.getLostBeds(req.user.token, premisesId)

      res.render('lostBeds/index', {
        lostBeds,
        numberOfLostBeds: lostBeds.length,
        pageHeading: 'Manage out of service beds',
        premisesId,
      })
    }
  }

  show(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { premisesId, id } = req.params
      const { errors, errorSummary, userInput } = fetchErrorsAndUserInput(req)

      const referrer = req.headers.referer

      const lostBed = await this.lostBedService.getLostBed(req.user.token, premisesId, id)

      res.render('lostBeds/show', {
        errors,
        errorSummary,
        lostBed,
        premisesId,
        referrer,
        ...userInput,
      })
    }
  }

  update(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { premisesId, id } = req.params

      const { endDate } = DateFormats.dateAndTimeInputsToIsoString(req.body, 'endDate')
      req.body.endDate = endDate

      try {
        await this.lostBedService.updateLostBed(req.user.token, id, premisesId, req.body as UpdateLostBed)

        req.flash('success', 'Bed updated')

        return res.redirect(paths.lostBeds.index({ premisesId }))
      } catch (err) {
        const redirectPath = req.headers.referer

        return catchValidationErrorOrPropogate(req, res, err, redirectPath)
      }
    }
  }
}
