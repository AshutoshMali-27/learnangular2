import { useQuery } from '@tanstack/react-query'
import { MASTER_QUERY_OPTIONS } from '@/api'
import { MASTER_QUERY_KEYS } from '../queryKeys'
import { mastersService } from '../services'

// Masters are fetched once and cached for the session. Cascading masters stay idle until
// their parent is chosen, which replaces the MVC setTimeout / polling loaders.

export const useCountries = () =>
  useQuery({
    queryKey: MASTER_QUERY_KEYS.COUNTRIES,
    queryFn: mastersService.getCountries,
    ...MASTER_QUERY_OPTIONS,
  })

export const useStates = (countryId: string | undefined) =>
  useQuery({
    queryKey: MASTER_QUERY_KEYS.STATES(countryId ?? ''),
    queryFn: () => mastersService.getStates(countryId ?? ''),
    enabled: !!countryId,
    ...MASTER_QUERY_OPTIONS,
  })

export const useCities = (stateId: string | undefined) =>
  useQuery({
    queryKey: MASTER_QUERY_KEYS.CITIES(stateId ?? ''),
    queryFn: () => mastersService.getCities(stateId ?? ''),
    enabled: !!stateId,
    ...MASTER_QUERY_OPTIONS,
  })

export const useRelations = () =>
  useQuery({
    queryKey: MASTER_QUERY_KEYS.RELATIONS,
    queryFn: mastersService.getRelations,
    ...MASTER_QUERY_OPTIONS,
  })

export const useServingBranches = () =>
  useQuery({
    queryKey: MASTER_QUERY_KEYS.SERVING_BRANCHES,
    queryFn: mastersService.getServingBranches,
    ...MASTER_QUERY_OPTIONS,
  })

export const useAdmins = () =>
  useQuery({
    queryKey: MASTER_QUERY_KEYS.ADMINS,
    queryFn: mastersService.getAdmins,
    ...MASTER_QUERY_OPTIONS,
  })

export const useDpMaster = () =>
  useQuery({
    queryKey: MASTER_QUERY_KEYS.DP,
    queryFn: mastersService.getDpMaster,
    ...MASTER_QUERY_OPTIONS,
  })

/** A master with no parameters: fetched once, cached for the session. */
const staticMaster =
  <T>(queryKey: readonly string[], queryFn: () => Promise<T>) =>
  () =>
    useQuery({ queryKey, queryFn, ...MASTER_QUERY_OPTIONS })

export const useOccupations = staticMaster(MASTER_QUERY_KEYS.OCCUPATIONS, mastersService.getOccupations)
export const useIncomeSlabs = staticMaster(MASTER_QUERY_KEYS.INCOME_SLABS, mastersService.getIncomeSlabs)
export const useSourcesOfWealth = staticMaster(
  MASTER_QUERY_KEYS.SOURCES_OF_WEALTH,
  mastersService.getSourcesOfWealth,
)
export const useNatureOfBusiness = staticMaster(
  MASTER_QUERY_KEYS.NATURE_OF_BUSINESS,
  mastersService.getNatureOfBusiness,
)
export const useNationalities = staticMaster(MASTER_QUERY_KEYS.NATIONALITIES, mastersService.getNationalities)
export const useFatcaCountries = staticMaster(MASTER_QUERY_KEYS.FATCA_COUNTRIES, mastersService.getFatcaCountries)
export const useFatcaCities = staticMaster(MASTER_QUERY_KEYS.FATCA_CITIES, mastersService.getFatcaCities)
export const useDocumentTypes = staticMaster(MASTER_QUERY_KEYS.DOCUMENT_TYPES, mastersService.getDocumentTypes)
export const useNomineeRelations = staticMaster(
  MASTER_QUERY_KEYS.NOMINEE_RELATIONS,
  mastersService.getNomineeRelations,
)
export const useKmpDesignations = staticMaster(
  MASTER_QUERY_KEYS.KMP_DESIGNATIONS,
  mastersService.getKmpDesignations,
)
