import {
  ApplicationType,
  GroupedAssessments,
  HtmlItem,
  PageResponse,
  SummaryListItem,
  TableRow,
  TextItem,
  UiTask,
} from '@approved-premises/ui'
import { add, differenceInDays, format } from 'date-fns'

import { ApprovedPremisesApplication, ApprovedPremisesAssessment as Assessment } from '@approved-premises/api'
import { tierBadge } from '../personUtils'
import { DateFormats } from '../dateUtils'
import { arrivalDateFromApplication } from '../applications/arrivalDateFromApplication'
import paths from '../../paths/assess'
import { TasklistPageInterface } from '../../form-pages/tasklistPage'
import Assess from '../../form-pages/assess'
import { UnknownPageError } from '../errors'
import { embeddedSummaryListItem } from '../applications/summaryListUtils'
import reviewSections from '../reviewUtils'
import Apply from '../../form-pages/apply'
import { kebabCase, linkTo } from '../utils'
import { getApplicationType as getApplicationTypeFromApplication, getResponseForPage } from '../applications/utils'
import { documentsFromApplication } from './documentUtils'
import { applicationAccepted, decisionFromAssessment } from './decisionUtils'
import { getActionsForTaskId } from './getActionsForTaskId'

const DUE_DATE_APPROACHING_DAYS_WINDOW = 3

const groupAssessmements = (assessments: Array<Assessment>): GroupedAssessments => {
  const result = { completed: [], requestedFurtherInformation: [], awaiting: [] } as GroupedAssessments

  assessments.forEach(assessment => {
    switch (assessment.status) {
      case 'completed':
        result.completed.push(assessment)
        break
      case 'pending':
        result.requestedFurtherInformation.push(assessment)
        break
      default:
        result.awaiting.push(assessment)
        break
    }
  })

  return result
}

const getApplicationType = (assessment: Assessment): ApplicationType => {
  return getApplicationTypeFromApplication(assessment.application)
}

const allocationSummary = (assessment: Assessment): Array<SummaryListItem> => {
  const summary = [
    {
      key: {
        text: 'CRN',
      },
      value: {
        text: assessment.application.person.crn,
      },
    },
    {
      key: {
        text: 'Arrival date',
      },
      value: {
        text: formattedArrivalDate(assessment),
      },
    },
    {
      key: {
        text: 'Application Type',
      },
      value: {
        text: getApplicationType(assessment),
      },
    },
  ]

  if (assessment.allocatedToStaffMember) {
    summary.push({
      key: {
        text: 'Allocated To',
      },
      value: {
        text: assessment.allocatedToStaffMember.name,
      },
    })
  }

  return summary
}

const crnCell = (assessment: Assessment) => {
  return {
    html: assessment.application.person.crn,
  }
}

const arrivalDateCell = (assessment: Assessment) => {
  return {
    text: formattedArrivalDate(assessment),
  }
}

const daysUntilDueCell = (assessment: Assessment) => {
  return {
    html: formatDaysUntilDueWithWarning(assessment),
  }
}

const statusCell = (assessment: Assessment) => {
  return {
    html: getStatus(assessment),
  }
}

const linkCell = (assessment: Assessment) => {
  return {
    html: assessmentLink(assessment),
  }
}

const tierCell = (assessment: Assessment) => {
  return {
    html: tierBadge(assessment.application.risks.tier.value.level),
  }
}

const prisonCell = (assessment: Assessment) => {
  return {
    text: assessment.application.person.prisonName,
  }
}

const daysSinceReceivedCell = (assessment: Assessment) => {
  return {
    text: formatDays(daysSinceReceived(assessment)),
  }
}

const daysSinceInfoRequestCell = (assessment: Assessment) => {
  return {
    text: formatDays(daysSinceInfoRequest(assessment)),
  }
}

const awaitingAssessmentTableRows = (assessments: Array<Assessment>): Array<TableRow> => {
  const rows = [] as Array<TableRow>

  assessments.forEach(assessment => {
    rows.push([
      linkCell(assessment),
      crnCell(assessment),
      tierCell(assessment),
      arrivalDateCell(assessment),
      prisonCell(assessment),
      daysUntilDueCell(assessment),
      statusCell(assessment),
    ])
  })

  return rows
}

const completedTableRows = (assessments: Array<Assessment>): Array<TableRow> => {
  const rows = [] as Array<TableRow>

  assessments.forEach(assessment => {
    rows.push([
      linkCell(assessment),
      crnCell(assessment),
      tierCell(assessment),
      arrivalDateCell(assessment),
      statusCell(assessment),
    ])
  })

  return rows
}

