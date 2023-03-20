/* istanbul ignore file */

import { ApprovedPremisesApplication as Application, Task } from '../../@types/shared'
import { SummaryListItem } from '../../@types/ui'
import { arrivalDateFromApplication } from '../applications/arrivalDateFromApplication'
import { getApplicationType } from '../applications/utils'
import { DateFormats } from '../dateUtils'
import { allocatedTableRows, unallocatedTableRows } from './table'

type GroupedTasks = {
  allocated: Array<Task>
  unallocated: Array<Task>
}

const groupByAllocation = (tasks: Array<Task>) => {
  const result: GroupedTasks = { allocated: [], unallocated: [] }

  tasks.forEach(task => {
    if (task.allocatedToStaffMember) {
      result.allocated.push(task)
    } else {
      result.unallocated.push(task)
    }
  })

  return result
}

const applicationSummary = (application: Application): Array<SummaryListItem> => {
  const summary = [
    {
      key: {
        text: 'CRN',
      },
      value: {
        text: application.person.crn,
      },
    },
    {
      key: {
        text: 'Arrival date',
      },
      value: {
        text: DateFormats.isoDateToUIDate(arrivalDateFromApplication(application)),
      },
    },
    {
      key: {
        text: 'Application Type',
      },
      value: {
        text: getApplicationType(application),
      },
    },
  ]

  return summary
}

export { applicationSummary, allocatedTableRows, groupByAllocation, unallocatedTableRows }