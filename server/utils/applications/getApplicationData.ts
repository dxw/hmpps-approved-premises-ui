import {
  ApprovedPremisesApplication as Application,
  ReleaseTypeOption,
  SentenceTypeOption,
  SubmitApprovedPremisesApplication,
  UpdateApprovedPremisesApplication,
} from '@approved-premises/api'

import ReleaseType from '../../form-pages/apply/reasons-for-placement/basic-information/releaseType'
import SentenceType from '../../form-pages/apply/reasons-for-placement/basic-information/sentenceType'
import SelectApType, { ApType } from '../../form-pages/apply/reasons-for-placement/type-of-ap/apType'

import {
  retrieveOptionalQuestionResponseFromFormArtifact,
  retrieveQuestionResponseFromFormArtifact,
} from '../retrieveQuestionResponseFromFormArtifact'
import DescribeLocationFactors from '../../form-pages/apply/risk-and-need-factors/location-factors/describeLocationFactors'
import { arrivalDateFromApplication } from './arrivalDateFromApplication'
import { isInapplicable } from './utils'
import { FormArtifact } from '../../@types/ui'
import { noticeTypeFromApplication } from './noticeTypeFromApplication'
import Situation from '../../form-pages/apply/reasons-for-placement/basic-information/situation'
import ConfirmYourDetails from '../../form-pages/apply/reasons-for-placement/basic-information/confirmYourDetails'

type FirstClassFields<T> = T extends UpdateApprovedPremisesApplication
  ? Omit<UpdateApprovedPremisesApplication, 'data'>
  : T extends SubmitApprovedPremisesApplication
    ? Omit<SubmitApprovedPremisesApplication, 'translatedDocument'>
    : never

type QuestionResponseFunction = (formArtifact: FormArtifact, Page: unknown, question?: string) => unknown

export const getApplicationUpdateData = (application: Application): UpdateApprovedPremisesApplication => {
  return {
    data: application.data,
    isInapplicable: isInapplicable(application),
    ...getUpdateFirstClassFields(application),
  }
}

export const getApplicationSubmissionData = (application: Application): SubmitApprovedPremisesApplication => {
  return {
    translatedDocument: application.document,
    ...getSubmitFirstClassFields(application),
  }
}

const firstClassFields = <T>(
  application: Application,
  retrieveQuestionResponse: QuestionResponseFunction,
): FirstClassFields<T> => {
  const apType = retrieveQuestionResponse(application, SelectApType, 'type') as ApType
  const targetLocation = retrieveQuestionResponse(application, DescribeLocationFactors, 'postcodeArea')
  const sentenceType = getSentenceType(application, retrieveQuestionResponse)
  const releaseType = getReleaseType(application, sentenceType)
  const situation =
    releaseType === 'in_community' ? retrieveQuestionResponse(application, Situation, 'situation') : null
  const arrivalDate = arrivalDateFromApplication(application)
  const isEmergencyApplication = noticeTypeFromApplication(application) === 'emergency'
  const apAreaId = retrieveQuestionResponse(application, ConfirmYourDetails, 'area')

  return {
    isWomensApplication: false,
    isPipeApplication: isPipeApplication(apType),
    isEsapApplication: isEsapApplication(apType),
    targetLocation,
    releaseType,
    sentenceType,
    situation,
    arrivalDate,
    isEmergencyApplication,
    apAreaId,
  } as FirstClassFields<T>
}

const getUpdateFirstClassFields = (application: Application): FirstClassFields<UpdateApprovedPremisesApplication> => {
  return firstClassFields(application, retrieveOptionalQuestionResponseFromFormArtifact)
}

const getSubmitFirstClassFields = (application: Application): FirstClassFields<SubmitApprovedPremisesApplication> => {
  return firstClassFields(application, retrieveQuestionResponseFromFormArtifact)
}

const getReleaseType = (application: Application, sentenceType: SentenceTypeOption): ReleaseTypeOption => {
  if (sentenceType === 'nonStatutory') {
    return 'not_applicable'
  }

  if (sentenceType === 'communityOrder' || sentenceType === 'bailPlacement') {
    return 'in_community'
  }

  return retrieveOptionalQuestionResponseFromFormArtifact(application, ReleaseType, 'releaseType')
}

const getSentenceType = (
  application: Application,
  retrieveQuestionResponse: QuestionResponseFunction,
): SentenceTypeOption => {
  return retrieveQuestionResponse(application, SentenceType, 'sentenceType') as SentenceTypeOption
}

const isPipeApplication = (apType?: ApType): boolean | undefined => {
  if (apType === undefined) {
    return undefined
  }

  return apType === 'pipe'
}

const isEsapApplication = (apType?: ApType): boolean | undefined => {
  if (apType === undefined) {
    return undefined
  }

  return apType === 'esap'
}
