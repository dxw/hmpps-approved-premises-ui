import nock from 'nock'
import { Response } from 'express'
import { createMock } from '@golevelup/ts-jest'
import { Readable } from 'stream'
import logger from '../../logger'

import type { ApiConfig } from '../config'
import RestClient from './restClient'

jest.mock('express')
jest.mock('../../logger')

describe('restClient', () => {
  let fakeApprovedPremisesApi: nock.Scope
  let restClient: RestClient

  const token = 'token-1'

  beforeEach(() => {
    const apiConfig: ApiConfig = {
      url: 'http://example.com:8000',
      timeout: {
        response: 1000,
        deadline: 1000,
      },
      agent: { timeout: 1000 },
      serviceName: 'approved-premises',
    }

    fakeApprovedPremisesApi = nock(apiConfig.url, {
      reqheaders: {
        authorization: `Bearer ${token}`,
        'X-SERVICE-NAME': 'approved-premises',
      },
    })
    restClient = new RestClient('premisesClient', apiConfig, token)
  })

  afterEach(() => {
    if (!nock.isDone()) {
      nock.cleanAll()
      throw new Error('Not all nock interceptors were used!')
    }
    nock.abortPendingRequests()
    nock.cleanAll()
  })

  describe('get', () => {
    it('should make a GET request', async () => {
      fakeApprovedPremisesApi.get(`/some/path`).reply(200, { some: 'data' })

      const result = await restClient.get({ path: '/some/path' })

      expect(result).toEqual({ some: 'data' })
      expect(nock.isDone()).toBeTruthy()
    })

    it('should omit the X-SERVICE-NAME header when the configuration does not include a service name', async () => {
      const apiConfig: ApiConfig = {
        url: 'http://example.com:8000',
        timeout: {
          response: 1000,
          deadline: 1000,
        },
        agent: { timeout: 1000 },
      }

      fakeApprovedPremisesApi = nock(apiConfig.url, {
        reqheaders: {
          authorization: `Bearer ${token}`,
        },
        badheaders: ['X-SERVICE-NAME'],
      })
      restClient = new RestClient('premisesClient', apiConfig, token)

      fakeApprovedPremisesApi.get(`/some/path`).reply(200, { some: 'data' })

      await restClient.get({ path: '/some/path' })

      expect(nock.isDone()).toBeTruthy()
    })
  })

  describe('post', () => {
    it('should filter out blank values', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = { some: 'data', empty: '', undefinedItem: undefined, nullItem: null } as any

      fakeApprovedPremisesApi.post(`/some/path`, { some: 'data' }).reply(201, { some: 'data' })

      const result = await restClient.post({ path: '/some/path', data })

      expect(result).toEqual({ some: 'data' })
      expect(nock.isDone()).toBeTruthy()
    })
  })

  describe('put', () => {
    it('should filter out blank values', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = { some: 'data', empty: '', undefinedItem: undefined, nullItem: null } as any

      fakeApprovedPremisesApi.put(`/some/path`, { some: 'data' }).reply(201, { some: 'data' })

      const result = await restClient.put({ path: '/some/path', data })

      expect(result).toEqual({ some: 'data' })
      expect(nock.isDone()).toBeTruthy()
    })
  })

  describe('pipe', () => {
    const response = createMock<Response>({})
    const mockReadStream = jest.fn().mockImplementation(() => {
      const readable = new Readable()
      readable.push('hello')
      readable.push('world')
      readable.push(null)

      return readable
    })

    it('should pipe a streaming response to a response', async () => {
      fakeApprovedPremisesApi.get('/some/path').reply(200, () => mockReadStream())

      const writeSpy = jest.spyOn(response, 'write')

      await restClient.pipe({ path: '/some/path' }, response)

      expect(writeSpy).toHaveBeenCalledWith(Buffer.from('hello', 'utf-8'))
      expect(writeSpy).toHaveBeenCalledWith(Buffer.from('world', 'utf-8'))

      expect(nock.isDone()).toBeTruthy()
    })

    it('should throw error if the response is unsuccessful', async () => {
      fakeApprovedPremisesApi.get('/some/path').reply(404)

      const loggerSpy = jest.spyOn(logger, 'warn')

      await expect(restClient.pipe({ path: '/some/path' }, response)).rejects.toThrowError(
        'cannot GET /some/path (404)',
      )

      expect(loggerSpy).toHaveBeenCalledWith(new Error('cannot GET /some/path (404)'), 'Error calling premisesClient')

      nock.cleanAll()
    })
  })
})
