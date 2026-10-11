import { journeyMock } from '@/features/journey/journey.mock'
import type { FormObjections, ObjectionFilters, ObjectionForm } from './types'

// UI phase: resolves from the journey mock, which shares its forms with the journey screens.
// API integration swaps each body for the call named in its comment (see OBJECTION_ENDPOINTS).

export const objectionService = {
  /** GetobjectionNRIReportDetails with the filters as an NRIReportRequest. */
  getForms: (filters: ObjectionFilters): Promise<ObjectionForm[]> => journeyMock.getObjectionForms(filters),

  /**
   * GetObjectionFormDetails, raw string body (SK reference no). The response keys stages
   * "1"–"11" with nullable Remarks / Objections, which the mapper will normalise to this shape.
   */
  getObjections: (formNo: string, _skRefNo: string): Promise<FormObjections> =>
    journeyMock.getObjections(formNo),

  /** closeobjection with `{ skReferenceNo, Objections: "<id>" }`. */
  closeObjection: (formNo: string, _skRefNo: string, objectionId: string): Promise<unknown> =>
    journeyMock.closeObjection(formNo, objectionId),
}
