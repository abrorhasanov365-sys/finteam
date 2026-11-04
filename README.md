# FINANCE TEAM — finteam.uz

FINANCE TEAM o'quv markazi sayti (o'zbek va rus tillarida). Statik sayt, Vercel'da ishlaydi.

## Matnlarni qayerdan o'zgartirish

| Nima | Fayl |
|---|---|
| Telefon, Telegram, e-mail, ijtimoiy tarmoq linklari | `content/site.json` |
| Kurslar, o'qituvchilar, bitiruvchilar, manzil, barcha matnlar (o'zbekcha) | `content/uz.json` |
| Xuddi shu, ruscha | `content/ru.json` |
| Ommaviy oferta | `content/oferta.uz.md`, `content/oferta.ru.md` |
| Rasmlar (logo, o'qituvchi va bitiruvchi suratlari) | `assets/` |

- Surat qo'shish: rasmni `assets/` ga yuklang va tegishli yozuvda `"photo": "fayl-nomi.jpg"` deb yozing.
- Namuna yozuvidan "Namuna" belgisini olib tashlash: `"sample": true` qatorini o'chiring.
- Kurs narxi va boshlanish sanasi: `"price"` va `"start"`. Bo'sh bo'lsa saytda "Aniqlanmoqda" chiqadi.
- Yangi kurs: `courses.items` ga yangi yozuv qo'shing, `slug` ikkala tilda bir xil bo'lsin (sahifa manzili `/courses/<slug>/`).

## Kursga yozilish arizalari

Forma arizani `api/enroll.js` orqali Telegram botga va Google Sheets jadvaliga yuboradi. Vercel → Settings → Environment Variables:

- `TELEGRAM_BOT_TOKEN` — @BotFather bergan token
- `TELEGRAM_CHAT_ID` — arizalar keladigan chat ID (@Financeteam_TM botga /start yozadi, keyin getUpdates orqali olinadi)
- `SHEETS_WEBHOOK_URL` — Google Apps Script web app manzili (kod: `tools/arizalar-sheet.gs`)
- `SHEETS_SECRET` — skriptdagi `SECRET` bilan bir xil maxfiy so'z

Kamida bittasi sozlangan bo'lsa forma ishlaydi. Hech biri bo'lmasa, forma foydalanuvchiga Telegram/telefon orqali bog'lanishni taklif qiladi.

## Yig'ish

`node build.mjs` → `public/` (Vercel buni o'zi bajaradi).
