import type { NextFunction, Request, Response } from 'express'
import { DeepMocked, createMock } from '@golevelup/ts-jest'

import PremisesService from '../../../services/premisesService'
import BedsController from './bedsController'
import { bedDetailFactory, bedSummaryFactory } from '../../../testutils/factories'

describe('BedsController', () => {
  const token = 'SOME_TOKEN'

  const request: DeepMocked<Request> = createMock<Request>({ user: { token } })
  const response: DeepMocked<Response> = createMock<Response>({})
  const next: DeepMocked<NextFunction> = createMock<NextFunction>({})

  const premisesService = createMock<PremisesService>({})
  const bedsController = new BedsController(premisesService)

  describe('index', () => {
    it('should return the beds to the template', async () => {
      const beds = bedSummaryFactory.buildList(1)
      const premisesId = 'premisesId'
      request.params.premisesId = premisesId

      premisesService.getBeds.mockResolvedValue(beds)

      const requestHandler = bedsController.index()
      await requestHandler(request, response, next)

      expect(response.render).toHaveBeenCalledWith('premises/beds/index', {
        beds,
        premisesId,
        pageHeading: 'Manage beds',
      })

      expect(premisesService.getBeds).toHaveBeenCalledWith(token, premisesId)
    })
  })

  describe('show', () => {
    it('should return the bed to the template', async () => {
      const bed = bedDetailFactory.build()
      const premisesId = 'premisesId'
      request.params.premisesId = premisesId
      const bedId = 'bedId'
      request.params.bedId = bedId

      premisesService.getBed.mockResolvedValue(bed)

      const requestHandler = bedsController.show()
      await requestHandler(request, response, next)

      expect(response.render).toHaveBeenCalledWith('premises/beds/show', {
        bed,
        premisesId,
        pageHeading: 'Manage beds',
      })

      expect(premisesService.getBed).toHaveBeenCalledWith(token, premisesId, bedId)
    })
  })
})