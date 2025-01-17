import TaskClient from './taskClient'
import paths from '../paths/api'

import {
  assessmentTaskFactory,
  bookingAppealTask,
  placementApplicationTaskFactory,
  placementRequestTaskFactory,
  taskFactory,
  taskWrapperFactory,
} from '../testutils/factories'
import describeClient from '../testutils/describeClient'

describeClient('taskClient', provider => {
  let taskClient: TaskClient

  const token = 'token-1'

  beforeEach(() => {
    taskClient = new TaskClient(token)
  })

  describe('allReallocatable', () => {
    it('makes a get request to the reallocatable tasks endpoint', async () => {
      const tasks = taskFactory.buildList(2)

      provider.addInteraction({
        state: 'Server is healthy',
        uponReceiving: `A request to get a list of tasks`,
        withRequest: {
          method: 'GET',
          path: paths.tasks.reallocatable.index.pattern,
          query: { allocatedFilter: 'allocated', page: '1', sortDirection: 'asc', sortBy: 'createdAt' },
          headers: {
            authorization: `Bearer ${token}`,
            'X-Service-Name': 'approved-premises',
          },
        },
        willRespondWith: {
          status: 200,
          body: tasks,
          headers: {
            'X-Pagination-TotalPages': '10',
            'X-Pagination-TotalResults': '100',
            'X-Pagination-PageSize': '10',
          },
        },
      })

      const result = await taskClient.allReallocatable('allocated', 1, 'asc', 'createdAt')

      expect(result).toEqual({
        data: tasks,
        pageNumber: '1',
        totalPages: '10',
        totalResults: '100',
        pageSize: '10',
      })
    })
  })

  describe('allByType', () => {
    it('makes a get request to the tasks type endpoint', async () => {
      const tasks = taskFactory.buildList(2)

      provider.addInteraction({
        state: 'Server is healthy',
        uponReceiving: `A request to get a list of tasks of a type`,
        withRequest: {
          method: 'GET',
          path: paths.tasks.type.index({ taskType: 'placement-application' }),
          query: {
            page: '1',
          },
          headers: {
            authorization: `Bearer ${token}`,
            'X-Service-Name': 'approved-premises',
          },
        },
        willRespondWith: {
          status: 200,
          body: tasks,
          headers: {
            'X-Pagination-TotalPages': '10',
            'X-Pagination-TotalResults': '100',
            'X-Pagination-PageSize': '10',
          },
        },
      })

      const result = await taskClient.allByType('placement-application')

      expect(result).toEqual({
        data: tasks,
        pageNumber: '1',
        totalPages: '10',
        totalResults: '100',
        pageSize: '10',
      })
    })
  })

  describe('allForUser', () => {
    it('makes a get request to the tasks endpoint', async () => {
      const tasks = [
        placementApplicationTaskFactory.buildList(1),
        placementRequestTaskFactory.buildList(1),
        assessmentTaskFactory.buildList(1),
        bookingAppealTask.buildList(1),
      ].flat()

      provider.addInteraction({
        state: 'Server is healthy',
        uponReceiving: `A request to get a list of tasks`,
        withRequest: {
          method: 'GET',
          path: paths.tasks.index.pattern,
          headers: {
            authorization: `Bearer ${token}`,
            'X-Service-Name': 'approved-premises',
          },
        },
        willRespondWith: {
          status: 200,
          body: tasks,
        },
      })

      const result = await taskClient.allForUser()

      expect(result).toEqual(tasks)
    })
  })

  describe('find', () => {
    it('should get a task', async () => {
      const taskWrapper = taskWrapperFactory.build()

      const applicationId = 'some-application-id'
      const taskType = 'placement-request'

      provider.addInteraction({
        state: 'Server is healthy',
        uponReceiving: 'A request to get a task',
        withRequest: {
          method: 'GET',
          path: paths.tasks.show({ id: applicationId, taskType }),
          headers: {
            authorization: `Bearer ${token}`,
            'X-Service-Name': 'approved-premises',
          },
        },
        willRespondWith: {
          status: 200,
          body: taskWrapper,
        },
      })

      const result = await taskClient.find(applicationId, taskType)

      expect(result).toEqual(taskWrapper)
    })
  })

  describe('createAllocation', () => {
    it('should allocate a task', async () => {
      const task = taskFactory.build()

      const applicationId = 'some-application-id'
      const userId = 'some-user-id'

      provider.addInteraction({
        state: 'Server is healthy',
        uponReceiving: 'A request to allocate a task',
        withRequest: {
          method: 'POST',
          path: paths.tasks.allocations.create({ id: applicationId, taskType: task.taskType }),
          body: { userId },
          headers: {
            authorization: `Bearer ${token}`,
            'X-Service-Name': 'approved-premises',
          },
        },
        willRespondWith: {
          status: 201,
          body: task,
        },
      })

      const result = await taskClient.createAllocation(applicationId, userId, task.taskType)

      expect(result).toEqual(task)
    })
  })
})
