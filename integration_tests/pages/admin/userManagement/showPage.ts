import Page from '../../page'
import paths from '../../../../server/paths/admin'

import {
  ApprovedPremisesUser as User,
  UserQualification,
  ApprovedPremisesUserRole as UserRole,
} from '../../../../server/@types/shared'
import { AllocationRole, userSummaryListItems } from '../../../../server/utils/users'

export default class ShowPage extends Page {
  constructor() {
    super('Manage permissions')
  }

  static visit(userId: string): ShowPage {
    cy.visit(paths.admin.userManagement.show({ id: userId }))
    return new ShowPage()
  }

  shouldShowUserDetails(user: User): void {
    this.shouldContainSummaryListItems(userSummaryListItems(user))
  }

  uncheckUsersPreviousRoles(): void {
    cy.get('[type="checkbox"]').uncheck()
  }

  selectRoles(roles: ReadonlyArray<UserRole>): void {
    this.uncheckUsersPreviousRoles()
    roles.forEach(role => {
      this.checkCheckboxByLabel(role)
    })
  }

  selectAllocationRoles(roles: ReadonlyArray<UserRole>): void {
    roles.forEach(role => {
      this.checkCheckboxByLabel(role)
    })
  }

  selectUserQualifications(roles: ReadonlyArray<UserQualification>): void {
    roles.forEach(role => {
      this.checkCheckboxByLabel(role)
    })
  }

  completeForm({
    roles,
    allocationRoles,
    qualifications,
  }: {
    roles: ReadonlyArray<UserRole>
    allocationRoles: ReadonlyArray<AllocationRole>
    qualifications: ReadonlyArray<UserQualification>
  }): void {
    this.selectRoles(roles)
    this.selectAllocationRoles(allocationRoles)
    this.selectUserQualifications(qualifications)
  }
}
