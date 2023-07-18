import type { SummaryList, TableRow } from '@approved-premises/ui'
import type { ApprovedPremises, BedDetail, BedSummary, Premises, Room, StaffMember } from '@approved-premises/api'
import type { PremisesClient, RestClientBuilder } from '../data'
import paths from '../paths/manage'

import { DateFormats } from '../utils/dateUtils'
import getDateRangesWithNegativeBeds, { NegativeDateRange, mapApiOccupancyToUiOccupancy } from '../utils/premisesUtils'

export default class PremisesService {
  constructor(private readonly premisesClientFactory: RestClientBuilder<PremisesClient>) {}

  async getStaffMembers(token: string, premisesId: string): Promise<Array<StaffMember>> {
    const premisesClient = this.premisesClientFactory(token)

    const staffMembers = await premisesClient.getStaffMembers(premisesId)

    return staffMembers
  }

  async getRooms(token: string, premisesId: string): Promise<Array<Room>> {
    const premisesClient = this.premisesClientFactory(token)

    const rooms = await premisesClient.getRooms(premisesId)

    return rooms
  }

  async getBeds(token: string, premisesId: string): Promise<Array<BedSummary>> {
    const premisesClient = this.premisesClientFactory(token)

    return premisesClient.getBeds(premisesId)
  }

  async getBed(token: string, premisesId: string, bedId: string): Promise<BedDetail> {
    const premisesClient = this.premisesClientFactory(token)

    return premisesClient.getBed(premisesId, bedId)
  }

  async getRoom(token: string, premisesId: string, roomId: string): Promise<Room> {
    const premisesClient = this.premisesClientFactory(token)

    const room = await premisesClient.getRoom(premisesId, roomId)

    return room
  }

  async tableRows(token: string): Promise<Array<TableRow>> {
    const premisesClient = this.premisesClientFactory(token)
    const premises = await premisesClient.all()

    return premises
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p: ApprovedPremises) => {
        return [
          this.textValue(p.name),
          this.textValue(p.apCode),
          this.textValue(p.bedCount.toString()),
          this.htmlValue(
            `<a href="${paths.premises.show({ premisesId: p.id })}">View<span class="govuk-visually-hidden">about ${
              p.name
            }</span></a>`,
          ),
        ]
      })
  }

  async find(token: string, id: string): Promise<Premises> {
    const premisesClient = this.premisesClientFactory(token)
    const premises = await premisesClient.find(id)

    return premises
  }

  async getPremisesDetails(token: string, id: string): Promise<{ name: string; summaryList: SummaryList }> {
    const premisesClient = this.premisesClientFactory(token)
    const premises = await premisesClient.find(id)
    const summaryList = await this.summaryListForPremises(premises)

    return { name: premises.name, summaryList }
  }

  async getOvercapacityMessage(token: string, premisesId: string): Promise<Array<string> | string> {
    const premisesClient = this.premisesClientFactory(token)
    const premisesDateCapacities = await premisesClient.capacity(premisesId)

    const overcapacityDateRanges = getDateRangesWithNegativeBeds(premisesDateCapacities)

    const overcapacityMessage = this.generateOvercapacityMessage(overcapacityDateRanges)

    return overcapacityMessage ? [overcapacityMessage] : ''
  }

  async getOccupancy(token: string, premisesId: string, startDate: string, endDate: string) {
    const premisesClient = this.premisesClientFactory(token)
    const apiOccupancy = await premisesClient.calendar(premisesId, startDate, endDate)
    const occupancyForUi = await mapApiOccupancyToUiOccupancy(apiOccupancy)

    return occupancyForUi
  }

  private generateOvercapacityMessage(overcapacityDateRanges: Array<NegativeDateRange>) {
    if (overcapacityDateRanges.length === 1) {
      if (!overcapacityDateRanges[0].end) {
        return `<h3 class="govuk-!-margin-top-0 govuk-!-margin-bottom-2">The premises is over capacity on ${DateFormats.isoDateToUIDate(
          overcapacityDateRanges[0].start,
        )}</h3>`
      }
      return `<h3 class="govuk-!-margin-top-0 govuk-!-margin-bottom-2">The premises is over capacity for the period ${DateFormats.isoDateToUIDate(
        overcapacityDateRanges[0].start,
      )} to ${DateFormats.isoDateToUIDate(overcapacityDateRanges[0].end)}</h3>`
    }

    if (overcapacityDateRanges.length > 1) {
      const dateRanges = overcapacityDateRanges
        .map((dateRange: NegativeDateRange) =>
          !dateRange.end
            ? `<li>${DateFormats.isoDateToUIDate(dateRange.start)}</li>`
            : `<li>${DateFormats.isoDateToUIDate(dateRange.start)} to ${DateFormats.isoDateToUIDate(
                dateRange.end,
              )}</li>`,
        )
        .join('')
      return `<h3 class="govuk-!-margin-top-0 govuk-!-margin-bottom-2">The premises is over capacity for the periods:</h3>
        <ul class="govuk-list govuk-list--bullet">${dateRanges}</ul>`
    }
    return ''
  }

  /**
   * getPremisesSelectList
   * @deprecated per ADR-0008: manipulation of view data should happen in the views
   */
  async getPremisesSelectList(token: string): Promise<Array<{ text: string; value: string }>> {
    const premisesClient = this.premisesClientFactory(token)
    const premises = await premisesClient.all()

    return premises
      .map(singlePremises => {
        return { text: `${singlePremises.name}`, value: `${singlePremises.id}` }
      })
      .sort((a, b) => {
        if (a.text < b.text) {
          return -1
        }
        if (a.text > b.text) {
          return 1
        }
        return 0
      })
  }

  async summaryListForPremises(premises: ApprovedPremises): Promise<SummaryList> {
    return {
      rows: [
        {
          key: this.textValue('Code'),
          value: this.textValue(premises.apCode),
        },
        {
          key: this.textValue('Postcode'),
          value: this.textValue(premises.postcode),
        },
        {
          key: this.textValue('Number of Beds'),
          value: this.textValue(premises.bedCount.toString()),
        },
        {
          key: this.textValue('Available Beds'),
          value: this.textValue(premises.availableBedsForToday.toString()),
        },
      ],
    }
  }

  private textValue(value: string) {
    return { text: value }
  }

  private htmlValue(value: string) {
    return { html: value }
  }
}
