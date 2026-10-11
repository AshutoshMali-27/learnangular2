import type { Option } from '@/components/form'
import {
  MOCK_ADMINS,
  MOCK_BRANCHES,
  MOCK_CITIES,
  MOCK_COUNTRIES,
  MOCK_DOCUMENT_TYPES,
  MOCK_DPS,
  MOCK_FATCA_CITIES,
  MOCK_FATCA_COUNTRIES,
  MOCK_INCOME_SLABS,
  MOCK_KMP_DESIGNATIONS,
  MOCK_NATIONALITIES,
  MOCK_NATURE_OF_BUSINESS,
  MOCK_NOMINEE_RELATIONS,
  MOCK_OCCUPATIONS,
  MOCK_RELATIONS,
  MOCK_SOURCES_OF_WEALTH,
  MOCK_STATES,
} from './masters.mock'

// UI phase: every master resolves from sample data after a short delay, so loading states are
// visible. API integration replaces each body with an `http.postJson(MASTER_ENDPOINTS.X, …)`
// call mapped to Option[]; hooks and components stay as they are.

const sample = <T>(data: T) => new Promise<T>((resolve) => setTimeout(() => resolve(data), 300))

export const mastersService = {
  getCountries: (): Promise<Option[]> => sample(MOCK_COUNTRIES),
  getStates: (countryId: string): Promise<Option[]> => sample(MOCK_STATES[countryId] ?? []),
  getCities: (stateId: string): Promise<Option[]> => sample(MOCK_CITIES[stateId] ?? []),
  getRelations: (): Promise<Option[]> => sample(MOCK_RELATIONS),
  getServingBranches: (): Promise<Option[]> => sample(MOCK_BRANCHES),
  getAdmins: (): Promise<Option[]> => sample(MOCK_ADMINS),
  getDpMaster: (): Promise<Option[]> => sample(MOCK_DPS),
  getOccupations: (): Promise<Option[]> => sample(MOCK_OCCUPATIONS),
  getIncomeSlabs: (): Promise<Option[]> => sample(MOCK_INCOME_SLABS),
  getSourcesOfWealth: (): Promise<Option[]> => sample(MOCK_SOURCES_OF_WEALTH),
  getNatureOfBusiness: (): Promise<Option[]> => sample(MOCK_NATURE_OF_BUSINESS),
  getNationalities: (): Promise<Option[]> => sample(MOCK_NATIONALITIES),
  getFatcaCountries: () => sample(MOCK_FATCA_COUNTRIES),
  getFatcaCities: (): Promise<Option[]> => sample(MOCK_FATCA_CITIES),
  getDocumentTypes: () => sample(MOCK_DOCUMENT_TYPES),
  getNomineeRelations: (): Promise<Option[]> => sample(MOCK_NOMINEE_RELATIONS),
  getKmpDesignations: (): Promise<Option[]> => sample(MOCK_KMP_DESIGNATIONS),
}
