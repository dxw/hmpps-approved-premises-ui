import { SuperAgentRequest } from 'superagent'

import type { Application } from '@approved-premises/api'

import { getMatchingRequests, stubFor } from '../../wiremock'

export default {
  stubApplications: (applications: Application): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        url: `/applications`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: applications,
      },
    }),
  stubApplicationCreate: (args: { application: Application }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        url: `/applications`,
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { ...args.application, data: null },
      },
    }),
  stubApplicationUpdate: (args: { application: Application }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'PUT',
        url: `/applications/${args.application.id}`,
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        body: `
        {
          "id": "{{request.pathSegments.[1]}}",
          "person": ${JSON.stringify(args.application.person)},
          "createdByProbationOfficerId": "${args.application.createdByUserId}",
          "schemaVersion": "${args.application.schemaVersion}",
          "createdAt": "${args.application.createdAt}",
          "submittedAt": "${args.application.submittedAt}",
          "data": {{{jsonPath request.body '$.data'}}}
        }
        `,
        transformers: ['response-template'],
      },
    }),
  stubApplicationGet: (args: { application: Application }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        url: `/applications/${args.application.id}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: args.application,
      },
    }),
  stubApplicationSubmit: (args: { application: Application }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        url: `/applications/${args.application.id}/submission`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    }),
  verifyApplicationUpdate: async (applicationId: string) =>
    (
      await getMatchingRequests({
        method: 'PUT',
        url: `/applications/${applicationId}`,
      })
    ).body.requests,
  verifyApplicationSubmit: async (applicationId: string) =>
    (
      await getMatchingRequests({
        method: 'POST',
        url: `/applications/${applicationId}/submission`,
      })
    ).body.requests,
}
