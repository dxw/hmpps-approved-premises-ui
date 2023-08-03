import {
  Application,
  ApprovedPremisesApplicationSummary as ApplicationSummary,
  ApprovedPremisesApplication,
  ApprovedPremisesAssessment,
  ArrayOfOASysOffenceDetailsQuestions,
  ArrayOfOASysRiskManagementPlanQuestions,
  ArrayOfOASysRiskOfSeriousHarmSummaryQuestions,
  ArrayOfOASysRiskToSelfQuestions,
  ArrayOfOASysSupportingInformationQuestions,
  ApprovedPremisesAssessment as Assessment,
  ApprovedPremisesAssessmentSummary as AssessmentSummary,
  AssessmentTask,
  BedOccupancyBookingEntry,
  BedOccupancyLostBedEntry,
  BedOccupancyOpenEntry,
  BedOccupancyRange,
  Booking,
  BookingAppealTask,
  Document,
  FlagsEnvelope,
  Mappa,
  OASysSection,
  Person,
  PersonAcctAlert,
  PlacementApplication,
  PlacementApplicationTask,
  PlacementApplicationTask,
  PlacementCriteria,
  PlacementRequest,
  PlacementRequestStatus,
  PlacementRequestTask,
  ReleaseTypeOption,
  RiskTier,
  RoshRisks,
  ApprovedPremisesUserRole as UserRole,
} from '@approved-premises/api'

interface TasklistPage {
  body: Record<string, unknown>
}
interface PersonService {}

// A utility type that allows us to define an object with a date attribute split into
// date, month, year (and optionally, time) attributes. Designed for use with the GOV.UK
// date input
export type ObjectWithDateParts<K extends string | number> = { [P in `${K}-${'year' | 'month' | 'day'}`]: string } & {
  [P in `${K}-time`]?: string
} & {
  [P in K]?: string
}

export type BookingStatus = 'arrived' | 'awaiting-arrival' | 'not-arrived' | 'departed' | 'cancelled'

export type TaskNames =
  | 'basic-information'
  | 'type-of-ap'
  | 'risk-management-features'
  | 'prison-information'
  | 'location-factors'
  | 'access-and-healthcare'
  | 'further-considerations'
  | 'move-on'
  | 'check-your-answers'

export type YesOrNoWithDetail<T extends string> = {
  [K in T]: YesOrNo
} & {
  [K in `${T}Detail`]: string
}

export type YesNoOrIDKWithDetail<T extends string> = {
  [K in T]: YesNoOrIDK
} & {
  [K in `${T}Detail`]: string
}

export type UiTask = {
  id: string
  title: string
  pages: Record<string, unknown>
}

export type TaskStatus = 'not_started' | 'in_progress' | 'complete' | 'cannot_start'

export type TaskWithStatus = UiTask & { status: TaskStatus }

export type FormSection = {
  title: string
  name: string
  tasks: Array<UiTask>
}

export type FormSections = Array<FormSection>

export type FormPages = { [key in TaskNames]: Record<string, unknown> }

export type PageResponse = Record<string, string | Array<string> | Array<Record<string, unknown>>>

export interface HtmlAttributes {
  [key: string]: string | number
}

export interface TextItem {
  text: string
}

export interface HtmlItem {
  html: string
}

export type TableCell =
  | { text: string; attributes?: HtmlAttributes; classes?: string }
  | { html: string; attributes?: HtmlAttributes }

export type TableRow = Array<TableCell>

export interface RadioItem {
  text: string
  value: string
  checked?: boolean
  conditional?: {
    html?: string
  }
}

export type CheckBoxItem =
  | {
      text: string
      value: string
      checked?: boolean
    }
  | CheckBoxDivider

export type CheckBoxDivider = { divider: string }

export interface SelectOption {
  text: string
  value: string
  selected?: boolean
}

export interface SummaryList {
  classes?: string
  attributes?: HtmlAttributes
  rows: Array<SummaryListItem>
}

export type SummaryListWithCard = SummaryList & {
  card: {
    title: { text: string }
    actions?: SummaryListActions
    attributes?: HtmlAttributes
  }
}

