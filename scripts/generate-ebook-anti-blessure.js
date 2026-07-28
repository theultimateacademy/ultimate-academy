#!/usr/bin/env node
// Génère public/ebooks/anti-blessure/guide-antiblessure.pdf
const puppeteer = require('puppeteer')
const fs        = require('fs')
const path      = require('path')

const LOGO = path.join(__dirname, '../public/Logo.png')
const logoB64 = fs.existsSync(LOGO)
  ? `data:image/png;base64,${fs.readFileSync(LOGO).toString('base64')}`
  : ''

const OUT_DIR = path.join(__dirname, '../public/ebooks/anti-blessure')
fs.mkdirSync(OUT_DIR, { recursive: true })

// ─── Helpers ──────────────────────────────────────────────────────────────────
let gidSeq = 0
function ptToPx(pt) { return Math.round(pt * 1.3333 * 10) / 10 }
function escXml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }

function gradText(text, { sizePt, weight=800, width=670, height, align='center', uppercase=false }={}) {
  const fs = ptToPx(sizePt)
  const h  = height || Math.ceil(fs * 1.38)
  const gid = `gt${gidSeq++}`
  const x = align==='center'? width/2 : align==='end'? width : 0
  const anchor = align==='center'?'middle': align==='end'?'end':'start'
  const y = Math.round(h * 0.76)
  const t = uppercase ? text.toUpperCase() : text
  return `<svg viewBox="0 0 ${width} ${h}" width="${width}" height="${h}" style="display:block;margin:0 auto;overflow:visible;max-width:100%">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#8B2FC9"/><stop offset="100%" stop-color="#E8237A"/>
    </linearGradient></defs>
    <text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Poppins" font-weight="${weight}" font-size="${fs}" fill="url(#${gid})">${escXml(t)}</text>
  </svg>`
}

