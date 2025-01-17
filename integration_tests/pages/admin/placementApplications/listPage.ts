import Page from '../../page'
import paths from '../../../../server/paths/admin'

import { PlacementRequest, PlacementRequestStatus } from '../../../../server/@types/shared'
import { tableRowsToArrays } from '../../../helpers'
import { dashboardTableRows } from '../../../../server/utils/placementRequests/table'

export default class ListPage extends Page {
  constructor() {
    super('Record and update placement details')
  }

  static visit(): ListPage {
    cy.visit(paths.admin.placementRequests.index({}))
    return new ListPage()
  }

  shouldShowPlacementRequests(placementRequests: Array<PlacementRequest>, status?: PlacementRequestStatus): void {
    const tableRows = dashboardTableRows(placementRequests, status)
    const rowItems = tableRowsToArrays(tableRows)

    rowItems.forEach(columns => {
      const headerCell = columns.shift()
      cy.contains('th', headerCell)
        .parent('tr')
        .within(() => {
          columns.forEach((e, i) => {
            cy.get('td').eq(i).invoke('text').should('contain', e)
          })
        })
    })
  }

  clickPlacementRequest(placementRequest: PlacementRequest): void {
    cy.get(`[data-cy-placementRequestId="${placementRequest.id}"]`).click()
  }

  clickReadyToMatch(): void {
    cy.get('a.moj-sub-navigation__link').contains('Ready to match').click()
  }

  clickMatched(): void {
    cy.get('a.moj-sub-navigation__link').contains('Matched').click()
  }

  clickUnableToMatch(): void {
    cy.get('a.moj-sub-navigation__link').contains('Unable to match').click()
  }
}
