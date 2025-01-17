import type { Cancellation } from '@approved-premises/api'
import Page from '../page'
import paths from '../../../server/paths/manage'

export default class CancellationCreatePage extends Page {
  constructor(
    public readonly premisesId: string,
    public readonly bookingId: string,
  ) {
    super('Confirm cancelled placement')
  }

  static visit(premisesId: string, bookingId: string): CancellationCreatePage {
    cy.visit(paths.bookings.cancellations.new({ premisesId, bookingId }))

    return new CancellationCreatePage(premisesId, bookingId)
  }

  completeForm(cancellation: Cancellation): void {
    this.getLegend('When was this placement cancelled?')
    this.completeDateInputs('date', cancellation.date)

    this.getLegend('Why was this placement cancelled?')
    this.checkRadioByNameAndValue('cancellation[reason]', cancellation.reason.id)

    this.getLabel('Provide any additional notes on why this placement was cancelled')
    this.completeTextArea('cancellation[notes]', cancellation.notes)

    this.clickSubmit()
  }

  shouldHaveCorrectBacklink(): void {
    cy.get('.govuk-back-link')
      .should('have.attr', 'href')
      .and('include', paths.bookings.show({ premisesId: this.premisesId, bookingId: this.bookingId }))
  }
}