const requestedFurtherInformationTableRows = (assessments: Array<Assessment>): Array<TableRow> => {
  const rows = [] as Array<TableRow>

  const infoRequestStatusCell = {
    html: `<strong class="govuk-tag govuk-tag--yellow">Info Request</strong>`,
  }

  assessments.forEach(assessment => {
    rows.push([
      linkCell(assessment),
      crnCell(assessment),
      tierCell(assessment),
      arrivalDateCell(assessment),
      daysSinceReceivedCell(assessment),
      daysSinceInfoRequestCell(assessment),
      infoRequestStatusCell,
    ])
  })

  return rows
}

const assessmentLink = (assessment: Assessment, linkText = '', hiddenText = ''): string => {
  return linkTo(
    paths.assessments.show,
    { id: assessment.id },
    {
      text: linkText || assessment.application.person.name,
      hiddenText,
      attributes: { 'data-cy-assessmentId': assessment.id },
    },
  )
}

const formattedArrivalDate = (assessment: Assessment): string => {
  const arrivalDate = arrivalDateFromApplication(assessment.application as ApprovedPremisesApplication)
  return format(DateFormats.isoToDateObj(arrivalDate), 'd MMM yyyy')
}

const formatDays = (days: number): string => {
  if (days === undefined) {
    return 'N/A'
  }
  return `${days} Day${days > 1 ? 's' : ''}`
}

const daysUntilDue = (assessment: Assessment): number => {
  const receivedDate = DateFormats.isoToDateObj(assessment.createdAt)
  const dueDate = add(receivedDate, { days: 10 })

  return differenceInDays(dueDate, new Date())
}

const getStatus = (assessment: Assessment): string => {
  if (assessment.status === 'completed') {
    if (assessment.decision === 'accepted') return `<strong class="govuk-tag govuk-tag--green">Suitable</strong>`
    if (assessment.decision === 'rejected') return `<strong class="govuk-tag govuk-tag--red">Rejected</strong>`
  }

  if (assessment.data) {
    return `<strong class="govuk-tag govuk-tag--blue">In progress</strong>`
  }

  return `<strong class="govuk-tag govuk-tag--grey">Not started</strong>`
}

const daysSinceReceived = (assessment: Assessment): number => {
  const receivedDate = DateFormats.isoToDateObj(assessment.createdAt)

  return differenceInDays(new Date(), receivedDate)
}

const formatDaysUntilDueWithWarning = (assessment: Assessment): string => {
  const days = daysUntilDue(assessment)
  if (days < DUE_DATE_APPROACHING_DAYS_WINDOW) {
    return `<strong class="assessments--index__warning">${formatDays(
      days,
    )}<span class="govuk-visually-hidden"> (Approaching due date)</span></strong>`
  }
  return formatDays(days)
}

const daysSinceInfoRequest = (assessment: Assessment): number => {
  const lastInfoRequest = assessment.clarificationNotes[assessment.clarificationNotes.length - 1]
  if (!lastInfoRequest) {
    return undefined
  }
  const infoRequestDate = DateFormats.isoToDateObj(lastInfoRequest.createdAt)

  return differenceInDays(new Date(), infoRequestDate)
}

const assessmentsApproachingDueBadge = (assessments: Array<Assessment>): string => {
  const dueCount = assessmentsApproachingDue(assessments)

  if (dueCount === 0) {
    return ''
  }
  return `<span id="notifications" class="moj-notification-badge">${dueCount}<span class="govuk-visually-hidden"> assessments approaching due date</span></span>`
}

const assessmentsApproachingDue = (assessments: Array<Assessment>): number => {
  return assessments.filter(a => daysUntilDue(a) < DUE_DATE_APPROACHING_DAYS_WINDOW).length
}

const getPage = (taskName: string, pageName: string): TasklistPageInterface => {
  const pageList = Assess.pages[taskName]

  const Page = pageList[pageName]

  if (!Page) {
    throw new UnknownPageError(pageName)
  }

  return Page as TasklistPageInterface
}

const assessmentSections = (assessment: Assessment, showActions = true) => {
  return reviewSections(assessment, getTaskResponsesAsSummaryListItems, showActions)
}

const reviewApplicationSections = (application: ApprovedPremisesApplication, assessmentId: string) => {
  const cardActionFunction = (taskId: string) => getActionsForTaskId(taskId, assessmentId)

  return reviewSections(application, getTaskResponsesAsSummaryListItems, false, cardActionFunction)
}

