/* istanbul ignore file */

import type { Router } from 'express'

import type { Controllers } from '../controllers'
import type { Services } from '../services'

import Assess from '../form-pages/assess'
import paths from '../paths/assess'

import actions from './utils'
import { getPage } from '../utils/assessments/utils'

export default function routes(controllers: Controllers, router: Router, services: Partial<Services>): Router {
  const { pages } = Assess
  const { get, put, post } = actions(router, services.auditService)
  const {
    assessmentsController,
    assessmentPagesController,
    clarificationNotesController,
    supportingInformationController,
  } = controllers

  get(paths.assessments.index.pattern, assessmentsController.index(), { auditEvent: 'LIST_ASSESSMENTS' })
  get(paths.assessments.show.pattern, assessmentsController.show(), { auditEvent: 'SHOW_ASSESSMENT' })

  get(paths.assessments.clarificationNotes.confirm.pattern, clarificationNotesController.confirm(), {
    auditEvent: 'CONFIRM_ASSESSMENT_CLARIFICATION_NOTE',
  })

  get(paths.assessments.supportingInformationPath.pattern, supportingInformationController.show(), {
    auditEvent: 'SHOW_SUPPORTING_INFORMATION',
  })

  post(paths.assessments.submission.pattern, assessmentsController.submit(), { auditEvent: 'SUBMIT_ASSESSMENT' })

  Object.keys(pages).forEach((taskKey: string) => {
    Object.keys(pages[taskKey]).forEach((pageKey: string) => {
      const { pattern } = paths.assessments.show.path(`tasks/${taskKey}/pages/${pageKey}`)

      const page = getPage(taskKey, pageKey)
      const updateAction = Reflect.getMetadata('page:controllerActions:update', page)

      get(pattern, assessmentPagesController.show(taskKey, pageKey), {
        auditEvent: 'VIEW_ASSESSMENT',
        additionalMetadata: { task: taskKey, page: pageKey },
      })

      let controllerAction

      if (updateAction) {
        if (assessmentPagesController[updateAction]) {
          controllerAction = assessmentPagesController[updateAction](taskKey, pageKey)
        } else {
          throw new Error(`No controller action found for AssessmentPagesController#${updateAction}`)
        }
      } else {
        controllerAction = assessmentPagesController.update(taskKey, pageKey)
      }

      put(pattern, controllerAction, {
        auditEvent: `UPDATE_ASSESSMENT_SUCCESS`,
        additionalMetadata: { task: taskKey, page: pageKey },
        redirectAuditEventSpecs: [
          {
            // If we redirect to the same page, the user has hit an error
            path: pattern,
            auditEvent: 'UPDATE_ASSESSMENT_FAILURE',
          },
        ],
      })
    })
  })

  return router
}
