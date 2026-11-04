// Kursga yozilish arizasini Telegramga yuboradi.
// Vercel sozlamalarida (Settings → Environment Variables) ikki o'zgaruvchi kerak:
//   TELEGRAM_BOT_TOKEN — @BotFather bergan bot tokeni
//   TELEGRAM_CHAT_ID   — arizalar keladigan chat yoki guruh ID raqami
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
  const name = clip(b.name, 100);
  const phone = clip(b.phone, 40);
  const course = clip(b.course, 200);
  const telegram = clip(b.telegram, 60);
  const comment = clip(b.comment, 1000);
  const lang = clip(b.lang, 5);
  if (name.length < 2 || phone.replace(/\D/g, '').length < 9 || !b.consent) {
    return res.status(400).json({ ok: false, error: 'invalid' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return res.status(503).json({ ok: false, error: 'not_configured' });

  const text = [
    '📝 Yangi ariza — finteam.uz',
    `Kurs: ${course || '—'}`,
    `Ism: ${name}`,
    `Telefon: ${phone}`,
    telegram && `Telegram: ${telegram}`,
    comment && `Izoh: ${comment}`,
    `Til: ${lang || '—'}`,
  ].filter(Boolean).join('\n');

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
    });
    if (!r.ok) return res.status(502).json({ ok: false, error: 'telegram' });
  } catch {
    return res.status(502).json({ ok: false, error: 'telegram' });
  }
  return res.status(200).json({ ok: true });
}
