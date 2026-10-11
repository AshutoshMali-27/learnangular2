export {
  FOREIGN_PINCODE,
  GENDERS,
  INDIA_COUNTRY_ID,
  MARITAL_STATUSES,
  NAME_PREFIXES,
  RESIDENTIAL_STATUSES,
} from './constants'
export {
  useAdmins,
  useCities,
  useCountries,
  useDocumentTypes,
  useDpMaster,
  useFatcaCities,
  useFatcaCountries,
  useIncomeSlabs,
  useKmpDesignations,
  useNationalities,
  useNatureOfBusiness,
  useNomineeRelations,
  useOccupations,
  useRelations,
  useServingBranches,
  useSourcesOfWealth,
  useStates,
} from './hooks/useMasters'
export type { DocumentTypeMeta } from './masters.mock'
export { MASTER_QUERY_KEYS } from './queryKeys'
