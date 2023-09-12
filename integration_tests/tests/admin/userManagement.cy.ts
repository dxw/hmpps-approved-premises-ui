import paths from '../../../server/paths/admin'
import { userFactory } from '../../../server/testutils/factories'
import ConfirmDeletionPage from '../../pages/admin/userManagement/confirmDeletionPage'
import ConfirmUserDetailsPage from '../../pages/admin/userManagement/confirmUserDetailsPage'
import ListPage from '../../pages/admin/userManagement/listPage'
import SearchDeliusPage from '../../pages/admin/userManagement/searchDeliusPage'
import ShowPage from '../../pages/admin/userManagement/showPage'
import Page from '../../pages/page'

context('User management', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')

    // Given I am logged in
    cy.signIn()
  })

  it('allows the user to view and update users', () => {
    // Given there are users in the DB
    const users = userFactory.buildList(10, { roles: ['assessor'] })
    const user = users[0]
    cy.task('stubFindUser', { user, id: user.id })
    cy.task('stubUsers', { users })

    // When I visit the list page
    const listPage = ListPage.visit()
    listPage.checkForBackButton('/')

    // Then I should see the users and their details
    listPage.shouldShowUsers(users)

    // Given I want to manage a user's permissions
    // When I click on a user's name
    listPage.clickUser(user.name)

    // Then I am taken to the user's permissions page
    const showPage = Page.verifyOnPage(ShowPage)

    showPage.checkForBackButton(paths.admin.userManagement.index({}))
    showPage.shouldShowUserDetails(user)

    // When I update the user's roles and qualifications
    const updatedRoles = {
      roles: ['manager', 'matcher', 'workflow_manager'] as const,
      allocationRoles: [
        'excluded_from_assess_allocation',
        'excluded_from_match_allocation',
        'excluded_from_placement_application_allocation',
      ] as const,
      qualifications: ['pipe', 'emergency', 'esap'] as const,
    }
    showPage.completeForm({
      roles: updatedRoles.roles,
      allocationRoles: updatedRoles.allocationRoles,
      qualifications: updatedRoles.qualifications,
    })
    const updatedUser = {
      ...user,
      roles: [...updatedRoles.roles, ...updatedRoles.allocationRoles],
      qualifications: [...updatedRoles.qualifications],
    }
    cy.task('stubUserUpdate', {
      user: updatedUser,
    })
    cy.task('stubFindUser', { user: updatedUser, id: user.id })
    showPage.clickSubmit()

    // Then the user is updated in the DB
    cy.task('verifyUserUpdate', user.id).then(requests => {
      expect(requests).to.have.length(1)

      const body = JSON.parse(requests[0].body)

      expect(body).to.deep.equal({
        ...updatedUser,
      })
    })

    // And I should see a message confirming the details have been updated
    showPage.shouldShowBanner('User updated')
  })

  it('allows searching for users', () => {
    const usersForResults = userFactory.buildList(10)
    const initialUsers = userFactory.buildList(10)
    cy.task('stubUsers', { users: initialUsers })

    // When I visit the list page
    const page = ListPage.visit()
    page.checkForBackButton('/')

    // Then I should see the users and their details
    page.shouldShowUsers(initialUsers)

    // When I search for a user
    const searchTerm = 'search term'
    cy.task('stubUserSearch', { results: usersForResults, searchTerm })
    page.search(searchTerm)

    // Then the page should show the results
    page.shouldShowUsers(usersForResults)
  })

  it('enables adding a user from Delius', () => {
    const users = userFactory.buildList(10)

    cy.task('stubUsers', { users })
    // Given I am on the list page
    const listPage = ListPage.visit()

    // When I click the add user button
    listPage.clickAddUser()

    // Then I am taken to the add user page
    const searchDeliusPage = Page.verifyOnPage(SearchDeliusPage)
    searchDeliusPage.checkForBackButton(paths.admin.userManagement.index({}))

    // When I search for a username that doesn't exist
    const notFoundSearchTerm = 'user not in delius'
    cy.task('stubNotFoundDeliusUserSearch', { searchTerm: notFoundSearchTerm })
    searchDeliusPage.searchForUser(notFoundSearchTerm)

    // Then I should see an error
    searchDeliusPage.shouldShowErrorMessagesForFields(['username'], {
      username: 'User not found. Enter the nDelius username as appears on nDelius',
    })

    // When I search for a user
    const newUser = userFactory.build()
    cy.task('stubDeliusUserSearch', { result: newUser, searchTerm: newUser.deliusUsername })
    searchDeliusPage.searchForUser(newUser.deliusUsername)

    // Then I should be taken to the confirm details of the new user page
    const confirmationPage = Page.verifyOnPage(ConfirmUserDetailsPage)
    confirmationPage.checkForBackButton(paths.admin.userManagement.searchDelius({}))
    confirmationPage.shouldShowUserDetails(newUser)

    // When I click 'continue'
    cy.task('stubFindUser', { user: newUser, id: newUser.id })
    confirmationPage.clickContinue()

    // Then I should be taken to the user management dashboard
    Page.verifyOnPage(ShowPage)
  })

  it('enables deleting a user', () => {
    const users = userFactory.buildList(10)
    const userToDelete = users[0]
    cy.task('stubUsers', { users })
    cy.task('stubFindUser', { user: userToDelete, id: userToDelete.id })

    // Given I am on a user's permissions page
    const permissionsPage = ShowPage.visit(userToDelete.id)

    // When I click the delete user button
    permissionsPage.clickRemoveAccess()

    // Then I should be taken to the confirmation screen
    const confirmationPage = Page.verifyOnPage(ConfirmDeletionPage)
    confirmationPage.checkForBackButton(paths.admin.userManagement.edit({ id: userToDelete.id }))

    // When I click 'Remove access'
    cy.task('stubUserDelete', { id: userToDelete.id })
    confirmationPage.clickSubmit()

    // Then I should be redirected to the user management dashboard
    const listPage = Page.verifyOnPage(ListPage)

    // And I should see a message confirming the user has been deleted
    listPage.shouldShowBanner('User deleted')
  })
})
