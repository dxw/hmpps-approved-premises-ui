import {
  ActiveOffence,
  Adjudication,
  ApprovedPremisesApplication as Application,
  ArrayOfOASysOffenceDetailsQuestions,
  ArrayOfOASysRiskManagementPlanQuestions,
  ArrayOfOASysRiskOfSeriousHarmSummaryQuestions,
  ArrayOfOASysRiskToSelfQuestions,
  ArrayOfOASysSupportingInformationQuestions,
  Document,
  OASysSection,
  Person,
  PrisonCaseNote,
} from '@approved-premises/api'
import { PersonRisksUI } from '@approved-premises/ui'

import {
  AccessNeedsMobilityPage,
  AccessNeedsPage,
  ArsonPage,
  AttachDocumentsPage,
  CaseNotesPage,
  CateringPage,
  CheckYourAnswersPage,
  ComplexCaseBoard,
  ConfirmDetailsPage,
  ConvictedOffences,
  CovidPage,
  DateOfOffence,
  DescribeLocationFactors,
  EnterCRNPage,
  ForeignNationalPage,
  OffenceDetailsPage,
  OptionalOasysSectionsPage,
  PlacementDurationPage,
  PlacementPurposePage,
  PlacementStartPage,
  PlansInPlacePage,
  PreviousPlacements,
  RehabilitativeInterventions,
  ReleaseDatePage,
  RelocationRegionPage,
  RiskManagementFeatures,
  RiskManagementPlanPage,
  RiskToSelfPage,
  RoomSharingPage,
  RoshSummaryPage,
  SentenceTypePage,
  SituationPage,
  StartPage,
  SupportingInformationPage,
  TaskListPage,
  TypeOfAccommodationPage,
  TypeOfApPage,
  TypeOfConvictedOffence,
  VulnerabilityPage,
} from '../pages/apply'

import Page from '../pages'

import adjudicationsFactory from '../../server/testutils/factories/adjudication'
import documentFactory from '../../server/testutils/factories/document'
import oasysSectionsFactory from '../../server/testutils/factories/oasysSections'
import oasysSelectionFactory from '../../server/testutils/factories/oasysSelection'
import prisonCaseNotesFactory from '../../server/testutils/factories/prisonCaseNotes'

import {
  offenceDetailSummariesFromApplication,
  riskManagementPlanFromApplication,
  riskToSelfSummariesFromApplication,
  roshSummariesFromApplication,
  supportInformationFromApplication,
} from './index'
import ApplyPage from '../pages/apply/applyPage'
import { documentsFromApplication } from '../../server/utils/assessments/documentUtils'
import IsExceptionalCasePage from '../pages/apply/isExceptionalCase'
import ExceptionDetailsPage from '../pages/apply/ExceptionDetails'

export default class ApplyHelper {
  pages = {
    basicInformation: [] as Array<ApplyPage>,
    typeOfAp: [] as Array<ApplyPage>,
    oasys: [] as Array<ApplyPage>,
    riskManagement: [] as Array<ApplyPage>,
    locationFactors: [] as Array<ApplyPage>,
    accessAndHealthcare: [] as Array<ApplyPage>,
    furtherConsiderations: [] as Array<ApplyPage>,
    moveOn: [] as Array<ApplyPage>,
  }

  uiRisks?: PersonRisksUI

  oasysSectionsLinkedToReoffending: Array<OASysSection> = []

  otherOasysSections: Array<OASysSection> = []

  roshSummaries: ArrayOfOASysRiskOfSeriousHarmSummaryQuestions = []

  offenceDetailSummaries: ArrayOfOASysOffenceDetailsQuestions = []

  supportingInformationSummaries: ArrayOfOASysSupportingInformationQuestions = []

  riskManagementPlanSummaries: ArrayOfOASysRiskManagementPlanQuestions = []

  riskToSelfSummaries: ArrayOfOASysRiskToSelfQuestions = []

  selectedPrisonCaseNotes: Array<PrisonCaseNote> = []

  adjudications: Array<Adjudication> = []

  moreDetail = 'Some detail'

  documents: Array<Document> = []

  selectedDocuments: Array<Document> = []

  constructor(
    private readonly application: Application,
    private readonly person: Person,
    private readonly offences: Array<ActiveOffence>,
    private readonly type: 'e2e' | 'integration',
  ) {}

  initializeE2e(oasysSectionsLinkedToReoffending: Array<OASysSection>, otherOasysSections: Array<OASysSection>) {
    this.oasysSectionsLinkedToReoffending = oasysSectionsLinkedToReoffending
    this.otherOasysSections = otherOasysSections
  }

