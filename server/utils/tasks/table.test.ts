import { taskFactory } from '../../testutils/factories'
import {
  allocatedTableRows,
  allocationCell,
  allocationLinkCell,
  daysUntilDueCell,
  formatDaysUntilDueWithWarning,
  statusBadge,
  statusCell,
  taskTypeCell,
  unallocatedTableRows,
} from './table'
import { sentenceCase } from '../utils'
import { DateFormats } from '../dateUtils'

jest.mock('../dateUtils')

describe('table', () => {
  describe('allocatedTableRows', () => {
    describe('when all the optional task properties are populated', () => {
      it('returns an array of table rows', () => {
        const task = taskFactory.build()

        expect(allocatedTableRows([task])).toEqual([
          [
            {
              text: task.personName,
            },
            daysUntilDueCell(task),
            {
              text: task?.allocatedToStaffMember?.name,
            },
            {
              html: statusBadge(task),
            },
            {
              html: `<strong class="govuk-tag">${sentenceCase(task.taskType)}</strong>`,
            },

            allocationLinkCell(task, 'Reallocate'),
          ],
        ])
      })
    })
  })

  describe('unallocatedTableRows', () => {
    describe('when all the optional task properties are populated', () => {
      it('returns an array of table rows', () => {
        const task = taskFactory.build()

        expect(unallocatedTableRows([task])).toEqual([
          [
            {
              text: task.personName,
            },
            daysUntilDueCell(task),
            {
              html: statusBadge(task),
            },
            {
              html: `<strong class="govuk-tag">${sentenceCase(task.taskType)}</strong>`,
            },
            allocationLinkCell(task, 'Allocate'),
          ],
        ])
      })
    })
  })

  describe('daysUntilDueCell', () => {
    it('returns the days until due formatted for the UI as a TableCell object', () => {
      ;(DateFormats.differenceInBusinessDays as jest.Mock).mockReturnValue(10)
      const task = taskFactory.build()
      expect(daysUntilDueCell(task)).toEqual({
        html: formatDaysUntilDueWithWarning(task),
        attributes: {
          'data-sort-value': 10,
        },
      })
    })
  })

  describe('statusCell', () => {
    it('returns the status of the task as a TableCell object', () => {
      const task = taskFactory.build()
      expect(statusCell(task)).toEqual({
        html: statusBadge(task),
      })
    })
  })

  describe('taskTypeCell', () => {
    it('returns the task type formatted for the UI as a TableCell object', () => {
      const task = taskFactory.build()
      expect(taskTypeCell(task)).toEqual({
        html: `<strong class="govuk-tag">${sentenceCase(task.taskType)}</strong>`,
      })
    })
  })

  describe('allocationCell', () => {
    it('returns the name of the staff member the task is allocated to as a TableCell object', () => {
      const task = taskFactory.build()
      expect(allocationCell(task)).toEqual({ text: task.allocatedToStaffMember?.name })
    })
  })

  describe('statusBadge', () => {
    it('returns the "complete" status tag', () => {
      const completedTask = taskFactory.build({ status: 'complete' })
      expect(statusBadge(completedTask)).toEqual('<strong class="govuk-tag">Complete</strong>')
    })

    it('returns the "not started" status tag', () => {
      const notStartedTask = taskFactory.build({ status: 'not_started' })
      expect(statusBadge(notStartedTask)).toEqual('<strong class="govuk-tag govuk-tag--yellow">Not started</strong>')
    })

    it('returns the "in_progress" status tag', () => {
      const inProgressTask = taskFactory.build({ status: 'in_progress' })
      expect(statusBadge(inProgressTask)).toEqual('<strong class="govuk-tag govuk-tag--grey">In progress</strong>')
    })
  })

  describe('formatDaysUntilDueWithWarning', () => {
    it('returns the number of days until the task is due', () => {
      ;(DateFormats.differenceInBusinessDays as jest.Mock).mockReturnValue(10)
      const task = taskFactory.build()
      expect(formatDaysUntilDueWithWarning(task)).toEqual('10 Days')
    })

    it('returns "overdue" if the task is overdue', () => {
      ;(DateFormats.differenceInBusinessDays as jest.Mock).mockReturnValue(2)
      const task = taskFactory.build()
      expect(formatDaysUntilDueWithWarning(task)).toEqual(
        `<strong class="task--index__warning">2 Days<span class="govuk-visually-hidden"> (Approaching due date)</span></strong>`,
      )
    })
  })

  describe('allocationLinkCell', () => {
    it('returns the cell when there is a person present in the task', () => {
      const task = taskFactory.build({
        taskType: 'Assessment',
      })
      expect(allocationLinkCell(task, 'Allocate')).toEqual({
        html: `<a href="/tasks/assessment/${task.id}" data-cy-taskId="${task.id}" data-cy-applicationId="${task.applicationId}">Allocate <span class="govuk-visually-hidden">task for ${task.personName}</span></a>`,
      })
    })
  })
})
