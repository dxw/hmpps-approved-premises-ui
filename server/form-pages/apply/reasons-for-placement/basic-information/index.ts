/* istanbul ignore file */

import IsExceptionalCase from './isExceptionalCase'
import ExceptionDetails from './exceptionDetails'
import SentenceType from './sentenceType'
import ReleaseType from './releaseType'
import Situation from './situation'
import ReleaseDate from './releaseDate'
import OralHearing from './oralHearing'
import PlacementDate from './placementDate'
import PlacementPurpose from './placementPurpose'
import ReasonForShortNotice from './reasonForShortNotice'
import IsPersonTransgender from './isPersonTransgender'
import { Task } from '../../../utils/decorators'

@Task({
  name: 'Basic Information',
  slug: 'basic-information',
  pages: [
    IsExceptionalCase,
    IsPersonTransgender,
    ExceptionDetails,
    SentenceType,
    ReleaseType,
    Situation,
    ReleaseDate,
    OralHearing,
    PlacementDate,
    PlacementPurpose,
    ReasonForShortNotice,
  ],
})
export default class BasicInformation {}
