import type { PersonStatus } from '@approved-premises/ui'
import { FullPerson, Person } from '../@types/shared'

const statusTag = (status: PersonStatus): string => {
  if (status === 'InCommunity') {
    return `<strong class="govuk-tag" data-cy-status="${status}">In Community</strong>`
  }

  return `<strong class="govuk-tag" data-cy-status="${status}">In Custody</strong>`
}

const tierBadge = (tier: string): string => {
  if (!tier) return ''

  const colour = { A: 'moj-badge--red', B: 'moj-badge--purple' }[tier[0]]

  return `<span class="moj-badge ${colour}">${tier}</span>`
}

const isApplicableTier = (sex: string, tier: string): boolean => {
  const applicableTiersAll = ['A3', 'A2', 'B1', 'B3', 'B2', 'B1']
  const applicableTiersWomen = ['C3']

  const applicableTiers = sex === 'Female' ? [applicableTiersAll, applicableTiersWomen].flat() : applicableTiersAll

  return applicableTiers.includes(tier)
}

const isFullPerson = (person?: Person): person is FullPerson => (person as FullPerson)?.name !== undefined

const laoName = (person: FullPerson) => (person.isRestricted ? `LAO: ${person.name}` : person.name)

/**
 * Returns the person's name if they are a FullPerson, otherwise returns 'the person'
 * @param {Person} person
 * @returns 'the person' | person.name
 */
const nameOrPlaceholderCopy = (person: Person, copyForRestrictedPerson = 'the person'): string => {
  return isFullPerson(person) ? person.name : copyForRestrictedPerson
}

export { statusTag, tierBadge, isApplicableTier, isFullPerson, nameOrPlaceholderCopy, laoName }
