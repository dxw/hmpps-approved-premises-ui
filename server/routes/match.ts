/* istanbul ignore file */

import type { Router } from 'express'

import type { Controllers } from '../controllers'
import type { Services } from '../services'

import paths from '../paths/match'

import actions from './utils'

export default function routes(controllers: Controllers, router: Router, services: Partial<Services>): Router {
  const { get, post } = actions(router, services.auditService)

  const { placementRequestController, bedController, placementRequestBookingsController } = controllers

  get(paths.placementRequests.index.pattern, placementRequestController.index(), {
    auditEvent: 'LIST_PLACEMENT_REQUESTS',
  })
  get(paths.placementRequests.show.pattern, placementRequestController.show(), { auditEvent: 'SHOW_PLACEMENT_REQUEST' })

  get(paths.placementRequests.bookingNotMade.confirm.pattern, placementRequestBookingsController.bookingNotMade(), {
    auditEvent: 'NEW_BOOKING_NOT_MADE',
  })
  post(
    paths.placementRequests.bookingNotMade.create.pattern,
    placementRequestBookingsController.createBookingNotMade(),
    { auditEvent: 'CREATE_BOOKING_NOT_MADE' },
  )

  get(paths.placementRequests.beds.search.pattern, bedController.search(), { auditEvent: 'BED_SEARCH' })
  post(paths.placementRequests.beds.search.pattern, bedController.search(), { auditEvent: 'BED_SEARCH' })

  get(paths.placementRequests.bookings.confirm.pattern, placementRequestBookingsController.confirm())
  post(paths.placementRequests.bookings.create.pattern, placementRequestBookingsController.create(), {
    auditEvent: 'CREATE_BOOKING_FROM_PLACEMENT_REQUEST',
  })

  return router
}
