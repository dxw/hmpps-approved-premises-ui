import type { Request, RequestHandler, Response } from 'express'
import { PlacementApplicationDecisionEnvelope } from '@approved-premises/api'
import { PlacementApplicationService } from '../../services'

import {
  catchAPIErrorOrPropogate,
  catchValidationErrorOrPropogate,
  fetchErrorsAndUserInput,
  generateErrorMessages,
  generateErrorSummary,
} from '../../utils/validation'
import { PlacementApplicationReview } from '../../utils/placementApplications/review'
import paths from '../../paths/match'
import placementApplicationPaths from '../../paths/placementApplications'

export default class ReviewController {
  constructor(private readonly placementApplicationService: PlacementApplicationService) {}

  show(step: 'review' | 'decision'): RequestHandler {
    return async (req: Request, res: Response) => {
      const { errors, errorSummary, userInput } = fetchErrorsAndUserInput(req)

      const review = new PlacementApplicationReview(req, step)
      const placementApplication = await this.placementApplicationService.getPlacementApplication(
        req.user.token,
        req.params.id,
      )

      const pageProps =
        step === 'review'
          ? {
              pageHeading: 'Review information',
              backLink: `${paths.placementRequests.index({})}#placement-applications`,
            }
          : {
              pageHeading: 'Make a decision',
              backLink: placementApplicationPaths.placementApplications.show({ id: review.applicationId }),
            }

      res.render(`placement-applications/pages/review/${review.step}`, {
        pageProps,
        placementApplication,
        errors,
        errorSummary,
        ...userInput,
      })
    }
  }

  update() {
    return async (req: Request, res: Response) => {
      const review = new PlacementApplicationReview(req, 'review')

      try {
        review.update()
        return res.redirect(
          placementApplicationPaths.placementApplications.review.decision({ id: review.applicationId }),
        )
      } catch (err) {
        if (err.message === 'Invalid request body') {
          const errorMessages = generateErrorMessages(review.errors)
          const errorSummary = generateErrorSummary(review.errors)

          req.flash('errors', errorMessages)
          req.flash('errorSummary', errorSummary)
          req.flash('userInput', req.body)

          return res.redirect(req.headers.referer)
        }
        return catchValidationErrorOrPropogate(req, res, err, req.headers.referer)
      }
    }
  }

  submit() {
    return async (req: Request, res: Response) => {
      const review = new PlacementApplicationReview(req, 'decision')

      try {
        review.update()

        await this.placementApplicationService.submitDecision(
          req.user.token,
          req.params.id,
          req.session.placementApplicationDecisions[review.applicationId] as PlacementApplicationDecisionEnvelope,
        )

        return res.redirect(
          placementApplicationPaths.placementApplications.review.confirm({ id: review.applicationId }),
        )
      } catch (err) {
        if (err.message === 'Invalid request body') {
          const errorMessages = generateErrorMessages(review.errors)
          const errorSummary = generateErrorSummary(review.errors)

          req.flash('errors', errorMessages)
          req.flash('errorSummary', errorSummary)
          req.flash('userInput', req.body)

          return res.redirect(req.headers.referer)
        }
        return catchAPIErrorOrPropogate(req, res, err)
      }
    }
  }

  confirm() {
    return async (req: Request, res: Response) => {
      res.render('placement-applications/pages/review/confirm', {
        pageHeading: 'Review complete',
      })
    }
  }
}
