import type { NextFunction, Request, Response } from 'express'
import { DeepMocked, createMock } from '@golevelup/ts-jest'

import type { ErrorsAndUserInput, GroupedApplications } from '@approved-premises/ui'
import TasklistService from '../../services/tasklistService'
import ApplicationsController from './applicationsController'
import { ApplicationService, PersonService } from '../../services'
import { addErrorMessageToFlash, fetchErrorsAndUserInput } from '../../utils/validation'
import { activeOffenceFactory, applicationFactory, personFactory } from '../../testutils/factories'

import paths from '../../paths/apply'
import { DateFormats } from '../../utils/dateUtils'
import { firstPageOfApplicationJourney } from '../../utils/applications/utils'
import { getResponses } from '../../utils/applications/getResponses'

jest.mock('../../utils/validation')
jest.mock('../../utils/applications/utils')
jest.mock('../../utils/applications/getResponses')
jest.mock('../../services/tasklistService')

describe('applicationsController', () => {
  const token = 'SOME_TOKEN'

  let request: DeepMocked<Request> = createMock<Request>({ user: { token } })
  let response: DeepMocked<Response> = createMock<Response>({})
  const next: DeepMocked<NextFunction> = jest.fn()

  const applicationService = createMock<ApplicationService>({})
  const personService = createMock<PersonService>({})

  let applicationsController: ApplicationsController

  beforeEach(() => {
    applicationsController = new ApplicationsController(applicationService, personService)
    request = createMock<Request>({ user: { token } })
    response = createMock<Response>({})
    jest.clearAllMocks()
  })

  describe('index', () => {
    it('renders the index view', async () => {
      const applications: GroupedApplications = { inProgress: [], requestedFurtherInformation: [], submitted: [] }

      applicationService.getAllForLoggedInUser.mockResolvedValue(applications)

      const requestHandler = applicationsController.index()

      await requestHandler(request, response, next)

      expect(response.render).toHaveBeenCalledWith('applications/index', {
        pageHeading: 'Approved Premises applications',
        applications,
      })
      expect(applicationService.getAllForLoggedInUser).toHaveBeenCalled()
    })
  })

  describe('start', () => {
    it('renders the start page', () => {
      const requestHandler = applicationsController.start()

      requestHandler(request, response, next)

      expect(response.render).toHaveBeenCalledWith('applications/start', {
        pageHeading: 'Apply for an Approved Premises (AP) placement',
      })
    })
  })

  describe('show', () => {
    beforeEach(() => {
      ;(fetchErrorsAndUserInput as jest.Mock).mockImplementation(() => {
        return { errors: {}, errorSummary: [] }
      })
    })

    const application = applicationFactory.build({ person: { crn: 'some-crn' } })
    const referrer = 'http://localhost/foo/bar'

    beforeEach(() => {
      request = createMock<Request>({
        params: { id: application.id },
        user: {
          token,
        },
        headers: {
          referer: referrer,
        },
      })
    })

    it('fetches the application from the API and renders the task list if the application is in progress', async () => {
      application.status = 'inProgress'

      const requestHandler = applicationsController.show()
      const stubTaskList = jest.fn()

      applicationService.findApplication.mockResolvedValue(application)
      ;(TasklistService as jest.Mock).mockImplementation(() => {
        return stubTaskList
      })

      await requestHandler(request, response, next)

      expect(response.render).toHaveBeenCalledWith('applications/tasklist', {
        application,
        taskList: stubTaskList,
        errors: {},
        errorSummary: [],
      })

      expect(applicationService.findApplication).toHaveBeenCalledWith(token, application.id)
    })

    it('fetches the application from the API and renders the read only view if the application is submitted', async () => {
      application.status = 'submitted'

      const requestHandler = applicationsController.show()
      const stubTaskList = jest.fn()

      ;(TasklistService as jest.Mock).mockImplementation(() => {
        return stubTaskList
      })

      await requestHandler(request, response, next)

      expect(response.render).toHaveBeenCalledWith('applications/show', {
        application,
        referrer,
      })

      expect(applicationService.findApplication).toHaveBeenCalledWith(token, application.id)
    })

    describe('when there is an error in the flash', () => {
      const errorsAndUserInput = createMock<ErrorsAndUserInput>()

      beforeEach(() => {
        ;(fetchErrorsAndUserInput as jest.Mock).mockImplementation(() => {
          return errorsAndUserInput
        })
      })

      it('sends the errors to the template', async () => {
        application.status = 'inProgress'

        const requestHandler = applicationsController.show()
        const stubTaskList = jest.fn()

        applicationService.findApplication.mockResolvedValue(application)
        ;(TasklistService as jest.Mock).mockImplementation(() => {
          return stubTaskList
        })

        await requestHandler(request, response, next)

        expect(response.render).toHaveBeenCalledWith('applications/tasklist', {
          application,
          taskList: stubTaskList,
          errors: errorsAndUserInput.errors,
          errorSummary: errorsAndUserInput.errorSummary,
        })

        expect(applicationService.findApplication).toHaveBeenCalledWith(token, application.id)
      })
    })
  })

  describe('new', () => {
    describe('If there is a CRN in the flash', () => {
      const person = personFactory.build()
      const offence = activeOffenceFactory.build()

      beforeEach(() => {
        request = createMock<Request>({
          user: { token },
          flash: jest.fn().mockReturnValue([person.crn]),
        })
        personService.findByCrn.mockResolvedValue(person)
        personService.getOffences.mockResolvedValue([offence])
      })

      describe('if an error has not been sent to the flash', () => {
        beforeEach(() => {
          ;(fetchErrorsAndUserInput as jest.Mock).mockImplementation(() => {
            return { errors: {}, errorSummary: [], userInput: {} }
          })
        })

        it('it should render the start of the application form', async () => {
          const requestHandler = applicationsController.new()

          await requestHandler(request, response, next)

          expect(response.render).toHaveBeenCalledWith('applications/people/confirm', {
            pageHeading: `Confirm ${person.name}'s details`,
            person,
            date: DateFormats.dateObjtoUIDate(new Date()),
            dateOfBirth: DateFormats.isoDateToUIDate(person.dateOfBirth, { format: 'short' }),
            offenceId: offence.offenceId,
            errors: {},
            errorSummary: [],
          })
          expect(personService.findByCrn).toHaveBeenCalledWith(token, person.crn)
          expect(request.flash).toHaveBeenCalledWith('crn')
        })

        it('should not send an offence ID to the view if there are more than one offences returned', async () => {
          const offences = activeOffenceFactory.buildList(2)
          personService.getOffences.mockResolvedValue(offences)

          const requestHandler = applicationsController.new()
          await requestHandler(request, response, next)

          expect(response.render).toHaveBeenCalledWith('applications/people/confirm', {
            pageHeading: `Confirm ${person.name}'s details`,
            person,
            date: DateFormats.dateObjtoUIDate(new Date()),
            dateOfBirth: DateFormats.isoDateToUIDate(person.dateOfBirth, { format: 'short' }),
            offenceId: null,
            errors: {},
            errorSummary: [],
          })
        })
      })

      it('renders the form with errors and user input if an error has been sent to the flash', async () => {
        personService.findByCrn.mockResolvedValue(person)
        const errorsAndUserInput = createMock<ErrorsAndUserInput>()
        ;(fetchErrorsAndUserInput as jest.Mock).mockReturnValue(errorsAndUserInput)

        const requestHandler = applicationsController.new()

        await requestHandler(request, response, next)

        expect(response.render).toHaveBeenCalledWith('applications/people/confirm', {
          pageHeading: `Confirm ${person.name}'s details`,
          person,
          date: DateFormats.dateObjtoUIDate(new Date()),
          dateOfBirth: DateFormats.isoDateToUIDate(person.dateOfBirth, { format: 'short' }),
          offenceId: offence.offenceId,
          errors: errorsAndUserInput.errors,
          errorSummary: errorsAndUserInput.errorSummary,
          ...errorsAndUserInput.userInput,
        })
        expect(request.flash).toHaveBeenCalledWith('crn')
      })
    })

    describe('if there isnt a CRN present in the flash', () => {
      beforeEach(() => {
        request = createMock<Request>({
          user: { token },
          flash: jest.fn().mockReturnValue([]),
        })
      })

      it('renders the CRN lookup page', async () => {
        ;(fetchErrorsAndUserInput as jest.Mock).mockImplementation(() => {
          return { errors: {}, errorSummary: [], userInput: {} }
        })

        const requestHandler = applicationsController.new()

        await requestHandler(request, response, next)

        expect(response.render).toHaveBeenCalledWith('applications/new', {
          pageHeading: "Enter the person's CRN",
          errors: {},
          errorSummary: [],
        })
      })
      it('renders the form with errors and user input if an error has been sent to the flash', async () => {
        const errorsAndUserInput = createMock<ErrorsAndUserInput>()
        ;(fetchErrorsAndUserInput as jest.Mock).mockReturnValue(errorsAndUserInput)

        const requestHandler = applicationsController.new()

        await requestHandler(request, response, next)

        expect(response.render).toHaveBeenCalledWith('applications/new', {
          pageHeading: "Enter the person's CRN",
          errors: errorsAndUserInput.errors,
          errorSummary: errorsAndUserInput.errorSummary,
          ...errorsAndUserInput.userInput,
        })
      })
    })
  })

  describe('create', () => {
    const application = applicationFactory.build()
    const offences = activeOffenceFactory.buildList(2)

    beforeEach(() => {
      request = createMock<Request>({
        user: { token },
      })
      request.body.crn = 'some-crn'
      request.body.offenceId = offences[0].offenceId

      personService.getOffences.mockResolvedValue(offences)
      applicationService.createApplication.mockResolvedValue(application)
    })

    it('creates an application and redirects to the first page of the first step', async () => {
      const firstPage = '/foo/bar'
      ;(firstPageOfApplicationJourney as jest.Mock).mockReturnValue(firstPage)

      const requestHandler = applicationsController.create()

      await requestHandler(request, response, next)

      expect(applicationService.createApplication).toHaveBeenCalledWith('SOME_TOKEN', 'some-crn', offences[0])
      expect(firstPageOfApplicationJourney).toHaveBeenCalledWith(application)
      expect(response.redirect).toHaveBeenCalledWith(firstPage)
    })

    it('redirects to the select offences step if an offence has not been provided', async () => {
      request.body.offenceId = null

      const requestHandler = applicationsController.create()

      await requestHandler(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(
        paths.applications.people.selectOffence({
          crn: request.body.crn,
        }),
      )
    })

    it('saves the application to the session', async () => {
      const requestHandler = applicationsController.create()

      await requestHandler(request, response, next)

      expect(request.session.application).toEqual(application)
    })
  })

  describe('submit', () => {
    it('calls the application service with the application id if the checkbox is ticked', async () => {
      const application = applicationFactory.build()
      application.data = { 'basic-information': { 'sentence-type': '' } }
      applicationService.findApplication.mockResolvedValue(application)

      const requestHandler = applicationsController.submit()

      request.params.id = 'some-id'
      request.body.confirmation = 'submit'

      await requestHandler(request, response, next)

      expect(applicationService.findApplication).toHaveBeenCalledWith(token, 'some-id')
      expect(getResponses).toHaveBeenCalledWith(application)
      expect(applicationService.submit).toHaveBeenCalledWith(token, application)
      expect(response.render).toHaveBeenCalledWith('applications/confirm', {
        pageHeading: 'Application confirmation',
      })
    })

    it('sets errors and redirects if the confirmation checkbox is not ticked', async () => {
      const application = applicationFactory.build()
      request.params.id = 'some-id'
      request.body.confirmation = 'some-id'
      applicationService.findApplication.mockResolvedValue(application)

      const requestHandler = applicationsController.submit()

      await requestHandler(request, response, next)

      expect(applicationService.findApplication).toHaveBeenCalledWith(token, request)
      expect(addErrorMessageToFlash).toHaveBeenCalledWith(
        request,
        'You must confirm the information provided is complete, accurate and up to date.',
        'confirmation',
      )
      expect(response.redirect).toHaveBeenCalledWith(paths.applications.show({ id: application.id }))
    })
  })

  describe('confirmWithdrawal', () => {
    it('renders the template', async () => {
      const applicationId = 'some-id'
      const errorsAndUserInput = createMock<ErrorsAndUserInput>()
      ;(fetchErrorsAndUserInput as jest.Mock).mockReturnValue(errorsAndUserInput)
      request.params.id = applicationId

      const requestHandler = applicationsController.confirmWithdrawal()

      await requestHandler(request, response, next)

      expect(response.render).toHaveBeenCalledWith('applications/withdraw', {
        pageHeading: 'Do you want to withdraw this application?',
        applicationId,
        errors: errorsAndUserInput.errors,
        errorSummary: errorsAndUserInput.errorSummary,
        ...errorsAndUserInput.userInput,
      })
    })
  })

  describe('withdraw', () => {
    it('redirects to the confirmation screen with an error if there isnt any input', async () => {
      const applicationId = 'some-id'

      request.params.id = applicationId

      const requestHandler = applicationsController.withdraw()

      await requestHandler(request, response, next)

      expect(addErrorMessageToFlash).toHaveBeenCalledWith(
        request,
        'You must confirm if you want to withdraw this application',
        'confirmWithdrawal',
      )
      expect(response.redirect).toHaveBeenCalledWith(paths.applications.withdraw.confirm({ id: applicationId }))
    })

    it('redirects to the index screen if the user responds "no" to withdrawing the application', async () => {
      const applicationId = 'some-id'

      request.params.id = applicationId
      request.body.confirmWithdrawal = 'no'

      const requestHandler = applicationsController.withdraw()

      await requestHandler(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(paths.applications.index({}))
    })

    it('calls the service method, redirects to the index screen and shows a confirmation message if the user answers yes', async () => {
      const applicationId = 'some-id'

      request.params.id = applicationId
      request.body.confirmWithdrawal = 'yes'

      const requestHandler = applicationsController.withdraw()

      await requestHandler(request, response, next)

      expect(applicationService.withdraw).toHaveBeenCalledWith(token, applicationId)
      expect(response.redirect).toHaveBeenCalledWith(paths.applications.index({}))
      expect(request.flash).toHaveBeenCalledWith('success', 'Application withdrawn')
    })
  })
})