export interface SummaryListActionItem {
  href: string
  text: string
  visuallyHiddenText?: string
}

export interface SummaryListActions {
  items: Array<SummaryListActionItem>
}

export interface SummaryListItem {
  key: TextItem | HtmlItem
  value: TextItem | HtmlItem
  actions?: SummaryListActions
}

export interface IdentityBar {
  title: {
    html: string
  }
  menus: Array<IdentityBarMenu>
}

export interface IdentityBarMenu {
  items: Array<IdentityBarMenuItem>
}

export interface IdentityBarMenuItem {
  classes?: string
  href: string
  text: string
}

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Very High'

export type TierNumber = '1' | '2' | '3' | '4'
export type TierLetter = 'A' | 'B' | 'C' | 'D'
export type RiskTierLevel = `${TierLetter}${TierNumber}`

export type ApplicationType = 'Standard' | 'PIPE'

export interface ErrorMessage {
  text: string
  attributes: {
    [K: string]: boolean
  }
}

export interface ErrorMessages {
  [K: string]: ErrorMessage
}

export interface ErrorSummary {
  text?: string
  html?: string
  href?: string
}

export interface ErrorsAndUserInput {
  errorTitle?: string
  errors: ErrorMessages
  errorSummary: Array<string>
  userInput: Record<string, unknown>
}

export interface BespokeError {
  errorTitle: string
  errorSummary: Array<ErrorSummary>
}

export type TaskListErrors<K extends TasklistPage> = Partial<Record<keyof K['body'], unknown>>

export type YesOrNo = 'yes' | 'no'
export type YesNoOrIDK = YesOrNo | 'iDontKnow'

export type PersonStatus = 'InCustody' | 'InCommunity'

export interface ReferenceData {
  id: string
  name: string
  isActive: boolean
  serviceScope: string
}

export interface PersonRisksUI {
  roshRisks: RoshRisks
  tier: RiskTier
  flags: FlagsEnvelope['value']
  mappa: Mappa
}

export type GroupedListofBookings = {
  [K in 'arrivingToday' | 'departingToday' | 'upcomingArrivals' | 'upcomingDepartures']: Array<Booking>
}

export type DataServices = Partial<{
  personService: {
    getPrisonCaseNotes: (token: string, crn: string) => Promise<Array<PrisonCaseNote>>
    getAdjudications: (token: string, crn: string) => Promise<Array<Adjudication>>
    getAcctAlerts: (token: string, crn: string) => Promise<Array<PersonAcctAlert>>
    getOasysSelections: (token: string, crn: string) => Promise<Array<OASysSection>>
    getOasysSections: (token: string, crn: string, selectedSections?: Array<number>) => Promise<OASysSections>
    getPersonRisks: (token: string, crn: string) => Promise<PersonRisksUI>
  }
  applicationService: {
    getDocuments: (token: string, application: ApprovedPremisesApplication) => Promise<Array<Document>>
    findApplication: (token: string, id: string) => Promise<ApprovedPremisesApplication>
  }
  userService: {
    getUserById: (token: string, id: string) => Promise<User>
  }
  premisesService: {
    getAll: (token: string) => Promise<Array<Premises>>
  }
}>

export type AssessmentGroupingCategory = 'status' | 'allocation'

export type GroupedAssessments = {
  completed: Array<AssessmentSummary>
  requestedFurtherInformation: Array<AssessmentSummary>
  awaiting: Array<AssessmentSummary>
}

export interface AllocatedAndUnallocatedAssessments {
  allocated: Array<Assessment>
  unallocated: Array<Assessment>
}

export interface GroupedApplications {
  inProgress: Array<ApplicationSummary>
  requestedFurtherInformation: Array<ApplicationSummary>
  submitted: Array<ApplicationSummary>
}

export type GroupedPlacementRequests = Record<PlacementRequestStatus, Array<PlacementRequest>>

export type CategorisedTask = AssessmentTask | BookingAppealTask | PlacementApplicationTask | PlacementRequestTask

