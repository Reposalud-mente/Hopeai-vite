import { useState, useCallback, useEffect } from 'react';
import { Patient } from '../types/clinical-types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface PatientCache {
  list: CacheEntry<Patient[]> | null;
  details: Record<number, CacheEntry<Patient>>;
}

interface UsePatientCacheReturn {
  // Cache management
  getCachedPatients: () => Patient[] | null;
  getCachedPatient: (id: number) => Patient | null;
  cachePatients: (patients: Patient[]) => void;
  cachePatient: (patient: Patient) => void;
  invalidateCache: () => void;
  invalidatePatientCache: (id: number) => void;
  
  // Cache status
  isPatientsListCached: () => boolean;
  isPatientCached: (id: number) => boolean;
  isCacheExpired: (cacheType: 'list' | 'patient', id?: number) => boolean;
}

/**
 * Hook para gestionar el caché de datos de pacientes
 * 
 * @param cacheDuration - Duración del caché en milisegundos (por defecto 5 minutos)
 * @returns Funciones para gestionar el caché de pacientes
 */
export const usePatientCache = (
  cacheDuration: number = 5 * 60 * 1000 // 5 minutos por defecto
): UsePatientCacheReturn => {
  // Estado para almacenar el caché
  const [cache, setCache] = useState<PatientCache>({
    list: null,
    details: {}
  });

  // Almacenar pacientes en caché
  const cachePatients = useCallback((patients: Patient[]) => {
    const now = Date.now();
    
    setCache(prev => ({
      ...prev,
      list: {
        data: patients,
        timestamp: now,
        expiresAt: now + cacheDuration
      }
    }));
  }, [cacheDuration]);

  // Almacenar un paciente individual en caché
  const cachePatient = useCallback((patient: Patient) => {
    if (!patient || !patient.id) return;
    
    const now = Date.now();
    
    setCache(prevCache => {
      // Si tenemos una lista en caché, actualizar el paciente en ella también
      let updatedList = prevCache.list;
      
      if (prevCache.list && prevCache.list.data) {
        const updatedListData = prevCache.list.data.map((p: Patient) => 
          p.id === patient.id ? patient : p
        );
        
        updatedList = {
          ...prevCache.list,
          data: updatedListData
        };
      }
      
      return {
        ...prevCache,
        list: updatedList,
        details: {
          ...prevCache.details,
          [patient.id]: {
            data: patient,
            timestamp: now,
            expiresAt: now + cacheDuration
          }
        }
      };
    });
  }, [cacheDuration]);

  // Obtener pacientes del caché
  const getCachedPatients = useCallback((): Patient[] | null => {
    if (!cache.list || Date.now() > cache.list.expiresAt) {
      return null;
    }
    
    return cache.list.data;
  }, [cache.list]);

  // Obtener un paciente específico del caché
  const getCachedPatient = useCallback((id: number): Patient | null => {
    const patientCache = cache.details[id];
    
    if (!patientCache || Date.now() > patientCache.expiresAt) {
      return null;
    }
    
    return patientCache.data;
  }, [cache.details]);

  // Invalidar todo el caché
  const invalidateCache = useCallback(() => {
    setCache({
      list: null,
      details: {}
    });
  }, []);

  // Invalidar caché para un paciente específico
  const invalidatePatientCache = useCallback((id: number) => {
    setCache(prev => {
      const newDetails = { ...prev.details };
      delete newDetails[id];
      
      return {
        ...prev,
        details: newDetails
      };
    });
  }, []);

  // Verificar si la lista de pacientes está en caché
  const isPatientsListCached = useCallback((): boolean => {
    return cache.list !== null && Date.now() <= cache.list.expiresAt;
  }, [cache.list]);

  // Verificar si un paciente específico está en caché
  const isPatientCached = useCallback((id: number): boolean => {
    const patientCache = cache.details[id];
    return patientCache !== undefined && Date.now() <= patientCache.expiresAt;
  }, [cache.details]);

  // Verificar si un caché está expirado
  const isCacheExpired = useCallback((cacheType: 'list' | 'patient', id?: number): boolean => {
    if (cacheType === 'list') {
      return !cache.list || Date.now() > cache.list.expiresAt;
    } else if (cacheType === 'patient' && id !== undefined) {
      const patientCache = cache.details[id];
      return !patientCache || Date.now() > patientCache.expiresAt;
    }
    
    return true;
  }, [cache]);

  // Eliminar caché expirado periódicamente (cada minuto)
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      
      // Verificar y limpiar caché expirado
      setCache(prev => {
        // Verificar lista
        const newCache: PatientCache = {
          list: prev.list && now <= prev.list.expiresAt ? prev.list : null,
          details: {}
        };
        
        // Verificar detalles de pacientes
        Object.entries(prev.details).forEach(([id, entry]) => {
          if (now <= entry.expiresAt) {
            newCache.details[Number(id)] = entry;
          }
        });
        
        return newCache;
      });
    }, 60000); // Verificar cada minuto
    
    return () => clearInterval(intervalId);
  }, []);

  return {
    getCachedPatients,
    getCachedPatient,
    cachePatients,
    cachePatient,
    invalidateCache,
    invalidatePatientCache,
    isPatientsListCached,
    isPatientCached,
    isCacheExpired
  };
}; 