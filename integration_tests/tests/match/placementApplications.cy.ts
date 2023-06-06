import { applicationFactory, placementApplicationFactory } from '../../../server/testutils/factories'
import { ShowPage } from '../../pages/apply'
import ReasonForPlacementPage from '../../pages/match/placementRequestForm/reasonForPlacement'

context('Placement Applications', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
  })

  beforeEach(() => {
    cy.signIn()
  })

  it('allows me to complete form', () => {
    // Given I have completed an application I am viewing a completed application
    const completedApplication = applicationFactory.build({ status: 'submitted', id: '123' })
    cy.task('stubApplicationGet', { application: completedApplication })
    cy.task('stubApplications', [completedApplication])

    // And there is a placement application in the DB
    const placementApplicationId = '123'
    const placementApplication = placementApplicationFactory.build({ id: placementApplicationId })
    cy.task('stubCreatePlacementApplication', placementApplication)
    cy.task('stubPlacementApplication', placementApplication)

    // When I visit the readonly application view
    const showPage = ShowPage.visit(completedApplication)

    // Then I should be able to click submit
    showPage.clickSubmit()

    // When I visit the placement request page
    const placementReasonPage = ReasonForPlacementPage.visit(placementApplicationId)

    // Then I can complete the form
    placementReasonPage.completeForm()

    // And submit it
    placementReasonPage.clickSubmit()
  })
})