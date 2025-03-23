import type { ClinicalQuery } from '../types/ClinicalQuery';

// Cache TTL en minutos
const DEFAULT_CACHE_TTL = 60; 

interface CacheEntry {
  query: ClinicalQuery;
  timestamp: number;
  ttl: number; // Tiempo de vida en minutos
  similarityScore?: number; // Opcional, para similaridad semántica
}

interface CacheOptions {
  ttl?: number; // Tiempo de vida en minutos (opcional)
  patientId?: string; // ID de paciente para filtrar caché
  maxEntries?: number; // Número máximo de entradas en caché
}

/**
 * Clase para gestionar la caché de consultas clínicas
 * Almacena respuestas recientes para mejorar rendimiento
 */
class ClinicalQueryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxEntries: number = 100; // Valor predeterminado
  
  constructor() {
    // Iniciar limpieza periódica
    setInterval(() => this.cleanExpiredEntries(), 1000 * 60 * 30); // Limpiar cada 30 minutos
  }

  /**
   * Añade una consulta a la caché
   * @param key Clave de caché (normalmente pregunta o ID)
   * @param query Objeto de consulta clínica completo
   * @param options Opciones de caché
   */
  public set(key: string, query: ClinicalQuery, options: CacheOptions = {}): void {
    // Verificar límite de entradas
    if (options.maxEntries) {
      this.maxEntries = options.maxEntries;
    }
    
    if (this.cache.size >= this.maxEntries) {
      this.removeOldestEntry();
    }
    
    // Configurar tiempo de vida
    const ttl = options.ttl || DEFAULT_CACHE_TTL;
    
    // Guardar en caché
    this.cache.set(key, {
      query,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Obtiene una consulta de la caché
   * @param key Clave de caché
   * @param patientId ID de paciente para filtrar (opcional)
   * @returns La consulta si existe y no ha expirado, o undefined
   */
  public get(key: string, patientId?: string): ClinicalQuery | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) return undefined;
    
    // Verificar si ha expirado
    const now = Date.now();
    const expirationTime = entry.timestamp + (entry.ttl * 60 * 1000);
    
    if (now > expirationTime) {
      this.cache.delete(key);
      return undefined;
    }
    
    // Filtrar por paciente si es necesario
    if (patientId && entry.query.patientId !== patientId) {
      return undefined;
    }
    
    return entry.query;
  }

  /**
   * Busca consultas similares en la caché
   * Simplemente busca coincidencias de texto, puede mejorarse con
   * algoritmos de similaridad semántica más avanzados en el futuro
   * 
   * @param searchTerm Término de búsqueda
   * @param patientId ID de paciente opcional para filtrar
   * @param threshold Umbral mínimo de similitud (0-1)
   * @returns Lista de entradas en caché con puntuación de similitud
   */
  public findSimilar(searchTerm: string, patientId?: string, threshold: number = 0.7): ClinicalQuery[] {
    const normalizedTerm = searchTerm.toLowerCase().trim();
    const results: ClinicalQuery[] = [];
    
    // Realizar búsqueda simple por ahora
    this.cache.forEach((entry) => {
      // Filtrar por paciente si es necesario
      if (patientId && entry.query.patientId !== patientId) {
        return;
      }
      
      // Verificar si ha expirado
      const now = Date.now();
      const expirationTime = entry.timestamp + (entry.ttl * 60 * 1000);
      if (now > expirationTime) {
        return;
      }
      
      // Calcular similitud simple (se podría mejorar con algoritmos más sofisticados)
      const normalizedQuestion = entry.query.question.toLowerCase().trim();
      
      // Método simple: verificar subcadenas y calcular similitud
      let similarity = 0;
      
      if (normalizedQuestion.includes(normalizedTerm) || normalizedTerm.includes(normalizedQuestion)) {
        // Calcular similitud básica basada en la longitud relativa
        const maxLength = Math.max(normalizedQuestion.length, normalizedTerm.length);
        const minLength = Math.min(normalizedQuestion.length, normalizedTerm.length);
        similarity = minLength / maxLength;
        
        // Solo añadir si supera el umbral de similitud
        if (similarity >= threshold) {
          results.push(entry.query);
        }
      }
    });
    
    return results;
  }

  /**
   * Elimina una entrada específica de la caché
   * @param key Clave de la entrada a eliminar
   */
  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Limpia todas las entradas de caché para un paciente específico
   * @param patientId ID del paciente
   * @returns Número de entradas eliminadas
   */
  public clearForPatient(patientId: string): number {
    let count = 0;
    
    this.cache.forEach((entry, key) => {
      if (entry.query.patientId === patientId) {
        this.cache.delete(key);
        count++;
      }
    });
    
    return count;
  }

  /**
   * Actualiza el estado de favorito para una consulta en caché
   * @param queryId ID de la consulta a actualizar
   * @param isFavorite Nuevo estado de favorito
   * @param patientId ID del paciente (opcional, para filtrado)
   * @returns boolean indicando si se actualizó alguna entrada
   */
  public updateFavoriteStatus(queryId: number, isFavorite: boolean, patientId?: string): boolean {
    let updated = false;
    
    this.cache.forEach((entry) => {
      // Si se especifica patientId, verificar que coincida
      if (patientId && entry.query.patientId !== patientId) {
        return;
      }
      
      // Actualizar si el ID coincide
      if (entry.query.id === queryId) {
        entry.query.isFavorite = isFavorite;
        updated = true;
      }
    });
    
    return updated;
  }

  /**
   * Limpia toda la caché
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Elimina las entradas expiradas
   * @returns Número de entradas eliminadas
   */
  public cleanExpiredEntries(): number {
    const now = Date.now();
    let count = 0;
    
    this.cache.forEach((entry, key) => {
      const expirationTime = entry.timestamp + (entry.ttl * 60 * 1000);
      
      if (now > expirationTime) {
        this.cache.delete(key);
        count++;
      }
    });
    
    return count;
  }

  /**
   * Elimina la entrada más antigua de la caché
   */
  private removeOldestEntry(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;
    
    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    });
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// Exportar instancia singleton
export const queryCache = new ClinicalQueryCache();

// Función auxiliar para generar clave de caché consistente
export const generateCacheKey = (question: string, patientId: string): string => {
  const normalizedQuestion = question.toLowerCase().trim();
  return `${patientId}:${normalizedQuestion}`;
}; 