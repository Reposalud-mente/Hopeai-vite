import { ClinicalQuery, ClinicalResponseJson } from '../types/ClinicalQuery';
import { generatePdf } from '../utils/pdfExporter';
import { saveAsTextFile } from '../utils/fileExporter';
import notificationService from '../utils/notificationService';

/**
 * Servicio para manejar la exportación de consultas clínicas en diferentes formatos
 */
class ExportService {
  /**
   * Genera texto de respuesta para exportación
   */
  generateResponseText(query: ClinicalQuery): string {
    const response = query.responseJson as ClinicalResponseJson;
    if (!response) return query.answer || 'Sin respuesta';
    
    let text = `Consulta: ${query.question}\n\n`;
    text += `Respuesta: ${response.mainAnswer}\n\n`;
    
    if (response.reasoning) {
      text += `Razonamiento Clínico:\n${response.reasoning}\n\n`;
    }
    
    if (response.diagnosticConsiderations && response.diagnosticConsiderations.length > 0) {
      text += `Consideraciones Diagnósticas:\n`;
      response.diagnosticConsiderations.forEach((item, index) => {
        text += `${index + 1}. ${item}\n`;
      });
      text += '\n';
    }
    
    if (response.treatmentSuggestions && response.treatmentSuggestions.length > 0) {
      text += `Sugerencias de Tratamiento:\n`;
      response.treatmentSuggestions.forEach((item, index) => {
        text += `${index + 1}. ${item}\n`;
      });
      text += '\n';
    }
    
    if (response.references && response.references.length > 0) {
      text += `Referencias:\n`;
      response.references.forEach((ref, index) => {
        text += `${index + 1}. ${ref.source}: ${ref.citation}`;
        if (ref.link) text += ` ${ref.link}`;
        text += '\n';
      });
    }
    
    text += `\nNivel de confianza: ${(response.confidenceScore * 100).toFixed(0)}%\n`;
    text += `\nNota: Esta información es orientativa y no reemplaza el juicio clínico profesional.`;
    
    return text;
  }
  
  /**
   * Copia la respuesta al portapapeles
   */
  copyToClipboard(query: ClinicalQuery): void {
    const text = this.generateResponseText(query);
    navigator.clipboard.writeText(text)
      .then(() => {
        notificationService.toast('success', 'Respuesta copiada al portapapeles', { duration: 2 });
      })
      .catch(() => {
        notificationService.toast('error', 'Error al copiar al portapapeles', { duration: 3 });
      });
  }
  
  /**
   * Exporta la consulta como PDF
   */
  exportAsPdf(query: ClinicalQuery): void {
    try {
      const text = this.generateResponseText(query);
      const title = `Consulta Clínica: ${query.question}`;
      generatePdf(title, text);
      notificationService.toast('success', 'PDF generado correctamente', { duration: 2 });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      notificationService.toast('error', 'Error al generar PDF', { duration: 3 });
    }
  }
  
  /**
   * Exporta la consulta como archivo de texto
   */
  exportAsText(query: ClinicalQuery): void {
    try {
      const text = this.generateResponseText(query);
      const filename = `consulta_clinica_${query.id}.txt`;
      saveAsTextFile(text, filename);
      notificationService.toast('success', 'Archivo de texto guardado', { duration: 2 });
    } catch (error) {
      console.error('Error al guardar archivo de texto:', error);
      notificationService.toast('error', 'Error al guardar archivo', { duration: 3 });
    }
  }
  
  /**
   * Comparte la consulta por correo electrónico
   */
  shareByEmail(query: ClinicalQuery): void {
    try {
      const subject = encodeURIComponent(`Consulta Clínica: ${query.question}`);
      const body = encodeURIComponent(this.generateResponseText(query));
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      notificationService.toast('success', 'Abriendo cliente de correo...', { duration: 2 });
    } catch (error) {
      console.error('Error al compartir por correo:', error);
      notificationService.toast('error', 'Error al compartir por correo', { duration: 3 });
    }
  }
}

export default new ExportService(); 