  setupApplicationStubs(uiRisks?: PersonRisksUI) {
    this.uiRisks = uiRisks
    this.stubPersonEndpoints()
    this.stubApplicationEndpoints()
    this.stubOasysEndpoints()
    this.stubPrisonCaseNoteEndpoints()
    this.stubAdjudicationEndpoints()
    this.stubDocumentEndpoints()
    this.stubOffences()
  }

  startApplication() {
    // Given I visit the start page
    const startPage = StartPage.visit()
    startPage.startApplication()

    // And I complete the first step
    const crnPage = new EnterCRNPage()
    crnPage.enterCrn(this.person.crn)
    crnPage.clickSubmit()

    // And I see the person on the confirmation page
    const confirmDetailsPage = new ConfirmDetailsPage(this.person)
    confirmDetailsPage.verifyPersonIsVisible()

    // And I confirm the person is who I expect to see
    confirmDetailsPage.clickSubmit()
  }

  completeApplication(isExceptionalCase?: boolean) {
    if (isExceptionalCase) {
      this.completeExceptionalCase()
    }
    this.completeBasicInformation()
    this.completeTypeOfApSection()
    this.completeOasysSection()
    this.completeRiskManagementSection()
    this.completePrisonInformationSection()
    this.completeAccessAndHealthcareSection()
    this.completeFurtherConsiderationsSection()
    this.completeMoveOnSection()
    this.completeDocumentsSection()
    this.completeCheckYourAnswersSection()
    this.submitApplication()
  }

  numberOfPages() {
    return [
      ...this.pages.basicInformation,
      ...this.pages.typeOfAp,
      ...this.pages.oasys,
      ...this.pages.riskManagement,
      ...this.selectedPrisonCaseNotes,
      ...this.pages.locationFactors,
      ...this.pages.accessAndHealthcare,
      ...this.pages.furtherConsiderations,
      ...this.pages.moveOn,
      ...this.selectedDocuments,
    ].length
  }

  private stubPersonEndpoints() {
    cy.task('stubPersonRisks', { person: this.person, risks: this.application.risks })
    cy.task('stubFindPerson', { person: this.person })
  }

  private stubOffences() {
    cy.task('stubPersonOffences', { person: this.person, offences: this.offences })
  }

  private stubApplicationEndpoints() {
    // Given I can create an application
    cy.task('stubApplicationCreate', { application: this.application })
    cy.task('stubApplicationUpdate', { application: this.application })
    cy.task('stubApplicationGet', { application: this.application })
  }

  private stubOasysEndpoints() {
    // And there are OASys sections in the db
    const oasysSelectionA = oasysSelectionFactory.needsLinkedToReoffending().build({
      section: 1,
      name: 'accommodation',
    })
    const oasysSelectionB = oasysSelectionFactory.needsLinkedToReoffending().build({
      section: 2,
      name: 'relationships',
      linkedToHarm: false,
      linkedToReOffending: true,
    })
    const oasysSelectionC = oasysSelectionFactory.needsNotLinkedToReoffending().build({
      section: 3,
      name: 'emotional',
      linkedToHarm: false,
      linkedToReOffending: false,
    })
    const oasysSelectionD = oasysSelectionFactory.needsNotLinkedToReoffending().build({
      section: 4,
      name: 'thinking',
      linkedToHarm: false,
      linkedToReOffending: false,
    })

    this.oasysSectionsLinkedToReoffending = [oasysSelectionA, oasysSelectionB]
    this.otherOasysSections = [oasysSelectionC, oasysSelectionD]

    const oasysSelection = [...this.oasysSectionsLinkedToReoffending, ...this.otherOasysSections]

    cy.task('stubOasysSelection', { person: this.person, oasysSelection })

    const oasysSections = oasysSectionsFactory.build()

    this.roshSummaries = roshSummariesFromApplication(this.application)
    this.offenceDetailSummaries = offenceDetailSummariesFromApplication(this.application)
    this.supportingInformationSummaries = supportInformationFromApplication(this.application)
    this.riskManagementPlanSummaries = riskManagementPlanFromApplication(this.application)
    this.riskToSelfSummaries = riskToSelfSummariesFromApplication(this.application)

    cy.task('stubOasysSections', {
      person: this.person,
      oasysSections: {
        ...oasysSections,
        roshSummary: this.roshSummaries,
        offenceDetails: this.offenceDetailSummaries,
        riskManagementPlan: this.riskManagementPlanSummaries,
        riskToSelf: this.riskToSelfSummaries,
      },
    })
    cy.task('stubOasysSectionsWithSelectedSections', {
      person: this.person,
      oasysSections: {
        ...oasysSections,
        roshSummary: this.roshSummaries,
        offenceDetails: this.offenceDetailSummaries,
        supportingInformation: this.supportingInformationSummaries,
      },
      selectedSections: [1, 2, 3, 4],
    })
  }

