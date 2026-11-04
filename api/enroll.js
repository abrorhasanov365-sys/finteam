// Kursga yozilish arizasini Telegram botga va Google Sheets jadvaliga yuboradi.
// Vercel → Settings → Environment Variables:
//   TELEGRAM_BOT_TOKEN — @BotFather bergan bot tokeni
//   TELEGRAM_CHAT_ID   — arizalar keladigan chat ID (@Financeteam_TM akkaunti botga /start yozgandan keyin)
//   SHEETS_WEBHOOK_URL — Google Apps Script web app manzili (tools/arizalar-sheet.gs)
//   SHEETS_SECRET      — skriptdagi SECRET bilan bir xil qiymat
// Ikkalasidan kamida bittasi sozlangan bo'lsa ariza qabul qilinadi.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};
  if (b.website) return res.status(200).json({ ok: true }); // bot tuzog'i

  const clip = (s, n) => String(s ?? '').trim().slice(0, n);
  const lead = {
    name: clip(b.name, 100),
    phone: clip(b.phone, 40),
    course: clip(b.course, 200),
    telegram: clip(b.telegram, 60),
    comment: clip(b.comment, 1000),
    lang: clip(b.lang, 5),
  };
  if (lead.name.length < 2 || lead.phone.replace(/\D/g, '').length < 9 || !b.consent) {
    return res.status(400).json({ ok: false, error: 'invalid' });
  }

  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chat, SHEETS_WEBHOOK_URL: sheetUrl, SHEETS_SECRET: secret } = process.env;
  const jobs = [];

  if (token && chat) {
    const text = [
      '📝 Yangi ariza — finteam.uz',
      `Kurs: ${lead.course || '—'}`,
      `Ism: ${lead.name}`,
      `Telefon: ${lead.phone}`,
      lead.telegram && `Telegram: ${lead.telegram}`,
      lead.comment && `Izoh: ${lead.comment}`,
      `Til: ${lead.lang || '—'}`,
    ].filter(Boolean).join('\n');
    jobs.push(fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
    }).then((r) => { if (!r.ok) throw new Error('telegram ' + r.status); }));
  }

  if (sheetUrl) {
    jobs.push(fetch(sheetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...lead, secret: secret || '' }),
      redirect: 'follow',
    }).then((r) => { if (!r.ok) throw new Error('sheets ' + r.status); }));
  }

  if (!jobs.length) return res.status(503).json({ ok: false, error: 'not_configured' });
  const results = await Promise.allSettled(jobs);
  results.filter((r) => r.status === 'rejected').forEach((r) => console.error(r.reason));
  if (!results.some((r) => r.status === 'fulfilled')) return res.status(502).json({ ok: false, error: 'delivery' });
  return res.status(200).json({ ok: true });
}
