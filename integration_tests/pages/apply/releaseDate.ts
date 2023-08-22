import type { ApprovedPremisesApplication } from '@approved-premises/api'

import ApplyPage from './applyPage'
import { nameOrPlaceholderCopy } from '../../../server/utils/personUtils'

export default class ReleaseDatePage extends ApplyPage {
  constructor(application: ApprovedPremisesApplication) {
    super(
      `Do you know ${nameOrPlaceholderCopy(application.person)}’s release date?`,
      application,
      'basic-information',
      'release-date',
    )
  }

  completeForm() {
    this.checkRadioButtonFromPageBody('knowReleaseDate')
    this.completeDateInputsFromPageBody('releaseDate')
  }
}