export type GroupedMatchTasks = Record<PlacementRequestStatus, Array<PlacementRequestTask>> & {
  placementApplications: Array<PlacementApplicationTask>
}

export interface ApplicationWithRisks extends Application {
  person: PersonWithRisks
}

export interface PersonWithRisks extends Person {
  risks: PersonRisks
}

export type OasysImportArrays =
  | ArrayOfOASysOffenceDetailsQuestions
  | ArrayOfOASysRiskOfSeriousHarmSummaryQuestions
  | ArrayOfOASysSupportingInformationQuestions
  | ArrayOfOASysRiskToSelfQuestions
  | ArrayOfOASysRiskManagementPlanQuestions

export type OasysSummariesSection = { [index: string]: OasysImportArrays }

export type JourneyType = 'applications' | 'assessments' | 'placement-applications'

export type ServiceSection = {
  id: string
  title: string
  description: string
  shortTitle: string
  href: string
}

export type UserDetails = {
  id: string
  name: string
  displayName: string
  roles: Array<UserRole>
}

export type PartnerAgencyDetails = {
  partnerAgencyName: string
  namedContact: string
  phoneNumber: string
  roleInPlan: string
}

export type ContingencyPlanQuestionId =
  | 'noReturn'
  | 'placementWithdrawn'
  | 'victimConsiderations'
  | 'unsuitableAddresses'
  | 'suitableAddresses'
  | 'breachInformation'
  | 'otherConsiderations'

export type ContingencyPlanQuestionsBody = Record<ContingencyPlanQuestionId, string>

type ContingencyPlanQuestion = {
  question: string
  hint?: string
  error: string
}

export type ContingencyPlanQuestionsRecord = Record<ContingencyPlanQuestionId, ContingencyPlanQuestion>

export interface BedSearchParametersUi {
  durationDays: string
  durationWeeks: string
  maxDistanceMiles: string
  startDate: string
  postcodeDistrict: string
  requiredCharacteristics: Array<PlacementCriteria>
  crn: string
  applicationId: string
  assessmentId: string
}

export type ReleaseTypeOptions = Record<ReleaseTypeOption, string>

export type FormArtifact = ApprovedPremisesApplication | ApprovedPremisesAssessment | PlacementApplication

type RemoveStartAndEndDates<T> = Omit<T, 'startDate' | 'endDate'>

interface StartAndEndDates {
  startDate: Date
  endDate: Date
}

export interface BedOccupancyBookingEntryUi extends RemoveStartAndEndDates<BedOccupancyBookingEntry>, StartAndEndDates {
  type: 'booking'
}

export interface BedOccupancyLostBedEntryUi extends RemoveStartAndEndDates<BedOccupancyLostBedEntry>, StartAndEndDates {
  type: 'lost_bed'
}

export interface BedOccupancyOpenEntryUi extends RemoveStartAndEndDates<BedOccupancyOpenEntry>, StartAndEndDates {
  type: 'open'
}

export interface BedOccupancyOverbookingEntryUi extends StartAndEndDates {
  length: number
  type: 'overbooking'
  items: Array<BedOccupancyEntryUi>
}

export type BedOccupancyEntryTypes =
  | BedOccupancyBookingEntryUi
  | BedOccupancyLostBedEntryUi
  | BedOccupancyOpenEntryUi
  | BedOccupancyOverbookingEntryUi

export type BedOccupancyEntryUiType = 'open' | 'lost_bed' | 'booking' | 'overbooking'

export type BedOccupancyEntryUi = BedOccupancyEntryTypes & { type: BedOccupancyEntryUiType }

export type BedOccupancyEntryCalendar = BedOccupancyEntryUi & { label: string }

export type BedOccupancyRangeUi = Omit<BedOccupancyRange, 'schedule'> & { schedule: Array<BedOccupancyEntryUi> }

export interface OasysPage extends TasklistPage {
  oasysCompleted: string
  risks: PersonRisksUI
  oasysSuccess: boolean
}

export type PaginatedResponse<T> = {
  data: Array<T>
  pageNumber: string
  totalPages: string
  totalResults: string
  pageSize: string
}
