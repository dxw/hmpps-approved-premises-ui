import { ApprovedPremisesApplication as Application, Document, PlacementApplication } from '../../@types/shared'
import { HtmlItem, SummaryListItem, TextItem } from '../../@types/ui'
import AdditionalDocuments from '../../form-pages/placement-application/request-a-placement/additionalDocuments'
import paths from '../../paths/placementApplications'
import { embeddedSummaryListItem, summaryListItemForResponse } from '../applications/summaryListUtils'
import { getPage, getResponseForPage } from '../applications/utils'
import { retrieveQuestionResponseFromFormArtifact } from '../retrieveQuestionResponseFromFormArtifact'

export const mapPageForSummaryList = (
  placementApplication: PlacementApplication,
  pageName: string,
  application: Application,
) => {
  return {
    card: {
      title: { text: getPageTitle(placementApplication, pageName) },
    },
    rows: pageResponsesAsSummaryListItems(placementApplication, pageName, application),
  }
}

export const getPageTitle = (placementApplication: PlacementApplication, pageName: string) => {
  const Page = getPage('request-a-placement', pageName, 'placement-applications')
  return new Page(placementApplication.data?.['request-a-placement'][pageName], placementApplication).title
}

export const pagesForReview = (placementApplication: PlacementApplication) => {
  const pageNames = Object.keys(placementApplication.data['request-a-placement'])

  return pageNames.filter(page => page !== 'check-your-answers')
}

export const pageResponsesAsSummaryListItems = (
  placementApplication: PlacementApplication,
  pageName: string,
  application: Application,
) => {
  if (pageName === 'additional-documents') {
    return attachDocumentsSummaryListItems(placementApplication, application, 'request-a-placement', pageName, true)
  }

  const response = getResponseForPage(placementApplication, 'request-a-placement', pageName)
  return Object.keys(response).map(key => {
    const value =
      typeof response[key] === 'string' || response[key] instanceof String
        ? ({ text: response[key] } as TextItem)
        : ({ html: embeddedSummaryListItem(response[key] as Array<Record<string, unknown>>) } as HtmlItem)

    return summaryListItemForResponse(key, value, 'request-a-placement', pageName, placementApplication, true)
  })
}

export const attachDocumentsSummaryListItems = (
  placementApplication: PlacementApplication,
  application: Application,
  taskName: string,
  pageName: string,
  showActions: boolean,
) => {
  const items: Array<SummaryListItem> = []

  const documents = retrieveQuestionResponseFromFormArtifact(
    placementApplication,
    AdditionalDocuments,
    'selectedDocuments',
  ) as Array<Document>

  documents.forEach(document => {
    const item: SummaryListItem = {
      key: {
        html: `<a href="/applications/people/${application.person.crn}/documents/${document.id}" data-cy-documentId="${document.id}">${document.fileName}</a>`,
      },
      value: { text: document?.description || '' },
    }
    if (showActions) {
      item.actions = {
        items: [
          {
            href: paths.placementApplications.pages.show({ task: taskName, page: pageName, id: application.id }),
            text: 'Change',
            visuallyHiddenText: document.fileName,
          },
        ],
      }
    }
    items.push(item)
  })

  return items
}