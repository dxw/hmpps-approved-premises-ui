import { DataServices, OasysImportArrays, OasysPage } from '../@types/ui'
import {
  ApprovedPremisesApplication as Application,
  ApprovedPremisesApplication,
  OASysQuestion,
  OASysSection,
  OASysSections,
} from '../@types/shared'
import { SessionDataError } from './errors'
import { escape } from './formUtils'
import { mapApiPersonRisksForUi, sentenceCase } from './utils'
import { OasysNotFoundError } from '../services/personService'
import oasysStubs from '../data/stubs/oasysStubs.json'

export type Constructor<T> = new (body: unknown) => T

export const getOasysSections = async <T extends OasysPage>(
  body: Record<string, unknown>,
  application: ApprovedPremisesApplication,
  token: string,
  dataServices: DataServices,
  constructor: Constructor<T>,
  {
    sectionName,
    summaryKey,
    answerKey,
    selectedSections = [],
  }: {
    sectionName: string
    summaryKey: string
    answerKey: string
    selectedSections?: Array<number>
  },
): Promise<T> => {
  let oasysSections: OASysSections
  let oasysSuccess: boolean

  try {
    oasysSections = await dataServices.personService.getOasysSections(token, application.person.crn, selectedSections)
    oasysSuccess = true
  } catch (e) {
    if (e instanceof OasysNotFoundError) {
      oasysSections = oasysStubs
      oasysSuccess = false
    } else {
      throw e
    }
  }

  const summaries = sortOasysImportSummaries(oasysSections[sectionName]).map(question => {
    const answer = body[answerKey]?.[question.questionNumber] || question.answer
    return {
      ...question,
      answer,
    }
  })

  const page = new constructor(body)

  page.body[summaryKey] = summaries
  page[summaryKey] = summaries
  page.oasysCompleted = oasysSections?.dateCompleted || oasysSections?.dateStarted
  page.oasysSuccess = oasysSuccess
  page.risks = mapApiPersonRisksForUi(application.risks)

  return page
}

export const validateOasysEntries = <T>(body: Partial<T>, questionKey: string, answerKey: string) => {
  const errors = {}
  const questions = body[questionKey]
  const answers = body[answerKey]

  Object.keys(questions).forEach(key => {
    const question = questions[key]
    if (!answers[question.questionNumber]) {
      errors[`${answerKey}[${question.questionNumber}]`] =
        `You must enter a response for the '${question.label}' question`
    }
  })

  return errors
}

export const textareas = (questions: OasysImportArrays, key: 'roshAnswers' | 'offenceDetails') => {
  return questions
    .map(question => {
      return `<div class="govuk-form-group">
                <h2 class="govuk-label-wrapper">
                    <label class="govuk-label govuk-label--m" for=${key}[${question.questionNumber}]>
                        ${question.label}
                    </label>
                </h2>
                <textarea class="govuk-textarea" id=${key}[${question.questionNumber}] name=${key}[${
                  question.questionNumber
                }] rows="8">${escape(question?.answer)}</textarea>
            </div>
            <hr>`
    })
    .join('')
}

export const oasysImportReponse = (answers: Record<string, string>, summaries: Array<OASysQuestion>) => {
  return Object.keys(answers).reduce((prev, k) => {
    return {
      ...prev,
      [`${k}: ${findSummary(k, summaries).label}`]: answers[k],
    }
  }, {}) as Record<string, string>
}

export const findSummary = (questionNumber: string, summaries: Array<OASysQuestion>) => {
  const summary = summaries.find(i => i.questionNumber === questionNumber)

  if (!summary) {
    throw new Error(`No summary found for question number ${questionNumber}`)
  }

  return summary
}

export const fetchOptionalOasysSections = (application: Application): Array<number> => {
  try {
    const oasysImport = application.data['oasys-import']

    if (!oasysImport) throw new SessionDataError('No OASys import section')

    const optionalOasysSections = oasysImport['optional-oasys-sections']

    if (!optionalOasysSections) throw new SessionDataError('No optional OASys imports')

    return [...optionalOasysSections.needsLinkedToReoffending, ...optionalOasysSections.otherNeeds]
      .map((oasysSection: OASysSection) => oasysSection?.section)
      .filter(section => !!section)
  } catch (e) {
    throw new SessionDataError(`Oasys supporting information error: ${e}`)
  }
}

export const sortOasysImportSummaries = (summaries: Array<OASysQuestion>): Array<OASysQuestion> => {
  return summaries.sort((a, b) => a.questionNumber.localeCompare(b.questionNumber, 'en', { numeric: true }))
}

export const sectionCheckBoxes = (fullList: Array<OASysSection>, selectedList: Array<OASysSection>) => {
  return fullList.map(need => {
    const sectionAndName = `${need.section}. ${sentenceCase(need.name)}`
    return {
      value: need.section.toString(),
      text: sectionAndName,
      checked: selectedList.map(n => n.section).includes(need.section),
    }
  })
}
