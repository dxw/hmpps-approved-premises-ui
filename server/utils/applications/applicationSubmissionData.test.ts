import { ReleaseTypeOption } from '@approved-premises/api'
import applicationFactory from '../../testutils/factories/application'
import { applicationSubmissionData } from './applicationSubmissionData'

describe('applicationSubmissionData', () => {
  const postcodeArea = 'ABC 123'
  const releaseType = 'license' as ReleaseTypeOption

  it('returns the correct data for a pipe application', () => {
    const application = applicationFactory
      .withApType('pipe')
      .withPostcodeArea(postcodeArea)
      .withSentenceType('standardDeterminate')
      .withReleaseType(releaseType)
      .build()

    expect(applicationSubmissionData(application)).toEqual({
      translatedDocument: application.document,
      isPipeApplication: true,
      isWomensApplication: false,
      releaseType,
      targetLocation: postcodeArea,
    })
  })

  it('returns the correct data for a non-pipe application', () => {
    const application = applicationFactory
      .withApType('standard')
      .withPostcodeArea(postcodeArea)
      .withSentenceType('standardDeterminate')
      .withReleaseType(releaseType)
      .build()

    expect(applicationSubmissionData(application)).toEqual({
      translatedDocument: application.document,
      isPipeApplication: false,
      isWomensApplication: false,
      releaseType,
      targetLocation: postcodeArea,
    })
  })

  it('handles when a release type is missing', () => {
    const application = applicationFactory
      .withApType('standard')
      .withSentenceType('standardDeterminate')
      .withPostcodeArea(postcodeArea)
      .build()

    expect(applicationSubmissionData(application)).toEqual({
      translatedDocument: application.document,
      isPipeApplication: false,
      isWomensApplication: false,
      releaseType: undefined,
      targetLocation: postcodeArea,
    })
  })

  it('returns in_community for a community order application', () => {
    const application = applicationFactory
      .withApType('standard')
      .withPostcodeArea(postcodeArea)
      .withSentenceType('communityOrder')
      .build()

    expect(applicationSubmissionData(application)).toEqual({
      translatedDocument: application.document,
      isPipeApplication: false,
      isWomensApplication: false,
      releaseType: 'in_community',
      targetLocation: postcodeArea,
    })
  })

  it('returns in_community for a bail placement application', () => {
    const application = applicationFactory
      .withApType('standard')
      .withPostcodeArea(postcodeArea)
      .withSentenceType('bailPlacement')
      .build()

    expect(applicationSubmissionData(application)).toEqual({
      translatedDocument: application.document,
      isPipeApplication: false,
      isWomensApplication: false,
      releaseType: 'in_community',
      targetLocation: postcodeArea,
    })
  })
})
