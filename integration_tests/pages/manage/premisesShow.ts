import { parseISO } from 'date-fns'

import type { Premises, Booking } from 'approved-premises'

import Page from '../page'
import { formatDateString, formatDate } from '../../../server/utils/utils'
import paths from '../../../server/paths/manage'

export default class PremisesShowPage extends Page {
  constructor(private readonly premises: Premises) {
    super(premises.name)
  }

  static visit(premises: Premises): PremisesShowPage {
    cy.visit(paths.premises.show({ premisesId: premises.id }))
    return new PremisesShowPage(premises)
  }

  shouldShowPremisesDetail(): void {
    cy.get('.govuk-summary-list__key')
      .contains('Code')
      .siblings('.govuk-summary-list__value')
      .should('contain', this.premises.apCode)

    cy.get('.govuk-summary-list__key')
      .contains('Postcode')
      .siblings('.govuk-summary-list__value')
      .should('contain', this.premises.postcode)

    cy.get('.govuk-summary-list__key')
      .contains('Number of Beds')
      .siblings('.govuk-summary-list__value')
      .should('contain', this.premises.bedCount)

    cy.get('.govuk-summary-list__key')
      .contains('Available Beds')
      .siblings('.govuk-summary-list__value')
      .should('contain', this.premises.availableBedsForToday)
  }

  shouldShowBookings(
    bookingsArrivingToday: Array<Booking>,
    bookingsLeavingToday: Array<Booking>,
    bookingsArrivingSoon: Array<Booking>,
    bookingsLeavingSoon: Array<Booking>,
  ): void {
    cy.get('a')
      .contains('Arriving Today')
      .click()
      .then(() => {
        this.tableShouldContainBookings(bookingsArrivingToday, 'arrival')
      })

    cy.get('a')
      .contains('Departing Today')
      .click()
      .then(() => {
        this.tableShouldContainBookings(bookingsLeavingToday, 'departure')
      })

    cy.get('a')
      .contains('Upcoming Arrivals')
      .click()
      .then(() => {
        this.tableShouldContainBookings(bookingsArrivingSoon, 'arrival')
      })

    cy.get('a')
      .contains('Upcoming Departures')
      .click()
      .then(() => {
        this.tableShouldContainBookings(bookingsLeavingSoon, 'departure')
      })
  }

  private tableShouldContainBookings(bookings: Array<Booking>, type: 'arrival' | 'departure') {
    bookings.forEach((item: Booking) => {
      const date = type === 'arrival' ? parseISO(item.expectedArrivalDate) : parseISO(item.expectedDepartureDate)
      cy.contains(item.crn)
        .parent()
        .within(() => {
          cy.get('td').eq(0).contains(formatDate(date))
          cy.get('td')
            .eq(1)
            .contains('Manage')
            .should('have.attr', 'href', `/premises/${this.premises.id}/bookings/${item.id}`)
        })
    })
  }

  shouldShowCurrentResidents(currentResidents: Array<Booking>) {
    cy.get('h2').should('contain', 'Current Residents')
    currentResidents.forEach((item: Booking) => {
      cy.contains(item.crn)
        .parent()
        .within(() => {
          cy.get('td')
            .eq(0)
            .contains(formatDate(parseISO(item.expectedDepartureDate)))
          cy.get('td')
            .eq(1)
            .contains('Manage')
            .should('have.attr', 'href', `/premises/${this.premises.id}/bookings/${item.id}`)
        })
    })
  }

  shouldShowOvercapacityMessage(overcapacityStartDate: string, overcapacityEndDate: string) {
    this.shouldShowBanner(
      `The premises is over capacity for the period ${formatDateString(overcapacityStartDate)} to ${formatDateString(
        overcapacityEndDate,
      )}`,
    )
  }
}