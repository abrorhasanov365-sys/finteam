// Saytni yig'ish: node build.mjs
// content/*.json va content/oferta.*.md fayllaridan public/ papkasiga tayyor sahifalar yasaydi.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(root, 'content', f), 'utf8');
const site = JSON.parse(read('site.json'));
const langs = ['uz', 'ru'].map((l) => ({ ...JSON.parse(read(`${l}.json`)), offerMd: read(`oferta.${l}.md`) }));
const SITE = site.url;

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const initials = (n) => n.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const tel = (p) => p.replace(/[^+\d]/g, '');
const tg = (u) => `https://t.me/${u.replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '')}`;
const asset = (f) => `/assets/${f}`;
const href = (t, p) => (t.prefix + p).replace(/\/+$/, '/') || '/';

const ICONS = {
  telegram: '<path d="M21.4 4.1 2.9 11.3c-1.1.4-1 1.5 0 1.8l4.6 1.4 1.8 5.5c.2.7 1.1.9 1.6.4l2.6-2.4 4.8 3.5c.6.5 1.5.1 1.7-.6l3-14.2c.2-1-.7-1.9-1.6-1.6ZM10 14.3l-.4 4-1.5-4.6 10.5-6.6L10 14.3Z"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.4" cy="6.6" r="1.3"/>',
  facebook: '<path d="M13.5 22v-8h2.8l.5-3.4h-3.3V8.5c0-1 .4-1.7 1.8-1.7H17V3.8c-.3 0-1.4-.1-2.6-.1-2.6 0-4.3 1.6-4.3 4.4v2.5H7.3V14h2.8v8h3.4Z"/>',
  youtube: '<path d="M22 8.2c-.2-1.6-1-2.6-2.6-2.8C17 5 12 5 12 5s-5 0-7.4.4C3 5.6 2.2 6.6 2 8.2c-.2 1.4-.2 3.8-.2 3.8s0 2.4.2 3.8c.2 1.6 1 2.6 2.6 2.8C7 19 12 19 12 19s5 0 7.4-.4c1.6-.2 2.4-1.2 2.6-2.8.2-1.4.2-3.8.2-3.8s0-2.4-.2-3.8ZM10 15V9l5.2 3L10 15Z"/>',
  phone: '<path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2Z"/>',
  arrow: '<path d="M5 12h13m-5-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
};
const icon = (n, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="currentColor" aria-hidden="true">${ICONS[n]}</svg>`;
const SOCIAL_NAMES = { telegram: 'Telegram', instagram: 'Instagram', facebook: 'Facebook', youtube: 'YouTube' };

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600&family=Montserrat:wght@700;800&display=swap">';

const CSS = `
/* Brand: green #00796F, white, slate #263238. Motif: the shield from the logo (pointed bottom). */
:root {
  --green: #00796F; --slate: #263238;
  --bg: #FFFFFF; --surface: #F2F7F6; --card: #FFFFFF; --fg: #263238; --muted: #56656C;
  --line: rgba(38,50,56,.13); --accent: #00796F; --accent-strong: #005C54; --accent-ink: #FFFFFF; --tint: #E3F1EF;
  --band: #00796F; --band-fg: #FFFFFF; --band-muted: rgba(255,255,255,.84); --band-line: rgba(255,255,255,.22);
  --dark: #263238; --dark-fg: #FFFFFF; --dark-muted: #B4C1C6;
  --display: "Montserrat", "Golos Text", system-ui, sans-serif;
  --body: "Golos Text", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --radius: 10px; --max: 1180px;
  --shield: polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%);
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #141C1F; --surface: #1A2427; --card: #1E2A2E; --fg: #E6EEEC; --muted: #A3B2B6;
  --line: rgba(230,238,236,.13); --accent: #3DB5A8; --accent-strong: #6FCFC4; --accent-ink: #0D1A1A; --tint: #1D3431;
  --band: #0B5A52; --dark: #0E1517; color-scheme: dark } }
:root[data-theme="dark"] {
  --bg: #141C1F; --surface: #1A2427; --card: #1E2A2E; --fg: #E6EEEC; --muted: #A3B2B6;
  --line: rgba(230,238,236,.13); --accent: #3DB5A8; --accent-strong: #6FCFC4; --accent-ink: #0D1A1A; --tint: #1D3431;
  --band: #0B5A52; --dark: #0E1517; color-scheme: dark }
* { box-sizing: border-box }
html { scroll-behavior: smooth; scroll-padding-top: 90px; -webkit-text-size-adjust: 100% }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto } * { transition: none !important } }
body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.6 var(--body); -webkit-font-smoothing: antialiased }
img { max-width: 100%; display: block }
a { color: inherit }
h1, h2, h3 { margin: 0; text-wrap: balance; font-family: var(--display); letter-spacing: -.01em }
p { margin: 0 }
ul { margin: 0; padding: 0 }
.wrap { max-width: var(--max); margin: 0 auto; padding-left: max(20px, env(safe-area-inset-left, 0px)); padding-right: max(20px, env(safe-area-inset-right, 0px)) }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px }
.logo-w { display: none }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .logo-c { display: none } :root:not([data-theme="light"]) .logo-w { display: block } }
:root[data-theme="dark"] .logo-c { display: none } :root[data-theme="dark"] .logo-w { display: block }

