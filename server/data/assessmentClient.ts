import type { ApprovedPremisesAssessment as Assessment } from '@approved-premises/api'
import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import paths from '../paths/api'

export default class AssessmentClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('assessmentClient', config.apis.approvedPremises as ApiConfig, token)
  }

  async all(): Promise<Array<Assessment>> {
    return (await this.restClient.get({ path: paths.assessments.index.pattern })) as Array<Assessment>
  }

  async find(assessmentId: string): Promise<Assessment> {
    return (await this.restClient.get({ path: paths.assessments.show({ id: assessmentId }) })) as Assessment
  }

  async update(assessment: Assessment): Promise<Assessment> {
    return (await this.restClient.put({
      path: paths.assessments.update({ id: assessment.id }),
      data: { data: assessment.data },
    })) as Assessment
  }
}
