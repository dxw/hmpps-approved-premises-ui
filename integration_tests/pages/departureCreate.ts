import type { Departure, Booking } from 'approved-premises'

import Page from './page'

export default class DepartureCreatePage extends Page {
  constructor(private readonly premisesId: string, private readonly bookingId: string) {
    super('Log a departure')
  }

  static visit(premisesId: string, bookingId: string): DepartureCreatePage {
    cy.visit(`/premises/${premisesId}/bookings/${bookingId}/departures/new`)
    return new DepartureCreatePage(premisesId, bookingId)
  }

  public verifySummary(booking: Booking): void {
    this.assertDefinition('Name', booking.name)
    this.assertDefinition('CRN', booking.CRN)
  }

  public completeForm(departure: Departure): void {
    const dateTime = new Date(Date.parse(departure.dateTime))
    const minutes = dateTime.getMinutes()
    const hours = dateTime.getHours()

    cy.get('input[name="dateTime-day"]').type(String(dateTime.getDate()))
    cy.get('input[name="dateTime-month"]').type(String(dateTime.getMonth() + 1))
    cy.get('input[name="dateTime-year"]').type(String(dateTime.getFullYear()))
    cy.get('input[name="dateTime-time"]').type(`${hours}:${minutes}`)

    cy.get('#destinationAp').select(departure.destinationAp)

    cy.get('input[name="departure[reason]"]').last().check()

    cy.get('input[name="departure[moveOnCategory]"]').last().check()

    cy.get('input[name="departure[destinationProvider]"]').last().check()

    cy.get('textarea[name="departure[notes]"]').type(departure.notes)
    this.clickSubmit()
  }

  clickSubmit() {
    cy.get('button').click()
  }
}