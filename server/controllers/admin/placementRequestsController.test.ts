import type { NextFunction, Request, Response } from 'express'
import { DeepMocked, createMock } from '@golevelup/ts-jest'

import PlacementRequestsController from './placementRequestsController'

import { PlacementRequestService } from '../../services'
import { paginatedResponseFactory, placementRequestFactory } from '../../testutils/factories'
import placementRequestDetail from '../../testutils/factories/placementRequestDetail'
import { PaginatedResponse } from '../../@types/ui'
import { PlacementRequest } from '../../@types/shared'
import paths from '../../paths/admin'
import { createQueryString } from '../../utils/utils'

jest.mock('../../utils/applications/utils')
jest.mock('../../utils/applications/getResponses')

describe('PlacementRequestsController', () => {
  const token = 'SOME_TOKEN'

  const request: DeepMocked<Request> = createMock<Request>({ user: { token } })
  const response: DeepMocked<Response> = createMock<Response>({})
  const next: DeepMocked<NextFunction> = createMock<NextFunction>({})

  const placementRequestService = createMock<PlacementRequestService>({})

  let placementRequestsController: PlacementRequestsController

  beforeEach(() => {
    jest.resetAllMocks()
    placementRequestsController = new PlacementRequestsController(placementRequestService)
  })

  describe('index', () => {
    const paginatedResponse = paginatedResponseFactory.build({
      data: placementRequestFactory.buildList(2),
    }) as PaginatedResponse<PlacementRequest>

    beforeEach(() => {
      placementRequestService.getDashboard.mockResolvedValue(paginatedResponse)
    })

    it('should render the placement requests template', async () => {
      const hrefPrefix = `${paths.admin.placementRequests.index({})}?${createQueryString({ isParole: false })}&`

      const requestHandler = placementRequestsController.index()

      await requestHandler(request, response, next)

      expect(response.render).toHaveBeenCalledWith('admin/placementRequests/index', {
        pageHeading: 'Record and update placement details',
        placementRequests: paginatedResponse.data,
        isParole: false,
        pageNumber: Number(paginatedResponse.pageNumber),
        totalPages: Number(paginatedResponse.totalPages),
        hrefPrefix,
      })
      expect(placementRequestService.getDashboard).toHaveBeenCalledWith(token, false, undefined, undefined, undefined)
    })

    it('should request parole placement requests', async () => {
      const hrefPrefix = `${paths.admin.placementRequests.index({})}?${createQueryString({ isParole: true })}&`

      const requestHandler = placementRequestsController.index()

      await requestHandler({ ...request, query: { isParole: '1' } }, response, next)

      expect(response.render).toHaveBeenCalledWith('admin/placementRequests/index', {
        pageHeading: 'Record and update placement details',
        placementRequests: paginatedResponse.data,
        isParole: true,
        pageNumber: Number(paginatedResponse.pageNumber),
        totalPages: Number(paginatedResponse.totalPages),
        hrefPrefix,
      })
      expect(placementRequestService.getDashboard).toHaveBeenCalledWith(token, true, undefined, undefined, undefined)
    })

    it('should request page numbers and sort options', async () => {
      const hrefPrefix = `${paths.admin.placementRequests.index({})}?${createQueryString({ isParole: true })}&`

      const requestHandler = placementRequestsController.index()

      await requestHandler(
        { ...request, query: { isParole: '1', page: '2', sortBy: 'expectedArrival', sortDirection: 'desc' } },
        response,
        next,
      )

      expect(response.render).toHaveBeenCalledWith('admin/placementRequests/index', {
        pageHeading: 'Record and update placement details',
        placementRequests: paginatedResponse.data,
        isParole: true,
        pageNumber: Number(paginatedResponse.pageNumber),
        totalPages: Number(paginatedResponse.totalPages),
        hrefPrefix,
        sortBy: 'expectedArrival',
        sortDirection: 'desc',
      })
      expect(placementRequestService.getDashboard).toHaveBeenCalledWith(token, true, 2, 'expectedArrival', 'desc')
    })
  })

  describe('show', () => {
    it('should render the placement request show template', async () => {
      const placementRequest = placementRequestDetail.build()
      placementRequestService.getPlacementRequest.mockResolvedValue(placementRequest)

      const requestHandler = placementRequestsController.show()

      request.params.id = 'some-uuid'

      await requestHandler(request, response, next)

      expect(response.render).toHaveBeenCalledWith('admin/placementRequests/show', {
        placementRequest,
      })
      expect(placementRequestService.getPlacementRequest).toHaveBeenCalledWith(token, 'some-uuid')
    })
  })
})
