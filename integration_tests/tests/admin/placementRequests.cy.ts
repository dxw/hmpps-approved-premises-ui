import ListPage from '../../pages/admin/placementApplications/listPage'
import ShowPage from '../../pages/admin/placementApplications/showPage'

import {
  cancellationFactory,
  placementRequestDetailFactory,
  placementRequestFactory,
  premisesFactory,
} from '../../../server/testutils/factories'
import Page from '../../pages/page'
import CreatePlacementPage from '../../pages/admin/placementApplications/createPlacementPage'
import { CancellationCreatePage, NewDateChangePage } from '../../pages/manage'

context('Placement Requests', () => {
  const placementRequests = placementRequestFactory.buildList(2)
  const placementRequestWithoutBooking = placementRequestDetailFactory.build({
    ...placementRequests[0],
    booking: undefined,
  })
  const placementRequestWithBooking = placementRequestDetailFactory.build({ ...placementRequests[1] })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')

    // Given I am logged in
    cy.signIn()

    cy.task('stubPlacementRequestsDashboard', placementRequests)
    cy.task('stubPlacementRequest', placementRequestWithoutBooking)
    cy.task('stubPlacementRequest', placementRequestWithBooking)
  })

  it('allows me to view a placement request', () => {
    // When I visit the tasks dashboard
    const listPage = ListPage.visit(placementRequests)

    // Then I should see a list of placement requests
    listPage.shouldShowPlacementRequests()

    // When I choose a placement request
    listPage.clickPlacementRequest(placementRequestWithoutBooking)

    // Then I should be taken to the placement request page
    let showPage = Page.verifyOnPage(ShowPage, placementRequestWithoutBooking)

    // And I should see the information about the placement request
    showPage.shouldShowSummary()
    showPage.shouldShowMatchingInformationSummary()

    // And I should not see any booking information
    showPage.shouldNotShowBookingInformation()

    showPage.shouldShowCreateBookingOption()
    showPage.shouldNotShowAmendBookingOption()
    showPage.shouldNotShowCancelBookingOption()

    // When I go back to the dashboard
    ListPage.visit(placementRequests)

    // And I click the placement request with a booking
    listPage.clickPlacementRequest(placementRequestWithBooking)

    // Then I should be taken to the placement request page
    showPage = Page.verifyOnPage(ShowPage, placementRequestWithBooking)

    // And I should see the information about the placement request
    showPage.shouldShowSummary()
    showPage.shouldShowMatchingInformationSummary()

    showPage.shouldNotShowCreateBookingOption()
    showPage.shouldShowAmendBookingOption()
    showPage.shouldShowCancelBookingOption()

    // And I should not see any booking information
    showPage.shouldShowBookingInformation()
  })

  it('allows me to create a booking', () => {
    const premises = premisesFactory.buildList(3)
    cy.task('stubPremises', premises)
    cy.task('stubBookingFromPlacementRequest', placementRequestWithoutBooking)

    // When I visit the tasks dashboard
    const listPage = ListPage.visit(placementRequests)

    // And I choose a placement request
    listPage.clickPlacementRequest(placementRequestWithoutBooking)

    // Then I should be taken to the placement request page
    const showPage = Page.verifyOnPage(ShowPage, placementRequestWithoutBooking)

    // When I click on the create booking button
    showPage.clickCreateBooking()

    // Then I should be on the create a booking page
    const createPage = Page.verifyOnPage(CreatePlacementPage, placementRequestWithoutBooking)

    // And the dates should be prepopulated
    createPage.dateInputsShouldBePrepopulated()

    // When I complete the form
    createPage.completeForm('2022-01-01', '2022-02-01', premises[0].id)
    createPage.clickSubmit()

    // Then I should see a confirmation message
    showPage.shouldShowBanner('Placement created')

    // And the booking details should have been sent to the API
    cy.task('verifyBookingFromPlacementRequest', placementRequestWithoutBooking).then(requests => {
      expect(requests).to.have.length(1)

      const body = JSON.parse(requests[0].body)

      expect(body).to.contain({
        premisesId: premises[0].id,
        arrivalDate: '2022-01-01',
        departureDate: '2022-02-01',
      })
    })
  })

  it('allows me to amend a booking', () => {
    const premises = premisesFactory.buildList(3)
    cy.task('stubPremises', premises)
    cy.task('stubBookingFromPlacementRequest', placementRequestWithBooking)
    cy.task('stubDateChange', {
      premisesId: placementRequestWithBooking.booking.premisesId,
      bookingId: placementRequestWithBooking.booking.id,
    })
    cy.task('stubBookingGet', {
      premisesId: placementRequestWithBooking.booking.premisesId,
      booking: placementRequestWithBooking.booking,
    })

    // When I visit the tasks dashboard
    const listPage = ListPage.visit(placementRequests)

    // And I choose a placement request
    listPage.clickPlacementRequest(placementRequestWithBooking)

    // Then I should be taken to the placement request page
    const showPage = Page.verifyOnPage(ShowPage, placementRequestWithBooking)

    // When I click on the create booking button
    showPage.clickAmendBooking()

    // Then I should be on the amend a booking page
    const dateChangePage = Page.verifyOnPage(NewDateChangePage, placementRequestWithBooking)

    // And I change the date of my booking
    dateChangePage.completeForm('2023-01-01', '2023-03-02')
    dateChangePage.clickSubmit()

    // Then I should see a confirmation message
    showPage.shouldShowBanner('Booking changed successfully')

    // And the change booking endpoint should have been called with the correct parameters
    cy.task('verifyDateChange', {
      premisesId: placementRequestWithBooking.booking.premisesId,
      bookingId: placementRequestWithBooking.booking.id,
    }).then(requests => {
      expect(requests).to.have.length(1)
      const requestBody = JSON.parse(requests[0].body)

      expect(requestBody.newArrivalDate).equal('2023-01-01')
      expect(requestBody.newDepartureDate).equal('2023-03-02')
    })
  })

  it('allows me to cancel a booking', () => {
    const premises = premisesFactory.buildList(3)
    const cancellation = cancellationFactory.build({ date: '2022-06-01' })

    cy.task('stubPremises', premises)
    cy.task('stubBookingFromPlacementRequest', placementRequestWithBooking)
    cy.task('stubCancellationCreate', {
      premisesId: placementRequestWithBooking.booking.premisesId,
      bookingId: placementRequestWithBooking.booking.id,
      cancellation,
    })
    cy.task('stubBookingGet', {
      premisesId: placementRequestWithBooking.booking.premisesId,
      booking: placementRequestWithBooking.booking,
    })
    cy.task('stubCancellationReferenceData')

    // When I visit the tasks dashboard
    const listPage = ListPage.visit(placementRequests)

    // And I choose a placement request
    listPage.clickPlacementRequest(placementRequestWithBooking)

    // Then I should be taken to the placement request page
    const showPage = Page.verifyOnPage(ShowPage, placementRequestWithBooking)

    // When I click on the create booking button
    showPage.clickCancelBooking()

    // Then I should be on the cancel a booking page
    const cancellationPage = Page.verifyOnPage(CancellationCreatePage, placementRequestWithBooking)

    // And I cancel my booking
    cancellationPage.completeForm(cancellation)
    cancellationPage.clickSubmit()

    // Then I should see a confirmation message
    showPage.shouldShowBanner('Booking cancelled')

    // And a cancellation should have been created in the API
    cy.task('verifyCancellationCreate', {
      premisesId: placementRequestWithBooking.booking.premisesId,
      bookingId: placementRequestWithBooking.booking.id,
      cancellation,
    }).then(requests => {
      expect(requests).to.have.length(1)
      const requestBody = JSON.parse(requests[0].body)

      expect(requestBody.date).equal(cancellation.date)
      expect(requestBody.notes).equal(cancellation.notes)
      expect(requestBody.reason).equal(cancellation.reason.id)
    })
  })
})