const getTaskResponsesAsSummaryListItems = (
  task: UiTask,
  application: ApprovedPremisesApplication,
): Array<SummaryListItem> => {
  if (!application.data[task.id]) {
    return []
  }

  const pageNames = Object.keys(application.data[task.id])

  return pageNames.reduce((prev, pageName) => {
    const response = getResponseForPage(application, task.id, pageName)
    const summaryListItems =
      pageName === 'attach-documents'
        ? getAttatchDocumentsSummaryListItems(application)
        : getGenericSummaryListItems(response)

    return [...prev, ...summaryListItems]
  }, [])
}

const getGenericSummaryListItems = (response: PageResponse) => {
  const items: Array<SummaryListItem> = []

  Object.keys(response).forEach(key => {
    const value =
      typeof response[key] === 'string' || response[key] instanceof String
        ? ({ text: response[key] } as TextItem)
        : ({ html: embeddedSummaryListItem(response[key] as Array<Record<string, unknown>>) } as HtmlItem)

    items.push({
      key: {
        text: key,
      },
      value,
    })
  })

  return items
}

const getAttatchDocumentsSummaryListItems = (application: ApprovedPremisesApplication) => {
  const items: Array<SummaryListItem> = []

  documentsFromApplication(application).forEach(document => {
    items.push({
      key: {
        html: `<a href="/applications/people/${application.person.crn}/documents/${document.id}" data-cy-documentId="${document.id}" />${document.fileName}</a>`,
      },
      value: { text: document?.description || '' },
    })
  })

  return items
}

const getReviewNavigationItems = () => {
  const applySections = Apply.sections.slice(0, -1)
  return applySections.map(applicationSection => {
    return {
      href: `#${kebabCase(applicationSection.title)}`,
      text: applicationSection.title,
    }
  })
}

const confirmationPageMessage = (assessment: Assessment) => {
  switch (decisionFromAssessment(assessment)) {
    case 'releaseDate':
      return `<p>We've notified the Probation Practitioner that this application has been assessed as suitable.</p>
      <p>The assessment can now be used to match Robert Brown to a bed in an Approved Premises.</p>`
    case 'hold':
      return `<p>We've notified the Probation Practitioner that this application has been assessed as suitable.</p>
      <p>This case is now paused until the oral hearing outcome has been provided by the Probation Practitioner and a release date is confirmed.</p>
      <p>It will be added to the matching queue if the oral hearing is successful.</p>`
    default:
      return `<p>We've sent you a confirmation email.</p>
      <p>We've notified the Probation Practitioner that this application has been rejected as unsuitable for an Approved Premises.</p>`
  }
}

const confirmationPageResult = (assessment: Assessment) => {
  switch (applicationAccepted(assessment)) {
    case true:
      return 'You have marked this application as suitable.'
    default:
      return 'You have marked this application as unsuitable.'
  }
}

const adjudicationsFromAssessment = (assessment: Assessment) =>
  assessment.application?.data?.['prison-information']?.['case-notes']?.adjudications || []

const caseNotesFromAssessment = (assessment: Assessment) =>
  assessment.application?.data?.['prison-information']?.['case-notes']?.selectedCaseNotes || []

const acctAlertsFromAssessment = (assessment: Assessment) =>
  assessment.application?.data?.['prison-information']?.['case-notes']?.acctAlerts || []

const rejectionRationaleFromAssessmentResponses = (assessment: Assessment): string => {
  const response = getResponseForPage(assessment, 'make-a-decision', 'make-a-decision')?.Decision || ''

  if (Array.isArray(response)) return ''

  return response
}

export {
  acctAlertsFromAssessment,
  adjudicationsFromAssessment,
  allocationSummary,
  assessmentLink,
  assessmentsApproachingDue,
  assessmentsApproachingDueBadge,
  assessmentSections,
  awaitingAssessmentTableRows,
  caseNotesFromAssessment,
  completedTableRows,
  confirmationPageMessage,
  confirmationPageResult,
  daysSinceInfoRequest,
  daysSinceReceived,
  daysUntilDue,
  formatDays,
  formatDaysUntilDueWithWarning,
  formattedArrivalDate,
  getApplicationType,
  getPage,
  getReviewNavigationItems,
  getStatus,
  getTaskResponsesAsSummaryListItems,
  groupAssessmements,
  requestedFurtherInformationTableRows,
  rejectionRationaleFromAssessmentResponses,
  reviewApplicationSections,
}
