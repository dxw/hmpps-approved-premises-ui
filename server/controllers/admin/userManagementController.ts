import type { Request, Response, TypedRequestHandler } from 'express'

import { qualifications, roles } from '../../utils/users'
import { UserService } from '../../services'
import { flattenCheckboxInput } from '../../utils/formUtils'
import paths from '../../paths/admin'

export default class UserController {
  constructor(private readonly userService: UserService) {}

  index(): TypedRequestHandler<Request, Response> {
    return async (req: Request, res: Response) => {
      const users = await this.userService.getUsers(req.user.token)

      res.render('admin/users/index', { pageHeading: 'User management dashboard', users })
    }
  }

  edit(): TypedRequestHandler<Request, Response> {
    return async (req: Request, res: Response) => {
      const user = await this.userService.getUserById(req.user.token, req.params.id)

      res.render('admin/users/show', { pageHeading: 'Manage permissions', user, roles, qualifications })
    }
  }

  update(): TypedRequestHandler<Request, Response> {
    return async (req: Request, res: Response) => {
      const user = await this.userService.getUserById(req.user.token, req.params.id)

      await this.userService.updateUser(req.user.token, {
        ...user,
        roles: [...flattenCheckboxInput(req.body.roles), ...flattenCheckboxInput(req.body.allocationPreferences)],
        qualifications: flattenCheckboxInput(req.body.qualifications),
      })

      req.flash('success', 'User updated')
      res.redirect(paths.admin.userManagement.show({ id: user.id }))
    }
  }

  search(): TypedRequestHandler<Request, Response> {
    return async (req: Request, res: Response) => {
      const users = await this.userService.search(req.user.token, req.body.name as string)

      res.render('admin/users/index', { pageHeading: 'User management dashboard', users, name: req.body.name })
    }
  }
}