/* header */
.top { position: sticky; top: 0; z-index: 20; background: color-mix(in srgb, var(--bg) 94%, transparent); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); padding-top: env(safe-area-inset-top, 0px) }
.top .wrap { display: flex; align-items: center; gap: 24px; min-height: 74px }
.brand { display: inline-flex; flex: none }
.brand img { height: 46px; width: auto }
.nav { display: flex; gap: 22px; margin-left: auto; align-items: center }
.nav a:not(.btn) { text-decoration: none; font-weight: 500; font-size: 15px; color: var(--fg) }
.nav a:not(.btn):hover, .nav a[aria-current="page"] { color: var(--accent) }
.nav a[aria-current="page"] { text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 2px }
.langs { display: inline-flex; border: 1px solid var(--line); border-radius: 999px; overflow: hidden; font-size: 13px; font-weight: 600; letter-spacing: .05em }
.langs a { padding: 6px 11px; text-decoration: none; color: var(--muted) }
.langs a[aria-current="true"] { background: var(--fg); color: var(--bg) }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 22px; border-radius: 999px; font: 600 15px/1.2 var(--body); text-decoration: none; border: 1.5px solid transparent; transition: background .15s, color .15s, border-color .15s; cursor: pointer }
.btn-primary { background: var(--accent); color: var(--accent-ink) }
.btn-primary:hover { background: var(--accent-strong) }
.btn-ghost { border-color: var(--line); color: var(--fg) }
.btn-ghost:hover { border-color: var(--fg) }
.btn-light { background: #FFFFFF; color: #00665D }
.btn-light:hover { background: #E3F1EF }
.btn-outline-light { border-color: rgba(255,255,255,.6); color: #FFFFFF }
.btn-outline-light:hover { background: rgba(255,255,255,.12); border-color: #FFFFFF }
.menu-btn { display: none; margin-left: auto; background: none; border: 1px solid var(--line); border-radius: 999px; padding: 8px 16px; font: 600 14px var(--body); color: var(--fg); cursor: pointer }
@media (max-width: 1060px) {
  .menu-btn { display: inline-flex }
  .nav { display: none; position: absolute; left: 0; right: 0; top: 100%; flex-direction: column; align-items: flex-start; gap: 2px; background: var(--bg); border-bottom: 1px solid var(--line); padding: 12px max(20px, env(safe-area-inset-right, 0px)) 22px max(20px, env(safe-area-inset-left, 0px)); box-shadow: 0 16px 24px -16px rgba(0,0,0,.2) }
  .nav.open { display: flex }
  .nav a:not(.btn) { padding: 9px 0; font-size: 17px }
  .nav .langs { margin-top: 8px }
  .nav .btn { margin-top: 10px }
  .brand img { height: 40px }
}

/* common */
section { padding-block: 88px }
@media (max-width: 700px) { section { padding-block: 60px } }
.eyebrow { display: inline-flex; align-items: center; gap: 9px; font-size: 13px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--accent) }
.eyebrow::before { content: ""; width: 10px; height: 13px; background: currentColor; clip-path: var(--shield) }
.h2 { font-weight: 800; font-size: clamp(26px, 3.4vw, 40px); line-height: 1.15; margin-top: 12px; max-width: 24ch; hyphens: auto; overflow-wrap: break-word }
.lead { color: var(--muted); font-size: 18px; max-width: 62ch; margin-top: 14px }
.head { margin-bottom: 44px }
.head-row { display: flex; justify-content: space-between; align-items: end; gap: 24px; flex-wrap: wrap; margin-bottom: 40px }
.head-row .head { margin-bottom: 0 }
.more-link { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; color: var(--accent); text-decoration: none; white-space: nowrap }
.more-link:hover { text-decoration: underline; text-underline-offset: 4px }
.sample { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: var(--muted); background: var(--surface); border: 1px dashed color-mix(in srgb, var(--muted) 55%, transparent); padding: 3px 10px; border-radius: 999px }
.soon { color: var(--muted); font-style: italic; font-weight: 400 }
.tags { display: flex; flex-wrap: wrap; gap: 6px }
.tags li { list-style: none; padding: 4px 11px; background: var(--tint); color: var(--accent-strong); border-radius: 999px; font-size: 13px; font-weight: 500 }
.grid { display: grid; gap: 24px }
.g3 { grid-template-columns: repeat(3, minmax(0, 1fr)) }
.g4 { grid-template-columns: repeat(4, minmax(0, 1fr)) }
@media (max-width: 1000px) { .g3, .g4 { grid-template-columns: repeat(2, minmax(0, 1fr)) } }
@media (max-width: 620px) { .g3, .g4 { grid-template-columns: 1fr } }

/* hero */
.hero { background: var(--band); color: var(--band-fg); position: relative; overflow: hidden; padding-block: 72px 84px }
.hero::after { content: ""; position: absolute; right: -60px; top: -40px; width: 460px; height: 650px; background: url(/assets/mark-white.png) no-repeat center / contain; opacity: .07; pointer-events: none }
.hero .wrap { position: relative; z-index: 1; display: grid; grid-template-columns: 1.2fr .8fr; gap: 56px; align-items: center }
.hero .eyebrow { color: var(--band-fg) }
.hero h1 { font-weight: 800; font-size: clamp(32px, 4.6vw, 56px); line-height: 1.08; max-width: 16ch }
.hero h1 em { font-style: normal; color: #B9E6E0 }
.hero .lead { color: var(--band-muted); font-size: 19px }
.actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px }
.groups { background: rgba(0,0,0,.14); border: 1px solid var(--band-line); border-radius: 16px; padding: 24px }
.groups h2 { font: 600 13px var(--body); letter-spacing: .1em; text-transform: uppercase; color: var(--band-muted) }
.groups ul { margin-top: 10px }
.groups li { list-style: none; border-top: 1px solid var(--band-line) }
.groups li:first-child { border-top: 0 }
.groups a { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; align-items: center; padding: 13px 0; text-decoration: none }
.groups a:hover strong { text-decoration: underline; text-underline-offset: 3px }
.groups strong { font-weight: 600; line-height: 1.35 }
.groups span { grid-column: 1; font-size: 14px; color: var(--band-muted) }
.groups svg { grid-row: 1 / 3; grid-column: 2; opacity: .8 }
@media (max-width: 900px) { .hero .wrap { grid-template-columns: 1fr; gap: 40px } .hero { padding-block: 52px 60px } }

/* features */
.features { border-bottom: 1px solid var(--line); padding-block: 56px }
.feat { display: grid; gap: 8px; align-content: start }
.feat b { font: 800 14px var(--display); color: var(--accent) }
.feat h3 { font-size: 18px; font-weight: 700 }
.feat p { color: var(--muted); font-size: 15px }

/* page head (inner pages) */
.page-head { background: var(--surface); border-bottom: 1px solid var(--line); padding-block: 56px 52px }
.page-head h1 { font-weight: 800; font-size: clamp(30px, 4.4vw, 50px); line-height: 1.1; margin-top: 12px; max-width: 22ch }
.crumb { font-size: 14px; color: var(--muted); text-decoration: none; display: inline-flex; gap: 6px; align-items: center; margin-bottom: 14px }
.crumb:hover { color: var(--accent) }
.crumb svg { transform: rotate(180deg) }

/* course cards */
.course { display: flex; flex-direction: column; gap: 14px; padding: 26px; background: var(--card); border: 1px solid var(--line); border-radius: 16px; text-decoration: none; transition: border-color .15s, transform .15s, box-shadow .15s; position: relative }
.course:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 18px 32px -22px rgba(0,80,72,.45) }
.course .lvl { font-size: 13px; font-weight: 600; color: var(--accent) }
.course h3 { font-size: 20px; font-weight: 700; line-height: 1.25 }
.course p { color: var(--muted); font-size: 15px }
.course dl { margin: auto 0 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-top: 16px; border-top: 1px solid var(--line) }
.course dt { font-size: 12px; color: var(--muted) }
.course dd { margin: 0; font-weight: 600; font-size: 14px }
.course .go { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; color: var(--accent); font-size: 15px }
.course .sample { align-self: flex-start }

/* people */
.person { display: grid; gap: 16px; align-content: start }
.shield { aspect-ratio: 4 / 5; clip-path: var(--shield); background: var(--tint); position: relative; overflow: hidden }
.shield img { width: 100%; height: 100%; object-fit: cover; object-position: center top }
.shield.ph { background: var(--green); display: grid; place-items: center }
.shield.ph img { width: 34%; height: auto; opacity: .35 }
.shield.ph span { position: absolute; inset: auto 0 30% 0; text-align: center; font: 800 28px var(--display); color: #FFFFFF; opacity: .9; letter-spacing: .04em }
.person h3 { font-size: 20px; font-weight: 700 }
.person .role { color: var(--accent); font-weight: 500; margin-top: 4px }
.person .exp { font-size: 14px; color: var(--muted); margin-top: 2px }
.person .bio { display: grid; gap: 10px; color: var(--muted); font-size: 15px }
.person .teaches { font-size: 14px }
.person .teaches b { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin-bottom: 4px }
.person .teaches a { color: var(--fg); font-weight: 500 }
.person .teaches a:hover { color: var(--accent) }
.people-full { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 40px 28px }
.people-full .shield { max-width: 300px }
@media (max-width: 1000px) { .people-full { grid-template-columns: repeat(2, minmax(0, 1fr)) } }
@media (max-width: 560px) { .people-full { grid-template-columns: 1fr } .people-full .shield { max-width: 200px } }

/* graduates */
.grad { display: grid; grid-template-rows: auto 1fr; background: var(--card); border: 1px solid var(--line); border-radius: 16px; overflow: hidden }
.grad .photo { aspect-ratio: 1 / 1; background: var(--tint); position: relative }
.grad .photo img { width: 100%; height: 100%; object-fit: cover; object-position: center top }
.grad .photo.ph { display: grid; place-items: center; background: linear-gradient(160deg, var(--tint), color-mix(in srgb, var(--accent) 22%, var(--tint))) }
.grad .photo.ph span { font: 800 40px var(--display); color: var(--accent); opacity: .55 }
.grad .badge { position: absolute; left: 16px; bottom: -14px; width: 30px; height: 38px; background: var(--green); clip-path: var(--shield); display: grid; place-items: center }
.grad .badge img { width: 14px }
.grad .body { padding: 26px 22px 22px; display: grid; gap: 10px; align-content: start }
.grad h3 { font-size: 18px; font-weight: 700 }
.grad .job { font-weight: 600; color: var(--accent); font-size: 15px; line-height: 1.4 }
.grad .job span { display: block; color: var(--fg); font-weight: 500 }
.grad .meta { font-size: 13px; color: var(--muted) }
@media (max-width: 620px) { .grad { grid-template-rows: none; grid-template-columns: 112px minmax(0, 1fr) } .grad .photo { aspect-ratio: auto; min-height: 140px } .grad .badge { display: none } .grad .body { padding: 18px 16px } .grad .photo.ph span { font-size: 28px } }
.grad blockquote { margin: 4px 0 0; padding-left: 12px; border-left: 3px solid var(--accent); color: var(--muted); font-size: 14px; font-style: italic }

/* about */
.split { display: grid; grid-template-columns: 1.1fr .9fr; gap: 64px; align-items: start }
.prose { display: grid; gap: 16px; font-size: 17px }
.values { display: grid; border-top: 2px solid var(--fg); margin: 0 }
.values div { padding: 18px 0; border-bottom: 1px solid var(--line); display: grid; grid-template-columns: 140px 1fr; gap: 16px }
.values dt { font-weight: 700; font-family: var(--display) }
.values dd { margin: 0; color: var(--muted) }
.legal { margin-top: 40px }
.legal h2 { font-size: 20px; font-weight: 700 }
@media (max-width: 860px) { .split { grid-template-columns: 1fr; gap: 40px } .values div { grid-template-columns: 1fr; gap: 4px } }

/* course detail */
.facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; margin: 32px 0 0 }
.facts div { background: var(--card); padding: 16px 18px }
.facts dt { font-size: 13px; color: var(--muted) }
.facts dd { margin: 2px 0 0; font-weight: 600 }
@media (max-width: 700px) { .facts { grid-template-columns: repeat(2, minmax(0, 1fr)) } }
.detail { display: grid; grid-template-columns: minmax(0, 1fr) 400px; gap: 56px; align-items: start }
.detail > div { display: grid; gap: 52px }
.detail h2 { font-size: 24px; font-weight: 800; margin-bottom: 18px }
.ticks { display: grid; gap: 10px }
.ticks li { list-style: none; display: grid; grid-template-columns: 22px 1fr; gap: 10px }
.ticks li::before { content: ""; width: 12px; height: 15px; margin-top: 5px; background: var(--accent); clip-path: var(--shield) }
.modules { counter-reset: m; display: grid; gap: 0; border-top: 1px solid var(--line) }
.modules li { list-style: none; counter-increment: m; display: grid; grid-template-columns: 56px 1fr; gap: 4px 12px; padding: 18px 0; border-bottom: 1px solid var(--line) }
.modules li::before { content: counter(m, decimal-leading-zero); grid-row: 1 / 3; font: 800 22px var(--display); color: var(--accent) }
.modules h3 { font-size: 17px; font-weight: 700; font-family: var(--body) }
.modules p { color: var(--muted); font-size: 15px }
.mini-teacher { display: grid; grid-template-columns: 120px 1fr; gap: 20px; align-items: center }
@media (max-width: 1000px) { .detail { grid-template-columns: 1fr } }

/* enrol form */
.enroll-card { position: sticky; top: 96px; background: var(--card); border: 1px solid var(--line); border-top: 4px solid var(--accent); border-radius: 16px; padding: 28px; box-shadow: 0 24px 40px -30px rgba(0,60,55,.5) }
.enroll-card h2 { font-size: 22px; margin: 0 }
.enroll-card .lead { font-size: 15px; margin-top: 8px }
.enroll-card .price { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; margin-top: 18px; padding: 12px 0; border-block: 1px solid var(--line) }
.enroll-card .price span { color: var(--muted); font-size: 14px }
.enroll-card .price b { font: 800 20px var(--display) }
form.enroll { display: grid; gap: 14px; margin-top: 18px }
.field { display: grid; gap: 6px }
.field label { font-size: 14px; font-weight: 500 }
.field input, .field textarea { width: 100%; font: 16px var(--body); color: var(--fg); background: var(--bg); border: 1.5px solid var(--line); border-radius: 10px; padding: 11px 13px }
.field input:focus, .field textarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent) }
.field textarea { min-height: 80px; resize: vertical }
.consent { display: grid; grid-template-columns: 20px 1fr; gap: 10px; font-size: 13px; color: var(--muted); align-items: start }
.consent input { width: 18px; height: 18px; margin: 2px 0 0; accent-color: var(--accent) }
.consent a { color: var(--accent) }
.hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden }
form.enroll .btn { width: 100%; padding-block: 14px; font-size: 16px }
form.enroll .btn[disabled] { opacity: .6; cursor: wait }
.form-status { font-size: 14px; min-height: 0 }
.form-status.ok { color: var(--accent); font-weight: 600 }
.form-status.err { color: #B3261E }
:root[data-theme="dark"] .form-status.err { color: #F2B8B5 }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .form-status.err { color: #F2B8B5 } }
.fallback { display: flex; flex-wrap: wrap; gap: 8px }
.fallback[hidden] { display: none }
.fallback .btn { width: auto; padding: 9px 16px; font-size: 14px }

/* contact */
.contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: start }
.cl { margin: 0; display: grid; border-top: 2px solid var(--fg) }
.cl div { display: grid; grid-template-columns: 170px minmax(0, 1fr); gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--line) }
.cl dt { color: var(--muted); font-size: 14px; padding-top: 2px }
.cl dd { margin: 0; font-weight: 600; font-size: 17px; overflow-wrap: anywhere; display: grid; gap: 4px }
.cl dd a { text-decoration: none }
.cl dd a:hover { color: var(--accent) }
@media (max-width: 860px) { .contact-grid { grid-template-columns: 1fr; gap: 40px } .cl div { grid-template-columns: 1fr; gap: 2px } }
.socials { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 20px }
.social { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: 1px solid var(--line); border-radius: 12px; text-decoration: none; background: var(--card) }
.social svg { color: var(--accent); flex: none }
.social b { display: block; font-weight: 600 }
.social small { display: block; color: var(--muted); font-size: 13px; overflow-wrap: anywhere }
a.social:hover { border-color: var(--accent) }
.social.off { opacity: .7 }
@media (max-width: 420px) { .socials { grid-template-columns: 1fr } }
.box-title { font-size: 20px; font-weight: 700 }

