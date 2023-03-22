import { add } from 'date-fns'
import taskFactory from '../../testutils/factories/task'
import {
  allocatedTableRows,
  allocationCell,
  allocationLinkCell,
  daysUntilDue,
  daysUntilDueCell,
  formatDaysUntilDueWithWarning,
  statusBadge,
  statusCell,
  taskTypeCell,
  unallocatedTableRows,
} from './table'
import { sentenceCase } from '../utils'
import { DateFormats } from '../dateUtils'
import { Task } from '../../@types/shared'

describe('table', () => {
  describe('allocatedTableRows', () => {
    describe('when all the optional task properties are populated', () => {
      it('returns an array of table rows', () => {
        const task = taskFactory.build()

        expect(allocatedTableRows([task])).toEqual([
          [
            {
              text: task.person.name,
            },
            {
              html: formatDaysUntilDueWithWarning(task),
              attributes: {
                'data-sort-value': daysUntilDue(task),
              },
            },
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

    describe('when all the optional task properties are not defined', () => {
      it('returns an array of table rows with empty strings for the undefined values', () => {
        const task = taskFactory.build({
          person: undefined,
          dueDate: undefined,
          allocatedToStaffMember: undefined,
          status: undefined,
          taskType: undefined,
        })

        expect(allocatedTableRows([task])).toEqual([
          [
            {
              text: '',
            },
            {
              html: '',
              attributes: {
                'data-sort-value': 0,
              },
            },
            { text: '' },
            {
              html: '',
            },
            {
              html: '',
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
              text: task.person.name,
            },
            {
              html: formatDaysUntilDueWithWarning(task),
              attributes: {
                'data-sort-value': daysUntilDue(task),
              },
            },
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
    describe('when all the optional task properties are not defined', () => {
      it('returns an array of table rows with empty strings for the undefined values', () => {
        const task = taskFactory.build({
          person: undefined,
          dueDate: undefined,
          allocatedToStaffMember: undefined,
          status: undefined,
          taskType: undefined,
        })

        expect(unallocatedTableRows([task])).toEqual([
          [
            {
              text: '',
            },
            {
              html: '',
              attributes: {
                'data-sort-value': 0,
              },
            },
            {
              html: '',
            },
            {
              html: '',
            },
            allocationLinkCell(task, 'Allocate'),
          ],
        ])
      })
    })
  })

  describe('daysUntilDueCell', () => {
    it('returns the days until due formatted for the UI as a TableCell object', () => {
      const task = taskFactory.build()
      expect(daysUntilDueCell(task)).toEqual({
        html: formatDaysUntilDueWithWarning(task),
        attributes: {
          'data-sort-value': daysUntilDue(task),
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
      expect(allocationCell(task)).toEqual({ text: task.allocatedToStaffMember.name })
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

    it('returns an empty string for an unknown status', () => {
      const unknownStatusTask = taskFactory.build({ status: undefined })
      const unknownStatusTask2 = undefined as unknown as Task
      expect(statusBadge(unknownStatusTask)).toEqual('')
      expect(statusBadge(unknownStatusTask2)).toEqual('')
    })
  })

  describe('daysUntilDue', () => {
    it('returns the number of days until the task is due', () => {
      const task = taskFactory.build({ dueDate: DateFormats.dateObjToIsoDate(add(new Date(), { days: 2 })) })
      expect(daysUntilDue(task)).toEqual(1)
    })
    it('returns 0 if the task is due', () => {
      const task = taskFactory.build({ dueDate: DateFormats.dateObjToIsoDate(new Date()) })
      expect(daysUntilDue(task)).toEqual(0)
    })
    it('returns 0 if the task has no due date', () => {
      const task = taskFactory.build({ dueDate: undefined })
      expect(daysUntilDue(task)).toEqual(0)
    })
  })

  describe('formatDaysUntilDueWithWarning', () => {
    it('returns the number of days until the task is due', () => {
      const task = taskFactory.build({ dueDate: DateFormats.dateObjToIsoDate(add(new Date(), { days: 2 })) })
      expect(formatDaysUntilDueWithWarning(task)).toEqual(
        `<strong class="task--index__warning">${
          DateFormats.differenceInDays(DateFormats.isoToDateObj(task.dueDate), new Date()).ui
        }<span class="govuk-visually-hidden"> (Approaching due date)</span></strong>`,
      )
    })

    it('returns "overdue" if the task is overdue', () => {
      const task = taskFactory.build({ dueDate: DateFormats.dateObjToIsoDate(add(new Date(), { days: -2 })) })
      expect(formatDaysUntilDueWithWarning(task)).toEqual(
        `<strong class="task--index__warning">-${
          DateFormats.differenceInDays(DateFormats.isoToDateObj(task.dueDate), new Date()).ui
        }<span class="govuk-visually-hidden"> (Approaching due date)</span></strong>`,
      )
    })

    it('returns "no due date" if the task has no due date', () => {
      const task = taskFactory.build({ dueDate: undefined })
      expect(formatDaysUntilDueWithWarning(task)).toEqual('')
    })
  })

  describe('allocationLinkCell', () => {
    it('returns the cell when there is a person present in the task', () => {
      const task = taskFactory.build()
      expect(allocationLinkCell(task, 'Allocate')).toEqual({
        html: `<a href="/applications/${task.applicationId}/allocation" data-cy-taskId="${task.applicationId}">Allocate <span class="govuk-visually-hidden">task for ${task.person.name}</span></a>`,
      })
    })

    it('returns the cell when there is not a person present in the task', () => {
      const task = taskFactory.build({ person: undefined })
      expect(allocationLinkCell(task, 'Allocate')).toEqual({
        html: `<a href="/applications/${task.applicationId}/allocation" data-cy-taskId="${task.applicationId}">Allocate</a>`,
      })
    })
  })
})
