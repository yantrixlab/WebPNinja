/**
 * Receives contact-form submissions (POST) and appends them to the active
 * spreadsheet. Deploy as a Web App: Execute as "Me", access "Anyone".
 *
 * Setup:
 * 1. Open script.google.com, create/open this project.
 * 2. Tools > Script properties (or just bind to a Sheet): create a new
 *    Google Sheet, then in this script's editor go to
 *    Resources > "Container-bound" — easiest is to open the script FROM
 *    the Sheet (Extensions > Apps Script) so SpreadsheetApp.getActiveSpreadsheet()
 *    resolves automatically. If running standalone, replace
 *    SpreadsheetApp.getActiveSpreadsheet() below with
 *    SpreadsheetApp.openById('YOUR_SHEET_ID').
 * 3. Deploy > New deployment > Web app > Execute as "Me",
 *    Who has access: "Anyone". Copy the deployment URL.
 * 4. Paste that URL into CONTACT_FORM_ENDPOINT in src/pages/contact.astro.
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const name    = (data.name    || '').toString().trim();
    const email   = (data.email   || '').toString().trim();
    const subject = (data.subject || '').toString().trim();
    const message = (data.message || '').toString().trim();

    if (!name || !email || !message) {
      return jsonResponse({ ok: false, error: 'Missing required fields' }, 400);
    }

    const sheet = getSheet();
    sheet.appendRow([
      new Date(),
      name,
      email,
      subject,
      message,
      e.parameter.userAgent || '',
    ]);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message }, 500);
  }
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Submissions');
  if (!sheet) {
    sheet = ss.insertSheet('Submissions');
    sheet.appendRow(['Timestamp', 'Name', 'Email', 'Subject', 'Message', 'User Agent']);
  }
  return sheet;
}

function jsonResponse(obj, status) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
