import { ClinicalReference, ClinicalResponseJson } from '../../src/types/ClinicalQuery';
import { DiagnosticAnalysis, TreatmentRecommendations } from './types';

/**
 * Formatea referencias clínicas para visualización
 * @param references Array de referencias clínicas
 * @returns Referencias formateadas con HTML
 */
export function formatReferences(references: ClinicalReference[]): string {
  if (!references || !references.length) {
    return '<em>No se proporcionaron referencias.</em>';
  }

  return references.map((ref, index) => {
    const source = ref.source ? `<strong>${ref.source}</strong>` : 'Fuente no especificada';
    const citation = ref.citation || 'Sin cita específica';
    const link = ref.link ? `<a href="${ref.link}" target="_blank">Enlace</a>` : '';
    
    return `<div class="reference-item">
      <div class="reference-number">[${index + 1}]</div>
      <div class="reference-content">
        <div class="reference-source">${source}</div>
        <div class="reference-citation">${citation}</div>
        ${link ? `<div class="reference-link">${link}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

/**
 * Formatea consideraciones diagnósticas para visualización
 * @param diagnosticAnalysis Análisis diagnóstico
 * @returns HTML formateado para visualización
 */
export function formatDiagnosticConsiderations(diagnosticAnalysis: DiagnosticAnalysis): string {
  if (!diagnosticAnalysis || !diagnosticAnalysis.diagnosticConsiderations || !diagnosticAnalysis.diagnosticConsiderations.length) {
    return '<em>No se proporcionaron consideraciones diagnósticas.</em>';
  }

  return diagnosticAnalysis.diagnosticConsiderations.map(consideration => {
    const confidenceClass = 
      consideration.confidence >= 75 ? 'high-confidence' : 
      consideration.confidence >= 50 ? 'medium-confidence' : 'low-confidence';
    
    return `<div class="diagnostic-consideration">
      <div class="diagnosis-header">
        <span class="diagnosis-name">${consideration.diagnosis}</span>
        <span class="diagnosis-code">${consideration.code || 'N/A'}</span>
        <span class="confidence-badge ${confidenceClass}">${consideration.confidence}%</span>
      </div>
      <div class="criteria-section">
        <div class="supporting-evidence">
          <h5>Evidencia presente:</h5>
          <ul>
            ${consideration.supportingEvidence.map(c => `<li>${c}</li>`).join('')}
          </ul>
        </div>
        ${consideration.differentialDiagnoses && consideration.differentialDiagnoses.length > 0 ? `
        <div class="differential-diagnoses">
          <h5>Diagnósticos diferenciales:</h5>
          <ul>
            ${consideration.differentialDiagnoses.map(c => `<li>${c}</li>`).join('')}
          </ul>
        </div>` : ''}
      </div>
    </div>`;
  }).join('');
}

/**
 * Formatea recomendaciones de tratamiento para visualización
 * @param treatmentRecommendations Recomendaciones de tratamiento
 * @returns HTML formateado para visualización
 */
export function formatTreatmentRecommendations(treatmentRecommendations: TreatmentRecommendations): string {
  if (!treatmentRecommendations || !treatmentRecommendations.treatmentApproaches || !treatmentRecommendations.treatmentApproaches.length) {
    return '<em>No se proporcionaron recomendaciones de tratamiento.</em>';
  }

  let html = '<div class="treatment-recommendations">';
  
  // Enfoques de tratamiento
  html += '<div class="treatment-approaches">';
  html += '<h5>Enfoques terapéuticos recomendados:</h5>';
  
  html += treatmentRecommendations.treatmentApproaches.map(approach => {
    const evidenceBadge = 
      approach.evidenceLevel === 'A' ? '<span class="evidence-badge high">A</span>' : 
      approach.evidenceLevel === 'B' ? '<span class="evidence-badge medium">B</span>' : 
      '<span class="evidence-badge low">C</span>';
    
    return `<div class="treatment-approach">
      <div class="approach-header">
        <span class="approach-name">${approach.approach}</span>
        ${evidenceBadge}
      </div>
      <div class="approach-description">${approach.description}</div>
      <div class="expected-benefits">
        <h6>Beneficios esperados:</h6>
        <ul>
          ${approach.expectedBenefits.map(b => `<li>${b}</li>`).join('')}
        </ul>
      </div>
      <div class="approach-reference">${approach.reference}</div>
    </div>`;
  }).join('');
  
  html += '</div>'; // Cierre de treatment-approaches
  
  // Consideraciones de medicación
  if (treatmentRecommendations.medicationConsiderations && treatmentRecommendations.medicationConsiderations.length) {
    html += '<div class="medication-considerations">';
    html += '<h5>Consideraciones farmacológicas:</h5>';
    
    html += treatmentRecommendations.medicationConsiderations.map(med => {
      return `<div class="medication-item">
        <div class="medication-category">${med.category}</div>
        <div class="medication-considerations">${med.considerations}</div>
        <div class="referral-recommendation">${med.referralRecommendation}</div>
      </div>`;
    }).join('');
    
    html += '</div>'; // Cierre de medication-considerations
  }
  
  // Psicoeducación
  if (treatmentRecommendations.psychoeducation && treatmentRecommendations.psychoeducation.length) {
    html += '<div class="psychoeducation">';
    html += '<h5>Recursos psicoeducativos:</h5>';
    html += '<ul>';
    html += treatmentRecommendations.psychoeducation.map(pe => `<li>${pe}</li>`).join('');
    html += '</ul>';
    html += '</div>'; // Cierre de psychoeducation
  }
  
  // Recomendaciones de seguimiento
  if (treatmentRecommendations.followUpRecommendations) {
    html += '<div class="follow-up">';
    html += '<h5>Recomendaciones de seguimiento:</h5>';
    html += `<p>${treatmentRecommendations.followUpRecommendations}</p>`;
    html += '</div>'; // Cierre de follow-up
  }
  
  html += '</div>'; // Cierre de treatment-recommendations
  
  return html;
}

/**
 * Formatea la respuesta de la IA para visualización
 * @param response Respuesta clínica estructurada
 * @returns HTML formateado para visualización
 */
export function formatClinicalResponse(response: ClinicalResponseJson): string {
  if (!response) {
    return '<div class="error-message">No se pudo obtener una respuesta válida.</div>';
  }

  // Disclaimer clínico
  const disclaimer = `<div class="clinical-disclaimer">
    <i class="disclaimer-icon">⚠️</i>
    <p>Esta información es orientativa y no reemplaza el juicio clínico profesional. 
    Cualquier decisión diagnóstica o terapéutica debe basarse en la evaluación integral del paciente.</p>
  </div>`;

  // Respuesta principal
  const mainAnswer = `<div class="main-answer">
    <p>${response.mainAnswer}</p>
  </div>`;

  // Razonamiento clínico
  const reasoning = `<div class="clinical-reasoning">
    <h4>Razonamiento clínico</h4>
    <p>${response.reasoning}</p>
  </div>`;

  // Nivel de confianza
  const confidenceClass = 
    response.confidenceScore >= 0.8 ? 'high-confidence' : 
    response.confidenceScore >= 0.5 ? 'medium-confidence' : 'low-confidence';
  
  const confidenceScore = `<div class="confidence-score ${confidenceClass}">
    <span class="confidence-label">Nivel de confianza:</span>
    <span class="confidence-value">${Math.round(response.confidenceScore * 100)}%</span>
  </div>`;

  // Referencias
  const references = `<div class="references-section">
    <h4>Referencias</h4>
    <div class="references-list">
      ${formatReferences(response.references)}
    </div>
  </div>`;

  // Preguntas sugeridas (opcional)
  let suggestedQuestions = '';
  if (response.suggestedQuestions && response.suggestedQuestions.length) {
    suggestedQuestions = `<div class="suggested-questions">
      <h4>Preguntas sugeridas</h4>
      <ul>
        ${response.suggestedQuestions.map(q => `<li>${q}</li>`).join('')}
      </ul>
    </div>`;
  }

  // Consideraciones diagnósticas (opcional)
  let diagnosticConsiderations = '';
  if (response.diagnosticConsiderations && response.diagnosticConsiderations.length) {
    diagnosticConsiderations = `<div class="diagnostic-considerations">
      <h4>Consideraciones diagnósticas</h4>
      <ul>
        ${response.diagnosticConsiderations.map(d => `<li>${d}</li>`).join('')}
      </ul>
    </div>`;
  }

  // Sugerencias de tratamiento (opcional)
  let treatmentSuggestions = '';
  if (response.treatmentSuggestions && response.treatmentSuggestions.length) {
    treatmentSuggestions = `<div class="treatment-suggestions">
      <h4>Sugerencias de tratamiento</h4>
      <ul>
        ${response.treatmentSuggestions.map(t => `<li>${t}</li>`).join('')}
      </ul>
    </div>`;
  }

  // Combinar todo
  return `<div class="clinical-response">
    ${disclaimer}
    ${mainAnswer}
    ${reasoning}
    ${confidenceScore}
    ${references}
    ${suggestedQuestions}
    ${diagnosticConsiderations}
    ${treatmentSuggestions}
  </div>`;
} 