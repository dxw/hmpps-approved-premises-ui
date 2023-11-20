import type { Request, RequestHandler, Response } from 'express'

import { ApplicationTimelineNote } from '../../../@types/shared'
import { ApplicationService, UserService } from '../../../services'
import { applicationShowPageTab } from '../../../utils/applications/utils'

export const tasklistPageHeading = 'Apply for an Approved Premises (AP) placement'

type NewApplicationTimelineNote = Omit<ApplicationTimelineNote, 'id' | 'createdAt'>

export default class NotesController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly userService: UserService,
  ) {}

  new(): RequestHandler {
    return async (req: Request, res: Response) => {
      return res.render('applications/notes/new', {
        pageHeading: 'Do you want to add this note?',
        applicationId: req.params.id,
        note: req.body.note,
      })
    }
  }

  create(): RequestHandler {
    return async (req: Request, res: Response) => {
      const noteContent = req.body.note as string
      const user = await this.userService.getActingUser(req.user.token)
      const applicationId = req.params.id
      const note: NewApplicationTimelineNote = {
        note: noteContent,
        createdByUserId: user.id,
      }

      await this.applicationService.addNote(req.user.token, applicationId, note)

      req.flash('success', 'Note added')
      return res.redirect(applicationShowPageTab(applicationId, 'timeline'))
    }
  }
}
