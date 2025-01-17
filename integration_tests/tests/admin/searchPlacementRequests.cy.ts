import SearchPage from '../../pages/admin/placementApplications/searchPage'

import { placementRequestFactory } from '../../../server/testutils/factories'
import { PlacementRequestDashboardSearchOptions } from '../../../server/@types/ui'
import { normaliseCrn } from '../../../server/utils/normaliseCrn'

context('Search placement Requests', () => {
  const placementRequests = placementRequestFactory.buildList(3)
  const searchResults = placementRequestFactory.buildList(2)

  const searchQuery = {
    crnOrName: 'CRN123',
    tier: 'D2',
    arrivalDateStart: '2022-01-01',
    arrivalDateEnd: '2022-01-03',
  } as PlacementRequestDashboardSearchOptions

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')

    // Given I am logged in
    cy.signIn()

    cy.task('stubPlacementRequestsSearch', { placementRequests })
    cy.task('stubPlacementRequestsSearch', {
      placementRequests: searchResults,
      ...searchQuery,
      crnOrName: normaliseCrn(searchQuery.crnOrName),
    })
  })

  it('allows me to search for placement requests', () => {
    // When I visit the search page
    const searchPage = SearchPage.visit()

    // Then I should see a list of placement requests
    searchPage.shouldShowPlacementRequests(placementRequests, undefined)

    // When I search for a CRN
    searchPage.enterSearchQuery(searchQuery)

    // Then I should see the search results
    searchPage.shouldShowPlacementRequests(searchResults, undefined)

    // And the API should have received a request for the CRN
    cy.task('verifyPlacementRequestsSearch', searchQuery).then(requests => {
      expect(requests).to.have.length(1)
    })
  })

  it('supports pagination', () => {
    cy.task('stubPlacementRequestsSearch', {
      placementRequests,
      ...searchQuery,
      page: '2',
    })
    cy.task('stubPlacementRequestsSearch', {
      placementRequests,
      ...searchQuery,
      page: '9',
    })

    // When I visit the search page
    const searchPage = SearchPage.visit()

    // Then I should see a list of placement requests
    searchPage.shouldShowPlacementRequests(placementRequests, undefined)

    // And I search for a CRN
    searchPage.enterSearchQuery(searchQuery)

    // When I click next
    searchPage.clickNext()

    // Then the API should have received a request for the next page
    cy.task('verifyPlacementRequestsSearch', { page: '2', ...searchQuery }).then(requests => {
      expect(requests).to.have.length(1)
    })

    // When I click on a page number
    searchPage.clickPageNumber('9')

    // Then the API should have received a request for the that page number
    cy.task('verifyPlacementRequestsSearch', { page: '9', ...searchQuery }).then(requests => {
      expect(requests).to.have.length(1)
    })
  })

  it('supports sorting', () => {
    cy.task('stubPlacementRequestsSearch', {
      placementRequests,
      crn: 'CRN123',
      sortBy: 'expected_arrival',
      sortDirection: 'asc',
    })
    cy.task('stubPlacementRequestsSearch', {
      placementRequests,
      crn: 'CRN123',
      sortBy: 'expected_arrival',
      sortDirection: 'desc',
    })

    // When I visit the search page
    const searchPage = SearchPage.visit()

    // Then I should see a list of placement requests
    searchPage.shouldShowPlacementRequests(placementRequests, undefined)

    // And I search for a CRN
    searchPage.enterSearchQuery(searchQuery)

    // When I sort by expected arrival in ascending order
    searchPage.clickSortBy('expected_arrival')

    // Then the dashboard should be sorted by expected arrival
    searchPage.shouldBeSortedByField('expected_arrival', 'ascending')

    // And the API should have received a request for the correct sort order
    cy.task('verifyPlacementRequestsSearch', {
      ...searchQuery,
      sortBy: 'expected_arrival',
      sortDirection: 'asc',
    }).then(requests => {
      expect(requests).to.have.length(1)
    })

    // When I sort by expected arrival in descending order
    searchPage.clickSortBy('expected_arrival')

    // Then the dashboard should be sorted by expected arrival in descending order
    searchPage.shouldBeSortedByField('expected_arrival', 'descending')

    // And the API should have received a request for the correct sort order
    cy.task('verifyPlacementRequestsSearch', {
      ...searchQuery,
      sortBy: 'expected_arrival',
      sortDirection: 'desc',
    }).then(requests => {
      expect(requests).to.have.length(1)
    })
  })
})
