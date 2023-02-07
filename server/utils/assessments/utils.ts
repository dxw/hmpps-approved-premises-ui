import { HtmlItem, PageResponse, SummaryListItem, TableRow, Task, TextItem } from '@approved-premises/ui'
import { format, differenceInDays, add } from 'date-fns'

import { ApprovedPremisesAssessment as Assessment, ApprovedPremisesApplication } from '@approved-premises/api'
import { tierBadge } from '../personUtils'
import { DateFormats } from '../dateUtils'
import { getArrivalDate, getResponseForPage } from '../applicationUtils'
import paths from '../../paths/assess'
import { TasklistPageInterface } from '../../form-pages/tasklistPage'
import Assess from '../../form-pages/assess'
import { UnknownPageError } from '../errors'
import { embeddedSummaryListItem } from '../checkYourAnswersUtils'
import reviewSections from '../reviewUtils'
import Apply from '../../form-pages/apply'
import { kebabCase } from '../utils'
import { documentsFromApplication } from './documentUtils'

const DUE_DATE_APPROACHING_DAYS_WINDOW = 3

const awaitingAssessmentTableRows = (assessments: Array<Assessment>): Array<TableRow> => {
  const rows = [] as Array<TableRow>

  assessments.forEach(assessment => {
    rows.push([
      {
        html: assessmentLink(assessment),
      },
      {
        html: assessment.application.person.crn,
      },
      {
        html: tierBadge(assessment.application.risks.tier.value.level),
      },
      {
        text: formattedArrivalDate(assessment),
      },
      {
        text: assessment.application.person.prisonName,
      },
      {
        html: formatDaysUntilDueWithWarning(assessment),
      },
      {
        html: getStatus(assessment),
      },
    ])
  })

  return rows
}

const completedTableRows = (assessments: Array<Assessment>): Array<TableRow> => {
  const rows = [] as Array<TableRow>

  assessments.forEach(assessment => {
    rows.push([
      {
        html: assessmentLink(assessment),
      },
      {
        html: assessment.application.person.crn,
      },
      {
        html: tierBadge(assessment.application.risks.tier.value.level),
      },
      {
        text: formattedArrivalDate(assessment),
      },
      {
        html: getStatus(assessment),
      },
    ])
  })

  return rows
}

const requestedFurtherInformationTableRows = (assessments: Array<Assessment>): Array<TableRow> => {
  const rows = [] as Array<TableRow>

  assessments.forEach(assessment => {
    rows.push([
      {
        html: assessmentLink(assessment),
      },
      {
        html: assessment.application.person.crn,
      },
      {
        html: tierBadge(assessment.application.risks.tier.value.level),
      },
      {
        text: formattedArrivalDate(assessment),
      },
      {
        text: formatDays(daysSinceReceived(assessment)),
      },
      {
        text: formatDays(daysSinceInfoRequest(assessment)),
      },
      {
        html: `<strong class="govuk-tag govuk-tag--yellow">Info Request</strong>`,
      },
    ])
  })

  return rows
}

const assessmentLink = (assessment: Assessment): string => {
  return `<a href="${paths.assessments.show({ id: assessment.id })}" data-cy-assessmentId="${assessment.id}">${
    assessment.application.person.name
  }</a>`
}

const formattedArrivalDate = (assessment: Assessment): string => {
  const arrivalDate = getArrivalDate(assessment.application as ApprovedPremisesApplication)
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
    return `<strong class="govuk-tag govuk-tag">Completed</strong>`
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

const assessmentSections = (application: ApprovedPremisesApplication) => {
  return reviewSections(application, getTaskResponsesAsSummaryListItems)
}

const getTaskResponsesAsSummaryListItems = (
  task: Task,
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

const getSectionSuffix = (task: Task, assessmentId: string) => {
  let link: string
  let copy: string

  if (task.id !== 'oasys-import' && task.id !== 'prison-information') return ''

  if (task.id === 'oasys-import') {
    link = 'oasys-link'
    copy = 'View detailed risk information'
  }

  if (task.id === 'prison-information') {
    link = paths.assessments.pages.prisonInformationPath({ id: assessmentId })
    copy = 'View additional prison information'
  }

  return `<p><a href="${link}">${copy}</a></p>`
}

const decisionFromAssessment = (assessment: Assessment) =>
  assessment?.data?.['make-a-decision']?.['make-a-decision']?.decision || ''

const applicationAccepted = (assessment: Assessment) => {
  switch (decisionFromAssessment(assessment)) {
    case 'releaseDate':
      return true
      break
    case 'hold':
      return true
      break
    default:
      return false
      break
  }
}

const confirmationPageMessage = (assessment: Assessment) => {
  switch (decisionFromAssessment(assessment)) {
    case 'releaseDate':
      return `<p>We've notified the Probation Practitioner that this application has been assessed as suitable.</p>
      <p>The assessment can now be used to match Robert Brown to a bed in an Approved Premises.</p>`
      break
    case 'hold':
      return `<p>We've notified the Probation Practitioner that this application has been assessed as suitable.</p>
      <p>This case is now paused until the oral hearing outcome has been provided by the Probation Practitioner and a release date is confirmed.</p>
      <p>It will be added to the matching queue if the oral hearing is successful.</p>`
      break
    default:
      return `<p>We've sent you a confirmation email.</p>
      <p>We've notified the Probation Practitioner that this application has been rejected as unsuitable for an Approved Premises.</p>`
      break
  }
}

const confirmationPageResult = (assessment: Assessment) => {
  switch (applicationAccepted(assessment)) {
    case true:
      return 'You have marked this application as suitable.'
      break
    default:
      return 'You have marked this application as unsuitable.'
      break
  }
}

const adjudicationsFromAssessment = (assessment: Assessment) =>
  assessment.application?.data?.['prison-information']?.['case-notes']?.adjudications || ''

const caseNotesFromAssessment = (assessment: Assessment) =>
  assessment.application?.data?.['prison-information']?.['case-notes']?.selectedCaseNotes || ''

export {
  adjudicationsFromAssessment,
  applicationAccepted,
  assessmentSections,
  assessmentLink,
  awaitingAssessmentTableRows,
  caseNotesFromAssessment,
  confirmationPageMessage,
  confirmationPageResult,
  daysSinceReceived,
  decisionFromAssessment,
  formattedArrivalDate,
  getStatus,
  getPage,
  getTaskResponsesAsSummaryListItems,
  getReviewNavigationItems,
  getSectionSuffix,
  requestedFurtherInformationTableRows,
  daysSinceInfoRequest,
  formatDays,
  daysUntilDue,
  completedTableRows,
  assessmentsApproachingDue,
  assessmentsApproachingDueBadge,
  formatDaysUntilDueWithWarning,
}