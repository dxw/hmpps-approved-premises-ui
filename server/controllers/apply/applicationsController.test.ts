import type { NextFunction, Request, Response } from 'express'
import { DeepMocked, createMock } from '@golevelup/ts-jest'

import type {
  ApplicationDashboardSearchOptions,
  ErrorsAndUserInput,
  GroupedApplications,
  PaginatedResponse,
} from '@approved-premises/ui'
import { subDays } from 'date-fns'
import TasklistService from '../../services/tasklistService'
import ApplicationsController from './applicationsController'
import { ApplicationService, PersonService } from '../../services'
import { addErrorMessageToFlash, fetchErrorsAndUserInput } from '../../utils/validation'
import {
  activeOffenceFactory,
  applicationFactory,
  paginatedResponseFactory,
  personFactory,
  restrictedPersonFactory,
  timelineEventFactory,
} from '../../testutils/factories'

import paths from '../../paths/apply'
import { DateFormats } from '../../utils/dateUtils'
import { applicationShowPageTabs, firstPageOfApplicationJourney } from '../../utils/applications/utils'
import { getResponses } from '../../utils/applications/getResponses'
import { ApprovedPremisesApplicationSummary } from '../../@types/shared'
import { getPaginationDetails } from '../../utils/getPaginationDetails'
import { getSearchOptions } from '../../utils/getSearchOptions'
import placementApplication from '../../testutils/factories/placementApplication'

