/**
 * Utilidades de caché para almacenar datos en memoria con TTL
 * 
 * Este módulo proporciona una implementación de caché en memoria
 * con soporte para expiración de valores (TTL - Time To Live).
 */

interface CacheOptions {
  ttl?: number; // Tiempo de vida en milisegundos (por defecto: 5 minutos)
}

interface CacheItem<T> {
  value: T;
  expiresAt: number; // Timestamp de expiración
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

/**
 * Clase de caché en memoria con soporte para TTL
 */
export class MemoryCache<T = unknown> {
  private cache: Map<string, CacheItem<T>>;
  private defaultTTL: number;
  private stats: CacheStats;

  /**
   * Constructor del caché
   * @param defaultTTL Tiempo de vida predeterminado en ms (defecto: 5 minutos)
   */
  constructor(defaultTTL = 5 * 60 * 1000) {
    this.cache = new Map<string, CacheItem<T>>();
    this.defaultTTL = defaultTTL;
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0
    };
  }

  /**
   * Almacena un valor en caché
   * @param key Clave de identificación
   * @param value Valor a almacenar
   * @param options Opciones adicionales (TTL)
   */
  set(key: string, value: T, options?: CacheOptions): void {
    const ttl = options?.ttl ?? this.defaultTTL;
    const expiresAt = Date.now() + ttl;

    this.cache.set(key, {
      value,
      expiresAt
    });

    this.stats.size = this.cache.size;
  }

  /**
   * Obtiene un valor del caché si está disponible y no ha expirado
   * @param key Clave del valor a recuperar
   * @returns El valor almacenado o undefined si no existe o expiró
   */
  get(key: string): T | undefined {
    const item = this.cache.get(key);

    // Si no existe o expiró
    if (!item || item.expiresAt < Date.now()) {
      // Si existía pero expiró, eliminarlo
      if (item) {
        this.delete(key);
      }
      this.stats.misses++;
      return undefined;
    }

    this.stats.hits++;
    return item.value;
  }

  /**
   * Elimina un valor del caché
   * @param key Clave del valor a eliminar
   * @returns true si el valor existía y fue eliminado
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.stats.size = this.cache.size;
    return result;
  }

  /**
   * Comprueba si una clave existe en el caché y no ha expirado
   * @param key Clave a comprobar
   * @returns true si existe y no ha expirado
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    return !!item && item.expiresAt >= Date.now();
  }

  /**
   * Limpia todos los valores del caché
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Elimina todas las entradas expiradas del caché
   * @returns Número de entradas eliminadas
   */
  purgeExpired(): number {
    let count = 0;
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt < now) {
        this.cache.delete(key);
        count++;
      }
    }

    this.stats.size = this.cache.size;
    return count;
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }
}

// Caché único global para datos compartidos
export const globalCache = new MemoryCache<unknown>();

/**
 * Crea una función memoizada con caché
 * @param fn Función a memoizar
 * @param keyFn Función para generar la clave de caché (opcional)
 * @param options Opciones de caché (opcional)
 * @returns Función memoizada
 */
export function memoize<T, A extends unknown[]>(
  fn: (...args: A) => T,
  keyFn?: (...args: A) => string,
  options?: CacheOptions
): (...args: A) => T {
  const cache = new MemoryCache<T>(options?.ttl);

  return (...args: A) => {
    // Generar clave de caché
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    
    // Verificar si existe en caché
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Ejecutar la función y almacenar resultado
    const result = fn(...args);
    cache.set(key, result, options);
    return result;
  };
} 