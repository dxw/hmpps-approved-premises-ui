import type { Request, Response, TypedRequestHandler } from 'express'
import { ApplicationService, PlacementApplicationService, PlacementRequestService, TaskService } from '../../services'
import paths from '../../paths/placementApplications'
import matchpaths from '../../paths/match'
import { addErrorMessageToFlash } from '../../utils/validation'
import { getResponses } from '../../utils/applications/getResponses'
import { getPaginationDetails } from '../../utils/getPaginationDetails'

export default class PlacementRequestsController {
  constructor(
    private readonly placementRequestService: PlacementRequestService,
    private readonly placementApplicationService: PlacementApplicationService,
    private readonly taskService: TaskService,
    private readonly applicationService: ApplicationService,
  ) {}

  index(): TypedRequestHandler<Request, Response> {
    return async (req: Request, res: Response) => {
      const { pageNumber, hrefPrefix } = getPaginationDetails(req, matchpaths.placementRequests.index({}))
      const paginatedResponse = await this.taskService.getTasksOfType(
        req.user.token,
        'placement-application',
        pageNumber,
      )

      res.render('match/placementRequests/index', {
        pageHeading: 'My Cases',
        hrefPrefix,
        pageNumber: Number(paginatedResponse.pageNumber),
        totalPages: Number(paginatedResponse.totalPages),
        tasks: paginatedResponse.data,
      })
    }
  }

  show(): TypedRequestHandler<Request, Response> {
    return async (req: Request, res: Response) => {
      const placementRequest = await this.placementRequestService.getPlacementRequest(req.user.token, req.params.id)

      res.render('match/placementRequests/show', {
        pageHeading: `Matching information`,
        placementRequest,
      })
    }
  }

  create(): TypedRequestHandler<Request, Response> {
    return async (req: Request, res: Response) => {
      const application = await this.placementApplicationService.create(req.user.token, req.body.applicationId)

      return res.redirect(
        paths.placementApplications.pages.show({
          id: application.id,
          task: 'request-a-placement',
          page: 'reason-for-placement',
        }),
      )
    }
  }

  submit(): TypedRequestHandler<Request, Response> {
    return async (req: Request, res: Response) => {
      const { id } = req.params
      const { confirmation } = req.body

      if (confirmation !== '1') {
        addErrorMessageToFlash(
          req,
          'You must confirm that the information you have provided is correct',
          'confirmation',
        )
        return res.redirect(
          paths.placementApplications.pages.show({ id, task: 'request-a-placement', page: 'check-your-answers' }),
        )
      }

      const placementApplication = await this.placementApplicationService.getPlacementApplication(req.user.token, id)
      placementApplication.document = getResponses(placementApplication)
      const application = await this.applicationService.findApplication(
        req.user.token,
        placementApplication.applicationId,
      )
      await this.placementApplicationService.submit(req.user.token, placementApplication, application)

      return res.render('placement-applications/confirm', {
        pageHeading: 'Request for placement confirmed',
      })
    }
  }
}
