// Diccionario de términos clínicos para autocompletado en consultas
// Incluye términos del DSM-5 y CIE-11 más comunes en español

export interface ClinicalTerm {
  value: string;  // Valor que se usará al seleccionar
  label: string;  // Etiqueta para mostrar
  category: 'trastorno' | 'síntoma' | 'tratamiento' | 'evaluación'; // Categoría del término
  code?: string;  // Código DSM-5 o CIE-11 si aplica
}

// Términos clínicos organizados por categoría
export const clinicalTerms: ClinicalTerm[] = [
  // Trastornos
  { value: 'trastorno depresivo mayor', label: 'Trastorno Depresivo Mayor', category: 'trastorno', code: 'F32' },
  { value: 'trastorno de ansiedad generalizada', label: 'Trastorno de Ansiedad Generalizada', category: 'trastorno', code: 'F41.1' },
  { value: 'trastorno bipolar', label: 'Trastorno Bipolar', category: 'trastorno', code: 'F31' },
  { value: 'trastorno de estrés postraumático', label: 'Trastorno de Estrés Postraumático', category: 'trastorno', code: 'F43.1' },
  { value: 'trastorno obsesivo-compulsivo', label: 'Trastorno Obsesivo-Compulsivo', category: 'trastorno', code: 'F42' },
  { value: 'esquizofrenia', label: 'Esquizofrenia', category: 'trastorno', code: 'F20' },
  { value: 'trastorno límite de la personalidad', label: 'Trastorno Límite de la Personalidad', category: 'trastorno', code: 'F60.3' },
  { value: 'trastorno por déficit de atención', label: 'Trastorno por Déficit de Atención e Hiperactividad', category: 'trastorno', code: 'F90' },
  { value: 'trastorno del espectro autista', label: 'Trastorno del Espectro Autista', category: 'trastorno', code: 'F84' },
  
  // Síntomas
  { value: 'anhedonia', label: 'Anhedonia', category: 'síntoma' },
  { value: 'ideación suicida', label: 'Ideación Suicida', category: 'síntoma' },
  { value: 'alucinaciones', label: 'Alucinaciones', category: 'síntoma' },
  { value: 'delirios', label: 'Delirios', category: 'síntoma' },
  { value: 'insomnio', label: 'Insomnio', category: 'síntoma' },
  { value: 'hipersomnia', label: 'Hipersomnia', category: 'síntoma' },
  { value: 'fatiga', label: 'Fatiga', category: 'síntoma' },
  { value: 'aislamiento social', label: 'Aislamiento Social', category: 'síntoma' },
  { value: 'pensamientos intrusivos', label: 'Pensamientos Intrusivos', category: 'síntoma' },
  { value: 'ataques de pánico', label: 'Ataques de Pánico', category: 'síntoma' },
  { value: 'flashbacks', label: 'Flashbacks', category: 'síntoma' },
  
  // Tratamientos
  { value: 'terapia cognitivo-conductual', label: 'Terapia Cognitivo-Conductual', category: 'tratamiento' },
  { value: 'terapia dialéctico conductual', label: 'Terapia Dialéctico Conductual', category: 'tratamiento' },
  { value: 'ISRS', label: 'Inhibidores Selectivos de la Recaptación de Serotonina', category: 'tratamiento' },
  { value: 'IRSN', label: 'Inhibidores de la Recaptación de Serotonina y Noradrenalina', category: 'tratamiento' },
  { value: 'antipsicóticos', label: 'Antipsicóticos', category: 'tratamiento' },
  { value: 'estabilizadores del ánimo', label: 'Estabilizadores del Ánimo', category: 'tratamiento' },
  { value: 'mindfulness', label: 'Mindfulness', category: 'tratamiento' },
  
  // Evaluación
  { value: 'inventario de depresión de beck', label: 'Inventario de Depresión de Beck', category: 'evaluación' },
  { value: 'escala de ansiedad de hamilton', label: 'Escala de Ansiedad de Hamilton', category: 'evaluación' },
  { value: 'MMPI-2', label: 'Inventario Multifásico de Personalidad de Minnesota', category: 'evaluación' },
  { value: 'WAIS-IV', label: 'Escala Wechsler de Inteligencia para Adultos', category: 'evaluación' },
  { value: 'WISC-V', label: 'Escala Wechsler de Inteligencia para Niños', category: 'evaluación' },
  { value: 'escala PANSS', label: 'Escala de Síntomas Positivos y Negativos (PANSS)', category: 'evaluación' },
];

// Función para filtrar términos según búsqueda del usuario
export const filterClinicalTerms = (searchText: string): ClinicalTerm[] => {
  if (!searchText || searchText.trim() === '') {
    return [];
  }
  
  const normalized = searchText.toLowerCase().trim();
  return clinicalTerms.filter(term => 
    term.value.toLowerCase().includes(normalized) || 
    (term.code && term.code.toLowerCase().includes(normalized))
  );
}; 