  private stubPrisonCaseNoteEndpoints() {
    // And there is prison case notes for the person in the DB
    const prisonCaseNote1 = prisonCaseNotesFactory.build({
      authorName: 'Denise Collins',
      id: 'a30173ca-061f-42c9-a1a2-28c70b282d3f',
      createdAt: '2022-11-10',
      occurredAt: '2022-10-19',
      sensitive: false,
      subType: 'Ressettlement',
      type: 'Social Care',
      note: 'Note 1',
    })
    const prisonCaseNote2 = prisonCaseNotesFactory.build({
      authorName: 'Leticia Mann',
      id: '4a477187-b77f-4fcc-a919-43a6633ee868',
      createdAt: '2022-07-24',
      occurredAt: '2022-09-22',
      sensitive: true,
      subType: 'Quality Work',
      type: 'General',
      note: 'Note 2',
    })
    const prisonCaseNote3 = prisonCaseNotesFactory.build()
    const prisonCaseNotes = [prisonCaseNote1, prisonCaseNote2, prisonCaseNote3]

    this.selectedPrisonCaseNotes = [prisonCaseNote1, prisonCaseNote2]

    cy.task('stubPrisonCaseNotes', { prisonCaseNotes, person: this.person })
  }

  private stubAdjudicationEndpoints() {
    const adjudication1 = adjudicationsFactory.build({
      id: 69927,
      reportedAt: '2022-10-09',
      establishment: 'Hawthorne',
      offenceDescription: 'Nam vel nisi fugiat veniam possimus omnis.',
      hearingHeld: false,
      finding: 'NOT_PROVED',
    })
    const adjudication2 = adjudicationsFactory.build({
      id: 39963,
      reportedAt: '2022-07-10',
      establishment: 'Oklahoma City',
      offenceDescription: 'Illum maxime enim explicabo soluta sequi voluptas.',
      hearingHeld: true,
      finding: 'PROVED',
    })
    const adjudication3 = adjudicationsFactory.build({
      id: 77431,
      reportedAt: '2022-05-30',
      establishment: 'Jurupa Valley',
      offenceDescription: 'Quis porro nemo voluptates doloribus atque quis provident iure.',
      hearingHeld: false,
      finding: 'PROVED',
    })

    this.adjudications = [adjudication1, adjudication2, adjudication3]
    this.moreDetail = 'some details'

    cy.task('stubAdjudications', { adjudications: this.adjudications, person: this.person })
  }

  private stubDocumentEndpoints() {
    // And there are documents in the database
    this.selectedDocuments = documentsFromApplication(this.application)
    this.documents = [this.selectedDocuments, documentFactory.buildList(4)].flat()

    cy.task('stubApplicationDocuments', { application: this.application, documents: this.documents })
    this.documents.forEach(document => {
      cy.task('stubPersonDocument', { person: this.person, document })
    })

    // And the application exists in the database
    cy.task('stubApplicationSubmit', { application: this.application })
  }

  completeExceptionalCase() {
    const isExceptionalCasePage = new IsExceptionalCasePage()

    isExceptionalCasePage.completeForm('yes')
    isExceptionalCasePage.clickSubmit()

    const exceptionDetailsPage = new ExceptionDetailsPage()

    exceptionDetailsPage.completeForm()
    exceptionDetailsPage.clickSubmit()
  }

  completeBasicInformation() {
    const sentenceTypePage = new SentenceTypePage(this.application)
    sentenceTypePage.completeForm()
    sentenceTypePage.clickSubmit()

    const situationPage = new SituationPage(this.application)
    situationPage.completeForm()
    situationPage.clickSubmit()

    const releaseDatePage = new ReleaseDatePage(this.application)
    releaseDatePage.completeForm()
    releaseDatePage.clickSubmit()

    const placementStartPage = new PlacementStartPage(this.application)
    placementStartPage.completeForm()
    placementStartPage.clickSubmit()

    const placementPurposePage = new PlacementPurposePage(this.application)
    placementPurposePage.completeForm()
    placementPurposePage.clickSubmit()

    this.pages.basicInformation = [sentenceTypePage, releaseDatePage, placementStartPage, placementPurposePage]

    // Then I should be redirected to the task list
    const tasklistPage = Page.verifyOnPage(TaskListPage)

    // And the task should be marked as completed
    tasklistPage.shouldShowTaskStatus('basic-information', 'Completed')

    // And the next task should be marked as not started
    tasklistPage.shouldShowTaskStatus('type-of-ap', 'Not started')

    // And the risk widgets should be visible
    if (this.uiRisks) {
      tasklistPage.shouldShowRiskWidgets(this.uiRisks)
    }
  }

