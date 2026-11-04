// Google Sheets jadvaliga arizalarni yozadigan skript.
// Jadvalda: Kengaytmalar (Extensions) → Apps Script → shu kodni joylang → Deploy → New deployment → Web app,
// "Execute as: Me", "Who has access: Anyone" → Deploy. Chiqqan URL ni Vercel'da SHEETS_WEBHOOK_URL ga yozing.
// Ixtiyoriy: SECRET o'rniga o'z maxfiy so'zingizni yozing va xuddi shu so'zni Vercel'da SHEETS_SECRET ga kiriting.
// Hech narsa o'zgartirmasangiz ham ishlaydi (sayt standart qiymatni yuboradi).
const SECRET = 'BU_YERGA_MAXFIY_SOZ';

function doPost(e) {
  const d = JSON.parse((e.postData && e.postData.contents) || '{}');
  if (d.secret !== SECRET) return out({ ok: false });
  const safe = (v) => { v = String(v || ''); return /^[=+\-@]/.test(v) ? "'" + v : v; };
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book.getSheetByName('Arizalar') || book.getSheets()[0];
  sheet.appendRow([new Date(), safe(d.course), safe(d.name), safe(d.phone), safe(d.telegram), safe(d.comment), safe(d.lang), 'Yangi']);
  return out({ ok: true });
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
