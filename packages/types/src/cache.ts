/**
 * Cache type definitions
 */

/**
 * Cache entry with TTL
 */
export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

/**
 * Cache map type
 */
export interface CacheMap<T> {
  [key: string]: CacheEntry<T>
}