  private completeTypeOfApSection() {
    // And I should be able to start the next task
    cy.get('[data-cy-task-name="type-of-ap"]').click()
    Page.verifyOnPage(TypeOfApPage, this.application)

    // Given I am on the Type of AP Page
    const typeOfApPage = new TypeOfApPage(this.application)

    // When I complete the form and click submit
    typeOfApPage.completeForm()
    typeOfApPage.clickSubmit()

    this.pages.typeOfAp = [typeOfApPage]

    // Then I should be redirected to the task list
    const tasklistPage = Page.verifyOnPage(TaskListPage)

    // Then the Type of AP task should show as completed
    tasklistPage.shouldShowTaskStatus('type-of-ap', 'Completed')

    // And the OASys import task should show as not started
    tasklistPage.shouldShowTaskStatus('oasys-import', 'Not started')
  }

  private completeOasysSection() {
    // Given I click the 'Import Oasys' task
    cy.get('[data-cy-task-name="oasys-import"]').click()
    const optionalOasysImportPage = new OptionalOasysSectionsPage(this.application)

    // When I complete the form
    optionalOasysImportPage.completeForm(this.oasysSectionsLinkedToReoffending, this.otherOasysSections)
    optionalOasysImportPage.clickSubmit()

    const roshSummaryPage = new RoshSummaryPage(this.application, this.roshSummaries)

    if (this.uiRisks) {
      roshSummaryPage.shouldShowRiskWidgets(this.uiRisks)
    }

    roshSummaryPage.completeForm()

    roshSummaryPage.clickSubmit()

    const offenceDetailsPage = new OffenceDetailsPage(this.application, this.offenceDetailSummaries)

    if (this.uiRisks) {
      offenceDetailsPage.shouldShowRiskWidgets(this.uiRisks)
    }

    offenceDetailsPage.completeForm()
    offenceDetailsPage.clickSubmit()

    const supportingInformationPage = new SupportingInformationPage(
      this.application,
      this.supportingInformationSummaries,
    )
    supportingInformationPage.completeForm()
    supportingInformationPage.clickSubmit()

    const riskManagementPlanPage = new RiskManagementPlanPage(this.application, this.riskManagementPlanSummaries)
    riskManagementPlanPage.completeForm()
    riskManagementPlanPage.clickSubmit()

    const riskToSelfPage = new RiskToSelfPage(this.application, this.riskToSelfSummaries)
    riskToSelfPage.completeForm()
    riskToSelfPage.clickSubmit()

    this.pages.oasys = [
      optionalOasysImportPage,
      roshSummaryPage,
      offenceDetailsPage,
      supportingInformationPage,
      riskManagementPlanPage,
      riskToSelfPage,
    ]

    // Then I should be redirected to the task list
    const tasklistPage = Page.verifyOnPage(TaskListPage)

    // Then I should be taken back to the tasklist
    tasklistPage.shouldShowTaskStatus('oasys-import', 'Completed')

    // And the Risk Management Features task should show as not started
    tasklistPage.shouldShowTaskStatus('risk-management-features', 'Not started')
  }

