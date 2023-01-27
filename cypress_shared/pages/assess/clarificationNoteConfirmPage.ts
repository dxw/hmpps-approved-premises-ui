import { ApprovedPremisesUser as User } from '@approved-premises/api'

import Page from '../page'

export default class SufficientInformationPage extends Page {
  constructor() {
    super('Request information from probation practitioner')
  }

  clickBackToDashboard() {
    return cy.get('a').contains('Back to dashboard').click()
  }

  confirmUserDetails(user: User) {
    cy.get('dl').within(() => {
      this.assertDefinition('Name', user.name)
      this.assertDefinition('Email', user.email)
      this.assertDefinition('Contact number', user.telephoneNumber)
    })
  }
}
