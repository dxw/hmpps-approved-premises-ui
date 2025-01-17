import { fullPersonFactory, restrictedPersonFactory } from '../testutils/factories/person'
import { isApplicableTier, isFullPerson, laoName, nameOrPlaceholderCopy, statusTag, tierBadge } from './personUtils'

describe('personUtils', () => {
  describe('statusTag', () => {
    it('returns an "In Community" tag for an InCommunity status', () => {
      expect(statusTag('InCommunity')).toEqual(
        `<strong class="govuk-tag" data-cy-status="InCommunity">In Community</strong>`,
      )
    })

    it('returns an "In Custody" tag for an InCustody status', () => {
      expect(statusTag('InCustody')).toEqual(`<strong class="govuk-tag" data-cy-status="InCustody">In Custody</strong>`)
    })

    it('returns an "Unknown" tag for an Unknown status', () => {
      expect(statusTag('Unknown')).toEqual(`<strong class="govuk-tag" data-cy-status="Unknown">Unknown</strong>`)
    })
  })

  describe('tierBadge', () => {
    it('returns the correct tier badge for A', () => {
      expect(tierBadge('A')).toEqual('<span class="moj-badge moj-badge--red">A</span>')
    })

    it('returns the correct tier badge for B', () => {
      expect(tierBadge('B')).toEqual('<span class="moj-badge moj-badge--purple">B</span>')
    })
  })

  describe('isApplicableTier', () => {
    it(`returns true if the person's sex is male and has an applicable tier`, () => {
      expect(isApplicableTier('Male', 'A3')).toBeTruthy()
    })

    it(`returns false if the person's sex is male and has a tier that is not applicable to males`, () => {
      expect(isApplicableTier('Male', 'C3')).toBeFalsy()
    })

    it(`returns false if the person's sex is male and has an inapplicable tier`, () => {
      expect(isApplicableTier('Male', 'D1')).toBeFalsy()
    })

    it(`returns true if the person's sex is female and has an applicable tier`, () => {
      expect(isApplicableTier('Female', 'A3')).toBeTruthy()
    })

    it(`returns true if the person's sex is female and has a tier that is applicable to females`, () => {
      expect(isApplicableTier('Female', 'C3')).toBeTruthy()
    })

    it(`returns false if the person's sex is female and has an inapplicable tier`, () => {
      expect(isApplicableTier('Female', 'D1')).toBeFalsy()
    })
  })

  describe('isFullPerson', () => {
    it('returns true if the person is a full person', () => {
      expect(isFullPerson(fullPersonFactory.build())).toEqual(true)
    })

    it('returns false if the person is a restricted person', () => {
      expect(isFullPerson(restrictedPersonFactory.build())).toEqual(false)
    })
  })

  describe('laoName', () => {
    it('if the person is not restricted it returns their name', () => {
      const person = fullPersonFactory.build({ isRestricted: false })

      expect(laoName(person)).toEqual(person.name)
    })

    it('if the person is restricted it returns their name prefixed with LAO: ', () => {
      const person = fullPersonFactory.build({ isRestricted: true })

      expect(laoName(person)).toEqual(`LAO: ${person.name}`)
    })
  })

  describe('nameOrPlaceholderCopy', () => {
    it('returns "the person" if passed a restrictedPerson', () => {
      expect(nameOrPlaceholderCopy(restrictedPersonFactory.build())).toEqual('the person')
    })
    it('returns the persons name if passed a fullPerson', () => {
      const person = fullPersonFactory.build()
      expect(nameOrPlaceholderCopy(person)).toEqual(person.name)
    })
  })
})