  private completeRiskManagementSection() {
    // Given I click the 'Add detail about managing risks and needs' task
    cy.get('[data-cy-task-name="risk-management-features"]').click()

    // When I complete the form
    const riskManagementFeaturesPage = new RiskManagementFeatures(this.application)
    riskManagementFeaturesPage.completeForm()
    riskManagementFeaturesPage.clickSubmit()

    const convictedOffencesPage = new ConvictedOffences(this.application)
    convictedOffencesPage.completeForm()
    convictedOffencesPage.clickSubmit()

    const typeOfConvictedOffencePage = new TypeOfConvictedOffence(this.application)
    typeOfConvictedOffencePage.completeForm()
    typeOfConvictedOffencePage.clickSubmit()

    const dateOfOffencePage = new DateOfOffence(this.application)
    dateOfOffencePage.completeForm()
    dateOfOffencePage.clickSubmit()

    const rehabilitativeInterventionsPage = new RehabilitativeInterventions(this.application)
    rehabilitativeInterventionsPage.completeForm()
    rehabilitativeInterventionsPage.clickSubmit()

    this.pages.riskManagement = [
      riskManagementFeaturesPage,
      convictedOffencesPage,
      typeOfConvictedOffencePage,
      dateOfOffencePage,
      rehabilitativeInterventionsPage,
    ]

    // Then I should be redirected to the task list
    const tasklistPage = Page.verifyOnPage(TaskListPage)

    // And the risk management task should show a completed status
    tasklistPage.shouldShowTaskStatus('risk-management-features', 'Completed')
  }

  private completePrisonInformationSection() {
    // And I click the 'Review prison information' task
    cy.get('[data-cy-task-name="prison-information"]').click()

    const caseNotesPage = new CaseNotesPage(this.application, this.selectedPrisonCaseNotes)
    caseNotesPage.shouldDisplayAdjudications(this.adjudications)
    caseNotesPage.completeForm(this.moreDetail)
    caseNotesPage.clickSubmit()

    // Given I click the 'Describe location factors' task
    cy.get('[data-cy-task-name="location-factors"]').click()

    // When I complete the form
    const describeLocationFactorsPage = new DescribeLocationFactors(this.application)
    describeLocationFactorsPage.completeForm()
    describeLocationFactorsPage.clickSubmit()

    this.pages.locationFactors = [describeLocationFactorsPage]

    // Then I should be taken back to the task list
    const tasklistPage = Page.verifyOnPage(TaskListPage)

    // And the location factors task should show a completed status
    tasklistPage.shouldShowTaskStatus('location-factors', 'Completed')
  }

  private completeAccessAndHealthcareSection() {
    // Given I click the 'Provide access and healthcare information' task
    cy.get('[data-cy-task-name="access-and-healthcare"]').click()

    // When I complete the form
    const accessNeedsPage = new AccessNeedsPage(this.application)
    accessNeedsPage.completeForm()
    accessNeedsPage.clickSubmit()

    const accessNeedsMobilityPage = new AccessNeedsMobilityPage(this.application)
    accessNeedsMobilityPage.completeForm()
    accessNeedsMobilityPage.clickSubmit()

    const covidPage = new CovidPage(this.application)
    covidPage.completeForm()
    covidPage.clickSubmit()

    this.pages.accessAndHealthcare = [accessNeedsPage, accessNeedsMobilityPage, covidPage]

    // Then I should be taken back to the task list
    const tasklistPage = Page.verifyOnPage(TaskListPage)

    // And the access and healthcare task should show a completed status
    tasklistPage.shouldShowTaskStatus('access-and-healthcare', 'Completed')
  }

  private completeFurtherConsiderationsSection() {
    // Given I click the 'Detail further considerations for placement' task
    cy.get('[data-cy-task-name="further-considerations"]').click()

    // And I complete the Room Sharing page
    const roomSharingPage = new RoomSharingPage(this.application)
    roomSharingPage.completeForm()
    roomSharingPage.clickSubmit()

    // And I complete the Vulnerability page
    const vulnerabilityPage = new VulnerabilityPage(this.application)
    vulnerabilityPage.completeForm()
    vulnerabilityPage.clickSubmit()

    // And I complete the Previous Placements page
    const previousPlacementsPage = new PreviousPlacements(this.application)
    previousPlacementsPage.completeForm()
    previousPlacementsPage.clickSubmit()

    // And I complete the Complex Case Board page
    const complexCaseBoardPage = new ComplexCaseBoard(this.application)
    complexCaseBoardPage.completeForm()
    complexCaseBoardPage.clickSubmit()

    // And I complete the Catering page
    const cateringPage = new CateringPage(this.application)
    cateringPage.completeForm()
    cateringPage.clickSubmit()

    // And I complete the Arson page
    const arsonPage = new ArsonPage(this.application)
    arsonPage.completeForm()
    arsonPage.clickSubmit()

    this.pages.furtherConsiderations = [
      roomSharingPage,
      vulnerabilityPage,
      previousPlacementsPage,
      complexCaseBoardPage,
      cateringPage,
      arsonPage,
    ]

    // Then I should be taken back to the task list
    const tasklistPage = Page.verifyOnPage(TaskListPage)

    // And the further considerations task should show a completed status
    tasklistPage.shouldShowTaskStatus('further-considerations', 'Completed')
  }

