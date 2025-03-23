/**
 * Módulo para la generación de archivos PDF a partir de consultas clínicas
 */

/**
 * Utilidades para exportar contenido a PDF
 */

/**
 * Utilidad para generar y descargar archivos PDF
 */

/**
 * Genera un PDF a partir de texto y lo descarga
 * @param title Título del documento
 * @param content Contenido del documento
 */
export function generatePdf(title: string, content: string): void {
  // Implementación básica - en un entorno real, se usaría una librería como jsPDF o pdfmake
  console.log(`Generando PDF con título: ${title}`);
  
  // Crear un elemento <a> para descargar
  const element = document.createElement('a');
  
  // Crear un blob con el contenido (esto no es un PDF real, solo texto plano)
  // En producción, reemplazar con generación real de PDF
  const blob = new Blob([`# ${title}\n\n${content}`], { type: 'text/plain' });
  
  // Crear URL para el blob
  const fileUrl = URL.createObjectURL(blob);
  
  // Configurar elemento para descarga
  element.setAttribute('href', fileUrl);
  element.setAttribute('download', `${title.replace(/\s+/g, '_')}.txt`);
  element.style.display = 'none';
  
  // Añadir a DOM, simular clic y limpiar
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  
  // Liberar URL
  URL.revokeObjectURL(fileUrl);
} 