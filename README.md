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

Forma arizani `api/enroll.js` orqali Telegram botga yuboradi. Vercel → Settings → Environment Variables:

- `TELEGRAM_BOT_TOKEN` — @BotFather bergan token
- `TELEGRAM_CHAT_ID` — arizalar keladigan chat/guruh ID

Bular kiritilmaguncha forma xato beradi va foydalanuvchiga Telegram/telefon orqali bog'lanishni taklif qiladi.

## Yig'ish

`node build.mjs` → `public/` (Vercel buni o'zi bajaradi).