jest.mock('../../utils/validation')
jest.mock('../../utils/applications/utils')
jest.mock('../../utils/applications/getResponses')
jest.mock('../../services/tasklistService')
jest.mock('../../utils/getPaginationDetails')
jest.mock('../../utils/getSearchOptions')

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

  describe('dashboard', () => {
    it('calls the dashboard service with the page number and renders the results', async () => {
      const searchOptions = createMock<ApplicationDashboardSearchOptions>()
      const paginatedResponse = paginatedResponseFactory.build({
        data: applicationFactory.buildList(2),
      }) as PaginatedResponse<ApprovedPremisesApplicationSummary>

      const paginationDetails = {
        hrefPrefix: paths.applications.dashboard({}),
        pageNumber: 1,
        sortBy: 'arrivalDate',
        sortDirection: 'desc',
      }

      applicationService.dashboard.mockResolvedValue(paginatedResponse)
      ;(getSearchOptions as jest.Mock).mockReturnValue(searchOptions)
      ;(getPaginationDetails as jest.Mock).mockReturnValue(paginationDetails)

      const requestHandler = applicationsController.dashboard()

      await requestHandler(request, response, next)

      expect(response.render).toHaveBeenCalledWith('applications/dashboard', {
        pageHeading: 'Approved Premises applications',
        applications: paginatedResponse.data,
        pageNumber: Number(paginationDetails.pageNumber),
        totalPages: Number(paginatedResponse.totalPages),
        hrefPrefix: paginationDetails.hrefPrefix,
        sortBy: paginationDetails.sortBy,
        sortDirection: paginationDetails.sortDirection,
        ...searchOptions,
      })

      expect(applicationService.dashboard).toHaveBeenCalledWith(
        token,
        paginationDetails.pageNumber,
        paginationDetails.sortBy,
        paginationDetails.sortDirection,
        searchOptions,
      )
      expect(getSearchOptions).toHaveBeenCalledWith(request, ['crnOrName', 'status'])
      expect(getPaginationDetails).toHaveBeenCalledWith(request, paths.applications.dashboard({}), searchOptions)
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

    it('fetches the application from the API and renders the task list if the application is started', async () => {
      application.status = 'started'

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

    describe('when the tab=timeline query param is present', () => {
      it('calls the timeline method on the application service and passes the tab: "timeline" property', async () => {
        const timelineEvents = timelineEventFactory.buildList(1)
        application.status = 'submitted'

        const requestHandler = applicationsController.show()

        applicationService.findApplication.mockResolvedValue(application)
        applicationService.timeline.mockResolvedValue(timelineEvents)

        await requestHandler({ ...request, query: { tab: applicationShowPageTabs.timeline } }, response, next)

        expect(response.render).toHaveBeenCalledWith('applications/show', {
          application,
          referrer,
          tab: applicationShowPageTabs.timeline,
          timelineEvents,
          pageHeading: 'Approved Premises application',
        })

        expect(applicationService.findApplication).toHaveBeenCalledWith(token, application.id)
        expect(applicationService.timeline).toHaveBeenCalledWith(token, application.id)
      })
    })

    describe('when the tab=placementRequests query param is present', () => {
      it('calls the getPlacementApplications method on the application service and passes the tab: "placementRequests" property', async () => {
        const placementApplications = placementApplication.buildList(1)
        application.status = 'submitted'

        const requestHandler = applicationsController.show()

        applicationService.findApplication.mockResolvedValue(application)
        applicationService.getPlacementApplications.mockResolvedValue(placementApplications)

        await requestHandler({ ...request, query: { tab: applicationShowPageTabs.placementRequests } }, response, next)

        expect(response.render).toHaveBeenCalledWith('applications/show', {
          application,
          referrer,
          tab: applicationShowPageTabs.placementRequests,
          placementApplications,
          pageHeading: 'Approved Premises application',
        })

        expect(applicationService.findApplication).toHaveBeenCalledWith(token, application.id)
        expect(applicationService.getPlacementApplications).toHaveBeenCalledWith(token, application.id)
      })

      it('sorts the placement applications in descending date order', async () => {
        const newestPlacementApp = placementApplication.build({
          submittedAt: DateFormats.dateObjToIsoDate(subDays(new Date(), 1)),
        })
        const middlePlacementApp = placementApplication.build({
          submittedAt: DateFormats.dateObjToIsoDate(subDays(new Date(), 2)),
        })
        const oldestPlacementApp = placementApplication.build({
          submittedAt: DateFormats.dateObjToIsoDate(subDays(new Date(), 3)),
        })
        const unsortedPlacementApplications = [middlePlacementApp, oldestPlacementApp, newestPlacementApp]
        const sortedPlacementApplications = [newestPlacementApp, middlePlacementApp, oldestPlacementApp]

        application.status = 'submitted'

        const requestHandler = applicationsController.show()

        applicationService.findApplication.mockResolvedValue(application)
        applicationService.getPlacementApplications.mockResolvedValue(unsortedPlacementApplications)

        await requestHandler({ ...request, query: { tab: 'placementRequests' } }, response, next)

        expect(response.render).toHaveBeenCalledWith('applications/show', {
          application,
          referrer,
          tab: 'placementRequests',
          pageHeading: 'Approved Premises application',
          placementApplications: sortedPlacementApplications,
        })
      })
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
        tab: 'application',
        pageHeading: 'Approved Premises application',
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
        application.status = 'started'

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

      it('renders the form with an error if the CRN is for a restricted person', async () => {
        const restrictedPerson = restrictedPersonFactory.build()
        personService.findByCrn.mockResolvedValue(restrictedPerson)
        const errorsAndUserInput = createMock<ErrorsAndUserInput>()
        ;(fetchErrorsAndUserInput as jest.Mock).mockReturnValue(errorsAndUserInput)

        const requestHandler = applicationsController.new()

        await requestHandler(request, response, next)

        expect(response.render).toHaveBeenCalledWith('applications/new', {
          pageHeading: `Enter the person's CRN`,
          errors: errorsAndUserInput.errors,
          errorSummary: errorsAndUserInput.errorSummary,
          ...errorsAndUserInput.userInput,
        })
        expect(request.flash).toHaveBeenCalledWith('crn')
      })

      it('calls render with the noOffence view when the person dont have any offences', async () => {
        const offences = activeOffenceFactory.buildList(0)
        personService.getOffences.mockResolvedValue(offences)

        const requestHandler = applicationsController.new()

        await requestHandler(request, response, next)

        expect(response.render).toHaveBeenCalledWith('applications/people/noOffence', {
          pageHeading: 'There are no offences for this person',
        })
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
})
