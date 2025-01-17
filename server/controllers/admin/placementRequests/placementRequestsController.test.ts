import type { NextFunction, Request, Response } from 'express'
import { DeepMocked, createMock } from '@golevelup/ts-jest'

import PlacementRequestsController from './placementRequestsController'

import { PlacementRequestService } from '../../../services'
import { paginatedResponseFactory, placementRequestFactory } from '../../../testutils/factories'
import placementRequestDetail from '../../../testutils/factories/placementRequestDetail'
import { PaginatedResponse } from '../../../@types/ui'
import { PlacementRequest } from '../../../@types/shared'
import paths from '../../../paths/admin'
import { getPaginationDetails } from '../../../utils/getPaginationDetails'

jest.mock('../../../utils/applications/utils')
jest.mock('../../../utils/applications/getResponses')
jest.mock('../../../utils/getPaginationDetails')

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

    const paginationDetails = {
      hrefPrefix: paths.admin.placementRequests.index({}),
      pageNumber: 1,
      sortBy: 'name',
      sortDirection: 'desc',
    }

    beforeEach(() => {
      placementRequestService.getDashboard.mockResolvedValue(paginatedResponse)
      ;(getPaginationDetails as jest.Mock).mockReturnValue(paginationDetails)
    })

    it('should render the placement requests template', async () => {
      const requestHandler = placementRequestsController.index()

      await requestHandler(request, response, next)

      expect(response.render).toHaveBeenCalledWith('admin/placementRequests/index', {
        pageHeading: 'Record and update placement details',
        placementRequests: paginatedResponse.data,
        status: 'notMatched',
        pageNumber: Number(paginatedResponse.pageNumber),
        totalPages: Number(paginatedResponse.totalPages),
        hrefPrefix: paginationDetails.hrefPrefix,
        sortBy: paginationDetails.sortBy,
        sortDirection: paginationDetails.sortDirection,
      })

      expect(placementRequestService.getDashboard).toHaveBeenCalledWith(
        token,
        'notMatched',
        paginationDetails.pageNumber,
        paginationDetails.sortBy,
        paginationDetails.sortDirection,
      )

      expect(getPaginationDetails).toHaveBeenCalledWith(request, paths.admin.placementRequests.index({}), {
        status: 'notMatched',
      })
    })

    it('should handle the status parameter correctly', async () => {
      const requestHandler = placementRequestsController.index()
      const notMatchedRequest = { ...request, query: { status: 'matched' } }

      await requestHandler(notMatchedRequest, response, next)

      expect(response.render).toHaveBeenCalledWith('admin/placementRequests/index', {
        pageHeading: 'Record and update placement details',
        placementRequests: paginatedResponse.data,
        status: 'matched',
        pageNumber: Number(paginatedResponse.pageNumber),
        totalPages: Number(paginatedResponse.totalPages),
        hrefPrefix: paginationDetails.hrefPrefix,
        sortBy: paginationDetails.sortBy,
        sortDirection: paginationDetails.sortDirection,
      })

      expect(placementRequestService.getDashboard).toHaveBeenCalledWith(
        token,
        'matched',
        paginationDetails.pageNumber,
        paginationDetails.sortBy,
        paginationDetails.sortDirection,
      )

      expect(getPaginationDetails).toHaveBeenCalledWith(notMatchedRequest, paths.admin.placementRequests.index({}), {
        status: 'matched',
      })
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

  describe('search', () => {
    const paginatedResponse = paginatedResponseFactory.build({
      data: placementRequestFactory.buildList(2),
    }) as PaginatedResponse<PlacementRequest>

    const paginationDetails = {
      hrefPrefix: paths.admin.placementRequests.index({}),
      pageNumber: 1,
      sortBy: 'name',
      sortDirection: 'desc',
    }

    const hrefPrefix = paths.admin.placementRequests.search({})

    let searchRequest: Request

    beforeEach(() => {
      placementRequestService.search.mockResolvedValue(paginatedResponse)
      ;(getPaginationDetails as jest.Mock).mockReturnValue(paginationDetails)
    })

    it('should render the search template', async () => {
      const requestHandler = placementRequestsController.search()

      searchRequest = { ...request }

      await requestHandler(searchRequest, response, next)

      expect(response.render).toHaveBeenCalledWith('admin/placementRequests/search', {
        pageHeading: 'Record and update placement details',
        placementRequests: paginatedResponse.data,
        crnOrName: undefined,
        pageNumber: Number(paginatedResponse.pageNumber),
        totalPages: Number(paginatedResponse.totalPages),
        hrefPrefix: paginationDetails.hrefPrefix,
        sortBy: paginationDetails.sortBy,
        sortDirection: paginationDetails.sortDirection,
      })

      expect(placementRequestService.search).toHaveBeenCalledWith(
        token,
        {},
        paginationDetails.pageNumber,
        paginationDetails.sortBy,
        paginationDetails.sortDirection,
      )

      expect(getPaginationDetails).toHaveBeenCalledWith(searchRequest, hrefPrefix, {})
    })

    it('should search for placement requests by CRN', async () => {
      const requestHandler = placementRequestsController.search()

      searchRequest = { ...request, query: { crnOrName: 'CRN123' } }

      await requestHandler(searchRequest, response, next)

      expect(response.render).toHaveBeenCalledWith('admin/placementRequests/search', {
        pageHeading: 'Record and update placement details',
        placementRequests: paginatedResponse.data,
        crnOrName: 'CRN123',
        pageNumber: Number(paginatedResponse.pageNumber),
        totalPages: Number(paginatedResponse.totalPages),
        hrefPrefix: paginationDetails.hrefPrefix,
        sortBy: paginationDetails.sortBy,
        sortDirection: paginationDetails.sortDirection,
      })

      expect(getPaginationDetails).toHaveBeenCalledWith(searchRequest, hrefPrefix, { crnOrName: 'CRN123' })
    })

    it('should search for placement requests by tier and dates', async () => {
      const requestHandler = placementRequestsController.search()
      searchRequest = {
        ...request,
        query: { tier: 'A1', arrivalDateStart: '2022-01-01', arrivalDateEnd: '2022-01-03' },
      }

      await requestHandler(searchRequest, response, next)

      expect(response.render).toHaveBeenCalledWith('admin/placementRequests/search', {
        pageHeading: 'Record and update placement details',
        placementRequests: paginatedResponse.data,
        crnOrName: undefined,
        tier: 'A1',
        arrivalDateStart: '2022-01-01',
        arrivalDateEnd: '2022-01-03',
        pageNumber: Number(paginatedResponse.pageNumber),
        totalPages: Number(paginatedResponse.totalPages),
        hrefPrefix: paginationDetails.hrefPrefix,
        sortBy: paginationDetails.sortBy,
        sortDirection: paginationDetails.sortDirection,
      })

      expect(getPaginationDetails).toHaveBeenCalledWith(searchRequest, hrefPrefix, {
        tier: 'A1',
        arrivalDateStart: '2022-01-01',
        arrivalDateEnd: '2022-01-03',
      })
    })

    it('should remove empty queries from the search request', async () => {
      const requestHandler = placementRequestsController.search()

      searchRequest = {
        ...request,
        query: { crnOrName: '', tier: 'A1', arrivalDateStart: '2022-01-01', arrivalDateEnd: '2022-01-03' },
      }

      await requestHandler(searchRequest, response, next)

      expect(response.render).toHaveBeenCalledWith('admin/placementRequests/search', {
        pageHeading: 'Record and update placement details',
        placementRequests: paginatedResponse.data,
        crnOrName: undefined,
        tier: 'A1',
        arrivalDateStart: '2022-01-01',
        arrivalDateEnd: '2022-01-03',
        pageNumber: Number(paginatedResponse.pageNumber),
        totalPages: Number(paginatedResponse.totalPages),
        hrefPrefix: paginationDetails.hrefPrefix,
        sortBy: paginationDetails.sortBy,
        sortDirection: paginationDetails.sortDirection,
      })

      expect(getPaginationDetails).toHaveBeenCalledWith(searchRequest, hrefPrefix, {
        tier: 'A1',
        arrivalDateStart: '2022-01-01',
        arrivalDateEnd: '2022-01-03',
      })
    })

    it('should request page numbers and sort options', async () => {
      const requestHandler = placementRequestsController.search()

      searchRequest = {
        ...request,
        query: { crnOrName: 'CRN123', page: '2', sortBy: 'expectedArrival', sortDirection: 'desc' },
      }

      await requestHandler(searchRequest, response, next)

      expect(response.render).toHaveBeenCalledWith('admin/placementRequests/search', {
        pageHeading: 'Record and update placement details',
        placementRequests: paginatedResponse.data,
        crnOrName: 'CRN123',
        pageNumber: Number(paginatedResponse.pageNumber),
        totalPages: Number(paginatedResponse.totalPages),
        hrefPrefix: paginationDetails.hrefPrefix,
        sortBy: paginationDetails.sortBy,
        sortDirection: paginationDetails.sortDirection,
      })

      expect(getPaginationDetails).toHaveBeenCalledWith(searchRequest, hrefPrefix, {
        crnOrName: 'CRN123',
      })
    })
  })
})
