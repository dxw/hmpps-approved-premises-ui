import type { NextFunction, Request, Response } from 'express'
import { DeepMocked, createMock } from '@golevelup/ts-jest'

import { Task } from '@approved-premises/api'
import TasksController from './tasksController'
import { applicationFactory, paginatedResponseFactory, taskFactory, taskWrapperFactory } from '../testutils/factories'
import { ApplicationService, TaskService } from '../services'
import { fetchErrorsAndUserInput } from '../utils/validation'
import { ErrorsAndUserInput, PaginatedResponse } from '../@types/ui'
import paths from '../paths/api'

import { getPaginationDetails } from '../utils/getPaginationDetails'

jest.mock('../utils/validation')
jest.mock('../utils/getPaginationDetails')
describe('TasksController', () => {
  const token = 'SOME_TOKEN'

  const request: DeepMocked<Request> = createMock<Request>({ user: { token } })
  const response: DeepMocked<Response> = createMock<Response>({})
  const next: DeepMocked<NextFunction> = createMock<NextFunction>({})

  const applicationService = createMock<ApplicationService>({})
  const taskService = createMock<TaskService>({})

  let tasksController: TasksController

  beforeEach(() => {
    jest.resetAllMocks()
    tasksController = new TasksController(taskService, applicationService)
  })

  describe('index', () => {
    it('should render the tasks template', async () => {
      const tasks = taskFactory.buildList(1)
      const paginatedResponse = paginatedResponseFactory.build({
        data: tasks,
      }) as PaginatedResponse<Task>

      const paginationDetails = {
        hrefPrefix: paths.tasks.index({}),
        pageNumber: 1,
        sortBy: 'name',
        sortDirection: 'desc',
      }
      ;(getPaginationDetails as jest.Mock).mockReturnValue(paginationDetails)
      taskService.getAllReallocatable.mockResolvedValue(paginatedResponse)

      const requestHandler = tasksController.index()

      await requestHandler(request, response, next)

      expect(response.render).toHaveBeenCalledWith('tasks/index', {
        pageHeading: 'Tasks',
        tasks,
        allocatedFilter: 'allocated',
        pageNumber: Number(paginatedResponse.pageNumber),
        totalPages: Number(paginatedResponse.totalPages),
        hrefPrefix: paginationDetails.hrefPrefix,
        sortDirection: paginationDetails.sortDirection,
      })
      expect(taskService.getAllReallocatable).toHaveBeenCalledWith(token, 'allocated', 1, 'desc')
    })

    it('should handle request parameter correctly', async () => {
      const tasks = taskFactory.buildList(1)
      const paginatedResponse = paginatedResponseFactory.build({
        data: tasks,
      }) as PaginatedResponse<Task>

      const paginationDetails = {
        hrefPrefix: paths.tasks.index({}),
        pageNumber: 1,
        sortBy: 'name',
        sortDirection: 'desc',
      }

      ;(getPaginationDetails as jest.Mock).mockReturnValue(paginationDetails)
      taskService.getAllReallocatable.mockResolvedValue(paginatedResponse)

      const requestHandler = tasksController.index()

      const unallocatedRequest = { ...request, query: { allocatedFilter: 'unallocated' } }
      await requestHandler(unallocatedRequest, response, next)

      expect(response.render).toHaveBeenCalledWith('tasks/index', {
        pageHeading: 'Tasks',
        tasks,
        allocatedFilter: 'unallocated',
        pageNumber: Number(paginatedResponse.pageNumber),
        totalPages: Number(paginatedResponse.totalPages),
        hrefPrefix: paginationDetails.hrefPrefix,
        sortDirection: paginationDetails.sortDirection,
      })
      expect(taskService.getAllReallocatable).toHaveBeenCalledWith(token, 'unallocated', 1, 'desc')
    })
  })

  describe('show', () => {
    const task = taskFactory.build({ taskType: 'PlacementRequest' })
    const taskWrapper = taskWrapperFactory.build({ task })
    const application = applicationFactory.build()

    beforeEach(() => {
      taskService.find.mockResolvedValue(taskWrapper)
      applicationService.findApplication.mockResolvedValue(application)
    })

    it('fetches the application and a list of qualified users', async () => {
      ;(fetchErrorsAndUserInput as jest.Mock).mockReturnValue({ errors: {}, errorSummary: [], userInput: {} })

      const requestHandler = tasksController.show()
      request.params.taskType = 'placement-request'

      await requestHandler(request, response, next)

      expect(response.render).toHaveBeenCalledWith('tasks/show', {
        pageHeading: `Reallocate Placement Request`,
        application,
        task: taskWrapper.task,
        users: taskWrapper.users,
        errors: {},
        errorSummary: [],
      })

      expect(taskService.find).toHaveBeenCalledWith(request.user.token, request.params.id, request.params.taskType)
      expect(applicationService.findApplication).toHaveBeenCalledWith(request.user.token, task.applicationId)
    })

    it('renders the form with errors and user input if an error has been sent to the flash', async () => {
      const errorsAndUserInput = createMock<ErrorsAndUserInput>()
      ;(fetchErrorsAndUserInput as jest.Mock).mockReturnValue(errorsAndUserInput)

      const requestHandler = tasksController.show()
      await requestHandler(request, response, next)

      expect(response.render).toHaveBeenCalledWith('tasks/show', {
        pageHeading: `Reallocate Placement Request`,
        application,
        task: taskWrapper.task,
        users: taskWrapper.users,
        errors: errorsAndUserInput.errors,
        errorSummary: errorsAndUserInput.errorSummary,
        ...errorsAndUserInput.userInput,
      })
    })
  })
})
