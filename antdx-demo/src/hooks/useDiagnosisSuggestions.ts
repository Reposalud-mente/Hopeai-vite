import { useState, useEffect } from 'react';
import type { SuggestionItem } from '@ant-design/x';
import type { ClinicalAnalysisResult } from '../types/ai-types';

/**
 * Hook personalizado para generar sugerencias de diagnóstico basadas en el análisis clínico
 * Compatible con el componente Suggestion de Ant Design X
 * 
 * @param {ClinicalAnalysisResult} analysisState - Estado del análisis clínico de LangGraph
 * @returns {Object} - Sugerencias de diagnóstico formateadas
 */
export const useDiagnosisSuggestions = (analysisState: ClinicalAnalysisResult | null) => {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  
  useEffect(() => {
    if (!analysisState || !analysisState.possibleDiagnoses) {
      return;
    }
    
    const mapToSuggestionItems = (diagnoses: string[]): SuggestionItem[] => {
      return diagnoses.map((diagnosis, index) => {
        // Extraer código CIE-10 si existe
        const cieMatch = diagnosis.match(/F\d+(\.\d+)?/);
        const cieCode = cieMatch ? cieMatch[0] : '';
        
        // Determinar nivel de confianza basado en la posición
        const severity = index === 0 ? 'success' : index === 1 ? 'warning' : 'error';
        const confidence = index === 0 ? "Alta" : index === 1 ? "Media" : "Baja";
        
        return {
          label: diagnosis,
          value: diagnosis,
          description: `${cieCode ? `CIE-10: ${cieCode} - ` : ''}Confianza: ${confidence}`,
          severity
        };
      });
    };
    
    setSuggestions(mapToSuggestionItems(analysisState.possibleDiagnoses));
  }, [analysisState]);
  
  return {
    diagnosisSuggestions: suggestions
  };
}; 