/* CTA band */
.cta { background: var(--band); color: var(--band-fg); position: relative; overflow: hidden }
.cta::after { content: ""; position: absolute; left: -80px; bottom: -120px; width: 360px; height: 510px; background: url(/assets/mark-white.png) no-repeat center / contain; opacity: .07; pointer-events: none }
.cta .wrap { position: relative; z-index: 1; display: flex; flex-wrap: wrap; gap: 32px; align-items: center; justify-content: space-between }
.cta h2 { font-weight: 800; font-size: clamp(24px, 3vw, 36px); line-height: 1.15; max-width: 22ch }
.cta p { color: var(--band-muted); margin-top: 10px; max-width: 54ch }
.cta .actions { margin-top: 0 }

/* partners */
.partner-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); gap: 24px }
.partner { list-style: none }
.partner a { display: grid; height: 100%; grid-template-rows: auto 1fr; background: var(--card); border: 1px solid var(--line); border-radius: 16px; overflow: hidden; text-decoration: none; transition: border-color .15s, transform .15s }
.partner a:hover { border-color: var(--accent); transform: translateY(-2px) }
.partner img { width: 100%; height: auto; aspect-ratio: 640 / 369; object-fit: cover; border-bottom: 1px solid var(--line) }
.partner div { padding: 20px 22px 22px; display: grid; gap: 6px; align-content: start }
.partner h3 { font-size: 19px; font-weight: 800 }
.partner p { color: var(--muted); font-size: 15px }
.partner .go { color: var(--accent); font-weight: 600; font-size: 14px; margin-top: 6px }

