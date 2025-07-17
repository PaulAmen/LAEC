/**
 * @OnlyCurrentDoc
 *
 * El código anterior activa el modo de alcance restringido y es necesario para este script.
 */

// Constante para el nombre de la hoja de cálculo. Cámbiala si tu hoja tiene un nombre diferente.
const SHEET_NAME = "PI 2025";

/**
 * Función principal que se ejecuta cuando alguien visita la URL de la aplicación web.
 * Sirve el archivo HTML principal.
 * @param {Object} e - El objeto de evento de la solicitud GET.
 * @returns {HtmlOutput} El contenido HTML de la página.
 */
function doGet(e) {
  // Crea una plantilla HTML a partir del archivo 'Index.html'
  let template = HtmlService.createTemplateFromFile('Index');
  // Evalúa la plantilla para procesar cualquier scriptlet (si los hubiera) y la devuelve como una salida HTML.
  return template.evaluate()
    .setTitle('Directorio de Documentos de Proyectos') // Establece el título de la pestaña del navegador
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // Permite que se incruste en otros sitios si es necesario.
}

/**
 * Permite incluir el contenido de otros archivos (como CSS o JS) dentro de una plantilla HTML.
 * Se usa en Index.html para incluir el código de JavaScript.html.
 * @param {string} filename - El nombre del archivo a incluir.
 * @returns {string} El contenido del archivo.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Obtiene los datos del Google Sheet, los filtra y los devuelve al cliente.
 * Esta función es llamada desde el JavaScript del lado del cliente.
 * @returns {Array<Object>} Un array de objetos, donde cada objeto representa una fila del directorio.
 */
function getDirectoryData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      // Si no se encuentra la hoja con el nombre especificado, intenta con la primera hoja activa.
      // Esto da flexibilidad si el nombre del archivo cambia.
      const firstSheet = ss.getSheets()[0];
      if (!firstSheet) {
         throw new Error("No se encontraron hojas en el documento.");
      }
      return getDataFromSheet(firstSheet);
    }
    return getDataFromSheet(sheet);
  } catch (e) {
    Logger.log(`Error al obtener datos: ${e.message}`);
    // Devuelve un objeto de error que puede ser manejado en el lado del cliente.
    return { error: true, message: e.message };
  }
}

/**
 * Función auxiliar para leer, procesar y filtrar los datos de una hoja específica.
 * @param {Sheet} sheet - El objeto de la hoja de Google Sheets de donde se leerán los datos.
 * @returns {Array<Object>} Un array de objetos con los datos filtrados.
 */
function getDataFromSheet(sheet) {
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();

  // La primera fila contiene los encabezados.
  const headers = values.shift(); 
  
  // Encontrar los índices de las columnas de links para el filtro.
  const digitalLinkIndex = headers.indexOf("LINKS DIGITALES");
  const scannedLinkIndex = headers.indexOf("LINKS ESCANEADOS");

  if (digitalLinkIndex === -1 || scannedLinkIndex === -1) {
    throw new Error("No se encontraron las columnas 'LINKS DIGITALES' o 'LINKS ESCANEADOS'. Por favor, verifica los encabezados en tu hoja.");
  }

  const directoryData = [];
  values.forEach(row => {
    // Filtrar: solo incluir filas que tengan un valor en la columna de links digitales O en la de links escaneados.
    const hasDigitalLink = row[digitalLinkIndex] && row[digitalLinkIndex].toString().trim() !== '';
    const hasScannedLink = row[scannedLinkIndex] && row[scannedLinkIndex].toString().trim() !== '';

    if (hasDigitalLink || hasScannedLink) {
      let record = {};
      headers.forEach((header, i) => {
        // Convierte cada fila en un objeto fácil de usar con los encabezados como claves.
        record[header] = row[i];
      });
      directoryData.push(record);
    }
  });
  
  Logger.log(`Se encontraron ${directoryData.length} registros para mostrar.`);
  return directoryData;
}
