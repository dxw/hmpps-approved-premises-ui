import Page from '../page'

export default class TaskListPage extends Page {
  constructor() {
    super('Assess an Approved Premises (AP) application')
  }

  shouldShowTaskStatus = (task: string, status: string): void => {
    cy.get(`#${task}-status`).should('contain', status)
  }
}
