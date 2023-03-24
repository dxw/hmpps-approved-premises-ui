import type { Request, Response, TypedRequestHandler } from 'express'
import { convertToTitleCase, sentenceCase } from '../utils/utils'
import { ApplicationService, TaskService, UserService } from '../services'
import { getQualificationsForApplication } from '../utils/applications/getQualificationsForApplication'
import { groupByAllocation } from '../utils/tasks'
import { catchValidationErrorOrPropogate, fetchErrorsAndUserInput } from '../utils/validation'

export default class TasksController {
  constructor(
    private readonly taskService: TaskService,
    private readonly applicationService: ApplicationService,
    private readonly userService: UserService,
  ) {}

  index(): TypedRequestHandler<Request, Response> {
    return async (req: Request, res: Response) => {
      const tasks = await this.taskService.getAll(req.user.token)

      res.render('tasks/index', { pageHeading: 'Tasks', tasks: groupByAllocation(tasks) })
    }
  }

  show(): TypedRequestHandler<Request, Response> {
    return async (req: Request, res: Response) => {
      const task = await this.taskService.find(req.user.token, req.params.id, req.params.taskType)
      const application = await this.applicationService.findApplication(req.user.token, req.params.id)
      const users = await this.userService.getUsers(
        req.user.token,
        ['assessor'],
        getQualificationsForApplication(application),
      )
      const { errors, errorSummary, userInput } = fetchErrorsAndUserInput(req)

      res.render('tasks/allocations/show', {
        pageHeading: `Reallocate ${convertToTitleCase(sentenceCase(task.taskType))}`,
        application,
        task,
        users,
        errors,
        errorSummary,
        ...userInput,
      })
    }
  }

  create(): TypedRequestHandler<Request, Response> {
    return async (req: Request, res: Response) => {
      try {
        await this.applicationService.allocate(req.user.token, req.params.id, req.body.userId, 'Assessment')

        req.flash('success', `Case has been allocated`)
        res.redirect(paths.index({}))
      } catch (err) {
        catchValidationErrorOrPropogate(req, res, err, paths.allocations.show({ id: req.params.id }))
      }
    }
  }
}
