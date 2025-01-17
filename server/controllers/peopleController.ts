import type { Request, RequestHandler, Response } from 'express'

import PersonService from '../services/personService'
import { addErrorMessageToFlash } from '../utils/validation'
import { isFullPerson } from '../utils/personUtils'
import { RestrictedPersonError } from '../utils/errors'

export default class PeopleController {
  constructor(private readonly personService: PersonService) {}

  find(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, checkCaseload } = req.body

      if (crn) {
        try {
          const person = await this.personService.findByCrn(req.user.token, crn, !!checkCaseload)
          req.flash('crn', person.crn)

          if (!isFullPerson(person)) {
            throw new RestrictedPersonError(person.crn)
          }
        } catch (err) {
          if (err.type === 'RESTRICTED_PERSON') {
            addErrorMessageToFlash(req, err.message, 'crn')
          } else if ('data' in err && err.status === 404) {
            addErrorMessageToFlash(req, `No person with an CRN of '${crn}' was found`, 'crn')
          } else {
            throw err
          }
        }
      } else {
        addErrorMessageToFlash(req, 'You must enter a CRN', 'crn')
      }
      res.redirect(req.headers.referer)
    }
  }
}
