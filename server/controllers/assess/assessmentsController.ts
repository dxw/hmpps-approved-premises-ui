import type { Request, RequestHandler, Response } from 'express'

import { addErrorMessageToFlash, fetchErrorsAndUserInput } from '../../utils/validation'
import TasklistService from '../../services/tasklistService'
import { AssessmentService } from '../../services'
import informationSetAsNotReceived from '../../utils/assessments/informationSetAsNotReceived'

import paths from '../../paths/assess'
import { AssessmentSortField, AssessmentStatus } from '../../@types/shared'
import { awaitingAssessmentStatuses } from '../../utils/assessments/utils'
import { getPaginationDetails } from '../../utils/getPaginationDetails'

export const tasklistPageHeading = 'Assess an Approved Premises (AP) application'

export default class AssessmentsController {
  constructor(private readonly assessmentService: AssessmentService) {}

  index(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { activeTab } = req.query
      const { pageNumber, sortBy, sortDirection, hrefPrefix } = getPaginationDetails<AssessmentSortField>(
        req,
        paths.assessments.index({}),
        { activeTab },
      )
      const statuses =
        activeTab === 'awaiting_assessment' || !activeTab
          ? awaitingAssessmentStatuses
          : ([activeTab] as Array<AssessmentStatus>)

      const assessments = await this.assessmentService.getAll(
        req.user.token,
        statuses,
        sortBy,
        sortDirection,
        pageNumber,
      )

      res.render('assessments/index', {
        pageHeading: 'Approved Premises applications',
        activeTab,
        assessments: assessments.data,
        pageNumber: Number(assessments.pageNumber),
        totalPages: Number(assessments.totalPages),
        hrefPrefix,
        sortBy,
        sortDirection,
      })
    }
  }

  show(): RequestHandler {
    return async (req: Request, res: Response) => {
      const assessment = await this.assessmentService.findAssessment(req.user.token, req.params.id)
      const noteAwaitingResponse = assessment.status === 'awaiting_response' && !informationSetAsNotReceived(assessment)
      const { errors, errorSummary } = fetchErrorsAndUserInput(req)

      if (assessment.status === 'completed') {
        const referrer = req.headers.referer

        res.render('assessments/show', {
          assessment,
          referrer,
        })
      } else if (noteAwaitingResponse) {
        res.redirect(
          paths.assessments.pages.show({
            id: assessment.id,
            task: 'sufficient-information',
            page: 'information-received',
          }),
        )
      } else {
        const taskList = new TasklistService(assessment)

        res.render('assessments/tasklist', {
          assessment,
          pageHeading: tasklistPageHeading,
          taskList,
          errorSummary,
          errors,
        })
      }
    }
  }

  submit(): RequestHandler {
    return async (req: Request, res: Response) => {
      const assessment = await this.assessmentService.findAssessment(req.user.token, req.params.id)

      if (req.body?.confirmation !== 'confirmed') {
        addErrorMessageToFlash(
          req,
          'You must confirm the information provided is complete, accurate and up to date.',
          'confirmation',
        )

        return res.redirect(paths.assessments.show({ id: assessment.id }))
      }

      await this.assessmentService.submit(req.user.token, assessment)

      return res.render('assessments/confirm', {
        pageHeading: 'Assessment submission confirmed',
        assessment,
      })
    }
  }
}