/* offer */
.offer { max-width: 78ch }
.draft { display: flex; gap: 12px; align-items: flex-start; padding: 16px 18px; border-radius: 12px; background: #FFF5D6; color: #5C4300; border: 1px solid #F0D98A; font-weight: 500; margin-bottom: 36px }
:root[data-theme="dark"] .draft { background: #3A3016; color: #F5E2A8; border-color: #6B5821 }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .draft { background: #3A3016; color: #F5E2A8; border-color: #6B5821 } }
.offer h2 { font-size: 21px; font-weight: 700; margin: 36px 0 12px }
.offer p { margin: 10px 0 }
.offer ul { margin: 8px 0 8px 22px }
.offer li { margin: 4px 0 }
.offer .ver { color: var(--muted); font-size: 14px; margin-bottom: 8px }

/* footer */
.foot { background: var(--dark); color: var(--dark-muted); padding-block: 56px 32px; font-size: 15px }
.foot-grid { display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 40px }
.foot .brand img { height: 52px }
.foot p { margin-top: 14px; max-width: 34ch }
.foot h2 { font: 600 13px var(--body); letter-spacing: .1em; text-transform: uppercase; color: var(--dark-fg); margin-bottom: 12px }
.foot ul { display: grid; gap: 6px }
.foot li { list-style: none }
.foot a { text-decoration: none }
.foot a:hover { color: var(--dark-fg) }
.foot .icons { display: flex; gap: 10px; margin-top: 16px }
.foot .icons a { width: 40px; height: 40px; display: grid; place-items: center; border: 1px solid rgba(255,255,255,.2); border-radius: 50% }
.foot .icons a:hover { background: var(--green); border-color: var(--green); color: #FFFFFF }
.foot-bottom { display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; align-items: center; margin-top: 44px; padding-top: 22px; border-top: 1px solid rgba(255,255,255,.12); font-size: 14px }
.foot .langs { border-color: rgba(255,255,255,.25) }
.foot .langs a { color: var(--dark-muted) }
.foot .langs a[aria-current="true"] { background: #FFFFFF; color: var(--slate) }
@media (max-width: 800px) { .foot-grid { grid-template-columns: 1fr 1fr } .foot-grid > :first-child { grid-column: 1 / -1 } }
`;

// ---------- components ----------
const sampleBadge = (t, s) => (s ? `<span class="sample">${esc(t.ui.sample)}</span>` : '');
const teacherById = (t, id) => t.teachers.items.find((m) => m.id === id);
const courseUrl = (t, c) => href(t, `/courses/${c.slug}/`);

function courseCard(t, c) {
  return `<a class="course" href="${courseUrl(t, c)}">
    <span class="lvl">${esc(c.level)}</span>
    <h3>${esc(c.title)}</h3>
    <p>${esc(c.short)}</p>
    ${sampleBadge(t, c.sample)}
    <dl>
      <div><dt>${esc(t.ui.duration)}</dt><dd>${esc(c.duration)}</dd></div>
      <div><dt>${esc(t.ui.price)}</dt><dd>${c.price ? esc(c.price) : `<span class="soon">${esc(t.ui.priceTbd)}</span>`}</dd></div>
    </dl>
    <span class="go">${esc(t.ui.more)} ${icon('arrow', 18)}</span>
  </a>`;
}

function shield(m, alt) {
  return m.photo
    ? `<div class="shield"><img src="${asset(m.photo)}" alt="${esc(alt)}" loading="lazy" width="480" height="600"></div>`
    : `<div class="shield ph" aria-hidden="true"><img src="${asset('mark-white.png')}" alt=""><span>${esc(initials(m.name))}</span></div>`;
}

function teacherCard(t, m, full) {
  const courses = t.courses.items.filter((c) => c.teacher === m.id);
  return `<article class="person" id="${esc(m.id)}">
    ${shield(m, m.name)}
    <div>
      <h3>${esc(m.name)}</h3>
      <p class="role">${esc(m.role)}</p>
      ${m.exp ? `<p class="exp">${esc(m.exp)}</p>` : ''}
    </div>
    ${m.tags?.length ? `<ul class="tags">${m.tags.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    ${full && m.bio?.length ? `<div class="bio">${m.bio.map((p) => `<p>${esc(p)}</p>`).join('')}</div>` : ''}
    ${full && courses.length ? `<p class="teaches"><b>${esc(t.ui.teaches)}</b>${courses.map((c) => `<a href="${courseUrl(t, c)}">${esc(c.title)}</a>`).join('<br>')}</p>` : ''}
    ${full ? sampleBadge(t, m.sample) : ''}
  </article>`;
}

function gradCard(t, g) {
  return `<article class="grad">
    <div class="photo${g.photo ? '' : ' ph'}">
      ${g.photo ? `<img src="${asset(g.photo)}" alt="${esc(g.name)}" loading="lazy" width="600" height="600">` : `<span aria-hidden="true">${esc(initials(g.name))}</span>`}
      <span class="badge" aria-hidden="true"><img src="${asset('mark-white.png')}" alt=""></span>
    </div>
    <div class="body">
      <h3>${esc(g.name)}</h3>
      <p class="job">${esc(g.position)}<span>${esc(g.company)}</span></p>
      <p class="meta">${esc(t.ui.course)}: ${esc(g.course)}${g.year ? ` · ${esc(t.ui.graduated)} ${esc(g.year)}` : ''}</p>
      ${g.quote ? `<blockquote>${esc(g.quote)}</blockquote>` : ''}
      ${sampleBadge(t, g.sample)}
    </div>
  </article>`;
}

function partnerGrid(t) {
  return `<ul class="partner-grid">${t.partners.items.map((x) => `
    <li class="partner"><a href="${esc(x.url)}" target="_blank" rel="noopener">
      <img src="${asset(x.logo)}" alt="${esc(x.name)}" width="640" height="369" loading="lazy">
      <div><h3>${esc(x.name)}</h3><p>${esc(x.d)}</p><span class="go">${esc(x.url.replace(/^https?:\/\//, ''))} ↗</span></div>
    </a></li>`).join('')}</ul>`;
}

function fallbackLinks(t) {
  const c = t.contact;
  const out = [];
  if (site.telegram) out.push(`<a class="btn btn-primary" href="${tg(site.telegram)}" target="_blank" rel="noopener">${icon('telegram', 16)} ${esc(c.write)}</a>`);
  if (site.phones[0]) out.push(`<a class="btn btn-ghost" href="tel:${tel(site.phones[0])}">${icon('phone', 16)} ${esc(site.phones[0])}</a>`);
  if (!out.length) out.push(`<a class="btn btn-ghost" href="${href(t, '/contact/')}">${esc(t.nav.contact)}</a>`);
  return out.join('');
}

function enrollCard(t, c) {
  const f = t.form;
  return `<aside class="enroll-card" id="enroll">
    <h2>${esc(f.title)}</h2>
    <p class="lead">${esc(f.lead)}</p>
    <div class="price"><span>${esc(t.ui.price)}</span><b>${c.price ? esc(c.price) : `<span class="soon">${esc(t.ui.priceTbd)}</span>`}</b></div>
    <form class="enroll" novalidate data-sending="${esc(f.sending)}" data-ok="${esc(f.ok)}" data-err="${esc(f.err)}">
      <input type="hidden" name="course" value="${esc(c.title)}">
      <input type="hidden" name="lang" value="${t.lang}">
      <div class="hp" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div>
      <div class="field"><label for="f-name">${esc(f.name)}</label><input id="f-name" name="name" required minlength="2" maxlength="100" autocomplete="name"></div>
      <div class="field"><label for="f-phone">${esc(f.phone)}</label><input id="f-phone" name="phone" type="tel" required inputmode="tel" autocomplete="tel" placeholder="+998 __ ___ __ __" maxlength="40"></div>
      <div class="field"><label for="f-tg">${esc(f.telegram)}</label><input id="f-tg" name="telegram" maxlength="60" placeholder="@username"></div>
      <div class="field"><label for="f-comment">${esc(f.comment)}</label><textarea id="f-comment" name="comment" maxlength="1000" placeholder="${esc(f.commentHint)}"></textarea></div>
      <label class="consent"><input type="checkbox" name="consent" value="1" required><span>${esc(f.consent)} · <a href="${href(t, '/offer/')}" target="_blank">${esc(t.nav.offer)}</a></span></label>
      <button class="btn btn-primary" type="submit">${esc(f.submit)}</button>
      <p class="form-status" role="status" aria-live="polite"></p>
      <div class="fallback" hidden>${fallbackLinks(t)}</div>
    </form>
  </aside>`;
}

function socialsGrid(t) {
  const keys = Object.keys(SOCIAL_NAMES).filter((k) => site.socials[k]);
  return `<div class="socials">${(keys.length ? keys : Object.keys(SOCIAL_NAMES)).map((k) => {
    const url = site.socials[k];
    return url
      ? `<a class="social" href="${esc(url)}" target="_blank" rel="noopener">${icon(k, 26)}<span><b>${SOCIAL_NAMES[k]}</b><small>${esc(url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</small></span></a>`
      : `<div class="social off">${icon(k, 26)}<span><b>${SOCIAL_NAMES[k]}</b><small>${esc(t.ui.linkSoon)}</small></span></div>`;
  }).join('')}</div>`;
}

function contactActions(t, light) {
  const c = t.contact;
  const out = [];
  if (site.telegram) out.push(`<a class="btn ${light ? 'btn-light' : 'btn-primary'}" href="${tg(site.telegram)}" target="_blank" rel="noopener">${icon('telegram', 18)} ${esc(c.write)}</a>`);
  if (site.phones[0]) out.push(`<a class="btn ${light ? 'btn-outline-light' : 'btn-ghost'}" href="tel:${tel(site.phones[0])}">${icon('phone', 18)} ${esc(c.call)}</a>`);
  if (!out.length && light) out.push(`<a class="btn btn-light" href="${href(t, '/contact/')}">${esc(t.nav.contact)}</a>`);
  return out.join('');
}

const soon = (t) => `<span class="soon">${esc(t.ui.soon)}</span>`;

function contactList(t) {
  const c = t.contact;
  return `<dl class="cl">
    <div><dt>${esc(c.phoneLabel)}</dt><dd>${site.phones.length ? site.phones.map((p) => `<a href="tel:${tel(p)}">${esc(p)}</a>`).join('') : soon(t)}</dd></div>
    <div><dt>${esc(c.telegramLabel)}</dt><dd>${site.telegram ? `<a href="${tg(site.telegram)}" target="_blank" rel="noopener">@${esc(site.telegram.replace(/^@/, ''))}</a>` : soon(t)}</dd></div>
    ${site.email ? `<div><dt>${esc(c.emailLabel)}</dt><dd><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></dd></div>` : ''}
    <div><dt>${esc(c.addressLabel)}</dt><dd>${c.address ? esc(c.address) : soon(t)}${c.landmark ? `<span style="font-weight:400;color:var(--muted);font-size:15px">${esc(c.landmark)}</span>` : ''}${c.mapQuery ? `<a href="https://maps.google.com/?q=${encodeURIComponent(c.mapQuery)}" target="_blank" rel="noopener" style="color:var(--accent);font-size:15px">${esc(c.map)} ↗</a>` : ''}</dd></div>
    <div><dt>${esc(c.hoursLabel)}</dt><dd>${c.hours ? esc(c.hours) : soon(t)}</dd></div>
  </dl>`;
}

function ctaBand(t) {
  return `<section class="cta"><div class="wrap">
    <div><h2>${esc(t.home.ctaTitle)}</h2><p>${esc(t.home.ctaLead)}</p></div>
    <div class="actions">${contactActions(t, true)}</div>
  </div></section>`;
}

function pageHead(t, eyebrow, title, lead, extra = '') {
  return `<section class="page-head"><div class="wrap">
    <span class="eyebrow">${esc(eyebrow)}</span>
    <h1>${esc(title)}</h1>
    ${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
    ${extra}
  </div></section>`;
}

// minimal markdown: ## headings, paragraphs, "- " lists, **bold**
function md(src) {
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return src.trim().split(/\n{2,}/).map((block) => {
    const lines = block.split('\n');
    if (lines[0].startsWith('## ')) return `<h2>${inline(lines[0].slice(3))}</h2>`;
    if (lines.every((l) => l.startsWith('- '))) return `<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`;
    return `<p>${inline(lines.join(' '))}</p>`;
  }).join('\n');
}

// ---------- pages ----------
const PAGES = {
  '/': (t) => {
    const h = t.home;
    const title = h.accent ? esc(h.title).replace(esc(h.accent), `<em>${esc(h.accent)}</em>`) : esc(h.title);
    return `
<section class="hero"><div class="wrap">
  <div>
    <h1>${title}</h1>
    <div class="actions">
      <a class="btn btn-light" href="${href(t, '/courses/')}">${esc(h.primary)} ${icon('arrow', 18)}</a>
      <a class="btn btn-outline-light" href="${href(t, '/contact/')}">${esc(h.secondary)}</a>
    </div>
  </div>
  <aside class="groups">
    <h2>${esc(h.panelTitle)}</h2>
    <ul>${t.courses.items.map((c) => `<li><a href="${courseUrl(t, c)}"><strong>${esc(c.title)}</strong><span>${esc(t.ui.start)}: ${c.start ? esc(c.start) : esc(t.ui.priceTbd.toLowerCase())} · ${esc(c.duration)}</span>${icon('arrow', 18)}</a></li>`).join('')}</ul>
  </aside>
</div></section>
<section class="features"><div class="wrap grid g4">${h.features.map((f, i) => `<div class="feat"><b>0${i + 1}</b><h3>${esc(f.t)}</h3><p>${esc(f.d)}</p></div>`).join('')}</div></section>
<section><div class="wrap">
  <div class="head-row"><div class="head"><span class="eyebrow">${esc(t.courses.eyebrow)}</span><h2 class="h2">${esc(h.coursesTitle)}</h2><p class="lead">${esc(h.coursesLead)}</p></div><a class="more-link" href="${href(t, '/courses/')}">${esc(t.ui.allCourses)} ${icon('arrow', 18)}</a></div>
  <div class="grid g3">${t.courses.items.slice(0, 3).map((c) => courseCard(t, c)).join('')}</div>
</div></section>
<section style="background:var(--surface);border-block:1px solid var(--line)"><div class="wrap">
  <div class="head-row"><div class="head"><span class="eyebrow">${esc(t.teachers.eyebrow)}</span><h2 class="h2">${esc(h.teachersTitle)}</h2></div><a class="more-link" href="${href(t, '/teachers/')}">${esc(t.ui.allTeachers)} ${icon('arrow', 18)}</a></div>
  <div class="grid people-full">${t.teachers.items.slice(0, 3).map((m) => teacherCard(t, m, false)).join('')}</div>
</div></section>
<section><div class="wrap">
  <div class="head-row"><div class="head"><span class="eyebrow">${esc(t.graduates.eyebrow)}</span><h2 class="h2">${esc(h.graduatesTitle)}</h2><p class="lead">${esc(h.graduatesLead)}</p></div><a class="more-link" href="${href(t, '/graduates/')}">${esc(t.ui.allGraduates)} ${icon('arrow', 18)}</a></div>
  <div class="grid g4">${t.graduates.items.slice(0, 4).map((g) => gradCard(t, g)).join('')}</div>
</div></section>
<section style="background:var(--surface);border-top:1px solid var(--line)"><div class="wrap">
  <div class="head"><span class="eyebrow">${esc(t.partners.eyebrow)}</span><h2 class="h2">${esc(t.partners.title)}</h2><p class="lead">${esc(t.partners.lead)}</p></div>
  ${partnerGrid(t)}
</div></section>
${ctaBand(t)}`;
  },

  '/courses/': (t) => `${pageHead(t, t.courses.eyebrow, t.courses.title, t.courses.lead)}
<section><div class="wrap grid g3">${t.courses.items.map((c) => courseCard(t, c)).join('')}</div></section>
${ctaBand(t)}`,

  '/teachers/': (t) => `${pageHead(t, t.teachers.eyebrow, t.teachers.title, t.teachers.lead)}
<section><div class="wrap grid people-full">${t.teachers.items.map((m) => teacherCard(t, m, true)).join('')}</div></section>`,

  '/graduates/': (t) => `${pageHead(t, t.graduates.eyebrow, t.graduates.title, t.graduates.lead)}
<section><div class="wrap grid g4">${t.graduates.items.map((g) => gradCard(t, g)).join('')}</div></section>
${ctaBand(t)}`,

  '/partners/': (t) => `${pageHead(t, t.partners.eyebrow, t.partners.title, t.partners.lead)}
<section><div class="wrap">${partnerGrid(t)}</div></section>
${ctaBand(t)}`,

  '/about/': (t) => {
    const a = t.about;
    return `${pageHead(t, a.eyebrow, a.title)}
<section><div class="wrap split">
  <div>
    <div class="prose">${a.body.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
    <div class="legal"><h2>${esc(a.legalTitle)}</h2><dl class="cl" style="margin-top:14px">${a.legal.map((x) => `<div><dt>${esc(x.k)}</dt><dd>${x.v ? esc(x.v) : soon(t)}</dd></div>`).join('')}</dl></div>
  </div>
  <dl class="values">${a.values.map((v) => `<div><dt>${esc(v.t)}</dt><dd>${esc(v.d)}</dd></div>`).join('')}</dl>
</div></section>
${ctaBand(t)}`;
  },

  '/contact/': (t) => {
    const c = t.contact;
    return `${pageHead(t, c.eyebrow, c.title, c.lead, `<div class="actions">${contactActions(t, false)}</div>`)}
<section><div class="wrap contact-grid">
  <div>${contactList(t)}</div>
  <div><h2 class="box-title">${esc(c.socialsLabel)}</h2>${socialsGrid(t)}</div>
</div></section>`;
  },

  '/offer/': (t) => `${pageHead(t, t.offer.eyebrow, t.offer.title)}
<section><div class="wrap"><article class="offer">
  <div class="draft" role="note">${esc(t.offer.draft)}</div>
  ${md(t.offerMd)}
</article></div></section>`,
};

function coursePage(t, c) {
  const m = teacherById(t, c.teacher);
  const facts = [
    [t.ui.duration, c.duration], [t.ui.lessons, c.lessons], [t.ui.format, c.format],
    [t.ui.schedule, c.schedule], [t.ui.start, c.start], [t.ui.level, c.level],
  ];
  return `${pageHead(t, t.courses.eyebrow, c.title, c.short, `
    ${sampleBadge(t, c.sample)}
    <dl class="facts">${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v ? esc(v) : `<span class="soon">${esc(t.ui.priceTbd)}</span>`}</dd></div>`).join('')}</dl>
    <div class="actions"><a class="btn btn-primary" href="#enroll">${esc(t.nav.cta)}</a></div>`).replace('<span class="eyebrow">', `<a class="crumb" href="${href(t, '/courses/')}">${icon('arrow', 16)} ${esc(t.ui.backToCourses)}</a><br><span class="eyebrow">`)}
<section><div class="wrap detail">
  <div>
    <div><h2>${esc(t.ui.audience)}</h2><ul class="ticks">${c.audience.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div><h2>${esc(t.ui.program)}</h2><ol class="modules" style="margin:0;padding:0">${c.program.map((p) => `<li><h3>${esc(p.t)}</h3><p>${esc(p.d)}</p></li>`).join('')}</ol></div>
    <div><h2>${esc(t.ui.outcomes)}</h2><ul class="ticks">${c.outcomes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    ${m ? `<div><h2>${esc(t.ui.teacher)}</h2><a class="mini-teacher" href="${href(t, '/teachers/')}#${esc(m.id)}" style="text-decoration:none">${shield(m, m.name)}<div class="person"><div><h3>${esc(m.name)}</h3><p class="role">${esc(m.role)}</p>${m.exp ? `<p class="exp">${esc(m.exp)}</p>` : ''}</div></div></a></div>` : ''}
  </div>
  ${enrollCard(t, c)}
</div></section>`;
}

const NAV = ['about', 'courses', 'teachers', 'graduates', 'partners', 'contact'];

function layout(t, p, main, title, desc) {
  const langSwitch = langs.map((l) => `<a href="${href(l, p)}" hreflang="${l.htmlLang}" lang="${l.htmlLang}"${l.lang === t.lang ? ' aria-current="true"' : ''}>${l.lang.toUpperCase()}</a>`).join('');
  const section = '/' + p.split('/')[1] + '/';
  const navLinks = NAV.map((k) => `<a href="${href(t, `/${k}/`)}"${section === `/${k}/` ? ' aria-current="page"' : ''}>${esc(t.nav[k])}</a>`).join('\n      ');
  const ctaHref = p.startsWith('/courses/') && p !== '/courses/' ? '#enroll' : href(t, '/courses/');
  const alternates = langs.map((l) => `<link rel="alternate" hreflang="${l.htmlLang}" href="${SITE}${href(l, p)}">`).join('') + `<link rel="alternate" hreflang="x-default" href="${SITE}${href(langs[0], p)}">`;
  const socialIcons = Object.keys(SOCIAL_NAMES).filter((k) => site.socials[k]).map((k) => `<a href="${esc(site.socials[k])}" target="_blank" rel="noopener" aria-label="${SOCIAL_NAMES[k]}">${icon(k, 18)}</a>`).join('');
  return `<!doctype html>
<html lang="${t.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${href(t, p)}">
${alternates}
<meta property="og:type" content="website"><meta property="og:site_name" content="FINANCE TEAM"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${SITE}${href(t, p)}"><meta property="og:image" content="${SITE}/assets/og.jpg"><meta property="og:locale" content="${t.lang === 'ru' ? 'ru_RU' : 'uz_UZ'}">
<meta name="theme-color" content="#00796F">
<link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" href="/assets/icon-512.png" type="image/png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
${FONTS}
<link rel="stylesheet" href="/assets/site.css">
</head>
<body>
<header class="top">
  <div class="wrap">
    <a class="brand" href="${href(t, '/')}" aria-label="FINANCE TEAM — ${esc(t.nav.home)}">
      <img class="logo-c" src="${asset('logo.png')}" alt="FINANCE TEAM" width="269" height="120">
      <img class="logo-w" src="${asset('logo-white.png')}" alt="FINANCE TEAM" width="269" height="120">
    </a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">${esc(t.nav.menu)}</button>
    <nav class="nav" id="nav">
      ${navLinks}
      <span class="langs" aria-label="${esc(t.footer.langLabel)}">${langSwitch}</span>
      <a class="btn btn-primary" href="${ctaHref}">${esc(t.nav.cta)}</a>
    </nav>
  </div>
</header>
<main>${main}</main>
<footer class="foot">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <a class="brand" href="${href(t, '/')}"><img src="${asset('logo-white.png')}" alt="FINANCE TEAM" width="269" height="120" loading="lazy"></a>
        <p>${esc(t.home.eyebrow)}</p>
        ${socialIcons ? `<div class="icons">${socialIcons}</div>` : ''}
      </div>
      <div><h2>FINANCE TEAM</h2><ul>${NAV.map((k) => `<li><a href="${href(t, `/${k}/`)}">${esc(t.nav[k])}</a></li>`).join('')}<li><a href="${href(t, '/offer/')}">${esc(t.nav.offer)}</a></li></ul></div>
      <div><h2>${esc(t.nav.contact)}</h2><ul>
        ${site.phones.map((ph) => `<li><a href="tel:${tel(ph)}">${esc(ph)}</a></li>`).join('')}
        ${site.telegram ? `<li><a href="${tg(site.telegram)}" target="_blank" rel="noopener">Telegram: @${esc(site.telegram.replace(/^@/, ''))}</a></li>` : ''}
        ${site.email ? `<li><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></li>` : ''}
        ${t.contact.address ? `<li>${esc(t.contact.address)}${t.contact.landmark ? `<br>${esc(t.contact.landmark)}` : ''}</li>` : ''}
        ${!site.phones.length && !site.telegram ? `<li><a href="${href(t, '/contact/')}">${esc(t.contact.title)}</a></li>` : ''}
      </ul></div>
    </div>
    <div class="foot-bottom">
      <span>© ${new Date().getFullYear()} ${esc(site.legalName)}. ${esc(t.footer.rights)}</span>
      <span class="langs" aria-label="${esc(t.footer.langLabel)}">${langSwitch}</span>
    </div>
  </div>
</footer>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
}

const JS = `
document.querySelectorAll('.menu-btn').forEach(function (b) {
  var n = document.getElementById(b.getAttribute('aria-controls'));
  b.addEventListener('click', function () { var o = n.classList.toggle('open'); b.setAttribute('aria-expanded', o); });
});
document.querySelectorAll('form.enroll').forEach(function (f) {
  var st = f.querySelector('.form-status'), fb = f.querySelector('.fallback'), btn = f.querySelector('button[type=submit]');
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!f.checkValidity()) { f.reportValidity(); return; }
    var data = {}; new FormData(f).forEach(function (v, k) { data[k] = v; });
    btn.disabled = true; st.className = 'form-status'; st.textContent = f.dataset.sending; fb.hidden = true;
    fetch('/api/enroll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); f.reset(); st.className = 'form-status ok'; st.textContent = f.dataset.ok; })
      .catch(function () { st.className = 'form-status err'; st.textContent = f.dataset.err; fb.hidden = false; })
      .then(function () { btn.disabled = false; });
  });
});
`;

// ---------- write ----------
const out = join(root, 'public');
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'assets'), { recursive: true });
cpSync(join(root, 'assets'), join(out, 'assets'), { recursive: true });
cpSync(join(root, 'assets', 'favicon.ico'), join(out, 'favicon.ico'));
cpSync(join(root, 'assets', 'apple-touch-icon.png'), join(out, 'apple-touch-icon.png'));
writeFileSync(join(out, 'assets', 'site.css'), CSS.trim() + '\n');
writeFileSync(join(out, 'assets', 'site.js'), JS.trim() + '\n');

const urls = [];
function emit(t, p, main, title, desc) {
  const dir = join(out, href(t, p));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), layout(t, p, main, title, desc));
  urls.push(SITE + href(t, p));
}
for (const t of langs) {
  const titles = { '/': t.meta.title, '/courses/': t.courses.title, '/teachers/': t.teachers.title, '/graduates/': t.graduates.title, '/about/': t.about.eyebrow, '/partners/': t.partners.title, '/contact/': t.contact.eyebrow, '/offer/': t.offer.title };
  for (const [p, fn] of Object.entries(PAGES)) emit(t, p, fn(t), p === '/' ? t.meta.title : `${titles[p]} — FINANCE TEAM`, t.meta.description);
  for (const c of t.courses.items) emit(t, `/courses/${c.slug}/`, coursePage(t, c), `${c.title} — FINANCE TEAM`, c.short);
}
writeFileSync(join(out, '404.html'), `<!doctype html><html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>404 — FINANCE TEAM</title>${FONTS}<link rel="stylesheet" href="/assets/site.css"><style>.nf{min-height:80vh;display:grid;place-items:center;text-align:center}.nf .actions{justify-content:center}.nf img{height:56px;margin:0 auto 28px}</style></head><body><main class="wrap nf"><div><img src="/assets/logo.png" alt="FINANCE TEAM"><span class="eyebrow">404</span><h1 class="h2" style="margin-inline:auto">Sahifa topilmadi · Страница не найдена</h1><div class="actions"><a class="btn btn-primary" href="/">O'zbekcha</a><a class="btn btn-ghost" href="/ru/">Русский</a></div></div></main></body></html>`);
writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${SITE}/sitemap.xml\n`);
writeFileSync(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`OK: ${urls.length} sahifa -> public/`);