  private completeMoveOnSection() {
    // Given I click the 'Add move on information' task
    cy.get('[data-cy-task-name="move-on"]').click()

    // And I complete the Placement Duration page
    const placementDurationPage = new PlacementDurationPage(this.application)
    placementDurationPage.completeForm()
    placementDurationPage.clickSubmit()

    // And I complete the relocation region page
    const relocationRegion = new RelocationRegionPage(this.application)
    relocationRegion.completeForm()
    relocationRegion.clickSubmit()

    // And I complete the plans in place page
    const plansInPlacePage = new PlansInPlacePage(this.application)
    plansInPlacePage.completeForm()
    plansInPlacePage.clickSubmit()

    // And I complete the type of accommodation page
    const typeOfAccommodationPage = new TypeOfAccommodationPage(this.application)
    typeOfAccommodationPage.completeForm()
    typeOfAccommodationPage.clickSubmit()

    const foreignNationalPage = new ForeignNationalPage(this.application)
    foreignNationalPage.completeForm()
    foreignNationalPage.clickSubmit()

    this.pages.moveOn = [
      placementDurationPage,
      relocationRegion,
      plansInPlacePage,
      typeOfAccommodationPage,
      foreignNationalPage,
    ]

    // Then I should be taken back to the task list
    const tasklistPage = Page.verifyOnPage(TaskListPage)

    // And the move on information task should show a completed status
    tasklistPage.shouldShowTaskStatus('move-on', 'Completed')
  }

  private completeDocumentsSection() {
    // Given I click on the Attach Documents task
    cy.get('[data-cy-task-name="attach-required-documents"]').click()
    const attachDocumentsPage = new AttachDocumentsPage(this.documents, this.selectedDocuments, this.application)

    // Then I should be able to download the documents
    attachDocumentsPage.shouldBeAbleToDownloadDocuments(this.documents)

    // And I attach the relevant documents
    attachDocumentsPage.shouldDisplayDocuments()
    attachDocumentsPage.completeForm()
    attachDocumentsPage.clickSubmit()

    // Then I should be taken back to the task list
    const tasklistPage = Page.verifyOnPage(TaskListPage)

    // And the Attach Documents task should show a completed status
    tasklistPage.shouldShowTaskStatus('attach-required-documents', 'Completed')
  }

  private completeCheckYourAnswersSection() {
    // Given I click the check your answers task
    cy.get('[data-cy-task-name="check-your-answers"]').click()

    // Then I should be on the check your answers page
    const checkYourAnswersPage = new CheckYourAnswersPage(this.application)

    // And the page should be populated with my answers
    checkYourAnswersPage.shouldShowPersonInformation(this.person)
    checkYourAnswersPage.shouldShowBasicInformationAnswers(this.pages.basicInformation)
    checkYourAnswersPage.shouldShowTypeOfApAnswers(this.pages.typeOfAp)
    checkYourAnswersPage.shouldShowRiskManagementAnswers(this.pages.riskManagement)
    checkYourAnswersPage.shouldShowLocationFactorsAnswers(this.pages.locationFactors)
    checkYourAnswersPage.shouldShowAccessAndHealthcareAnswers(this.pages.accessAndHealthcare)
    checkYourAnswersPage.shouldShowFurtherConsiderationsAnswers(this.pages.furtherConsiderations)
    checkYourAnswersPage.shouldShowMoveOnAnswers(this.pages.moveOn)
    checkYourAnswersPage.shouldShowDocuments(this.selectedDocuments)

    // Skip the external system checks for e2e and setup is too complex and brittle
    if (this.type === 'integration') {
      checkYourAnswersPage.shouldShowOptionalOasysSectionsAnswers(this.pages.oasys)
      checkYourAnswersPage.shouldShowCaseNotes(this.selectedPrisonCaseNotes)
      checkYourAnswersPage.shouldShowAdjudications(this.adjudications)
    }

    // When I have checked my answers
    checkYourAnswersPage.clickSubmit()

    // Then I should be taken back to the task list
    const tasklistPage = Page.verifyOnPage(TaskListPage)

    // And the check your answers task should show a completed status
    tasklistPage.shouldShowTaskStatus('check-your-answers', 'Completed')
  }

  private submitApplication() {
    const tasklistPage = Page.verifyOnPage(TaskListPage)
    tasklistPage.checkCheckboxByLabel('submit')

    tasklistPage.clickSubmit()
  }
}
