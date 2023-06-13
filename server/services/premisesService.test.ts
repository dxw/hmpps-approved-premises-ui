import PremisesService from './premisesService'
import PremisesClient from '../data/premisesClient'
import {
  bedDetailFactory,
  bedOccupancyRangeFactory,
  bedSummaryFactory,
  dateCapacityFactory,
  premisesFactory,
  roomFactory,
  staffMemberFactory,
} from '../testutils/factories'
import getDateRangesWithNegativeBeds, { mapApiOccupancyToUiOccupancy } from '../utils/premisesUtils'
import paths from '../paths/manage'

jest.mock('../data/premisesClient')
jest.mock('../utils/premisesUtils')

describe('PremisesService', () => {
  const premisesClient = new PremisesClient(null) as jest.Mocked<PremisesClient>
  const premisesClientFactory = jest.fn()

  const service = new PremisesService(premisesClientFactory)

  const token = 'SOME_TOKEN'
  const premisesId = 'premisesId'

  beforeEach(() => {
    jest.resetAllMocks()
    premisesClientFactory.mockReturnValue(premisesClient)
  })

  describe('getStaffMembers', () => {
    it('on success returns the person given their CRN', async () => {
      const staffMembers = staffMemberFactory.buildList(5)
      premisesClient.getStaffMembers.mockResolvedValue(staffMembers)

      const result = await service.getStaffMembers(token, premisesId)

      expect(result).toEqual(staffMembers)

      expect(premisesClientFactory).toHaveBeenCalledWith(token)
      expect(premisesClient.getStaffMembers).toHaveBeenCalledWith(premisesId)
    })
  })

  describe('getRooms', () => {
    it('on success returns the rooms given a premises ID', async () => {
      const rooms = roomFactory.buildList(1)
      premisesClient.getRooms.mockResolvedValue(rooms)

      const result = await service.getRooms(token, premisesId)

      expect(result).toEqual(rooms)

      expect(premisesClientFactory).toHaveBeenCalledWith(token)
      expect(premisesClient.getRooms).toHaveBeenCalledWith(premisesId)
    })
  })

  describe('getBeds', () => {
    it('on success returns the beds given a premises ID', async () => {
      const beds = bedSummaryFactory.buildList(1)
      premisesClient.getBeds.mockResolvedValue(beds)

      const result = await service.getBeds(token, premisesId)

      expect(result).toEqual(beds)

      expect(premisesClientFactory).toHaveBeenCalledWith(token)
      expect(premisesClient.getBeds).toHaveBeenCalledWith(premisesId)
    })
  })

  describe('getBed', () => {
    it('on success returns a bed given a premises ID and bed ID', async () => {
      const bed = bedDetailFactory.build()
      premisesClient.getBed.mockResolvedValue(bed)

      const result = await service.getBed(token, premisesId, bed.id)

      expect(result).toEqual(bed)

      expect(premisesClientFactory).toHaveBeenCalledWith(token)
      expect(premisesClient.getBed).toHaveBeenCalledWith(premisesId, bed.id)
    })
  })

  describe('getRoom', () => {
    it('on success returns the room given a premises ID and room ID', async () => {
      const room = roomFactory.build()
      premisesClient.getRoom.mockResolvedValue(room)

      const result = await service.getRoom(token, premisesId, room.id)

      expect(result).toEqual(room)

      expect(premisesClientFactory).toHaveBeenCalledWith(token)
      expect(premisesClient.getRoom).toHaveBeenCalledWith(premisesId, room.id)
    })
  })

  describe('tableRows', () => {
    it('returns a table view of the premises', async () => {
      const premises1 = premisesFactory.build({ name: 'XYZ' })
      const premises2 = premisesFactory.build({ name: 'ABC' })
      const premises3 = premisesFactory.build({ name: 'GHI' })

      const premises = [premises1, premises2, premises3]
      premisesClient.all.mockResolvedValue(premises)

      const rows = await service.tableRows(token)

      expect(rows).toEqual([
        [
          {
            text: premises2.name,
          },
          {
            text: premises2.apCode,
          },
          {
            text: premises2.bedCount.toString(),
          },
          {
            html: `<a href="${paths.premises.show({
              premisesId: premises2.id,
            })}">View<span class="govuk-visually-hidden">about ${premises2.name}</span></a>`,
          },
        ],
        [
          {
            text: premises3.name,
          },
          {
            text: premises3.apCode,
          },
          {
            text: premises3.bedCount.toString(),
          },
          {
            html: `<a href="${paths.premises.show({
              premisesId: premises3.id,
            })}">View<span class="govuk-visually-hidden">about ${premises3.name}</span></a>`,
          },
        ],
        [
          {
            text: premises1.name,
          },
          {
            text: premises1.apCode,
          },
          {
            text: premises1.bedCount.toString(),
          },
          {
            html: `<a href="${paths.premises.show({
              premisesId: premises1.id,
            })}">View<span class="govuk-visually-hidden">about ${premises1.name}</span></a>`,
          },
        ],
      ])

      expect(premisesClientFactory).toHaveBeenCalledWith(token)
      expect(premisesClient.all).toHaveBeenCalled()
    })
  })

  describe('premisesSelectList', () => {
    it('returns the list mapped into the format required by the nunjucks macro and sorted alphabetically', async () => {
      const premisesA = premisesFactory.build({ name: 'a' })
      const premisesB = premisesFactory.build({ name: 'b' })
      const premisesC = premisesFactory.build({ name: 'c' })
      premisesClient.all.mockResolvedValue([premisesC, premisesB, premisesA])

      const result = await service.getPremisesSelectList(token)

      expect(result).toEqual([
        { text: premisesA.name, value: premisesA.id },
        { text: premisesB.name, value: premisesB.id },
        { text: premisesC.name, value: premisesC.id },
      ])

      expect(premisesClientFactory).toHaveBeenCalledWith(token)
      expect(premisesClient.all).toHaveBeenCalled()
    })
  })

  describe('getPremisesDetails', () => {
    it('returns a title and a summary list for a given Premises ID', async () => {
      const premises = premisesFactory.build({
        name: 'Test',
        apCode: 'ABC',
        postcode: 'SW1A 1AA',
        bedCount: 50,
        availableBedsForToday: 20,
      })
      premisesClient.find.mockResolvedValue(premises)

      const result = await service.getPremisesDetails(token, premises.id)

      expect(result).toEqual({
        name: 'Test',
        summaryList: {
          rows: [
            {
              key: { text: 'Code' },
              value: { text: 'ABC' },
            },
            {
              key: { text: 'Postcode' },
              value: { text: 'SW1A 1AA' },
            },
            {
              key: { text: 'Number of Beds' },
              value: { text: '50' },
            },
            {
              key: { text: 'Available Beds' },
              value: { text: '20' },
            },
          ],
        },
      })

      expect(premisesClient.find).toHaveBeenCalledWith(premises.id)

      expect(premisesClientFactory).toHaveBeenCalledWith(token)
      expect(premisesClient.find).toHaveBeenCalledWith(premises.id)
    })
  })

  describe('getOvercapacityMessage', () => {
    it('returns an empty string if not passed any dates', async () => {
      premisesClient.capacity.mockResolvedValue([])
      ;(getDateRangesWithNegativeBeds as jest.Mock).mockReturnValue([])

      const result = await service.getOvercapacityMessage(token, premisesId)

      expect(result).toBe('')
    })
    it('returns an empty string if passed dates that are not overcapacity', async () => {
      premisesClient.capacity.mockResolvedValue([
        dateCapacityFactory.build({ date: new Date(2023, 0, 1).toISOString(), availableBeds: 1 }),
        dateCapacityFactory.build({ date: new Date(2023, 1, 1).toISOString(), availableBeds: 2 }),
        dateCapacityFactory.build({ date: new Date(2023, 1, 2).toISOString(), availableBeds: 3 }),
        dateCapacityFactory.build({ date: new Date(2023, 2, 2).toISOString(), availableBeds: 4 }),
        dateCapacityFactory.build({ date: new Date(2023, 3, 2).toISOString(), availableBeds: 5 }),
      ])
      ;(getDateRangesWithNegativeBeds as jest.Mock).mockReturnValue([])

      const result = await service.getOvercapacityMessage(token, premisesId)

      expect(result).toBe('')
    })

    it('returns the correct string if passed a single date', async () => {
      const capacityStub = [
        dateCapacityFactory.build({
          date: new Date(2022, 0, 1).toISOString(),
          availableBeds: -1,
        }),
      ]
      premisesClient.capacity.mockResolvedValue(capacityStub)
      ;(getDateRangesWithNegativeBeds as jest.Mock).mockReturnValue([{ start: capacityStub[0].date }])

      const result = await service.getOvercapacityMessage(token, premisesId)

      expect(result).toEqual([
        '<h3 class="govuk-!-margin-top-0 govuk-!-margin-bottom-2">The premises is over capacity on Saturday 1 January 2022</h3>',
      ])
    })

    it('returns the correct string if passed a single date range', async () => {
      const capacityStub = [
        dateCapacityFactory.build({
          date: new Date(2022, 0, 1).toISOString(),
          availableBeds: -1,
        }),
        dateCapacityFactory.build({
          date: new Date(2022, 1, 1).toISOString(),
          availableBeds: -1,
        }),
      ]
      premisesClient.capacity.mockResolvedValue(capacityStub)
      ;(getDateRangesWithNegativeBeds as jest.Mock).mockReturnValue([
        {
          start: capacityStub[0].date,
          end: capacityStub[1].date,
        },
      ])

      const result = await service.getOvercapacityMessage(token, premisesId)

      expect(result).toEqual([
        '<h3 class="govuk-!-margin-top-0 govuk-!-margin-bottom-2">The premises is over capacity for the period Saturday 1 January 2022 to Tuesday 1 February 2022</h3>',
      ])
    })

    it('if there are multiple date ranges it returns the correct markup', async () => {
      const capacityStub = [
        dateCapacityFactory.build({ date: new Date(2023, 0, 1).toISOString(), availableBeds: -1 }),
        dateCapacityFactory.build({ date: new Date(2023, 1, 1).toISOString(), availableBeds: -1 }),
        dateCapacityFactory.build({ date: new Date(2023, 1, 2).toISOString(), availableBeds: 1 }),
        dateCapacityFactory.build({ date: new Date(2023, 2, 2).toISOString(), availableBeds: -1 }),
        dateCapacityFactory.build({ date: new Date(2023, 3, 2).toISOString(), availableBeds: -1 }),
      ]
      premisesClient.capacity.mockResolvedValue(capacityStub)
      ;(getDateRangesWithNegativeBeds as jest.Mock).mockReturnValue([
        {
          start: capacityStub[0].date,
          end: capacityStub[1].date,
        },
        {
          start: capacityStub[3].date,
          end: capacityStub[4].date,
        },
      ])

      const result = await service.getOvercapacityMessage(token, premisesId)

      expect(result).toEqual([
        `<h3 class="govuk-!-margin-top-0 govuk-!-margin-bottom-2">The premises is over capacity for the periods:</h3>
        <ul class="govuk-list govuk-list--bullet"><li>Sunday 1 January 2023 to Wednesday 1 February 2023</li><li>Thursday 2 March 2023 to Sunday 2 April 2023</li></ul>`,
      ])
    })

    it('if there is a date ranges and a single date it returns the correct markup', async () => {
      const capacityStub = [
        dateCapacityFactory.build({ date: new Date(2023, 0, 1).toISOString(), availableBeds: -1 }),
        dateCapacityFactory.build({ date: new Date(2023, 1, 2).toISOString(), availableBeds: 1 }),
        dateCapacityFactory.build({ date: new Date(2023, 2, 2).toISOString(), availableBeds: -1 }),
        dateCapacityFactory.build({ date: new Date(2023, 3, 2).toISOString(), availableBeds: -1 }),
      ]
      premisesClient.capacity.mockResolvedValue(capacityStub)
      ;(getDateRangesWithNegativeBeds as jest.Mock).mockReturnValue([
        {
          start: capacityStub[0].date,
        },
        {
          start: capacityStub[2].date,
          end: capacityStub[3].date,
        },
      ])
      const result = await service.getOvercapacityMessage(token, premisesId)

      expect(result).toEqual([
        `<h3 class="govuk-!-margin-top-0 govuk-!-margin-bottom-2">The premises is over capacity for the periods:</h3>
        <ul class="govuk-list govuk-list--bullet"><li>Sunday 1 January 2023</li><li>Thursday 2 March 2023 to Sunday 2 April 2023</li></ul>`,
      ])
    })
  })

  describe('getOccupancy', () => {
    it('returns the premises occupancy from the client', async () => {
      const occupancy = bedOccupancyRangeFactory.buildList(1)
      const startDate = '2020-01-01'
      const endDate = '2020-01-31'

      premisesClient.calendar.mockResolvedValue(occupancy)
      ;(mapApiOccupancyToUiOccupancy as jest.Mock).mockReturnValue(occupancy)

      const result = await service.getOccupancy(token, premisesId, startDate, endDate)

      expect(result).toEqual(occupancy)

      expect(premisesClientFactory).toHaveBeenCalledWith(token)
      expect(premisesClient.calendar).toHaveBeenCalledWith(premisesId, startDate, endDate)
    })
  })
})
