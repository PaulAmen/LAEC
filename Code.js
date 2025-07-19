/**
 * @OnlyCurrentDoc
 */

const SHEET_NAME = "PI 2025";

/**
 * Esta función ahora actúa como una API que soporta JSONP.
 * @param {Object} e - El objeto de evento de la solicitud GET. Contiene el parámetro 'callback'.
 * @returns {ContentService.TextOutput} Los datos en formato JSON o JAVASCRIPT (para JSONP).
 */
function doGet(e) {
  try {
    const data = getDirectoryData();
    const jsonOutput = JSON.stringify(data);
    
    // Si la petición incluye un parámetro 'callback', la envolvemos para JSONP.
    if (e.parameter.callback) {
      return ContentService.createTextOutput(e.parameter.callback + '(' + jsonOutput + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    // Si no, devolvemos JSON normal (para pruebas directas en el navegador).
    return ContentService.createTextOutput(jsonOutput)
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    const errorObject = { status: "error", message: error.message };
    const jsonErrorOutput = JSON.stringify(errorObject);
    
    if (e.parameter.callback) {
       return ContentService.createTextOutput(e.parameter.callback + '(' + jsonErrorOutput + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService.createTextOutput(jsonErrorOutput)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Obtiene, filtra y procesa los datos de la hoja de cálculo.
 * @returns {Array<Object>} Un array de objetos, donde cada objeto representa una fila.
 */
function getDirectoryData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  
  if (!sheet) {
    throw new Error("No se encontraron hojas en el documento.");
  }

  const values = sheet.getDataRange().getValues();
  const headers = values.shift(); 
  
  const digitalLinkIndex = headers.indexOf("LINKS DIGITALES");
  const scannedLinkIndex = headers.indexOf("LINKS ESCANEADOS");

  if (digitalLinkIndex === -1 || scannedLinkIndex === -1) {
    throw new Error("No se encontraron las columnas 'LINKS DIGITALES' o 'LINKS ESCANEADOS'.");
  }

  const directoryData = values.map(row => {
    const hasDigitalLink = row[digitalLinkIndex] && row[digitalLinkIndex].toString().trim() !== '';
    const hasScannedLink = row[scannedLinkIndex] && row[scannedLinkIndex].toString().trim() !== '';

    if (hasDigitalLink || hasScannedLink) {
      let record = {};
      headers.forEach((header, i) => {
        record[header] = row[i];
      });
      return record;
    }
    return null;
  }).filter(Boolean); // Elimina las filas que retornaron null
  
  return directoryData;
}
