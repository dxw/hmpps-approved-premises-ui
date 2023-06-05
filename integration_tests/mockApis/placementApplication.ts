import { SuperAgentRequest } from 'superagent'

import type { PlacementApplication } from '@approved-premises/api'
import { getMatchingRequests, stubFor } from '../../wiremock'
import paths from '../../server/paths/api'

export default {
  stubPlacementApplication: (placementApplication: PlacementApplication): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: paths.placementApplications.show({ id: placementApplication.id }),
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: placementApplication,
      },
    }),
  stubPlacementApplicationUpdate: (placementApplication: PlacementApplication): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'PUT',
        url: paths.placementApplications.update({
          id: placementApplication.id,
        }),
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: placementApplication,
      },
    }),
  stubCreatePlacementApplication: (placementApplication: PlacementApplication): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: paths.placementApplications.create.pattern,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: placementApplication,
      },
    }),
  stubSubmitPlacementApplication: (placementApplication: PlacementApplication): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: paths.placementApplications.submit({ id: placementApplication.id }),
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: placementApplication,
      },
    }),
  verifyPlacementApplicationSubmit: async (applicationId: string) =>
    (
      await getMatchingRequests({
        method: 'POST',
        url: paths.placementApplications.submit({ id: applicationId }),
      })
    ).body.requests,
}
