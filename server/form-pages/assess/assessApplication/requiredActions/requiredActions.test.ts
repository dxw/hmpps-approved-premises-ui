import { YesOrNo } from '../../../../@types/ui'
import { itShouldHaveNextValue, itShouldHavePreviousValue } from '../../../shared-examples'

import RequiredActions from './requiredActions'

describe('RequiredActions', () => {
  describe('title', () => {
    expect(
      new RequiredActions({
        additionalActions: 'yes',
        additionalActionsComments: '',
        curfewsOrSignIns: 'yes',
        curfewsOrSignInsComments: '',
        concernsOfUnmanagableRisk: 'yes',
        concernsOfUnmanagableRiskComments: '',
        additionalRecommendations: 'yes',
        additionalRecommendationsComments: '',
      }).title,
    ).toBe('Required actions to support a placement')
  })

  describe('body', () => {
    it('should set the body', () => {
      const page = new RequiredActions({
        additionalActions: 'yes',
        additionalActionsComments: '',
        curfewsOrSignIns: 'yes',
        curfewsOrSignInsComments: '',
        concernsOfUnmanagableRisk: 'yes',
        concernsOfUnmanagableRiskComments: '',
        additionalRecommendations: 'yes',
        additionalRecommendationsComments: '',
        nameOfAreaManager: 'frank',
        dateOfDiscussion: '2023-2-1',
        'dateOfDiscussion-year': '2023',
        'dateOfDiscussion-month': '1',
        'dateOfDiscussion-day': '2',
        outlineOfDiscussion: 'foo bar',
      })
      expect(page.body).toEqual({
        additionalActions: 'yes',
        additionalActionsComments: '',
        curfewsOrSignIns: 'yes',
        curfewsOrSignInsComments: '',
        concernsOfUnmanagableRisk: 'yes',
        concernsOfUnmanagableRiskComments: '',
        additionalRecommendations: 'yes',
        additionalRecommendationsComments: '',
        nameOfAreaManager: 'frank',
        dateOfDiscussion: '2023-01-02',
        'dateOfDiscussion-year': '2023',
        'dateOfDiscussion-month': '1',
        'dateOfDiscussion-day': '2',
        outlineOfDiscussion: 'foo bar',
      })
    })
  })

  itShouldHaveNextValue(
    new RequiredActions({
      additionalActions: 'yes',
      additionalActionsComments: '',
      curfewsOrSignIns: 'yes',
      curfewsOrSignInsComments: '',
      concernsOfUnmanagableRisk: 'yes',
      concernsOfUnmanagableRiskComments: '',
      additionalRecommendations: 'yes',
      additionalRecommendationsComments: '',
    }),
    '',
  )

  itShouldHavePreviousValue(
    new RequiredActions({
      additionalActions: 'yes',
      additionalActionsComments: '',
      curfewsOrSignIns: 'yes',
      curfewsOrSignInsComments: '',
      concernsOfUnmanagableRisk: 'yes',
      concernsOfUnmanagableRiskComments: '',
      additionalRecommendations: 'yes',
      additionalRecommendationsComments: '',
    }),
    'dashboard',
  )

  describe('errors', () => {
    it('should have an error if there is no answers', () => {
      const page = new RequiredActions({
        additionalActions: '' as YesOrNo,
        curfewsOrSignIns: '' as YesOrNo,
        concernsOfUnmanagableRisk: '' as YesOrNo,
        additionalRecommendations: '' as YesOrNo,
      })

      expect(page.errors()).toEqual({
        additionalActions:
          'You must state if there are additional actions required by the probation practitioner to make a placement viable',
        curfewsOrSignIns: 'You must state if there are any additional curfews or sign ins recommended',
        concernsOfUnmanagableRisk:
          'You must state if there are any concerns that the person poses an potentially unmanageable risk to staff or others',
        additionalRecommendations: 'You must state if there are any additional recommendations',
      })
    })

    it('if the answer to "concernsOfUnmanagableRisk" is "yes" then there must be comments in the "additionalRecommendations" box', () => {
      const page = new RequiredActions({
        additionalActions: 'yes',
        curfewsOrSignIns: 'yes',
        concernsOfUnmanagableRisk: 'yes',
        additionalRecommendations: 'yes',
      })

      expect(page.errors()).toEqual({
        additionalActionsComments:
          'You must state the additional recommendations due to there being concerns that the person poses a potentially unmanageable risk to staff and others',
        dateOfDiscussion: 'You must state the date of discussion',
        nameOfAreaManager: 'You must state the name of the area manager',
        outlineOfDiscussion: 'You must state the outline of the discussion',
      })
    })

    it('should have an error if the answer to "concernsOfUnmanagableRisk" is yes and the date is invalid', () => {
      const page = new RequiredActions({
        additionalActions: 'no',
        curfewsOrSignIns: 'no',
        concernsOfUnmanagableRisk: 'yes',
        additionalRecommendations: 'no',
        additionalActionsComments: 'comment',
        nameOfAreaManager: 'frank',
        outlineOfDiscussion: 'foo',
        'dateOfDiscussion-year': '12312321312321',
        'dateOfDiscussion-month': '1232131',
        'dateOfDiscussion-day': '12312321',
      })

      expect(page.errors()).toEqual({
        dateOfDiscussion: 'You must enter a valid date for the date of discussion',
      })
    })
  })

  describe('response', () => {
    it('returns the response', () => {
      const page = new RequiredActions({
        additionalActions: 'yes',
        additionalActionsComments: 'one',
        curfewsOrSignIns: 'yes',
        curfewsOrSignInsComments: 'two',
        concernsOfUnmanagableRisk: 'yes',
        concernsOfUnmanagableRiskComments: 'three',
        nameOfAreaManager: 'frank',
        'dateOfDiscussion-year': '2022',
        'dateOfDiscussion-month': '11',
        'dateOfDiscussion-day': '11',
        outlineOfDiscussion: 'foo bar baz',
        additionalRecommendations: 'yes',
        additionalRecommendationsComments: 'four',
      })

      expect(page.response()).toEqual({
        'Are any additional curfews or sign ins recommended?': 'Yes',
        'Are any additional curfews or sign ins recommended? Additional comments': 'two',
        'Are there any additional actions required by the probation practitioner to make a placement viable?': 'Yes',
        'Are there any additional actions required by the probation practitioner to make a placement viable? Additional comments':
          'one',
        'Are there any additional recommendations for the receiving AP manager?': 'Yes',
        'Are there any additional recommendations for the receiving AP manager? Additional comments': 'four',
        'Are there concerns that the person poses a potentially unmanageable risk to staff or others?': 'Yes',
        'Are there concerns that the person poses a potentially unmanageable risk to staff or others? Additional comments':
          'three',
        'Date of discussion': 'Friday 11 November 2022',
        'Name of area manager': 'frank',
        'Outline the discussion, including any additional measures that have been agreed.': 'foo bar baz',
      })
    })
  })
})
