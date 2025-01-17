import type { NextFunction, Request, Response } from 'express'
import { DeepMocked, createMock } from '@golevelup/ts-jest'

import PlacementRequestsController from './placementRequestsController'

import { ApplicationService, PlacementApplicationService, PlacementRequestService, TaskService } from '../../services'
import {
  applicationFactory,
  paginatedResponseFactory,
  placementApplicationFactory,
  placementRequestDetailFactory,
  taskFactory,
} from '../../testutils/factories'
import paths from '../../paths/placementApplications'
import matchpaths from '../../paths/match'
import { getResponses } from '../../utils/applications/getResponses'
import { PaginatedResponse } from '../../@types/ui'
import { getPaginationDetails } from '../../utils/getPaginationDetails'
import { Task } from '../../@types/shared'

jest.mock('../../utils/applications/utils')
jest.mock('../../utils/applications/getResponses')
jest.mock('../../utils/getPaginationDetails')
jest.mock('../../config')

describe('PlacementRequestsController', () => {
  const token = 'SOME_TOKEN'

  const request: DeepMocked<Request> = createMock<Request>({ user: { token } })
  const response: DeepMocked<Response> = createMock<Response>({})
  const next: DeepMocked<NextFunction> = createMock<NextFunction>({})

  const placementRequestService = createMock<PlacementRequestService>({})
  const placementApplicationService = createMock<PlacementApplicationService>({})
  const taskService = createMock<TaskService>({})
  const applicationService = createMock<ApplicationService>({})

  let placementRequestsController: PlacementRequestsController

  beforeEach(() => {
    placementRequestsController = new PlacementRequestsController(
      placementRequestService,
      placementApplicationService,
      taskService,
      applicationService,
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('index', () => {
    it('should render the placement requests template', async () => {
      const tasks = taskFactory.buildList(5)
      const paginatedResponse = paginatedResponseFactory.build({ data: tasks }) as PaginatedResponse<Task>

      taskService.getTasksOfType.mockResolvedValue(paginatedResponse)

      const paginationDetails = {
        hrefPrefix: matchpaths.placementRequests.index({}),
        pageNumber: 1,
      }

      ;(getPaginationDetails as jest.Mock).mockReturnValue(paginationDetails)

      const requestHandler = placementRequestsController.index()

      await requestHandler(request, response, next)

      expect(response.render).toHaveBeenCalledWith('match/placementRequests/index', {
        pageHeading: 'My Cases',
        tasks,
        pageNumber: Number(paginatedResponse.pageNumber),
        totalPages: Number(paginatedResponse.totalPages),
        hrefPrefix: paginationDetails.hrefPrefix,
      })
      expect(getPaginationDetails).toHaveBeenCalledWith(request, paginationDetails.hrefPrefix)
      expect(taskService.getTasksOfType).toHaveBeenCalledWith(
        token,
        'placement-application',
        Number(paginatedResponse.pageNumber),
      )
    })
  })

  describe('show', () => {
    it('should render the show template', async () => {
      const placementRequestDetail = placementRequestDetailFactory.build()

      placementRequestService.getPlacementRequest.mockResolvedValue(placementRequestDetail)

      const requestHandler = placementRequestsController.show()

      await requestHandler({ ...request, params: { id: placementRequestDetail.id } }, response, next)

      expect(response.render).toHaveBeenCalledWith('match/placementRequests/show', {
        pageHeading: 'Matching information',
        placementRequest: placementRequestDetail,
      })
      expect(placementRequestService.getPlacementRequest).toHaveBeenCalledWith(token, placementRequestDetail.id)
    })
  })

  describe('create', () => {
    it('should POST to the client and redirect to the first page of the form flow', async () => {
      const applicationId = '123'
      const placementApplication = placementApplicationFactory.build()
      placementApplicationService.create.mockResolvedValue(placementApplication)

      const requestHandler = placementRequestsController.create()

      await requestHandler({ ...request, body: { applicationId } }, response, next)

      expect(response.redirect).toHaveBeenCalledWith(
        paths.placementApplications.pages.show({
          id: placementApplication.id,
          task: 'request-a-placement',
          page: 'reason-for-placement',
        }),
      )
      expect(placementApplicationService.create).toHaveBeenCalledWith(token, applicationId)
    })
  })

  describe('submit', () => {
    describe('when confirmation is "1"', () => {
      it('should POST to the service and redirect to the confirmation page', async () => {
        const placementApplication = placementApplicationFactory.build()
        const application = applicationFactory.build()
        placementApplicationService.submit.mockResolvedValue(placementApplication)
        applicationService.findApplication.mockResolvedValue(application)

        const requestHandler = placementRequestsController.submit()

        await requestHandler(
          { ...request, body: { confirmation: '1' }, params: { id: placementApplication.id } },
          response,
          next,
        )

        expect(getResponses).toHaveBeenCalledWith(placementApplication)
        expect(response.render).toHaveBeenCalledWith('placement-applications/confirm', {
          pageHeading: 'Request for placement confirmed',
        })
        expect(placementApplicationService.submit).toHaveBeenCalledWith(token, placementApplication.id, application)
      })
    })

    describe('when confirmation is not "1"', () => {
      it('should POST to the service and redirect to the confirmation page', async () => {
        const placementApplication = placementApplicationFactory.build()
        placementApplicationService.submit.mockResolvedValue(placementApplication)
        const flash = jest.fn()
        const requestHandler = placementRequestsController.submit()

        await requestHandler({ ...request, body: {}, params: { id: placementApplication.id }, flash }, response, next)

        expect(response.redirect).toHaveBeenCalledWith(
          paths.placementApplications.pages.show({
            id: placementApplication.id,
            task: 'request-a-placement',
            page: 'check-your-answers',
          }),
        )
        expect(flash).toHaveBeenCalledWith('errors', {
          confirmation: {
            attributes: { 'data-cy-error-confirmation': true },
            text: 'You must confirm that the information you have provided is correct',
          },
        })
      })
    })
  })
})
