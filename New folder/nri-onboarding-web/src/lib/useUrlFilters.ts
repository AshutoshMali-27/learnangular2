import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Applied list filters kept in the URL query string, so a search survives refresh, can be
 * bookmarked, and follows browser back / forward. `empty` must be a stable (module-level) object.
 */
export function useUrlFilters<T extends { [K in keyof T]: string }>(empty: T) {
  const [params, setParams] = useSearchParams()

  const filters = useMemo(() => {
    const keys = Object.keys(empty) as (keyof T & string)[]
    return Object.fromEntries(keys.map((key) => [key, params.get(key) ?? empty[key]])) as T
  }, [params, empty])

  const setFilters = (next: T) =>
    // Only filters that are set go in the URL.
    setParams(Object.fromEntries(Object.entries<string>(next).filter(([, value]) => value)))

  return [filters, setFilters] as const
}
