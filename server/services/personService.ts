import type { Response } from 'express'
import type { PersonRisksUI } from '@approved-premises/ui'
import type {
  ActiveOffence,
  Adjudication,
  OASysSection,
  OASysSections,
  Person,
  PersonAcctAlert,
  PrisonCaseNote,
} from '@approved-premises/api'
import type { PersonClient, RestClientBuilder } from '../data'

import { mapApiPersonRisksForUi } from '../utils/utils'

export class OasysNotFoundError extends Error {}

export default class PersonService {
  constructor(private readonly personClientFactory: RestClientBuilder<PersonClient>) {}

  async findByCrn(token: string, crn: string, checkCaseload = false): Promise<Person> {
    const personClient = this.personClientFactory(token)

    const person = await personClient.search(crn, checkCaseload)
    return person
  }

  async getOffences(token: string, crn: string): Promise<Array<ActiveOffence>> {
    const personClient = this.personClientFactory(token)

    const offences = await personClient.offences(crn)
    return offences
  }

  async getPersonRisks(token: string, crn: string): Promise<PersonRisksUI> {
    const personClient = this.personClientFactory(token)

    const risks = await personClient.risks(crn)

    return mapApiPersonRisksForUi(risks)
  }

  async getPrisonCaseNotes(token: string, crn: string): Promise<Array<PrisonCaseNote>> {
    const personClient = this.personClientFactory(token)

    const prisonCaseNotes = await personClient.prisonCaseNotes(crn)

    return prisonCaseNotes
  }

  async getAdjudications(token: string, crn: string): Promise<Array<Adjudication>> {
    const personClient = this.personClientFactory(token)

    const adjudications = await personClient.adjudications(crn)

    return adjudications
  }

  async getAcctAlerts(token: string, crn: string): Promise<Array<PersonAcctAlert>> {
    const personClient = this.personClientFactory(token)

    const acctAlerts = await personClient.acctAlerts(crn)

    return acctAlerts
  }

  async getOasysSelections(token: string, crn: string): Promise<Array<OASysSection>> {
    const personClient = this.personClientFactory(token)

    try {
      const oasysSections = await personClient.oasysSelections(crn)

      return oasysSections
    } catch (e) {
      if (e?.data?.status === 404) {
        throw new OasysNotFoundError(`Oasys record not found for CRN: ${crn}`)
      }
      throw e
    }
  }

  async getOasysSections(token: string, crn: string, selectedSections: Array<number> = []): Promise<OASysSections> {
    const personClient = this.personClientFactory(token)

    try {
      const oasysSections = await personClient.oasysSections(crn, selectedSections)

      return oasysSections
    } catch (e) {
      if (e?.data?.status === 404) {
        throw new OasysNotFoundError(`Oasys record not found for CRN: ${crn}`)
      }
      throw e
    }
  }

  async getDocument(token: string, crn: string, documentId: string, response: Response): Promise<void> {
    const personClient = this.personClientFactory(token)

    return personClient.document(crn, documentId, response)
  }
}
