import { ApprovedPremisesAssessment as Assessment } from '../../@types/shared'
import Assess from '../../form-pages/assess'
import MatchingInformation from '../../form-pages/assess/matchingInformation'
import { applicationAccepted, decisionFromAssessment } from './decisionUtils'
import { filterSectionTasks } from './filterSectionTasks'

export default (assessment: Assessment) => {
  let { sections } = Assess

  if (decisionFromAssessment(assessment) && !applicationAccepted(assessment)) {
    sections = sections.filter(section => section.name !== MatchingInformation.name)
  }

  return sections.map(section => filterSectionTasks(section, assessment))
}
