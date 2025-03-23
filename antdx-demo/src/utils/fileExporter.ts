/**
 * Utilidades para exportar contenido a diferentes formatos de archivo
 */

/**
 * Utilidad para exportar archivos de texto
 */

/**
 * Guarda texto como un archivo y lo descarga
 * @param content Contenido del archivo
 * @param filename Nombre del archivo (incluyendo extensión)
 */
export function saveAsTextFile(content: string, filename: string): void {
  // Crear un elemento <a> para descargar
  const element = document.createElement('a');
  
  // Crear un blob con el contenido
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  
  // Crear URL para el blob
  const fileUrl = URL.createObjectURL(blob);
  
  // Configurar elemento para descarga
  element.setAttribute('href', fileUrl);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  
  // Añadir a DOM, simular clic y limpiar
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  
  // Liberar URL
  URL.revokeObjectURL(fileUrl);
} 