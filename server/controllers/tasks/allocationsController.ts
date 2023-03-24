import type { Request, Response, TypedRequestHandler } from 'express'
import { convertToTitleCase, sentenceCase } from '../../utils/utils'
import paths from '../../paths/tasks'
import { TaskService } from '../../services'
import { catchValidationErrorOrPropogate } from '../../utils/validation'

export default class AllocationsController {
  constructor(private readonly taskService: TaskService) {}

  create(): TypedRequestHandler<Request, Response> {
    return async (req: Request, res: Response) => {
      try {
        const reallocation = await this.taskService.createAllocation(
          req.user.token,
          req.params.id,
          req.body.userId,
          req.params.taskType,
        )

        req.flash(
          'success',
          `${convertToTitleCase(sentenceCase(reallocation.taskType))} has been allocated to ${reallocation.user.name}`,
        )
        res.redirect(paths.index({}))
      } catch (err) {
        catchValidationErrorOrPropogate(req, res, err, paths.show({ id: req.params.id, taskType: req.params.taskType }))
      }
    }
  }
}