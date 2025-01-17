import { userQualificationsSelectOptions, userRolesSelectOptions, userSummaryListItems } from '.'
import { userFactory } from '../../testutils/factories'

describe('UserUtils', () => {
  it('returns the correct objects in an array when all the expected data is present', () => {
    const user = userFactory.build()

    expect(userSummaryListItems(user)).toEqual([
      {
        key: {
          text: 'Name',
        },
        value: {
          text: user.name,
        },
      },
      {
        key: {
          text: 'Username',
        },
        value: {
          text: user.deliusUsername,
        },
      },
      {
        key: {
          text: 'Email',
        },
        value: {
          text: user.email,
        },
      },
      {
        key: {
          text: 'Phone number',
        },
        value: {
          text: user.telephoneNumber,
        },
      },
      {
        key: {
          text: 'Region',
        },
        value: {
          text: user.region.name,
        },
      },
    ])
  })

  it('returns the correct objects in an array when all the email and phone number is missing', () => {
    const user = userFactory.build({ email: undefined, telephoneNumber: undefined })

    expect(userSummaryListItems(user)).toEqual([
      {
        key: {
          text: 'Name',
        },
        value: {
          text: user.name,
        },
      },
      {
        key: {
          text: 'Username',
        },
        value: {
          text: user.deliusUsername,
        },
      },
      {
        key: {
          text: 'Email',
        },
        value: {
          text: 'No email address available',
        },
      },
      {
        key: {
          text: 'Phone number',
        },
        value: {
          text: 'No phone number available',
        },
      },
      {
        key: {
          text: 'Region',
        },
        value: {
          text: user.region.name,
        },
      },
    ])
  })
})

describe('userRolesSelectOptions', () => {
  it('should return select options for tiers with the all tiers option selected by default', () => {
    expect(userRolesSelectOptions(null)).toEqual([
      { selected: true, text: 'All roles', value: '' },
      { selected: false, text: 'Assessor', value: 'assessor' },
      { selected: false, text: 'Matcher', value: 'matcher' },
      { selected: false, text: 'Manager', value: 'manager' },
      { selected: false, text: 'Workflow manager', value: 'workflow_manager' },
      { selected: false, text: 'Applicant', value: 'applicant' },
      { selected: false, text: 'Role admin', value: 'role_admin' },
      { selected: false, text: 'Report viewer', value: 'report_viewer' },
      { selected: false, text: 'Excluded from assess allocation', value: 'excluded_from_assess_allocation' },
      { selected: false, text: 'Excluded from match allocation', value: 'excluded_from_match_allocation' },
      {
        selected: false,
        text: 'Excluded from placement application allocation',
        value: 'excluded_from_placement_application_allocation',
      },
    ])
  })

  it('should return the selected status if provided', () => {
    expect(userRolesSelectOptions('assessor')).toEqual([
      { selected: false, text: 'All roles', value: '' },
      { selected: true, text: 'Assessor', value: 'assessor' },
      { selected: false, text: 'Matcher', value: 'matcher' },
      { selected: false, text: 'Manager', value: 'manager' },
      { selected: false, text: 'Workflow manager', value: 'workflow_manager' },
      { selected: false, text: 'Applicant', value: 'applicant' },
      { selected: false, text: 'Role admin', value: 'role_admin' },
      { selected: false, text: 'Report viewer', value: 'report_viewer' },
      { selected: false, text: 'Excluded from assess allocation', value: 'excluded_from_assess_allocation' },
      { selected: false, text: 'Excluded from match allocation', value: 'excluded_from_match_allocation' },
      {
        selected: false,
        text: 'Excluded from placement application allocation',
        value: 'excluded_from_placement_application_allocation',
      },
    ])
  })
})

describe('userQualificationsSelectOptions', () => {
  it('should return select options for tiers with the all tiers option selected by default', () => {
    expect(userQualificationsSelectOptions(null)).toEqual([
      { selected: true, text: 'All qualifications', value: '' },
      { selected: false, text: 'Limited access offenders', value: 'lao' },
      { selected: false, text: "Women's APs", value: 'womens' },
      { selected: false, text: 'Emergency APs', value: 'emergency' },
      { selected: false, text: 'ESAP', value: 'esap' },
      { selected: false, text: 'PIPE', value: 'pipe' },
    ])
  })

  it('should return the selected status if provided', () => {
    expect(userQualificationsSelectOptions('lao')).toEqual([
      { selected: false, text: 'All qualifications', value: '' },
      { selected: true, text: 'Limited access offenders', value: 'lao' },
      { selected: false, text: "Women's APs", value: 'womens' },
      { selected: false, text: 'Emergency APs', value: 'emergency' },
      { selected: false, text: 'ESAP', value: 'esap' },
      { selected: false, text: 'PIPE', value: 'pipe' },
    ])
  })
})