// Numéro en dégradé SVG pour les exercices
function gradNum(n, sizePt=32) {
  const fs = ptToPx(sizePt)
  const w = sizePt * 2.5, h = sizePt * 1.6
  const gid = `gn${gidSeq++}`
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="display:block;flex-shrink:0">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#8B2FC9"/><stop offset="100%" stop-color="#E8237A"/>
    </linearGradient></defs>
    <text x="${w/2}" y="${h*0.78}" text-anchor="middle" font-family="Poppins" font-weight="900" font-size="${fs}" fill="url(#${gid})" opacity="0.9">${n}</text>
  </svg>`
}

function hl(t) {
  return `<span style="background:linear-gradient(135deg,#8B2FC9,#E8237A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-weight:700">${t}</span>`
}

// ─── SVG décoratifs globaux ───────────────────────────────────────────────────
const SVG_HEARTBEAT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 28" width="100%" height="28" style="display:block">
  <defs><linearGradient id="hb-g" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#8B2FC9" stop-opacity="0"/>
    <stop offset="15%" stop-color="#8B2FC9"/><stop offset="85%" stop-color="#E8237A"/>
    <stop offset="100%" stop-color="#E8237A" stop-opacity="0"/>
  </linearGradient></defs>
  <polyline fill="none" stroke="url(#hb-g)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    points="0,14 45,14 60,14 70,3 80,25 88,10 96,20 104,14 175,14 190,14 203,3 216,25 224,14 295,14 310,14 323,3 336,25 344,14 415,14 500,14"/>
</svg>`

function svgTitleDeco() {
  const id1=`td${gidSeq++}`, id2=`td${gidSeq++}`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 20" width="100%" height="20" style="display:block;margin:-2px 0 6px">
    <defs>
      <linearGradient id="${id1}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#8B2FC9" stop-opacity="0"/>
        <stop offset="40%" stop-color="#8B2FC9"/>
        <stop offset="60%" stop-color="#E8237A"/>
        <stop offset="100%" stop-color="#E8237A" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="${id2}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#E8237A" stop-opacity="0"/>
        <stop offset="50%" stop-color="#E8237A" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="#E8237A" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <line x1="0" y1="6" x2="500" y2="6" stroke="url(#${id1})" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="60" y1="13" x2="440" y2="13" stroke="url(#${id2})" stroke-width="1" stroke-linecap="round"/>
    <circle cx="250" cy="6" r="4" fill="#E8237A" opacity="0.7"/>
    <circle cx="130" cy="6" r="2" fill="#8B2FC9" opacity="0.5"/>
    <circle cx="370" cy="6" r="2" fill="#8B2FC9" opacity="0.5"/>
  </svg>`
}

function svgWave() {
  const id=`wv${gidSeq++}`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 18" width="100%" height="18" style="display:block;margin-top:4px">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8B2FC9" stop-opacity="0"/>
      <stop offset="20%" stop-color="#8B2FC9"/>
      <stop offset="80%" stop-color="#E8237A"/>
      <stop offset="100%" stop-color="#E8237A" stop-opacity="0"/>
    </linearGradient></defs>
    <path d="M0,10 Q125,2 250,10 Q375,18 500,10" fill="none" stroke="url(#${id})" stroke-width="2" stroke-linecap="round"/>
    <path d="M40,14 Q165,6 290,14 Q415,18 460,13" fill="none" stroke="url(#${id})" stroke-width="1" opacity="0.4" stroke-linecap="round"/>
  </svg>`
}

function svgDiamond() {
  const id=`dm${gidSeq++}`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 14" width="80" height="14" style="display:block;margin:2px auto">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8B2FC9" stop-opacity="0.4"/>
      <stop offset="50%" stop-color="#E8237A"/>
      <stop offset="100%" stop-color="#8B2FC9" stop-opacity="0.4"/>
    </linearGradient></defs>
    <line x1="0" y1="7" x2="28" y2="7" stroke="url(#${id})" stroke-width="1.5" stroke-linecap="round"/>
    <polygon points="40,2 46,7 40,12 34,7" fill="url(#${id})"/>
    <line x1="52" y1="7" x2="80" y2="7" stroke="url(#${id})" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`
}

function pageNum(n) {
  const id=`pn${gidSeq++}`, id2=`pn${gidSeq++}`
  return `<div class="pnum">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 22" width="44" height="22">
      <defs>
        <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#8B2FC9" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="#E8237A" stop-opacity="0.2"/>
        </linearGradient>
        <linearGradient id="${id2}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#C084FC"/><stop offset="100%" stop-color="#F472B6"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="44" height="22" rx="11" fill="url(#${id})" stroke="rgba(139,47,201,0.5)" stroke-width="1"/>
      <text x="22" y="15.5" text-anchor="middle" font-family="Poppins" font-weight="800" font-size="11" fill="url(#${id2})">${n}</text>
    </svg>
  </div>`
}

function blobs(v='A') {
  return v==='A'
    ? '<div class="blob-tr"></div><div class="blob-bl"></div>'
    : '<div class="blob-tl"></div><div class="blob-br"></div>'
}

// ─── SVG exercices (silhouettes humaines schématiques) ─────────────────────────
function svgExo(type) {
  const id = `ex${gidSeq++}`
  const grad = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8B2FC9" stop-opacity="0.8"/><stop offset="100%" stop-color="#E8237A" stop-opacity="0.6"/></linearGradient></defs>`
  const c = `url(#${id})`
  const stroke = `stroke="url(#${id})" stroke-linecap="round" stroke-linejoin="round" fill="none"`

  const figures = {
    squat: `${grad}
      <circle cx="50" cy="16" r="8" fill="${c}" opacity="0.7"/>
      <line x1="50" y1="24" x2="50" y2="52" ${stroke} stroke-width="3.5"/>
      <line x1="50" y1="36" x2="34" y2="28" ${stroke} stroke-width="2.5"/>
      <line x1="50" y1="36" x2="66" y2="28" ${stroke} stroke-width="2.5"/>
      <line x1="50" y1="52" x2="38" y2="72" ${stroke} stroke-width="3"/>
      <line x1="50" y1="52" x2="62" y2="72" ${stroke} stroke-width="3"/>
      <line x1="38" y1="72" x2="30" y2="80" ${stroke} stroke-width="2.5"/>
      <line x1="62" y1="72" x2="70" y2="80" ${stroke} stroke-width="2.5"/>`,

    hipthrust: `${grad}
      <rect x="10" y="58" width="80" height="8" rx="4" fill="${c}" opacity="0.25"/>
      <circle cx="50" cy="18" r="8" fill="${c}" opacity="0.7"/>
      <line x1="50" y1="26" x2="50" y2="48" ${stroke} stroke-width="3.5"/>
      <line x1="50" y1="36" x2="34" y2="30" ${stroke} stroke-width="2.5"/>
      <line x1="50" y1="36" x2="66" y2="30" ${stroke} stroke-width="2.5"/>
      <line x1="50" y1="48" x2="32" y2="58" ${stroke} stroke-width="3"/>
      <line x1="50" y1="48" x2="68" y2="58" ${stroke} stroke-width="3"/>
      <line x1="32" y1="58" x2="28" y2="48" ${stroke} stroke-width="2.5"/>
      <line x1="68" y1="58" x2="72" y2="48" ${stroke} stroke-width="2.5"/>`,

    mollet: `${grad}
      <rect x="15" y="72" width="70" height="6" rx="3" fill="${c}" opacity="0.2"/>
      <circle cx="50" cy="12" r="8" fill="${c}" opacity="0.7"/>
      <line x1="50" y1="20" x2="50" y2="48" ${stroke} stroke-width="3.5"/>
      <line x1="50" y1="30" x2="34" y2="24" ${stroke} stroke-width="2.5"/>
      <line x1="50" y1="30" x2="66" y2="24" ${stroke} stroke-width="2.5"/>
      <line x1="50" y1="48" x2="44" y2="68" ${stroke} stroke-width="3"/>
      <line x1="50" y1="48" x2="60" y2="72" ${stroke} stroke-width="3"/>
      <line x1="44" y1="68" x2="44" y2="78" ${stroke} stroke-width="3"/>
      <line x1="60" y1="72" x2="60" y2="78" ${stroke} stroke-width="3"/>
      <ellipse cx="60" cy="62" rx="6" ry="10" ${stroke} stroke-width="1.5" opacity="0.5"/>`,

    fente: `${grad}
      <circle cx="50" cy="12" r="8" fill="${c}" opacity="0.7"/>
      <line x1="50" y1="20" x2="50" y2="46" ${stroke} stroke-width="3.5"/>
      <line x1="50" y1="30" x2="33" y2="24" ${stroke} stroke-width="2.5"/>
      <line x1="50" y1="30" x2="67" y2="24" ${stroke} stroke-width="2.5"/>
      <line x1="50" y1="46" x2="36" y2="70" ${stroke} stroke-width="3"/>
      <line x1="50" y1="46" x2="72" y2="58" ${stroke} stroke-width="3"/>
      <line x1="36" y1="70" x2="28" y2="78" ${stroke} stroke-width="2.5"/>
      <line x1="72" y1="58" x2="76" y2="78" ${stroke} stroke-width="2.5"/>`,

    pont: `${grad}
      <circle cx="18" cy="22" r="8" fill="${c}" opacity="0.7"/>
      <line x1="18" y1="30" x2="26" y2="48" ${stroke} stroke-width="3.5"/>
      <line x1="18" y1="38" x2="8" y2="36" ${stroke} stroke-width="2.5"/>
      <line x1="26" y1="48" x2="40" y2="38" ${stroke} stroke-width="3.5"/>
      <line x1="40" y1="38" x2="52" y2="50" ${stroke} stroke-width="3"/>
      <line x1="52" y1="50" x2="52" y2="68" ${stroke} stroke-width="3"/>
      <line x1="26" y1="48" x2="26" y2="68" ${stroke} stroke-width="3"/>
      <line x1="18" y1="38" x2="6" y2="48" ${stroke} stroke-width="2.5"/>
      <line x1="6" y1="48" x2="6" y2="68" ${stroke} stroke-width="2.5"/>`,

    clam: `${grad}
      <circle cx="20" cy="26" r="8" fill="${c}" opacity="0.7"/>
      <line x1="20" y1="34" x2="30" y2="50" ${stroke} stroke-width="3.5"/>
      <line x1="20" y1="40" x2="10" y2="38" ${stroke} stroke-width="2.5"/>
      <line x1="30" y1="50" x2="55" y2="44" ${stroke} stroke-width="3"/>
      <line x1="55" y1="44" x2="75" y2="52" ${stroke} stroke-width="3"/>
      <line x1="30" y1="50" x2="50" y2="62" ${stroke} stroke-width="3"/>
      <line x1="50" y1="62" x2="78" y2="66" ${stroke} stroke-width="3"/>`,

    planche: `${grad}
      <circle cx="15" cy="30" r="8" fill="${c}" opacity="0.7"/>
      <line x1="22" y1="34" x2="85" y2="48" ${stroke} stroke-width="4"/>
      <line x1="22" y1="34" x2="16" y2="52" ${stroke} stroke-width="3"/>
      <line x1="16" y1="52" x2="22" y2="56" ${stroke} stroke-width="2.5"/>
      <line x1="85" y1="48" x2="80" y2="64" ${stroke} stroke-width="3"/>
      <line x1="80" y1="64" x2="88" y2="66" ${stroke} stroke-width="2.5"/>
      <line x1="15" y1="30" x2="8" y2="40" ${stroke} stroke-width="2.5"/>`,

    tibialis: `${grad}
      <rect x="20" y="5" width="60" height="70" rx="30" fill="${c}" opacity="0.08"/>
      <circle cx="50" cy="14" r="8" fill="${c}" opacity="0.7"/>
      <line x1="50" y1="22" x2="50" y2="50" ${stroke} stroke-width="3.5"/>
      <line x1="50" y1="32" x2="34" y2="26" ${stroke} stroke-width="2.5"/>
      <line x1="50" y1="32" x2="66" y2="26" ${stroke} stroke-width="2.5"/>
      <line x1="50" y1="50" x2="42" y2="72" ${stroke} stroke-width="3"/>
      <line x1="50" y1="50" x2="58" y2="72" ${stroke} stroke-width="3"/>
      <path d="M34,68 Q42,60 42,72" ${stroke} stroke-width="2" opacity="0.6"/>
      <path d="M66,68 Q58,60 58,72" ${stroke} stroke-width="2" opacity="0.6"/>`,

    copenhagen: `${grad}
      <rect x="55" y="50" width="38" height="7" rx="3.5" fill="${c}" opacity="0.25"/>
      <circle cx="15" cy="28" r="8" fill="${c}" opacity="0.7"/>
      <line x1="22" y1="32" x2="80" y2="46" ${stroke} stroke-width="4"/>
      <line x1="22" y1="32" x2="18" y2="54" ${stroke} stroke-width="3"/>
      <line x1="18" y1="54" x2="26" y2="56" ${stroke} stroke-width="2.5"/>
      <line x1="80" y1="46" x2="76" y2="58" ${stroke} stroke-width="3"/>
      <line x1="76" y1="58" x2="88" y2="58" ${stroke} stroke-width="2.5"/>`,

    chaise: `${grad}
      <rect x="62" y="10" width="18" height="70" rx="5" fill="${c}" opacity="0.15"/>
      <circle cx="50" cy="14" r="8" fill="${c}" opacity="0.7"/>
      <line x1="50" y1="22" x2="50" y2="50" ${stroke} stroke-width="3.5"/>
      <line x1="50" y1="32" x2="34" y2="26" ${stroke} stroke-width="2.5"/>
      <line x1="50" y1="32" x2="64" y2="26" ${stroke} stroke-width="2.5"/>
      <line x1="50" y1="50" x2="38" y2="68" ${stroke} stroke-width="3"/>
      <line x1="50" y1="50" x2="58" y2="50" ${stroke} stroke-width="2.5"/>
      <line x1="38" y1="68" x2="34" y2="80" ${stroke} stroke-width="2.5"/>`,
  }
  const svgContent = figures[type] || figures.squat
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90" width="90" height="80" style="display:block;margin:0 auto">${svgContent}</svg>`
}

// ─── SVG étirements ──────────────────────────────────────────────────────────
function svgEtir(type) {
  const id = `et${gidSeq++}`
  const grad = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8B2FC9" stop-opacity="0.8"/><stop offset="100%" stop-color="#E8237A" stop-opacity="0.5"/></linearGradient></defs>`
  const c = `url(#${id})`
  const s = `stroke="url(#${id})" stroke-linecap="round" stroke-linejoin="round" fill="none"`

  const figs = {
    quad: `${grad}
      <circle cx="50" cy="14" r="8" fill="${c}" opacity="0.7"/>
      <line x1="50" y1="22" x2="50" y2="52" ${s} stroke-width="3"/>
      <line x1="50" y1="32" x2="34" y2="26" ${s} stroke-width="2"/>
      <line x1="50" y1="32" x2="62" y2="22" ${s} stroke-width="2"/>
      <line x1="50" y1="52" x2="40" y2="72" ${s} stroke-width="3"/>
      <line x1="50" y1="52" x2="58" y2="52" ${s} stroke-width="2"/>
      <path d="M58,52 Q68,46 64,36 Q60,28 62,22" ${s} stroke-width="2" opacity="0.7"/>
      <line x1="40" y1="72" x2="36" y2="84" ${s} stroke-width="2.5"/>`,
    ischio: `${grad}
      <circle cx="50" cy="14" r="8" fill="${c}" opacity="0.7"/>
      <line x1="50" y1="22" x2="40" y2="48" ${s} stroke-width="3"/>
      <line x1="50" y1="30" x2="34" y2="26" ${s} stroke-width="2"/>
      <line x1="40" y1="48" x2="26" y2="58" ${s} stroke-width="2.5"/>
      <line x1="40" y1="48" x2="70" y2="58" ${s} stroke-width="2.5"/>
      <line x1="70" y1="58" x2="82" y2="58" ${s} stroke-width="2.5"/>
      <path d="M26,58 L82,58" ${s} stroke-width="1.5" opacity="0.4"/>`,
    mollet: `${grad}
      <circle cx="22" cy="20" r="8" fill="${c}" opacity="0.7"/>
      <rect x="72" y="55" width="16" height="28" rx="4" fill="${c}" opacity="0.2"/>
      <line x1="22" y1="28" x2="30" y2="52" ${s} stroke-width="3"/>
      <line x1="22" y1="36" x2="10" y2="32" ${s} stroke-width="2"/>
      <line x1="30" y1="52" x2="18" y2="72" ${s} stroke-width="2.5"/>
      <line x1="30" y1="52" x2="52" y2="62" ${s} stroke-width="2.5"/>
      <line x1="52" y1="62" x2="62" y2="48" ${s} stroke-width="2.5"/>
      <line x1="62" y1="48" x2="78" y2="55" ${s} stroke-width="2.5"/>`,
    bit: `${grad}
      <circle cx="50" cy="12" r="8" fill="${c}" opacity="0.7"/>
      <line x1="50" y1="20" x2="44" y2="46" ${s} stroke-width="3"/>
      <line x1="44" y1="32" x2="28" y2="28" ${s} stroke-width="2"/>
      <line x1="44" y1="32" x2="60" y2="28" ${s} stroke-width="2"/>
      <line x1="44" y1="46" x2="30" y2="66" ${s} stroke-width="3"/>
      <line x1="44" y1="46" x2="62" y2="56" ${s} stroke-width="2.5"/>
      <path d="M30,66 Q20,72 22,82" ${s} stroke-width="2"/>`,
    fessier: `${grad}
      <circle cx="24" cy="16" r="8" fill="${c}" opacity="0.7"/>
      <line x1="24" y1="24" x2="30" y2="48" ${s} stroke-width="3"/>
      <line x1="24" y1="32" x2="10" y2="30" ${s} stroke-width="2"/>
      <line x1="30" y1="48" x2="14" y2="62" ${s} stroke-width="2.5"/>
      <line x1="30" y1="48" x2="55" y2="55" ${s} stroke-width="2.5"/>
      <line x1="14" y1="62" x2="12" y2="78" ${s} stroke-width="2.5"/>
      <path d="M55,55 Q72,48 70,38 Q68,28 62,26" ${s} stroke-width="2" opacity="0.7"/>`,
    fascia: `${grad}
      <circle cx="50" cy="14" r="8" fill="${c}" opacity="0.7"/>
      <line x1="50" y1="22" x2="40" y2="46" ${s} stroke-width="3"/>
      <line x1="50" y1="32" x2="34" y2="28" ${s} stroke-width="2"/>
      <line x1="40" y1="46" x2="22" y2="58" ${s} stroke-width="2.5"/>
      <line x1="40" y1="46" x2="66" y2="58" ${s} stroke-width="2.5"/>
      <line x1="22" y1="58" x2="20" y2="76" ${s} stroke-width="2.5"/>
      <path d="M20,76 Q28,72 34,80" ${s} stroke-width="2" opacity="0.7"/>
      <ellipse cx="60" cy="72" rx="14" ry="8" ${s} stroke-width="1.5" opacity="0.5"/>`,
  }
  const content = figs[type] || figs.quad
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90" width="70" height="62" style="display:block;margin:0 auto">${content}</svg>`
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
@page { size: A4; margin: 0; }
html, body { margin: 0; padding: 0; background: #0C0A18; overflow-x: hidden; max-width: 210mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Poppins', sans-serif; color: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

.page {
  width: 210mm; height: 297mm; overflow: hidden;
  padding: 11mm 13mm 18mm;
  background: #0C0A18;
  page-break-after: always; break-after: page;
  position: relative;
  display: flex; flex-direction: column; gap: 10px;
}
.blob-tr, .blob-bl, .blob-tl, .blob-br {
  position: absolute; border-radius: 50%; pointer-events: none; z-index: 0;
}
.blob-tr { top:-80px; right:-70px; width:300px; height:300px; background:radial-gradient(ellipse,rgba(139,47,201,.22) 0%,transparent 65%); }
.blob-bl { bottom:-70px; left:-60px; width:260px; height:260px; background:radial-gradient(ellipse,rgba(232,35,122,.16) 0%,transparent 65%); }
.blob-tl { top:-60px; left:-60px; width:250px; height:250px; background:radial-gradient(ellipse,rgba(139,47,201,.22) 0%,transparent 65%); }
.blob-br { bottom:-60px; right:-50px; width:230px; height:230px; background:radial-gradient(ellipse,rgba(232,35,122,.16) 0%,transparent 65%); }
.page > *:not([class^="blob"]):not(.pnum) { position: relative; z-index: 1; }
.pnum { position: absolute; bottom: 9mm; right: 13mm; z-index: 10; }

/* COUVERTURE */
.cover-page {
  width: 210mm; height: 297mm; overflow: hidden; background: #0C0A18;
  page-break-after: always; break-after: page; position: relative;
  display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
}
.cover-wm { position: absolute; font-size: 200pt; font-weight: 800; line-height: 1; letter-spacing: -.05em; background: linear-gradient(135deg,#8B2FC9,#E8237A); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; opacity: .035; pointer-events: none; top: 50%; left: 50%; transform: translate(-50%,-50%); }
.cover-deco-tr { position: absolute; top: 14mm; right: 12mm; opacity: .65; }
.cover-deco-bl { position: absolute; bottom: 32mm; left: 10mm; opacity: .75; }
.cover-deco-br { position: absolute; bottom: 16mm; right: 14mm; opacity: .55; }
.cover-inner { display: flex; flex-direction: column; align-items: center; gap: 0; position: relative; z-index: 1; padding: 0 14mm; }
.cover-logo { width: 118px; opacity: .95; margin-bottom: 18px; }
.cover-sep { width: 60px; height: 2px; background: linear-gradient(90deg,#8B2FC9,#E8237A); border-radius: 1px; margin: 18px auto; }
.cover-eyebrow { font-size: 9pt; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: rgba(255,255,255,.38); margin-bottom: 8px; }
.cover-subtitle { font-size: 14pt; font-weight: 600; color: rgba(255,255,255,.72); letter-spacing: .04em; margin-top: 10px; line-height: 1.5; }
.cover-tags { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 18px; }
.cover-tag { font-size: 8pt; font-weight: 700; border-radius: 20px; padding: 5px 13px; border: 1px solid; }
.cover-academy { font-size: 8.5pt; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.25); margin-top: 30px; }

/* SOMMAIRE */
.som-item { display: flex; align-items: baseline; width: 100%; }
.som-label { font-size: 11.5pt; font-weight: 500; color: rgba(255,255,255,.88); flex-shrink: 0; }
.som-dots { flex: 1; border-bottom: 1px dotted rgba(255,255,255,.15); margin: 0 12px; align-self: flex-end; margin-bottom: 4px; }
.som-page { font-size: 11pt; font-weight: 800; flex-shrink: 0; color: #C084FC; width: 44px; }

/* PAGE TITLE */
.page-title-block { flex-shrink: 0; text-align: center; }
.page-tag { display: inline-block; font-size: 8pt; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: rgba(255,255,255,.38); margin-bottom: 5px; }
.page-intro { font-size: 10.5pt; color: rgba(255,255,255,.72); line-height: 1.7; text-align: justify; flex-shrink: 0; }

/* BLESSURE */
.blessure-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 9px; min-height: 0; }
.blessure-card { border-radius: 13px; padding: 12px 14px; display: flex; flex-direction: column; gap: 5px; border: 1px solid; overflow: hidden; }
.bl-head { display: flex; align-items: center; gap: 9px; flex-shrink: 0; }
.bl-icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; }
.bl-title { font-size: 10pt; font-weight: 800; line-height: 1.2; }
.bl-subtitle { font-size: 7.5pt; color: rgba(255,255,255,.45); margin-top: 1px; }
.bl-sep { height: 1px; background: rgba(255,255,255,.06); flex-shrink: 0; }
.bl-section-title { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .09em; margin-bottom: 2px; }
.bl-text { font-size: 8.8pt; color: rgba(255,255,255,.8); line-height: 1.55; text-align: justify; }
.bl-tag { display: inline-block; font-size: 7pt; font-weight: 700; border-radius: 10px; padding: 2px 8px; margin-top: 3px; }

/* EXERCICES — 5 par page, 1 colonne avec dessin */
.exo-list { flex: 1; display: flex; flex-direction: column; gap: 8px; min-height: 0; }
.exo-row {
  flex: 1; display: flex; gap: 0; align-items: stretch;
  border-radius: 12px; overflow: hidden;
  background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08);
}
.exo-fig { width: 100px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.02); border-right: 1px solid rgba(255,255,255,.06); }
.exo-content { flex: 1; padding: 10px 14px; display: flex; flex-direction: column; gap: 4px; }
.exo-header { display: flex; align-items: center; gap: 10px; }
.exo-title { font-size: 11pt; font-weight: 800; line-height: 1.2; }
.exo-muscle { font-size: 8pt; color: rgba(255,255,255,.45); }
.exo-sep { height: 1px; background: rgba(255,255,255,.06); }
.exo-body { display: flex; gap: 12px; align-items: flex-start; }
.exo-dose-chip { font-size: 8pt; font-weight: 700; border-radius: 8px; padding: 3px 10px; flex-shrink: 0; white-space: nowrap; }
.exo-desc { font-size: 9pt; color: rgba(255,255,255,.78); line-height: 1.55; text-align: justify; }
.exo-tip { font-size: 8pt; color: rgba(255,255,255,.4); font-style: italic; }

/* ÉTIREMENTS — 3 colonnes avec dessin */
.etir-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 9px; min-height: 0; }
.etir-card { border-radius: 12px; padding: 10px 11px 12px; display: flex; flex-direction: column; gap: 5px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08); }
.etir-fig { flex-shrink: 0; }
.etir-title { font-size: 10pt; font-weight: 800; }
.etir-muscle { font-size: 7.5pt; color: rgba(255,255,255,.4); margin-bottom: 1px; }
.etir-dose { font-size: 8.5pt; font-weight: 700; color: #C084FC; }
.etir-sep { height: 1px; background: rgba(255,255,255,.06); }
.etir-desc { font-size: 8.5pt; color: rgba(255,255,255,.75); line-height: 1.5; text-align: justify; }

/* CHARGE */
.charge-section { flex: 1; display: flex; flex-direction: column; gap: 10px; min-height: 0; }
.charge-bars { display: flex; flex-direction: column; gap: 10px; }
.charge-row { display: flex; align-items: center; gap: 12px; }
.charge-label { font-size: 9.5pt; font-weight: 600; width: 130px; flex-shrink: 0; }
.charge-bar-wrap { flex: 1; height: 16px; background: rgba(255,255,255,.06); border-radius: 8px; overflow: hidden; position: relative; }
.charge-bar { height: 100%; border-radius: 8px; }
.charge-val { font-size: 9pt; font-weight: 800; width: 40px; text-align: right; flex-shrink: 0; }

/* PEACE & LOVE — design tablette horizontale */
.peace-grid { flex: 1; display: flex; flex-direction: column; gap: 7px; min-height: 0; }
.peace-row {
  flex: 1; display: flex; align-items: stretch; gap: 0;
  border-radius: 12px; overflow: hidden;
  background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.07);
}
.peace-letter-block { width: 54px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.peace-letter { font-size: 26pt; font-weight: 900; line-height: 1; }
.peace-divider { width: 1px; background: rgba(255,255,255,.07); flex-shrink: 0; }
.peace-body { flex: 1; padding: 8px 14px; display: flex; flex-direction: column; justify-content: center; gap: 2px; }
.peace-title { font-size: 10pt; font-weight: 800; }
.peace-desc { font-size: 8.8pt; color: rgba(255,255,255,.75); line-height: 1.5; text-align: justify; }

/* CHAUSSURES */
.shoe-cards { flex: 1; display: flex; flex-direction: column; gap: 9px; justify-content: space-evenly; min-height: 0; }
.shoe-card { flex: 1; border-radius: 12px; padding: 10px 16px; display: flex; gap: 14px; align-items: center; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07); }
.shoe-icon { font-size: 28px; flex-shrink: 0; }
.shoe-body { flex: 1; }
.shoe-title { font-size: 10.5pt; font-weight: 800; margin-bottom: 3px; }
.shoe-desc { font-size: 9.5pt; color: rgba(255,255,255,.78); line-height: 1.55; text-align: justify; }

/* CTA FINALE */
.cta-page { justify-content: space-between; }
`

// ─── Données ──────────────────────────────────────────────────────────────────
const BLESSURES = [
  { icon:'🦴', color:'#06B6D4', bg:'rgba(6,182,212,.08)', border:'rgba(6,182,212,.25)', title:'Périostite tibiale', sub:'Syndrome de stress du tibia', symptomes:'Douleur diffuse le long du tibia, aggravée à l\'effort et en début de séance.', prevention:'Progression de 10% max/semaine. '+hl('Renforcement du mollet')+' et des tibialis. Varier les surfaces.', soins:'Repos relatif, glace 15 min x3/j. Reprise progressive sur surfaces souples.', tag:'Fréquente chez les débutants', tagColor:'rgba(6,182,212,.2)', tagBorder:'rgba(6,182,212,.4)' },
  { icon:'🦵', color:'#F97316', bg:'rgba(249,115,22,.08)', border:'rgba(249,115,22,.25)', title:'Tendinite d\'Achille', sub:'Tendinopathie du tendon calcanéen', symptomes:'Raideur matinale au talon, douleur à la palpation, gonflement possible.', prevention:hl('Montées excentriques')+' sur marche, échauffement soigneux, semelles adaptées.', soins:'Repos 2 à 4 semaines, massage transverse profond, kinésithérapie précoce.', tag:'Coureurs confirmés', tagColor:'rgba(249,115,22,.2)', tagBorder:'rgba(249,115,22,.4)' },
  { icon:'🔩', color:'#A855F7', bg:'rgba(168,85,247,.08)', border:'rgba(168,85,247,.25)', title:'Syndrome essuie-glace', sub:'Bandelette ilio-tibiale (BIT)', symptomes:'Douleur vive sur la face externe du genou, surtout après 20 à 30 min d\'effort.', prevention:hl('Renforcement des fessiers')+' et abducteurs. Foam roller BIT. Cadence 170-180 pas/min.', soins:'Stop immédiat si douleur vive. Anti-inflammatoires, étirements spécifiques BIT.', tag:'Longue distance', tagColor:'rgba(168,85,247,.2)', tagBorder:'rgba(168,85,247,.4)' },
  { icon:'🦶', color:'#22C55E', bg:'rgba(34,197,94,.08)', border:'rgba(34,197,94,.25)', title:'Fasciite plantaire', sub:'Aponévrosite plantaire', symptomes:'Douleur intense sous le pied au réveil ou en début de séance, talon et voûte.', prevention:hl('Renforcement intrinsèque du pied')+', billes sous le pied, semelles orthopédiques si besoin.', soins:'Étirements du fascia et du mollet, botte de nuit, ondes de choc si chronique.', tag:'Route et piste', tagColor:'rgba(34,197,94,.2)', tagBorder:'rgba(34,197,94,.4)' },
  { icon:'💥', color:'#EF4444', bg:'rgba(239,68,68,.08)', border:'rgba(239,68,68,.25)', title:'Claquage musculaire', sub:'Déchirure de fibre ou faisceau', symptomes:'Douleur brutale type "coup de couteau", contracture, hématome possible.', prevention:hl('Échauffement progressif')+' 15 min minimum. Alimentation et hydratation soignées.', soins:'Protocole PEACE & LOVE (voir page 8). Arrêt immédiat, pas de chaleur les 72 premières heures.', tag:'Séances intenses', tagColor:'rgba(239,68,68,.2)', tagBorder:'rgba(239,68,68,.4)' },
  { icon:'🦿', color:'#EAB308', bg:'rgba(234,179,8,.08)', border:'rgba(234,179,8,.25)', title:'Genou du coureur', sub:'Syndrome fémoro-patellaire', symptomes:'Douleur sous ou autour de la rotule, aggravée en descente et en position assise.', prevention:hl('Squats et fentes')+' unilatéraux, travail de la hanche, réduction temporaire du volume.', soins:'Repos relatif, glace, kiné pour rééquilibrage musculaire, taping rotulien si besoin.', tag:'Tous niveaux', tagColor:'rgba(234,179,8,.2)', tagBorder:'rgba(234,179,8,.4)' },
]

const EXERCICES = [
  { num:'01', svgType:'squat',     title:'Squat unilatéral',  muscle:'Quadriceps, fessiers, stabilisateurs', dose:'3 × 12 reps', dc:'rgba(139,47,201,.25)', db:'rgba(139,47,201,.5)', desc:'Debout sur une jambe, descends lentement jusqu\'à 90°. Garde le genou dans l\'axe du pied. Remonte en contrôlant.', tip:'Variation avancée: squat bulgare avec pied arrière surélevé' },
  { num:'02', svgType:'hipthrust', title:'Hip thrust',         muscle:'Grand fessier, ischio-jambiers',       dose:'3 × 15 reps', dc:'rgba(232,35,122,.25)', db:'rgba(232,35,122,.5)', desc:'Dos sur banc, pieds à plat, pousse le bassin vers le haut en contractant fort les fessiers. Pause 1 sec en haut.', tip:'Essentiel pour prévenir toutes les blessures au genou' },
  { num:'03', svgType:'mollet',    title:'Mollet excentrique', muscle:'Soléaire, gastrocnémien, Achille',     dose:'3 × 15 lentes', dc:'rgba(6,182,212,.25)', db:'rgba(6,182,212,.5)', desc:'Sur une marche, monte sur les deux pieds puis redescends lentement sur une seule jambe en 4 secondes.', tip:'Prophylaxie numéro 1 contre la tendinite d\'Achille' },
  { num:'04', svgType:'fente',     title:'Fente marchée',      muscle:'Quadriceps, fessiers, soléaire',       dose:'3 × 10/côté', dc:'rgba(249,115,22,.25)', db:'rgba(249,115,22,.5)', desc:'Pas en avant, genou avant à 90°, genou arrière effleure le sol. Pousse sur le talon avant pour remonter.', tip:'Améliore l\'équilibre et la proprioception globale' },
  { num:'05', svgType:'pont',      title:'Pont fessier',       muscle:'Grand fessier, core, ischios',         dose:'3 × 20 reps', dc:'rgba(34,197,94,.25)', db:'rgba(34,197,94,.5)', desc:'Allongé dos au sol, genoux fléchis à 90°, pousse le bassin vers le haut. Tiens 2 sec en haut, redescends lentement.', tip:'Version avancée: jambe tendue à l\'horizontal' },
  { num:'06', svgType:'clam',      title:'Clam shell',         muscle:'Moyen fessier, abducteurs',            dose:'3 × 20/côté', dc:'rgba(168,85,247,.25)', db:'rgba(168,85,247,.5)', desc:'Allongé sur le côté, hanches fléchies à 60°. Ouvre et ferme le genou supérieur comme une palourde. Lent et contrôlé.', tip:'Idéal pour prévenir le syndrome de l\'essuie-glace' },
  { num:'07', svgType:'planche',   title:'Planche latérale',   muscle:'Obliques, carré des lombes, abducteurs', dose:'3 × 30 sec', dc:'rgba(239,68,68,.25)', db:'rgba(239,68,68,.5)', desc:'Sur l\'avant-bras, corps aligné des pieds à la tête. Hanches hautes, ne laisse pas la hanche s\'affaisser.', tip:'Progression possible: planche avec levée de jambe' },
  { num:'08', svgType:'tibialis',  title:'Tibialis raise',     muscle:'Tibial antérieur, extenseurs',         dose:'3 × 20 reps', dc:'rgba(234,179,8,.25)', db:'rgba(234,179,8,.5)', desc:'Dos contre un mur, talons à 30 cm. Lève la pointe des pieds vers le haut en gardant les talons au sol. Mouvement lent.', tip:'Prévention directe et efficace de la périostite' },
  { num:'09', svgType:'copenhagen', title:'Copenhagen plank',  muscle:'Adducteurs, core, stabilisateurs',     dose:'3 × 20 sec', dc:'rgba(6,182,212,.25)', db:'rgba(6,182,212,.5)', desc:'Planche latérale avec pied supérieur posé sur un banc. Soulève la hanche inférieure pour créer un pont. Respire.', tip:'Un des meilleurs exercices de prévention toutes catégories' },
  { num:'10', svgType:'chaise',    title:'Chaise au mur',      muscle:'Quadriceps, genou, isométrique',       dose:'3 × 45 sec', dc:'rgba(232,35,122,.25)', db:'rgba(232,35,122,.5)', desc:'Dos contre le mur, genoux à 90°. Tiens la position sans bouger. La brûlure dans les quadriceps est normale.', tip:'Excellent pour renforcer le genou du coureur' },
]

const ETIREMENTS = [
  { svgType:'quad',    title:'Quadriceps',       muscle:'Face avant de la cuisse',  dose:'30 sec × 3', desc:'Debout, saisir le pied derrière, genou vers le bas. Hanche droite, bassin neutre, regard devant.' },
  { svgType:'ischio',  title:'Ischio-jambiers',  muscle:'Face arrière de la cuisse', dose:'30 sec × 3', desc:'Assis, jambe tendue, penche le buste vers l\'avant en gardant le dos bien droit et la pointe tendue.' },
  { svgType:'mollet',  title:'Mollet et Achille', muscle:'Mollet et tendon calcanéen', dose:'45 sec × 3', desc:'Main contre mur, pied arrière à plat, genou tendu. Pousse le talon vers le sol et respire.' },
  { svgType:'bit',     title:'Bandelette IT',     muscle:'Hanche externe',           dose:'30 sec × 3', desc:'Debout, croise les jambes, penche le buste du côté opposé en appuyant la hanche vers l\'extérieur.' },
  { svgType:'fessier', title:'Fessier piriforme', muscle:'Fessier profond',          dose:'30 sec × 3', desc:'Allongé, cheville posée sur le genou opposé, tire la cuisse vers la poitrine doucement.' },
  { svgType:'fascia',  title:'Fascia plantaire',  muscle:'Voûte et talon',           dose:'60 sec × 2', desc:'Assis, saisir les orteils et tirer vers le tibia. Masser également avec une balle de tennis ou de golf.' },
]

const PEACE_LOVE = [
  { letter:'P', title:'Protection',              desc:'Limiter les activités douloureuses les 1 à 3 premiers jours. Repos relatif, pas d\'immobilisation totale.' },
  { letter:'E', title:'Élévation',               desc:'Élever le membre blessé au-dessus du niveau du coeur pour réduire l\'enflure et accélérer le drainage.' },
  { letter:'A', title:'Anti-inflammatoires: éviter', desc:'Dans les 72 premières heures, ils freinent l\'inflammation naturelle essentielle à la cicatrisation tissulaire.' },
  { letter:'C', title:'Compression',             desc:'Bandage compressif pour limiter l\'oedème. Serré mais pas trop: les doigts ne doivent pas bleuir.' },
  { letter:'E', title:'Éducation',               desc:'Comprendre sa blessure. La douleur est un signal, pas un ennemi. La reprise progressive bat l\'arrêt total.' },
  { letter:'L', title:'Loading progressif',      desc:'Reprendre la charge dès que possible. Le mouvement favorise la guérison et évite la perte musculaire.' },
  { letter:'O', title:'Optimisme',               desc:'L\'état d\'esprit positif influence la guérison. Les patients optimistes récupèrent plus vite selon les études.' },
  { letter:'V', title:'Vascularisation',         desc:'Cardio non douloureux (vélo, natation, marche) pour maintenir le flux sanguin et accélérer la cicatrisation.' },
  { letter:'E', title:'Exercice',                desc:'Reprendre les exercices ciblés dès que possible. La rééducation active est supérieure au repos passif.' },
]

// ─── Couleurs PEACE & LOVE en dégradé par position ──────────────────────────
const PEACE_COLORS = [
  { bg:'rgba(6,182,212,.12)',  border:'rgba(6,182,212,.3)',  letter:'#06B6D4'  },
  { bg:'rgba(34,197,94,.12)', border:'rgba(34,197,94,.3)',  letter:'#22C55E'  },
  { bg:'rgba(139,47,201,.12)',border:'rgba(139,47,201,.3)', letter:'#A855F7'  },
  { bg:'rgba(249,115,22,.12)',border:'rgba(249,115,22,.3)', letter:'#F97316'  },
  { bg:'rgba(234,179,8,.12)', border:'rgba(234,179,8,.3)',  letter:'#EAB308'  },
  { bg:'rgba(232,35,122,.12)',border:'rgba(232,35,122,.3)', letter:'#E8237A'  },
  { bg:'rgba(168,85,247,.12)',border:'rgba(168,85,247,.3)', letter:'#A855F7'  },
  { bg:'rgba(59,130,246,.12)',border:'rgba(59,130,246,.3)', letter:'#3B82F6'  },
  { bg:'rgba(16,185,129,.12)',border:'rgba(16,185,129,.3)', letter:'#10B981'  },
]

// ─── Pages ────────────────────────────────────────────────────────────────────
const SVG_COVER_SHIELD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 120" width="110" height="120">
  <defs>
    <linearGradient id="sh-g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8B2FC9" stop-opacity="0.6"/><stop offset="100%" stop-color="#E8237A" stop-opacity="0.4"/></linearGradient>
    <linearGradient id="sh-g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8B2FC9"/><stop offset="100%" stop-color="#E8237A"/></linearGradient>
  </defs>
  <path d="M55 6 L95 22 L95 60 Q95 90 55 108 Q15 90 15 60 L15 22 Z" fill="url(#sh-g1)" stroke="url(#sh-g2)" stroke-width="2"/>
  <path d="M55 20 L82 32 L82 60 Q82 80 55 93 Q28 80 28 60 L28 32 Z" fill="none" stroke="url(#sh-g2)" stroke-width="1.5" opacity="0.5" stroke-dasharray="4,3"/>
  <path d="M40 58 L50 68 L70 46" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
</svg>`
const SVG_COVER_CIRCLES = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><defs><radialGradient id="cv-cg"><stop offset="0%" stop-color="#E8237A" stop-opacity="0.7"/><stop offset="100%" stop-color="#8B2FC9" stop-opacity="0.15"/></radialGradient></defs><circle cx="60" cy="60" r="56" fill="none" stroke="url(#cv-cg)" stroke-width="1.5"/><circle cx="60" cy="60" r="40" fill="none" stroke="url(#cv-cg)" stroke-width="1.5" stroke-dasharray="4,6"/><circle cx="60" cy="60" r="24" fill="none" stroke="url(#cv-cg)" stroke-width="1.5"/><circle cx="60" cy="60" r="9" fill="url(#cv-cg)"/></svg>`
const SVG_COVER_DOTS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 48" width="64" height="48"><defs><radialGradient id="cv-dg"><stop offset="0%" stop-color="#E8237A" stop-opacity="0.7"/><stop offset="100%" stop-color="#8B2FC9" stop-opacity="0.3"/></radialGradient></defs>${[0,1,2,3].map(i=>[0,1,2].map(j=>`<circle cx="${8+i*16}" cy="${8+j*16}" r="${2-j*0.3}" fill="url(#cv-dg)"/>`).join('')).join('')}</svg>`

function pageCover() {
  return `
  <div class="cover-page">
    <div class="blob-tr"></div><div class="blob-bl"></div>
    <div class="cover-wm">RUN</div>
    <div class="cover-deco-tr">${SVG_COVER_CIRCLES}</div>
    <div class="cover-deco-bl">${SVG_COVER_DOTS}</div>
    <div class="cover-deco-br"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="70" height="70" opacity="0.6"><defs><linearGradient id="cv-br" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8B2FC9" stop-opacity="0.5"/><stop offset="100%" stop-color="#E8237A" stop-opacity="0.3"/></linearGradient></defs><path d="M40 4 L74 22 L74 58 Q74 74 40 76 Q6 74 6 58 L6 22 Z" fill="none" stroke="url(#cv-br)" stroke-width="1.5" stroke-dasharray="5,4"/><circle cx="40" cy="40" r="12" fill="url(#cv-br)" opacity="0.5"/></svg></div>
    <div class="cover-inner">
      ${logoB64 ? `<img src="${logoB64}" class="cover-logo" alt="Logo"/>` : ''}
      <div class="cover-eyebrow">The Ultimate Academy</div>
      <div class="cover-sep"></div>
      ${SVG_COVER_SHIELD}
      <div style="height:16px"></div>
      ${gradText('GUIDE', { sizePt:72, weight:900 })}
      ${gradText('ANTI-BLESSURE', { sizePt:38, weight:800 })}
      <div class="cover-subtitle">Prévenir, détecter et soigner<br>les blessures du coureur</div>
      <div class="cover-tags">
        <span class="cover-tag" style="background:rgba(6,182,212,.1);color:#67E8F9;border-color:rgba(6,182,212,.4)">🦴 6 Blessures</span>
        <span class="cover-tag" style="background:rgba(139,47,201,.1);color:#C084FC;border-color:rgba(139,47,201,.4)">💪 10 Exercices</span>
        <span class="cover-tag" style="background:rgba(232,35,122,.1);color:#F9A8D4;border-color:rgba(232,35,122,.4)">🧘 Étirements</span>
        <span class="cover-tag" style="background:rgba(34,197,94,.1);color:#86EFAC;border-color:rgba(34,197,94,.4)">🏥 Protocoles</span>
      </div>
      <div class="cover-academy">theultimateacademy.fr</div>
    </div>
  </div>`
}

function pageSommaire() {
  const items = [
    { label:'Introduction',                        page:'3' },
    { label:'Les 6 blessures courantes',            page:'4' },
    { label:'Programme de renforcement — Partie 1', page:'5' },
    { label:'Programme de renforcement — Partie 2', page:'6' },
    { label:'Étirements essentiels',               page:'7' },
    { label:'Gestion de la charge',                page:'8' },
    { label:'Protocole PEACE & LOVE',              page:'9' },
    { label:'Chaussures et matériel',              page:'10' },
    { label:'Passer à l\'action',                  page:'11' },
  ]
  return `
  <div class="page">
    ${blobs('A')}
    <div class="page-title-block">
      <div class="page-tag">Guide Anti-Blessure</div>
      ${gradText('Sommaire', { sizePt:30, weight:800 })}
      ${svgTitleDeco()}
    </div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:space-evenly;min-height:0">
      ${items.map(it => `
      <div class="som-item">
        <span class="som-label">${it.label}</span>
        <span class="som-dots"></span>
        <span class="som-page">${it.page}</span>
      </div>`).join('')}
    </div>
    <div style="padding:10px 0 0">${SVG_HEARTBEAT}</div>
    ${pageNum('2')}
  </div>`
}

function pageIntro() {
  const cards = [
    { icon:'📈', title:'Progression trop rapide', desc:'L\'erreur numéro 1 du coureur. Le corps a besoin de temps pour s\'adapter : tendons, os et articulations s\'adaptent 3 fois plus lentement que les muscles.', color:'rgba(232,35,122,.18)', border:'rgba(232,35,122,.35)' },
    { icon:'🔧', title:'Manque de renforcement', desc:'Un coureur qui ne fait que courir accumule des déséquilibres musculaires. Les muscles fessiers et le gainage sont souvent trop faibles pour protéger les genoux et les hanches.', color:'rgba(249,115,22,.18)', border:'rgba(249,115,22,.35)' },
    { icon:'😴', title:'Récupération négligée', desc:'La performance et l\'adaptation se construisent pendant le repos, pas pendant l\'effort. Moins de 7h de sommeil multiplie par 2 le risque de blessure selon la littérature scientifique.', color:'rgba(139,47,201,.18)', border:'rgba(139,47,201,.35)' },
    { icon:'👟', title:'Équipement inadapté', desc:'Une chaussure usée ou mal adaptée à ta morphologie peut être à l\'origine de douleurs chroniques sur toute la chaîne cinétique : pied, cheville, genou, hanche et dos.', color:'rgba(6,182,212,.18)', border:'rgba(6,182,212,.35)' },
  ]
  return `
  <div class="page">
    ${blobs('B')}
    <div class="page-title-block">
      <div class="page-tag">Préambule</div>
      ${gradText('Introduction', { sizePt:30, weight:800 })}
      ${svgTitleDeco()}
    </div>
    <div class="page-intro">
      Courir, c'est l'une des activités les plus naturelles et accessibles qui soit. Pourtant, les statistiques sont sans appel : <span style="color:white;font-weight:700">près de 65% des coureurs se blessent chaque année</span>, souvent pour des raisons qui auraient pu être évitées avec un peu de méthode.
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:11px;flex-shrink:0">
      ${cards.map(c => `
      <div style="border-radius:13px;padding:13px 15px;background:${c.color};border:1px solid ${c.border}">
        <div style="font-size:22px;margin-bottom:6px">${c.icon}</div>
        <div style="font-size:10.5pt;font-weight:800;margin-bottom:5px">${c.title}</div>
        <div style="font-size:9pt;color:rgba(255,255,255,.78);line-height:1.6;text-align:justify">${c.desc}</div>
      </div>`).join('')}
    </div>
    <div class="page-intro">
      Ce guide est conçu pour te donner les ${hl('clés concrètes')} pour t'entraîner plus intelligemment. Tu y trouveras les blessures les plus fréquentes, comment les identifier tôt, les prévenir par le renforcement, et les soigner efficacement quand elles surviennent malgré tout.
    </div>
    <div class="page-intro">
      L'objectif n'est pas de te faire peur mais de te donner les outils pour rester sur les routes le plus longtemps possible, progresser régulièrement et atteindre tes objectifs ${hl('sans interruption forcée')}.
    </div>
    <div style="background:linear-gradient(135deg,rgba(139,47,201,.12),rgba(232,35,122,.08));border:1px solid rgba(139,47,201,.25);border-radius:12px;padding:12px 16px;flex-shrink:0">
      <div style="font-size:9pt;color:rgba(255,255,255,.82);line-height:1.65;text-align:justify">
        Ce guide est le fruit d'années d'expérience sur le terrain avec des coureurs de tous niveaux. Les protocoles présentés ici sont issus des ${hl('dernières recherches en médecine du sport')} et adaptés à la réalité de l'entraînement quotidien. Bonne lecture, et surtout : bonne course.
      </div>
    </div>
    ${pageNum('3')}
  </div>`
}

function pageBlessures() {
  return `
  <div class="page">
    ${blobs('A')}
    <div class="page-title-block">
      <div class="page-tag">Chapitre 1</div>
      ${gradText('Les 6 blessures courantes', { sizePt:26, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    <div class="blessure-grid">
      ${BLESSURES.map(b => `
      <div class="blessure-card" style="background:${b.bg};border-color:${b.border}">
        <div class="bl-head">
          <div class="bl-icon" style="background:${b.bg}">${b.icon}</div>
          <div><div class="bl-title">${b.title}</div><div class="bl-subtitle">${b.sub}</div></div>
        </div>
        <div class="bl-sep"></div>
        <div class="bl-section-title" style="color:${b.color}">Symptômes</div>
        <div class="bl-text">${b.symptomes}</div>
        <div class="bl-section-title" style="color:${b.color};margin-top:4px">Prévention</div>
        <div class="bl-text">${b.prevention}</div>
        <div class="bl-section-title" style="color:${b.color};margin-top:4px">Traitement</div>
        <div class="bl-text">${b.soins}</div>
        <span class="bl-tag" style="background:${b.tagColor};border:1px solid ${b.tagBorder};color:${b.color}">${b.tag}</span>
      </div>`).join('')}
    </div>
    ${pageNum('4')}
  </div>`
}

function pageRenforcement(exos, pageN, part) {
  return `
  <div class="page">
    ${blobs(part===1?'B':'A')}
    <div class="page-title-block">
      <div class="page-tag">Chapitre 2 — Partie ${part}/2</div>
      ${gradText('Programme de renforcement', { sizePt:26, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    ${part===1?`<div class="page-intro" style="text-align:justify">${hl('2 séances par semaine')} suffisent pour construire une armure musculaire solide. Ces exercices ciblent les groupes les plus sollicités en course. Chaque exercice dispose d'un schéma illustrant la position correcte.</div>`:''}
    <div class="exo-list">
      ${exos.map(e => `
      <div class="exo-row">
        <div class="exo-fig">${svgExo(e.svgType)}</div>
        <div class="exo-content">
          <div class="exo-header">
            ${gradNum(e.num, 24)}
            <div>
              <div class="exo-title">${e.title}</div>
              <div class="exo-muscle">${e.muscle}</div>
            </div>
          </div>
          <div class="exo-sep"></div>
          <div class="exo-body">
            <span class="exo-dose-chip" style="background:${e.dc};border:1px solid ${e.db};color:white">${e.dose}</span>
            <div>
              <div class="exo-desc">${e.desc}</div>
              <div class="exo-tip" style="margin-top:3px">Conseil : ${e.tip}</div>
            </div>
          </div>
        </div>
      </div>`).join('')}
    </div>
    ${pageNum(String(pageN))}
  </div>`
}

function pageEtirements() {
  return `
  <div class="page">
    ${blobs('B')}
    <div class="page-title-block">
      <div class="page-tag">Chapitre 3</div>
      ${gradText('Étirements essentiels', { sizePt:27, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    <div class="page-intro" style="text-align:justify">
      Les étirements doivent être pratiqués ${hl('après l\'effort uniquement')} et jamais à froid. Tiens chaque position sans rebonds, en respirant lentement. La régularité prime sur l'intensité. Chaque carte illustre la position à adopter.
    </div>
    <div class="etir-grid">
      ${ETIREMENTS.map(e => `
      <div class="etir-card">
        <div class="etir-fig">${svgEtir(e.svgType)}</div>
        <div class="etir-title">${e.title}</div>
        <div class="etir-muscle">${e.muscle}</div>
        <div class="etir-dose">${e.dose}</div>
        <div class="etir-sep"></div>
        <div class="etir-desc">${e.desc}</div>
      </div>`).join('')}
    </div>
    <div style="background:rgba(139,47,201,.1);border:1px solid rgba(139,47,201,.3);border-radius:12px;padding:12px 16px;flex-shrink:0;margin-top:2px">
      <div style="font-size:9.5pt;font-weight:700;color:#C084FC;margin-bottom:4px">Règle d'or</div>
      <div style="font-size:9.5pt;color:rgba(255,255,255,.8);line-height:1.6;text-align:justify">
        Ne jamais s'étirer sur une douleur aiguë. Si une zone est douloureuse, consulte un kiné avant de reprendre. La douleur pendant un étirement n'est ${hl('jamais normale')} et doit alerter immédiatement.
      </div>
    </div>
    ${pageNum('7')}
  </div>`
}

function pageCharge() {
  const barData = [
    { label:'Volume (km/semaine)',   pct:70, c1:'#8B2FC9', c2:'#A855F7', desc:'+10% max par semaine' },
    { label:'Intensité (% FC max)',  pct:80, c1:'#E8237A', c2:'#F472B6', desc:'Contrôler par fréquence cardiaque' },
    { label:'Fréquence (séances)',   pct:60, c1:'#06B6D4', c2:'#67E8F9', desc:'Augmenter progressivement' },
    { label:'Dénivelé positif',      pct:45, c1:'#22C55E', c2:'#86EFAC', desc:'Variable souvent oubliée' },
    { label:'Allure spécifique',     pct:35, c1:'#F97316', c2:'#FDBA74', desc:'Introduire en phase finale' },
    { label:'Récupération active',   pct:90, c1:'#EAB308', c2:'#FDE047', desc:'Ne jamais négliger le repos' },
  ]
  const infoCards = [
    { icon:'📊', title:'Règle des 10%', desc:'N\'augmente jamais ton volume de plus de 10% par semaine. Applique un cycle de 3 semaines de charge pour 1 semaine de décharge.', color:'rgba(139,47,201,.15)', border:'rgba(139,47,201,.3)' },
    { icon:'🌡️', title:'Écouter son corps', desc:'Un effort perçu constamment élevé, des douleurs inhabituelles ou une fatigue persistante sont des signaux d\'alarme à ne jamais ignorer.', color:'rgba(232,35,122,.15)', border:'rgba(232,35,122,.3)' },
    { icon:'💤', title:'Sommeil = performance', desc:'Moins de 7h de sommeil multiplie par 2 le risque de blessure. C\'est pendant le sommeil que le corps répare ses tissus et se renforce.', color:'rgba(6,182,212,.15)', border:'rgba(6,182,212,.3)' },
    { icon:'🔄', title:'Semaine de décharge', desc:'Toutes les 3 à 4 semaines, réduis le volume de 30 à 40%. Cette récupération planifiée est ce qui déclenche la surcompensation et la progression.', color:'rgba(34,197,94,.15)', border:'rgba(34,197,94,.3)' },
  ]
  return `
  <div class="page">
    ${blobs('A')}
    <div class="page-title-block">
      <div class="page-tag">Chapitre 4</div>
      ${gradText('Gestion de la charge', { sizePt:27, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    <div class="page-intro" style="text-align:justify">
      La ${hl('surcharge chronique')} est la première cause de blessure chez le coureur. Le corps s'adapte si on lui laisse le temps. La règle d'or : n'augmenter qu'un seul paramètre à la fois.
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;flex-shrink:0">
      ${infoCards.map(c=>`
      <div style="border-radius:13px;padding:12px 14px;background:${c.color};border:1px solid ${c.border}">
        <div style="font-size:21px;margin-bottom:5px">${c.icon}</div>
        <div style="font-size:10pt;font-weight:800;margin-bottom:4px">${c.title}</div>
        <div style="font-size:9pt;color:rgba(255,255,255,.78);line-height:1.55;text-align:justify">${c.desc}</div>
      </div>`).join('')}
    </div>
    <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:13px;padding:14px 16px;flex-shrink:0">
      <div style="font-size:8.5pt;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px">Variables à surveiller et pondérer</div>
      <div class="charge-bars">
        ${barData.map(b=>`
        <div class="charge-row">
          <div class="charge-label">${b.label}</div>
          <div class="charge-bar-wrap">
            <div class="charge-bar" style="width:${b.pct}%;background:linear-gradient(90deg,${b.c1},${b.c2})"></div>
          </div>
          <div class="charge-val" style="color:${b.c1}">${b.pct}%</div>
        </div>`).join('')}
      </div>
    </div>
    ${pageNum('8')}
  </div>`
}

function pagePeaceLove() {
  return `
  <div class="page">
    ${blobs('B')}
    <div class="page-title-block">
      <div class="page-tag">Chapitre 5</div>
      ${gradText('Protocole PEACE & LOVE', { sizePt:26, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    <div class="page-intro" style="text-align:justify">
      Le protocole PEACE & LOVE remplace l'ancien RICE. Il intègre les ${hl('dernières recherches en médecine du sport')} et offre une approche complète et éprouvée de la gestion des blessures aiguës.
    </div>
    <div class="peace-grid">
      ${PEACE_LOVE.map((p, i) => {
        const col = PEACE_COLORS[i]
        return `
        <div class="peace-row" style="background:${col.bg};border-color:${col.border}">
          <div class="peace-letter-block" style="background:rgba(0,0,0,.12)">
            <span class="peace-letter" style="color:${col.letter}">${p.letter}</span>
          </div>
          <div class="peace-divider" style="background:${col.border}"></div>
          <div class="peace-body">
            <div class="peace-title">${p.title}</div>
            <div class="peace-desc">${p.desc}</div>
          </div>
        </div>`
      }).join('')}
    </div>
    ${pageNum('9')}
  </div>`
}

function pageChaussures() {
  const shoes = [
    { icon:'🏃', title:'Chaussure d\'entraînement daily', desc:'Amorti modéré, durabilité maximale. Adaptée aux footings du quotidien. À renouveler tous les 600 à 800 km. C\'est la base indispensable de ta rotation.', color:'rgba(139,47,201,.15)', border:'rgba(139,47,201,.3)' },
    { icon:'⚡', title:'Chaussure de vitesse / plaquée', desc:'Carbone ou nylon pour les séances intenses et les compétitions. Ne pas utiliser pour les footings quotidiens : risque de surcharge tendineuse avéré si usage excessif.', color:'rgba(232,35,122,.15)', border:'rgba(232,35,122,.3)' },
    { icon:'🏔️', title:'Trail et stabilité', desc:'Drop bas pour le trail, semelle adhérente. Sur route, une chaussure de stabilité est recommandée si tu as une pronation excessive confirmée par un podologue spécialisé.', color:'rgba(6,182,212,.15)', border:'rgba(6,182,212,.3)' },
    { icon:'🔄', title:'Rotation de chaussures', desc:'Alterner 2 à 3 paires différentes réduit de 40% le risque de blessure. Chaque paire sollicite différemment le pied et permet une meilleure récupération des tissus entre les sorties.', color:'rgba(34,197,94,.15)', border:'rgba(34,197,94,.3)' },
    { icon:'📏', title:'Bilan podologique', desc:'Un bilan biomécanique est recommandé tous les 2 ans ou après une blessure répétée. Des semelles orthopédiques peuvent corriger des déséquilibres structurels qui fragilisent l\'ensemble de la chaîne cinétique.', color:'rgba(234,179,8,.15)', border:'rgba(234,179,8,.3)' },
  ]
  return `
  <div class="page">
    ${blobs('A')}
    <div class="page-title-block">
      <div class="page-tag">Chapitre 6</div>
      ${gradText('Chaussures et matériel', { sizePt:27, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    <div class="page-intro" style="text-align:justify">
      Le choix de la chaussure est souvent ${hl('sous-estimé')}, alors qu'il est l'un des facteurs les plus importants en prévention. Une chaussure inadaptée peut créer des problèmes sur toute la chaîne cinétique.
    </div>
    <div class="shoe-cards">
      ${shoes.map(s=>`
      <div class="shoe-card" style="background:${s.color};border-color:${s.border}">
        <div class="shoe-icon">${s.icon}</div>
        <div class="shoe-body">
          <div class="shoe-title">${s.title}</div>
          <div class="shoe-desc">${s.desc}</div>
        </div>
      </div>`).join('')}
    </div>
    ${pageNum('10')}
  </div>`
}

function pageCTA() {
  // Plans disponibles avec vrais prix
  const plans = [
    { icon:'🏃', name:'Plan 10 km', duration:'8 semaines', price:'14,99€', desc:'Parfait pour un premier 10 km ou améliorer son chrono.', color:'rgba(6,182,212,.15)', border:'rgba(6,182,212,.35)', tc:'#67E8F9' },
    { icon:'🏃', name:'Plan 10 km', duration:'12 semaines', price:'17,99€', desc:'Construction progressive sur 3 mois pour performer sur 10 km.', color:'rgba(6,182,212,.12)', border:'rgba(6,182,212,.28)', tc:'#67E8F9' },
    { icon:'🏅', name:'Semi-Marathon', duration:'12 semaines', price:'19,99€', desc:'Prépare ton semi-marathon avec un plan structuré et progressif.', color:'rgba(139,47,201,.15)', border:'rgba(139,47,201,.35)', tc:'#C084FC' },
    { icon:'🏆', name:'Marathon', duration:'12 semaines', price:'22,99€', desc:'Pour finir ton premier marathon ou descendre sous les 4h.', color:'rgba(232,35,122,.15)', border:'rgba(232,35,122,.35)', tc:'#F9A8D4' },
    { icon:'🏆', name:'Marathon', duration:'16 semaines', price:'24,99€', desc:'La préparation complète pour performer sur la distance reine.', color:'rgba(232,35,122,.12)', border:'rgba(232,35,122,.28)', tc:'#F9A8D4' },
  ]
  return `
  <div class="page cta-page">
    ${blobs('B')}
    <div style="text-align:center;flex-shrink:0">
      <div style="font-size:8.5pt;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.35);margin-bottom:6px">Passe à l'action</div>
      ${gradText('Prêt à courir plus intelligent ?', { sizePt:24, weight:800 })}
      ${svgDiamond()}
      <div style="font-size:10.5pt;color:rgba(255,255,255,.65);margin-top:6px;line-height:1.6">
        Tu as maintenant toutes les clés. La prochaine étape, c'est un plan structuré<br>qui respecte tes capacités et te fait progresser sans te blesser.
      </div>
    </div>

    <div style="flex-shrink:0">
      ${gradText('Nos plans d\'entraînement PDF', { sizePt:14, weight:700 })}
      <div style="height:8px"></div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px">
        ${plans.map(p=>`
        <div style="border-radius:12px;padding:11px 10px;background:${p.color};border:1px solid ${p.border};display:flex;flex-direction:column;gap:5px;text-align:center">
          <div style="font-size:22px">${p.icon}</div>
          <div style="font-size:9pt;font-weight:800;color:#fff;line-height:1.2">${p.name}</div>
          <div style="font-size:7.5pt;color:${p.tc};font-weight:700">${p.duration}</div>
          <div style="font-size:8pt;color:rgba(255,255,255,.65);line-height:1.4">${p.desc}</div>
          <div style="font-size:14pt;font-weight:900;background:linear-gradient(135deg,#8B2FC9,#E8237A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-top:3px">${p.price}</div>
        </div>`).join('')}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;flex-shrink:0">
      <div style="border-radius:14px;padding:16px;background:linear-gradient(135deg,rgba(139,47,201,.2),rgba(232,35,122,.15));border:1px solid rgba(139,47,201,.4)">
        <div style="font-size:22px;margin-bottom:6px">🎯</div>
        <div style="font-size:11pt;font-weight:800;margin-bottom:5px">Guide Anti-Blessure</div>
        <div style="font-size:9pt;color:rgba(255,255,255,.72);line-height:1.55;margin-bottom:8px">Tu lis déjà ce guide. Partage-le à un coureur qui en a besoin.</div>
        <div style="font-size:16pt;font-weight:900;background:linear-gradient(135deg,#8B2FC9,#E8237A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">14,99€</div>
      </div>
      <div style="border-radius:14px;padding:16px;background:linear-gradient(135deg,rgba(234,179,8,.15),rgba(249,115,22,.1));border:1px solid rgba(234,179,8,.35)">
        <div style="font-size:22px;margin-bottom:6px">🏆</div>
        <div style="font-size:11pt;font-weight:800;margin-bottom:5px">Coaching personnalisé</div>
        <div style="font-size:9pt;color:rgba(255,255,255,.72);line-height:1.55;margin-bottom:8px">Plan 100% sur-mesure, suivi hebdomadaire et messagerie directe avec ton coach.</div>
        <div style="font-size:9pt;font-weight:700;color:#FDE047">Découvrir sur le site</div>
      </div>
    </div>

    <div style="flex-shrink:0;border-radius:16px;padding:18px 22px;background:linear-gradient(135deg,#8B2FC9,#E8237A);text-align:center;position:relative;overflow:hidden">
      <div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.08)"></div>
      <div style="position:absolute;bottom:-20px;left:-20px;width:80px;height:80px;border-radius:50%;background:rgba(0,0,0,.1)"></div>
      <div style="position:relative;z-index:1">
        <div style="font-size:14pt;font-weight:900;color:white;margin-bottom:5px">Rejoins The Ultimate Academy</div>
        <div style="font-size:9.5pt;color:rgba(255,255,255,.9);line-height:1.6;margin-bottom:10px">Des centaines de coureurs ont déjà transformé leur entraînement.<br>C'est ton tour de courir plus loin, plus vite et sans blessure.</div>
        <div style="font-size:13pt;font-weight:900;color:white;letter-spacing:.06em">theultimateacademy.fr</div>
      </div>
    </div>

    <div style="flex-shrink:0;text-align:center;font-size:8pt;color:rgba(255,255,255,.25);letter-spacing:.06em">
      © The Ultimate Academy — Alexis Élie, Coach Athlétisme
    </div>
    ${pageNum('11')}
  </div>`
}

// ─── HTML ─────────────────────────────────────────────────────────────────────
function buildHtml() {
  const exos1 = EXERCICES.slice(0, 5)
  const exos2 = EXERCICES.slice(5, 10)
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
  <style>${CSS}</style>
</head>
<body>
${pageCover()}
${pageSommaire()}
${pageIntro()}
${pageBlessures()}
${pageRenforcement(exos1, 5, 1)}
${pageRenforcement(exos2, 6, 2)}
${pageEtirements()}
${pageCharge()}
${pagePeaceLove()}
${pageChaussures()}
${pageCTA()}
</body>
</html>`
}

// ─── Génération ───────────────────────────────────────────────────────────────
;(async () => {
  const html = buildHtml()
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })
  await new Promise(r => setTimeout(r, 1500))
  const outPath = path.join(OUT_DIR, 'guide-antiblessure.pdf')
  await page.pdf({ path: outPath, format: 'A4', printBackground: true, preferCSSPageSize: true })
  await browser.close()
  const size = fs.statSync(outPath).size
  console.log(`PDF généré: ${outPath} (${Math.round(size/1024)} KB, 11 pages)`)
})()
