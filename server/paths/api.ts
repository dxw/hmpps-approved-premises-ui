import { path } from 'static-path'

const premisesPath = path('/premises')
const singlePremisesPath = premisesPath.path(':premisesId')

const lostBedsPath = singlePremisesPath.path('lost-beds')

const bedsPath = singlePremisesPath.path('beds')

const bookingPath = singlePremisesPath.path('bookings/:bookingId')

const managePaths = {
  premises: {
    index: premisesPath,
    show: singlePremisesPath,
  },
  lostBeds: {
    create: lostBedsPath,
    index: lostBedsPath,
    show: lostBedsPath.path(':id'),
    update: lostBedsPath.path(':id'),
  },
  beds: {
    index: bedsPath,
    show: bedsPath.path(':bedId'),
  },
  rooms: singlePremisesPath.path('rooms'),
  room: singlePremisesPath.path('rooms/:roomId'),
  bookings: {
    move: bookingPath.path('moves'),
  },
}

const applicationsPath = path('/applications')
const singleApplicationPath = applicationsPath.path(':id')

const peoplePath = path('/people')
const personPath = peoplePath.path(':crn')
const oasysPath = personPath.path('oasys')

const usersPath = path('/users')

const tasksPath = path('/tasks')
const taskPath = tasksPath.path(':taskType/:id')

const placementRequestsPath = path('/placement-requests')
const placementRequestPath = placementRequestsPath.path(':id')

const placementApplicationsPath = path('/placement-applications')
const placementApplicationPath = placementApplicationsPath.path(':id')

const tasksPaths = {
  index: tasksPath,
  show: taskPath,
  allocations: {
    create: taskPath.path('allocations'),
  },
}

const applyPaths = {
  applications: {
    show: singleApplicationPath,
    create: applicationsPath,
    index: applicationsPath,
    update: singleApplicationPath,
    submission: singleApplicationPath.path('submission'),
  },
}

const assessPaths = {
  assessments: path('/assessments'),
  singleAssessment: path('/assessments/:id'),
  acceptance: path('/assessments/:id/acceptance'),
  rejection: path('/assessments/:id/rejection'),
}

const clarificationNotePaths = {
  notes: assessPaths.singleAssessment.path('notes'),
}

export default {
  premises: {
    show: managePaths.premises.show,
    index: managePaths.premises.index,
    capacity: managePaths.premises.show.path('capacity'),
    lostBeds: {
      create: managePaths.lostBeds.create,
      index: managePaths.lostBeds.index,
      update: managePaths.lostBeds.update,
      show: managePaths.lostBeds.show,
    },
    staffMembers: {
      index: managePaths.premises.show.path('staff'),
    },
    beds: {
      index: managePaths.beds.index,
      show: managePaths.beds.show,
    },
    rooms: managePaths.rooms,
    room: managePaths.room,
    bookings: {
      move: managePaths.bookings.move,
    },
    calendar: managePaths.premises.show.path('calendar'),
  },
  applications: {
    show: applyPaths.applications.show,
    index: applyPaths.applications.index,
    update: applyPaths.applications.update,
    new: applyPaths.applications.create,
    submission: applyPaths.applications.submission,
    documents: applyPaths.applications.show.path('documents'),
    assessment: applyPaths.applications.show.path('assessment'),
  },
  assessments: {
    index: assessPaths.assessments,
    show: assessPaths.singleAssessment,
    update: assessPaths.singleAssessment,
    acceptance: assessPaths.acceptance,
    rejection: assessPaths.rejection,
    clarificationNotes: {
      create: clarificationNotePaths.notes,
      update: clarificationNotePaths.notes.path(':clarificationNoteId'),
    },
  },
  match: {
    findBeds: path('/beds/search'),
  },
  tasks: {
    index: tasksPaths.index,
    reallocatable: {
      index: tasksPaths.index.path('reallocatable'),
    },
    show: tasksPaths.show,
    allocations: {
      create: tasksPaths.allocations.create,
    },
  },
  placementRequests: {
    index: placementRequestsPath,
    show: placementRequestPath,
    booking: placementRequestPath.path('booking'),
    bookingNotMade: placementRequestPath.path('booking-not-made'),
  },
  placementApplications: {
    update: placementApplicationPath,
    create: placementApplicationsPath,
    show: placementApplicationPath,
    submit: placementApplicationPath.path('submission'),
    submitDecision: placementApplicationPath.path('decision'),
  },
  people: {
    risks: {
      show: personPath.path('risks'),
    },
    search: peoplePath.path('search'),
    prisonCaseNotes: personPath.path('prison-case-notes'),
    adjudications: personPath.path('adjudications'),
    acctAlerts: personPath.path('acct-alerts'),
    offences: personPath.path('offences'),
    documents: path('/documents/:crn/:documentId'),
    oasys: {
      selection: oasysPath.path('selection'),
      sections: oasysPath.path('sections'),
    },
  },
  users: {
    index: usersPath,
    show: usersPath.path(':id'),
    profile: path('/profile'),
  },
}
