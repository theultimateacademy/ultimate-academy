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

// ─── Helpers grad-text SVG ────────────────────────────────────────────────────
let gidSeq = 0
function ptToPx(pt) { return Math.round(pt * 1.3333 * 10) / 10 }
function escXml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }

function gradText(text, { sizePt, weight=800, width=670, height, align='center', uppercase=false, opacity=1 }={}) {
  const fs = ptToPx(sizePt)
  const h  = height || Math.ceil(fs * 1.35)
  const gid = `gt${gidSeq++}`
  const x = align==='center'? width/2 : align==='end'? width : 0
  const anchor = align==='center'?'middle': align==='end'?'end':'start'
  const y = Math.round(h * 0.76)
  const t = uppercase ? text.toUpperCase() : text
  return `<svg viewBox="0 0 ${width} ${h}" width="${width}" height="${h}" style="display:block;margin:0 auto;overflow:visible;max-width:100%;opacity:${opacity}">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#8B2FC9"/><stop offset="100%" stop-color="#E8237A"/>
    </linearGradient></defs>
    <text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Poppins" font-weight="${weight}" font-size="${fs}" fill="url(#${gid})">${escXml(t)}</text>
  </svg>`
}

// Dégradé sur un mot en inline (pour l'intérieur des textes)
function hl(t) {
  return `<span style="background:linear-gradient(135deg,#8B2FC9,#E8237A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-weight:700">${t}</span>`
}

// ─── SVG décoratifs ───────────────────────────────────────────────────────────

const SVG_HEARTBEAT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 28" width="100%" height="28" style="display:block">
  <defs><linearGradient id="hb-g" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#8B2FC9" stop-opacity="0"/>
    <stop offset="15%" stop-color="#8B2FC9"/><stop offset="85%" stop-color="#E8237A"/>
    <stop offset="100%" stop-color="#E8237A" stop-opacity="0"/>
  </linearGradient></defs>
  <polyline fill="none" stroke="url(#hb-g)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    points="0,14 45,14 60,14 70,3 80,25 88,10 96,20 104,14 175,14 190,14 203,3 216,25 224,14 295,14 310,14 323,3 336,25 344,14 415,14 500,14"/>
</svg>`

// Vague fluide sous les titres de section
function svgWave(color1='#8B2FC9', color2='#E8237A') {
  const id = `wv${gidSeq++}`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 18" width="100%" height="18" style="display:block;margin-top:4px">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${color1}" stop-opacity="0"/>
      <stop offset="20%" stop-color="${color1}"/>
      <stop offset="80%" stop-color="${color2}"/>
      <stop offset="100%" stop-color="${color2}" stop-opacity="0"/>
    </linearGradient></defs>
    <path d="M0,10 Q125,2 250,10 Q375,18 500,10" fill="none" stroke="url(#${id})" stroke-width="2" stroke-linecap="round"/>
    <path d="M40,14 Q165,6 290,14 Q415,18 460,13" fill="none" stroke="url(#${id})" stroke-width="1" opacity="0.4" stroke-linecap="round"/>
  </svg>`
}

// Ligne déco sous un titre de page
function svgTitleDeco() {
  const id1 = `td${gidSeq++}`; const id2 = `td${gidSeq++}`
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

// Petit ornement diamant entre le titre et le contenu
function svgDiamond() {
  const id = `dm${gidSeq++}`
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

// Numéro de page stylisé
function pageNum(n) {
  const id = `pn${gidSeq++}`
  return `<div class="pnum">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 22" width="44" height="22">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#8B2FC9" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="#E8237A" stop-opacity="0.15"/>
      </linearGradient></defs>
      <rect x="0" y="0" width="44" height="22" rx="11" fill="url(#${id})" stroke="rgba(139,47,201,0.4)" stroke-width="1"/>
      <text x="22" y="15.5" text-anchor="middle" font-family="Poppins" font-weight="800" font-size="11" fill="url(#${id}_t)">${n}</text>
      <defs><linearGradient id="${id}_t" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#C084FC"/><stop offset="100%" stop-color="#F472B6"/>
      </linearGradient></defs>
      <text x="22" y="15.5" text-anchor="middle" font-family="Poppins" font-weight="800" font-size="11" fill="url(#${id}_t)">${n}</text>
    </svg>
  </div>`
}

function blobs(v='A') {
  return v==='A'
    ? '<div class="blob-tr"></div><div class="blob-bl"></div>'
    : '<div class="blob-tl"></div><div class="blob-br"></div>'
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
  display: flex; flex-direction: column; gap: 9px;
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

/* ── COUVERTURE ── */
.cover-page {
  width: 210mm; height: 297mm; overflow: hidden; background: #0C0A18;
  page-break-after: always; break-after: page; position: relative;
  display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
}
.cover-wm {
  position: absolute; font-size: 200pt; font-weight: 800; line-height: 1; letter-spacing: -.05em;
  background: linear-gradient(135deg,#8B2FC9,#E8237A);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  opacity: .035; pointer-events: none; top: 50%; left: 50%; transform: translate(-50%,-50%);
}
.cover-deco-tr { position: absolute; top: 14mm; right: 12mm; opacity: .65; }
.cover-deco-bl { position: absolute; bottom: 32mm; left: 10mm; opacity: .75; }
.cover-deco-br { position: absolute; bottom: 16mm; right: 14mm; opacity: .55; }
.cover-inner { display: flex; flex-direction: column; align-items: center; gap: 0; position: relative; z-index: 1; padding: 0 14mm; }
.cover-logo { width: 118px; opacity: .95; margin-bottom: 18px; }
.cover-sep { width: 60px; height: 2px; background: linear-gradient(90deg,#8B2FC9,#E8237A); border-radius: 1px; margin: 18px auto; }
.cover-eyebrow { font-size: 8pt; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: rgba(255,255,255,.38); margin-bottom: 8px; }
.cover-subtitle { font-size: 13.5pt; font-weight: 600; color: rgba(255,255,255,.72); letter-spacing: .04em; margin-top: 10px; line-height: 1.5; }
.cover-tags { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 18px; }
.cover-tag { font-size: 7.5pt; font-weight: 700; border-radius: 20px; padding: 4px 12px; border: 1px solid; }
.cover-academy { font-size: 8pt; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.25); margin-top: 30px; }

/* ── SOMMAIRE ── */
.som-item { display: flex; align-items: baseline; width: 100%; }
.som-label { font-size: 10.5pt; font-weight: 500; color: rgba(255,255,255,.88); flex-shrink: 0; }
.som-dots { flex: 1; border-bottom: 1px dotted rgba(255,255,255,.15); margin: 0 10px; align-self: flex-end; margin-bottom: 3px; }
.som-page { font-size: 10pt; font-weight: 800; flex-shrink: 0; color: #C084FC; width: 42px; }

/* ── PAGE TITLE ── */
.page-title-block { flex-shrink: 0; text-align: center; }
.page-tag { display: inline-block; font-size: 7pt; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: rgba(255,255,255,.38); margin-bottom: 5px; }
.page-intro { font-size: 9.5pt; color: rgba(255,255,255,.68); line-height: 1.65; text-align: justify; flex-shrink: 0; }

/* ── BLESSURE CARD ── */
.blessure-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; min-height: 0; }
.blessure-card {
  border-radius: 12px; padding: 11px 13px;
  display: flex; flex-direction: column; gap: 5px;
  border: 1px solid; overflow: hidden;
}
.bl-head { display: flex; align-items: center; gap: 9px; flex-shrink: 0; }
.bl-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.bl-title { font-size: 9.5pt; font-weight: 800; line-height: 1.2; }
.bl-subtitle { font-size: 7pt; color: rgba(255,255,255,.45); margin-top: 1px; }
.bl-sep { height: 1px; background: rgba(255,255,255,.06); flex-shrink: 0; }
.bl-section-title { font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: .09em; margin-bottom: 2px; }
.bl-text { font-size: 8.2pt; color: rgba(255,255,255,.78); line-height: 1.5; text-align: justify; }
.bl-tag { display: inline-block; font-size: 6.5pt; font-weight: 700; border-radius: 10px; padding: 2px 7px; margin-top: 3px; }

/* ── EXERCICE ── */
.exo-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 7px; min-height: 0; }
.exo-card {
  border-radius: 11px; padding: 10px 12px;
  display: flex; flex-direction: column; gap: 4px;
  background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
  overflow: hidden;
}
.exo-head { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.exo-num { font-size: 20pt; font-weight: 800; color: rgba(255,255,255,.06); flex-shrink: 0; line-height: 1; width: 36px; }
.exo-title { font-size: 9pt; font-weight: 800; line-height: 1.2; }
.exo-muscle { font-size: 6.5pt; color: rgba(255,255,255,.4); margin-top: 1px; }
.exo-sep { height: 1px; background: rgba(255,255,255,.06); flex-shrink: 0; }
.exo-dose { display: flex; gap: 6px; flex-shrink: 0; }
.exo-chip { font-size: 7pt; font-weight: 700; border-radius: 8px; padding: 2px 8px; }
.exo-desc { font-size: 8pt; color: rgba(255,255,255,.75); line-height: 1.5; text-align: justify; }
.exo-tip { font-size: 7pt; color: rgba(255,255,255,.42); font-style: italic; }

/* ── PROTOCOLE PEACE ── */
.peace-grid { flex: 1; display: flex; flex-direction: column; gap: 6px; min-height: 0; }
.peace-card {
  flex: 1; border-radius: 11px; padding: 10px 14px;
  display: flex; align-items: flex-start; gap: 12px;
  background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
}
.peace-letter { font-size: 28pt; font-weight: 800; flex-shrink: 0; width: 42px; line-height: 1; }
.peace-body { flex: 1; }
.peace-title { font-size: 10pt; font-weight: 800; margin-bottom: 2px; }
.peace-desc { font-size: 8.5pt; color: rgba(255,255,255,.75); line-height: 1.55; text-align: justify; }

/* ── CHARGE ── */
.charge-bars { flex: 1; display: flex; flex-direction: column; gap: 7px; justify-content: space-evenly; min-height: 0; }
.charge-row { display: flex; align-items: center; gap: 10px; }
.charge-label { font-size: 8.5pt; font-weight: 600; width: 120px; flex-shrink: 0; }
.charge-bar-wrap { flex: 1; height: 14px; background: rgba(255,255,255,.06); border-radius: 7px; overflow: hidden; }
.charge-bar { height: 100%; border-radius: 7px; }
.charge-val { font-size: 8pt; font-weight: 700; width: 36px; text-align: right; flex-shrink: 0; }

/* ── ÉTIREMENTS ── */
.etir-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 7px; min-height: 0; }
.etir-card {
  border-radius: 10px; padding: 10px 11px;
  display: flex; flex-direction: column; gap: 4px;
  background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
}
.etir-icon { font-size: 20px; margin-bottom: 2px; }
.etir-title { font-size: 8.5pt; font-weight: 800; }
.etir-muscle { font-size: 6.5pt; color: rgba(255,255,255,.4); margin-bottom: 2px; }
.etir-dose { font-size: 7.5pt; font-weight: 700; color: #C084FC; }
.etir-desc { font-size: 7.5pt; color: rgba(255,255,255,.72); line-height: 1.45; text-align: justify; }

/* ── CHAUSSURES ── */
.shoe-cards { flex: 1; display: flex; flex-direction: column; gap: 7px; justify-content: space-evenly; min-height: 0; }
.shoe-card {
  flex: 1; border-radius: 11px; padding: 10px 14px;
  display: flex; gap: 14px; align-items: center;
  background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
}
.shoe-icon { font-size: 26px; flex-shrink: 0; }
.shoe-body { flex: 1; }
.shoe-title { font-size: 10pt; font-weight: 800; margin-bottom: 3px; }
.shoe-desc { font-size: 8.5pt; color: rgba(255,255,255,.75); line-height: 1.55; text-align: justify; }

/* ── CTA FINALE ── */
.cta-page { justify-content: space-between; }
.cta-hero { flex-shrink: 0; text-align: center; padding: 4px 0 6px; }
.cta-eyebrow { font-size: 8pt; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; color: rgba(255,255,255,.38); margin-bottom: 5px; }
.cta-sub { font-size: 9.5pt; color: rgba(255,255,255,.62); margin-top: 5px; line-height: 1.55; }
.offers-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; flex-shrink: 0; }
.offer-card {
  border-radius: 14px; padding: 16px 14px 14px;
  display: flex; flex-direction: column; gap: 6px;
  position: relative; overflow: hidden;
}
.offer-badge {
  position: absolute; top: 12px; right: 12px;
  font-size: 6.5pt; font-weight: 800; border-radius: 20px; padding: 3px 9px;
  background: rgba(255,255,255,.12); color: rgba(255,255,255,.9);
}
.offer-icon { font-size: 24px; margin-bottom: 2px; }
.offer-title { font-size: 11pt; font-weight: 800; line-height: 1.2; }
.offer-tagline { font-size: 8pt; color: rgba(255,255,255,.65); line-height: 1.45; }
.offer-price { font-size: 13pt; font-weight: 800; margin-top: 2px; }
.offer-features { display: flex; flex-direction: column; gap: 3px; margin-top: 4px; }
.offer-feat { font-size: 7.5pt; color: rgba(255,255,255,.75); display: flex; gap: 5px; align-items: flex-start; }
.offer-feat::before { content: "✓"; font-weight: 800; flex-shrink: 0; }
.offer-cta-btn {
  margin-top: 6px; border-radius: 8px; padding: 7px 10px; text-align: center;
  font-size: 8pt; font-weight: 800; letter-spacing: .04em;
  background: rgba(255,255,255,.1); color: white;
}
.big-cta {
  flex-shrink: 0; border-radius: 14px; padding: 16px 20px;
  background: linear-gradient(135deg,#8B2FC9,#E8237A);
  text-align: center;
}
.big-cta-title { font-size: 13pt; font-weight: 800; color: white; margin-bottom: 4px; }
.big-cta-sub { font-size: 9pt; color: rgba(255,255,255,.88); line-height: 1.5; margin-bottom: 10px; }
.big-cta-url { font-size: 11pt; font-weight: 800; color: white; letter-spacing: .04em; }
.fin-url { flex-shrink: 0; text-align: center; padding-top: 6px; font-size: 8pt; color: rgba(255,255,255,.28); letter-spacing: .06em; }
`

// ─── SVG Cover déco ───────────────────────────────────────────────────────────
const SVG_COVER_SHIELD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 120" width="110" height="120">
  <defs>
    <linearGradient id="sh-g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#8B2FC9" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#E8237A" stop-opacity="0.4"/>
    </linearGradient>
    <linearGradient id="sh-g2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8B2FC9"/><stop offset="100%" stop-color="#E8237A"/>
    </linearGradient>
  </defs>
  <path d="M55 6 L95 22 L95 60 Q95 90 55 108 Q15 90 15 60 L15 22 Z" fill="url(#sh-g1)" stroke="url(#sh-g2)" stroke-width="2"/>
  <path d="M55 20 L82 32 L82 60 Q82 80 55 93 Q28 80 28 60 L28 32 Z" fill="none" stroke="url(#sh-g2)" stroke-width="1.5" opacity="0.5" stroke-dasharray="4,3"/>
  <path d="M40 58 L50 68 L70 46" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
</svg>`

const SVG_COVER_CIRCLES = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs><radialGradient id="cv-cg"><stop offset="0%" stop-color="#E8237A" stop-opacity="0.7"/><stop offset="100%" stop-color="#8B2FC9" stop-opacity="0.15"/></radialGradient></defs>
  <circle cx="60" cy="60" r="56" fill="none" stroke="url(#cv-cg)" stroke-width="1.5"/>
  <circle cx="60" cy="60" r="40" fill="none" stroke="url(#cv-cg)" stroke-width="1.5" stroke-dasharray="4,6"/>
  <circle cx="60" cy="60" r="24" fill="none" stroke="url(#cv-cg)" stroke-width="1.5"/>
  <circle cx="60" cy="60" r="9" fill="url(#cv-cg)"/>
</svg>`

const SVG_COVER_DOTS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 48" width="64" height="48">
  <defs><radialGradient id="cv-dg"><stop offset="0%" stop-color="#E8237A" stop-opacity="0.7"/><stop offset="100%" stop-color="#8B2FC9" stop-opacity="0.3"/></radialGradient></defs>
  ${[0,1,2,3].map(i=>[0,1,2].map(j=>`<circle cx="${8+i*16}" cy="${8+j*16}" r="${2-j*0.3}" fill="url(#cv-dg)"/>`).join('')).join('')}
</svg>`

// ─── Données ──────────────────────────────────────────────────────────────────
const BLESSURES = [
  {
    icon:'🦴', color:'#06B6D4', bg:'rgba(6,182,212,.08)', border:'rgba(6,182,212,.25)',
    title:'Périostite tibiale', sub:'Syndrome de stress du tibia',
    symptomes:'Douleur diffuse le long du tibia, aggravée à l\'effort et en début de séance.',
    causes:'Augmentation trop rapide du volume, surfaces dures, mauvaise foulée.',
    prevention:'Progression de 10% max/semaine. ' + hl('Renforcement du mollet') + ' et des tibialis. Varier les surfaces.',
    soins:'Repos relatif, glace 15 min x3/j. Reprise progressive sur surfaces souples.',
    tag:'Fréquente débutants', tagColor:'rgba(6,182,212,.2)', tagBorder:'rgba(6,182,212,.4)',
  },
  {
    icon:'🦵', color:'#F97316', bg:'rgba(249,115,22,.08)', border:'rgba(249,115,22,.25)',
    title:'Tendinite d\'Achille', sub:'Tendinopathie du tendon calcanéen',
    symptomes:'Raideur matinale au talon, douleur à la palpation, gonflement possible.',
    causes:'Surentraînement, manque d\'étirements, chaussures inadaptées.',
    prevention: hl('Montées excentriques') + ' sur marche, échauffement soigneux, semelles adaptées.',
    soins:'Repos 2-4 semaines, massage transverse profond, kinésithérapie précoce.',
    tag:'Coureurs confirmés', tagColor:'rgba(249,115,22,.2)', tagBorder:'rgba(249,115,22,.4)',
  },
  {
    icon:'🔩', color:'#A855F7', bg:'rgba(168,85,247,.08)', border:'rgba(168,85,247,.25)',
    title:'Syndrome de l\'essuie-glace', sub:'Bandelette ilio-tibiale (BIT)',
    symptomes:'Douleur vive et précise sur la face externe du genou, surtout après 20-30 min.',
    causes:'Excès de dénivelé, mauvaise cadence, abducteurs faibles.',
    prevention: hl('Renforcement des fessiers') + ' et abducteurs. Foam roller BIT. Cadence 170-180 pas/min.',
    soins:'Stop immédiat si douleur vive, anti-inflammatoires, étirements spécifiques BIT.',
    tag:'Coureurs longue distance', tagColor:'rgba(168,85,247,.2)', tagBorder:'rgba(168,85,247,.4)',
  },
  {
    icon:'🦶', color:'#22C55E', bg:'rgba(34,197,94,.08)', border:'rgba(34,197,94,.25)',
    title:'Fasciite plantaire', sub:'Aponévrosite plantaire',
    symptomes:'Douleur intense sous le pied au réveil ou en début de séance, talon et voûte.',
    causes:'Surpoids, pieds plats ou creux, chaussures usées, course sur pointe.',
    prevention: hl('Renforcement intrinsèque du pied') + ', billes sous le pied, semelles orthopédiques si besoin.',
    soins:'Étirements du fascia et du mollet, botte de nuit, ondes de choc si chronique.',
    tag:'Terrain: route et piste', tagColor:'rgba(34,197,94,.2)', tagBorder:'rgba(34,197,94,.4)',
  },
  {
    icon:'💥', color:'#EF4444', bg:'rgba(239,68,68,.08)', border:'rgba(239,68,68,.25)',
    title:'Claquage musculaire', sub:'Déchirure fibre ou faisceau',
    symptomes:'Douleur brutale "coup de couteau", contracture, hématome possible.',
    causes:'Départ rapide sans échauffement, fatigue, froid, déshydratation.',
    prevention: hl('Échauffement progressif') + ' 15 min minimum. Alimentation et hydratation soignées.',
    soins:'PEACE&LOVE (voir protocole). Arrêt immédiat, pas de chaleur les 72 premières heures.',
    tag:'Séances intenses', tagColor:'rgba(239,68,68,.2)', tagBorder:'rgba(239,68,68,.4)',
  },
  {
    icon:'🦿', color:'#EAB308', bg:'rgba(234,179,8,.08)', border:'rgba(234,179,8,.25)',
    title:'Syndrome fémoro-patellaire', sub:'Genou du coureur',
    symptomes:'Douleur sous ou autour de la rotule, aggravée en descente et position assise prolongée.',
    causes:'Cuissards faibles, valgus du genou, surentraînement en côtes.',
    prevention: hl('Squats et fentes') + ' unilatéraux, travail de la hanche, réduction temporaire volume.',
    soins:'Repos relatif, glace, kiné pour rééquilibrage musculaire, taping rotulien si besoin.',
    tag:'Tous niveaux', tagColor:'rgba(234,179,8,.2)', tagBorder:'rgba(234,179,8,.4)',
  },
]

const EXERCICES = [
  { num:'01', icon:'🦵', title:'Squat unilatéral', muscle:'Quadriceps, fessiers, stabilisateurs', dose:'3×12 reps', doséColor:'rgba(139,47,201,.25)', doseBorder:'rgba(139,47,201,.5)', desc:'Debout sur une jambe, descends lentement jusqu\'à 90°. Garde le genou dans l\'axe du pied. Remonte en contrôlant.', tip:'Variation: squat bulgare avec pied arrière surélevé' },
  { num:'02', icon:'🔥', title:'Hip thrust', muscle:'Grand fessier, ischio-jambiers', dose:'3×15 reps', doséColor:'rgba(232,35,122,.25)', doseBorder:'rgba(232,35,122,.5)', desc:'Dos sur banc, pieds à plat, pousse le bassin vers le haut en contractant fort les fessiers. Pause 1 sec en haut.', tip:'Essentiel pour prévenir les blessures au genou' },
  { num:'03', icon:'⚡', title:'Mollet excentrique', muscle:'Soléaire, gastrocnémien, Achille', dose:'3×15 lentes', doséColor:'rgba(6,182,212,.25)', doseBorder:'rgba(6,182,212,.5)', desc:'Sur marche, monte sur la pointe des deux pieds puis redescends lentement sur une seule jambe en 4 secondes.', tip:'Prophylaxie n°1 contre la tendinite d\'Achille' },
  { num:'04', icon:'🏋️', title:'Fente marchée', muscle:'Quadriceps, fessiers, soléaire', dose:'3×10/côté', doséColor:'rgba(249,115,22,.25)', doseBorder:'rgba(249,115,22,.5)', desc:'Pas en avant, genou avant à 90°, genou arrière effleure le sol. Pousse sur le talon avant pour remonter.', tip:'Améliore l\'équilibre et la proprioception' },
  { num:'05', icon:'🎯', title:'Pont fessier', muscle:'Grand fessier, core, ischios', dose:'3×20 reps', doséColor:'rgba(34,197,94,.25)', doseBorder:'rgba(34,197,94,.5)', desc:'Allongé dos au sol, genoux fléchis à 90°, pousse le bassin vers le haut. Tiens 2 sec en haut, redescends lentement.', tip:'Version difficile: jambe tendue à l\'horizontal' },
  { num:'06', icon:'🌀', title:'Clam shell', muscle:'Moyen fessier, abducteurs', dose:'3×20/côté', doséColor:'rgba(168,85,247,.25)', doseBorder:'rgba(168,85,247,.5)', desc:'Allongé sur le côté, hanches fléchies à 60°. Ouvre et ferme le genou supérieur comme une palourde. Lent et contrôlé.', tip:'Idéal pour prévenir le syndrome de l\'essuie-glace' },
  { num:'07', icon:'🧘', title:'Planche latérale', muscle:'Obliques, carré des lombes, abducteurs', dose:'3×30 sec', doséColor:'rgba(239,68,68,.25)', doseBorder:'rgba(239,68,68,.5)', desc:'Sur l\'avant-bras, corps aligné des pieds à la tête. Hanches hautes, ne laisse pas la hanche s\'affaisser.', tip:'Progression: planche avec levée de jambe' },
  { num:'08', icon:'🦿', title:'Tibialis raise', muscle:'Tibial antérieur, extenseurs', dose:'3×20 reps', doséColor:'rgba(234,179,8,.25)', doseBorder:'rgba(234,179,8,.5)', desc:'Dos contre un mur, talons à 30 cm. Lève la pointe des pieds vers le haut en gardant les talons au sol. Lent.', tip:'Prévention directe de la périostite tibiale' },
  { num:'09', icon:'🧱', title:'Copenhagen plank', muscle:'Adducteurs, core, stabilisateurs', dose:'3×20 sec', doséColor:'rgba(6,182,212,.25)', doseBorder:'rgba(6,182,212,.5)', desc:'Planche latérale avec pied supérieur posé sur un banc. Soulève la hanche inférieure pour créer un pont. Respire.', tip:'Un des meilleurs exercices de prévention en sport' },
  { num:'10', icon:'🦸', title:'Chaise au mur', muscle:'Quadriceps, genou, isométrique', dose:'3×45 sec', doséColor:'rgba(232,35,122,.25)', doseBorder:'rgba(232,35,122,.5)', desc:'Dos contre le mur, genoux à 90°. Tiens la position sans bouger. Brûlure normale dans les quadriceps.', tip:'Excellent pour renforcer le genou du coureur' },
]

const ETIREMENTS = [
  { icon:'🦵', title:'Quadriceps', muscle:'Face avant cuisse', dose:'30 sec x3', desc:'Debout, saisir le pied derrière, genou vers le bas. Hanche droite, bassin neutre.' },
  { icon:'🔗', title:'Ischio-jambiers', muscle:'Face arrière cuisse', dose:'30 sec x3', desc:'Assis, jambe tendue, penche le buste vers l\'avant en gardant le dos droit.' },
  { icon:'🦶', title:'Mollet / Achille', muscle:'Mollet et tendon', dose:'45 sec x3', desc:'Main contre mur, pied arrière à plat, genou tendu. Pousse le talon vers le sol.' },
  { icon:'🔩', title:'Bandelette IT', muscle:'Hanche externe', dose:'30 sec x3', desc:'Debout, croise les jambes, penche le buste du côté opposé en appuyant la hanche.' },
  { icon:'🍑', title:'Fessier piriforme', muscle:'Fessier profond', dose:'30 sec x3', desc:'Allongé, cheville sur genou opposé, tire la cuisse vers la poitrine doucement.' },
  { icon:'🌊', title:'Fascia plantaire', muscle:'Voûte et talon', dose:'60 sec x2', desc:'Assis, saisir les orteils et tirer vers le tibia. Masser aussi avec une balle de tennis.' },
]

const PEACE_LOVE = [
  { letter:'P', color:'#06B6D4', title:'Protection', desc:'Limiter les activités douloureuses dans les 1 à 3 premiers jours. Pas d\'immobilisation totale, mais repos relatif pour éviter d\'aggraver la lésion.' },
  { letter:'E', color:'#22C55E', title:'Élévation', desc:'Élever le membre blessé au-dessus du niveau du cœur le plus possible pour réduire l\'enflure et accélérer le drainage lymphatique.' },
  { letter:'A', color:'#8B2FC9', title:'Anti-inflammatoires à éviter', desc:'Éviter les anti-inflammatoires dans les 72 premières heures: ils freinent la phase inflammatoire naturelle, essentielle à la guérison tissulaire.' },
  { letter:'C', color:'#F97316', title:'Compression', desc:'Bandage compressif pour limiter l\'oedème. Serré mais pas trop: les doigts ne doivent pas bleuir ni ressentir de fourmillements.' },
  { letter:'E', color:'#EAB308', title:'Éducation', desc:'Comprendre sa blessure pour mieux la gérer. La douleur est un signal, pas un ennemi. La reprise progressive est plus efficace que l\'arrêt total.' },
  { letter:'L', color:'#E8237A', title:'Loading progressif', desc:'Reprendre la charge progressivement dès que possible. Le mouvement favorise la guérison et évite la perte musculaire et proprioceptive.' },
  { letter:'O', color:'#A855F7', title:'Optimisme', desc:'L\'état d\'esprit positif influence directement la guérison. Les études montrent que les patients optimistes récupèrent plus vite et avec moins de rechutes.' },
  { letter:'V', color:'#3B82F6', title:'Vascularisation', desc:'Exercices cardiovasculaires non douloureux (vélo, natation, marche) pour maintenir le flux sanguin et accélérer la cicatrisation des tissus.' },
  { letter:'E', color:'#10B981', title:'Exercice', desc:'Reprise des exercices ciblés de renforcement dès que possible. La rééducation active est supérieure au repos passif pour une récupération durable.' },
]

// ─── Pages ────────────────────────────────────────────────────────────────────

function pageCover() {
  return `
  <div class="cover-page">
    <div class="blob-tr"></div><div class="blob-bl"></div>
    <div class="cover-wm">RUN</div>
    <div class="cover-deco-tr">${SVG_COVER_CIRCLES}</div>
    <div class="cover-deco-bl">${SVG_COVER_DOTS}</div>
    <div class="cover-deco-br">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="70" height="70" opacity="0.6">
        <defs><linearGradient id="cv-br" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#8B2FC9" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#E8237A" stop-opacity="0.3"/>
        </linearGradient></defs>
        <path d="M40 4 L74 22 L74 58 Q74 74 40 76 Q6 74 6 58 L6 22 Z" fill="none" stroke="url(#cv-br)" stroke-width="1.5" stroke-dasharray="5,4"/>
        <circle cx="40" cy="40" r="12" fill="url(#cv-br)" opacity="0.5"/>
      </svg>
    </div>
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
    { label:'Introduction', page:'3' },
    { label:'Les 6 blessures courantes', page:'4' },
    { label:'Programme de renforcement', page:'5' },
    { label:'Étirements essentiels', page:'6' },
    { label:'Gestion de la charge d\'entraînement', page:'7' },
    { label:'Protocole PEACE & LOVE', page:'8' },
    { label:'Chaussures et matériel', page:'9' },
    { label:'Passer à l\'action', page:'10' },
  ]
  return `
  <div class="page">
    ${blobs('A')}
    <div class="page-title-block">
      <div class="page-tag">Guide Anti-Blessure</div>
      ${gradText('Sommaire', { sizePt:28, weight:800 })}
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
  return `
  <div class="page">
    ${blobs('B')}
    <div class="page-title-block">
      <div class="page-tag">Préambule</div>
      ${gradText('Introduction', { sizePt:28, weight:800 })}
      ${svgTitleDeco()}
    </div>
    <div class="page-intro">
      Courir, c'est l'une des activités les plus naturelles et accessibles qui soit. Pourtant, les statistiques sont sans appel: <span style="color:white;font-weight:700">près de 65% des coureurs se blessent chaque année</span>, souvent pour des raisons qui auraient pu être évitées.
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;flex-shrink:0">
      ${[
        { icon:'📈', title:'Progression trop rapide', desc:'L\'erreur numéro 1. Le corps a besoin de temps pour s\'adapter à la charge.', color:'rgba(232,35,122,.2)', border:'rgba(232,35,122,.35)' },
        { icon:'🔧', title:'Manque de renforcement', desc:'Un coureur qui ne fait que courir accumule des déséquilibres musculaires dangereux.', color:'rgba(249,115,22,.2)', border:'rgba(249,115,22,.35)' },
        { icon:'😴', title:'Récupération négligée', desc:'La performance se construit pendant le repos, pas pendant l\'effort.', color:'rgba(139,47,201,.2)', border:'rgba(139,47,201,.35)' },
        { icon:'👟', title:'Équipement inadapté', desc:'Une mauvaise chaussure peut être à l\'origine de nombreuses douleurs chroniques.', color:'rgba(6,182,212,.2)', border:'rgba(6,182,212,.35)' },
      ].map(c => `
      <div style="border-radius:12px;padding:12px 14px;background:${c.color};border:1px solid ${c.border}">
        <div style="font-size:20px;margin-bottom:5px">${c.icon}</div>
        <div style="font-size:9.5pt;font-weight:800;margin-bottom:4px">${c.title}</div>
        <div style="font-size:8.5pt;color:rgba(255,255,255,.75);line-height:1.5;text-align:justify">${c.desc}</div>
      </div>`).join('')}
    </div>
    <div class="page-intro">
      Ce guide est conçu pour te donner les ${hl('clés concrètes')} pour t'entraîner plus intelligemment. Tu trouveras ici les blessures les plus fréquentes chez le coureur, comment les identifier tôt, les prévenir grâce au renforcement musculaire, et les soigner efficacement quand elles surviennent malgré tout.
    </div>
    <div class="page-intro">
      L'objectif n'est pas de te faire avoir peur, mais de te donner les outils pour rester sur les routes le plus longtemps possible et progresser ${hl('sans interruption forcée')}.
    </div>
    <div style="padding:6px 0 0">${SVG_HEARTBEAT}</div>
    ${pageNum('3')}
  </div>`
}

function pageBlessures() {
  return `
  <div class="page">
    ${blobs('A')}
    <div class="page-title-block">
      <div class="page-tag">Chapitre 1</div>
      ${gradText('Les 6 blessures courantes', { sizePt:24, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    <div class="blessure-grid">
      ${BLESSURES.map(b => `
      <div class="blessure-card" style="background:${b.bg};border-color:${b.border}">
        <div class="bl-head">
          <div class="bl-icon" style="background:${b.bg}">${b.icon}</div>
          <div>
            <div class="bl-title">${b.title}</div>
            <div class="bl-subtitle">${b.sub}</div>
          </div>
        </div>
        <div class="bl-sep"></div>
        <div class="bl-section-title" style="color:${b.color}">Symptômes</div>
        <div class="bl-text">${b.symptomes}</div>
        <div class="bl-section-title" style="color:${b.color};margin-top:3px">Prévention</div>
        <div class="bl-text">${b.prevention}</div>
        <div class="bl-section-title" style="color:${b.color};margin-top:3px">Traitement</div>
        <div class="bl-text">${b.soins}</div>
        <span class="bl-tag" style="background:${b.tagColor};border:1px solid ${b.tagBorder};color:${b.color}">${b.tag}</span>
      </div>`).join('')}
    </div>
    ${pageNum('4')}
  </div>`
}

function pageRenforcement() {
  return `
  <div class="page">
    ${blobs('B')}
    <div class="page-title-block">
      <div class="page-tag">Chapitre 2</div>
      ${gradText('Programme de renforcement', { sizePt:24, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    <div class="page-intro" style="text-align:justify">
      ${hl('2 séances par semaine')} suffisent pour construire une armure musculaire solide. Ces exercices ciblent les groupes musculaires les plus sollicités en course et les plus souvent à l'origine des blessures.
    </div>
    <div class="exo-grid">
      ${EXERCICES.map(e => `
      <div class="exo-card">
        <div class="exo-head">
          <div class="exo-num">${e.num}</div>
          <div>
            <div class="exo-title">${e.icon} ${e.title}</div>
            <div class="exo-muscle">${e.muscle}</div>
          </div>
        </div>
        <div class="exo-sep"></div>
        <div class="exo-dose">
          <span class="exo-chip" style="background:${e.doséColor};border:1px solid ${e.doseBorder};color:white">${e.dose}</span>
        </div>
        <div class="exo-desc">${e.desc}</div>
        <div class="exo-tip">Conseil: ${e.tip}</div>
      </div>`).join('')}
    </div>
    ${pageNum('5')}
  </div>`
}

function pageEtirements() {
  return `
  <div class="page">
    ${blobs('A')}
    <div class="page-title-block">
      <div class="page-tag">Chapitre 3</div>
      ${gradText('Étirements essentiels', { sizePt:26, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    <div class="page-intro" style="text-align:justify">
      Les étirements doivent être pratiqués ${hl('après l\'effort uniquement')} (jamais avant à froid). Tiens chaque position sans rebonds, en respirant calmement. La régularité prime sur l'intensité.
    </div>
    <div class="etir-grid">
      ${ETIREMENTS.map(e => `
      <div class="etir-card">
        <div class="etir-icon">${e.icon}</div>
        <div class="etir-title">${e.title}</div>
        <div class="etir-muscle">${e.muscle}</div>
        <div class="etir-dose">${e.dose}</div>
        <div style="height:4px"></div>
        <div class="etir-desc">${e.desc}</div>
      </div>`).join('')}
    </div>
    <div style="background:rgba(139,47,201,.1);border:1px solid rgba(139,47,201,.3);border-radius:12px;padding:12px 16px;flex-shrink:0">
      <div style="font-size:9pt;font-weight:700;color:#C084FC;margin-bottom:4px">Règle d'or</div>
      <div style="font-size:8.5pt;color:rgba(255,255,255,.78);line-height:1.55;text-align:justify">
        Ne jamais s'étirer sur une douleur aiguë. Si une zone est douloureuse, consulte un kiné avant de reprendre l'étirement. La douleur pendant un étirement n'est ${hl('jamais normale')} et doit alerter.
      </div>
    </div>
    <div style="padding:6px 0 0">${SVG_HEARTBEAT}</div>
    ${pageNum('6')}
  </div>`
}

function pageCharge() {
  const barData = [
    { label:'Volume (km/sem)', val:70, color:'#8B2FC9', desc:'Max +10% par semaine' },
    { label:'Intensité (% VMA)', val:85, color:'#E8237A', desc:'Contrôler via fréquence cardiaque' },
    { label:'Fréquence (séances)', val:60, color:'#06B6D4', desc:'Augmenter progressivement' },
    { label:'Dénivelé positif', val:50, color:'#22C55E', desc:'Variable souvent négligée' },
    { label:'Allure spécifique', val:40, color:'#F97316', desc:'À introduire en phase finale' },
    { label:'Récupération', val:90, color:'#EAB308', desc:'Jamais négliger le repos actif' },
  ]
  return `
  <div class="page">
    ${blobs('B')}
    <div class="page-title-block">
      <div class="page-tag">Chapitre 4</div>
      ${gradText('Gestion de la charge', { sizePt:26, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    <div class="page-intro" style="text-align:justify">
      La ${hl('surcharge chronique')} est la première cause de blessure chez le coureur. Le corps s'adapte si on lui laisse le temps de le faire. La règle d'or: augmenter un seul paramètre à la fois.
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;flex-shrink:0">
      ${[
        { icon:'📊', title:'Règle des 10%', desc:'N\'augmente jamais ton volume de plus de 10% par semaine. Préfère 2 semaines de charge puis 1 semaine de récupération.', color:'rgba(139,47,201,.15)', border:'rgba(139,47,201,.3)' },
        { icon:'🌡️', title:'Écouter son corps', desc:'Un RPE (effort perçu) constamment élevé, des douleurs inhabituelles ou une fatigue persistante sont des signaux à ne jamais ignorer.', color:'rgba(232,35,122,.15)', border:'rgba(232,35,122,.3)' },
        { icon:'💤', title:'Sommeil = performance', desc:'Moins de 7h de sommeil multiplie par 2 le risque de blessure. La récupération se fait pendant le sommeil, pas pendant les footings.', color:'rgba(6,182,212,.15)', border:'rgba(6,182,212,.3)' },
        { icon:'🔄', title:'Semaine de décharge', desc:'Toutes les 3 à 4 semaines, réduis le volume de 30 à 40%. Cette récupération planifiée est ce qui permet la surcompensation.', color:'rgba(34,197,94,.15)', border:'rgba(34,197,94,.3)' },
      ].map(c => `
      <div style="border-radius:12px;padding:12px 14px;background:${c.color};border:1px solid ${c.border}">
        <div style="font-size:20px;margin-bottom:5px">${c.icon}</div>
        <div style="font-size:9.5pt;font-weight:800;margin-bottom:4px">${c.title}</div>
        <div style="font-size:8.5pt;color:rgba(255,255,255,.75);line-height:1.5;text-align:justify">${c.desc}</div>
      </div>`).join('')}
    </div>
    <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:14px;flex-shrink:0">
      <div style="font-size:8.5pt;font-weight:700;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px">Variables à surveiller</div>
      <div class="charge-bars">
        ${barData.map(b => `
        <div class="charge-row">
          <div class="charge-label">${b.label}</div>
          <div class="charge-bar-wrap">
            <div class="charge-bar" style="width:${b.val}%;background:${b.color}"></div>
          </div>
          <div class="charge-val" style="color:${b.color}">${b.val}%</div>
        </div>`).join('')}
      </div>
    </div>
    <div style="padding:4px 0 0">${SVG_HEARTBEAT}</div>
    ${pageNum('7')}
  </div>`
}

function pagePeaceLove() {
  return `
  <div class="page">
    ${blobs('A')}
    <div class="page-title-block">
      <div class="page-tag">Chapitre 5</div>
      ${gradText('Protocole PEACE & LOVE', { sizePt:24, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    <div class="page-intro" style="text-align:justify">
      Le protocole PEACE & LOVE remplace désormais l'ancien RICE (Repos, Glace, Compression, Élévation). Il intègre les ${hl('dernières recherches en médecine du sport')} et offre une approche plus complète de la gestion des blessures aiguës.
    </div>
    <div class="peace-grid">
      ${PEACE_LOVE.map(p => `
      <div class="peace-card">
        <div class="peace-letter" style="color:${p.color}">${p.letter}</div>
        <div class="peace-body">
          <div class="peace-title">${p.title}</div>
          <div class="peace-desc">${p.desc}</div>
        </div>
      </div>`).join('')}
    </div>
    ${pageNum('8')}
  </div>`
}

function pageChaussures() {
  const shoes = [
    { icon:'🏃', title:'Chaussure d\'entraînement daily', desc:'Amorti modéré, durabilité maximale. Adaptée aux footings du quotidien. À renouveler tous les 600-800 km. La base de ta rotation de chaussures.', color:'rgba(139,47,201,.15)', border:'rgba(139,47,201,.3)' },
    { icon:'⚡', title:'Chaussure de vitesse / plaquée', desc:'Carbone ou nylon pour les séances intenses et les compétitions. Ne pas utiliser en entraînement quotidien: risque de surcharge tendineuse si utilisée trop souvent.', color:'rgba(232,35,122,.15)', border:'rgba(232,35,122,.3)' },
    { icon:'🏔️', title:'Trail / stabilité', desc:'Drop bas pour le trail, semelle vibram pour l\'adhérence. Pour route: chaussure de stabilité si tu as une pronation excessive confirmée par un podologue.', color:'rgba(6,182,212,.15)', border:'rgba(6,182,212,.3)' },
    { icon:'🔄', title:'Rotation de chaussures', desc:'Alterner 2 à 3 paires différentes réduit de 40% le risque de blessure. Chaque paire sollicite le pied différemment et permet une meilleure récupération des tissus.', color:'rgba(34,197,94,.15)', border:'rgba(34,197,94,.3)' },
    { icon:'📏', title:'Bilan podologique', desc:'Un bilan biomécanique est recommandé tous les 2 ans, ou après une blessure répétée. Les semelles orthopédiques peuvent corriger des déséquilibres structurels importants.', color:'rgba(234,179,8,.15)', border:'rgba(234,179,8,.3)' },
  ]
  return `
  <div class="page">
    ${blobs('B')}
    <div class="page-title-block">
      <div class="page-tag">Chapitre 6</div>
      ${gradText('Chaussures et matériel', { sizePt:26, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    <div class="page-intro" style="text-align:justify">
      Le choix de la chaussure est souvent ${hl('sous-estimé')} alors qu'il est l'un des facteurs les plus importants dans la prévention des blessures. Une chaussure inadaptée peut créer des problèmes dans toute la chaîne cinétique.
    </div>
    <div class="shoe-cards">
      ${shoes.map(s => `
      <div class="shoe-card" style="background:${s.color};border-color:${s.border}">
        <div class="shoe-icon">${s.icon}</div>
        <div class="shoe-body">
          <div class="shoe-title">${s.title}</div>
          <div class="shoe-desc">${s.desc}</div>
        </div>
      </div>`).join('')}
    </div>
    <div style="padding:6px 0 0">${SVG_HEARTBEAT}</div>
    ${pageNum('9')}
  </div>`
}

function pageCTA() {
  return `
  <div class="page cta-page">
    ${blobs('A')}
    <div class="cta-hero">
      <div class="cta-eyebrow">Passe à l'action</div>
      ${gradText('Commence à courir plus intelligent', { sizePt:22, weight:800 })}
      ${svgDiamond()}
      <div class="cta-sub">
        Tu as maintenant les clés pour t'entraîner sans te blesser. La prochaine étape: un accompagnement personnalisé pour progresser rapidement et durablement.
      </div>
    </div>

    <div class="offers-grid">
      <div class="offer-card" style="background:linear-gradient(135deg,rgba(139,47,201,.18),rgba(139,47,201,.08));border:1px solid rgba(139,47,201,.4)">
        <span class="offer-badge">Ebook</span>
        <div class="offer-icon">📘</div>
        ${gradText('Plan d\'entraînement PDF', { sizePt:12, weight:800, width:280, align:'left' })}
        <div class="offer-tagline">Un plan structuré semaine par semaine, adapté à ta VMA et tes disponibilités. 8 à 16 semaines selon ton objectif.</div>
        <div class="offer-features">
          <div class="offer-feat">Plan 10km, semi ou marathon</div>
          <div class="offer-feat">Adapté à ta VMA et disponibilités</div>
          <div class="offer-feat">Sessions détaillées avec allures</div>
          <div class="offer-feat">Téléchargement immédiat</div>
        </div>
        <div class="offer-price" style="background:linear-gradient(135deg,#8B2FC9,#E8237A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">À partir de 14,99€</div>
        <div class="offer-cta-btn" style="background:rgba(139,47,201,.3);border:1px solid rgba(139,47,201,.5)">Découvrir les plans</div>
      </div>

      <div class="offer-card" style="background:linear-gradient(135deg,rgba(232,35,122,.18),rgba(232,35,122,.08));border:1px solid rgba(232,35,122,.4)">
        <span class="offer-badge" style="background:rgba(232,35,122,.2)">Coaching</span>
        <div class="offer-icon">🏆</div>
        ${gradText('Coaching personnalisé', { sizePt:12, weight:800, width:280, align:'left' })}
        <div class="offer-tagline">Un suivi sur-mesure avec un coach expert. Plans individualisés, analyses hebdomadaires et ajustements en temps réel.</div>
        <div class="offer-features">
          <div class="offer-feat">Plan 100% personnalisé</div>
          <div class="offer-feat">Analyse hebdomadaire de tes séances</div>
          <div class="offer-feat">Messagerie directe avec ton coach</div>
          <div class="offer-feat">Ajustements en temps réel</div>
        </div>
        <div class="offer-price" style="background:linear-gradient(135deg,#E8237A,#8B2FC9);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">Sur devis</div>
        <div class="offer-cta-btn" style="background:rgba(232,35,122,.3);border:1px solid rgba(232,35,122,.5)">Demander un devis</div>
      </div>
    </div>

    <div class="big-cta">
      <div class="big-cta-title">Rejoins The Ultimate Academy</div>
      <div class="big-cta-sub">Des centaines de coureurs ont déjà transformé leur entraînement.<br>C'est ton tour de courir plus loin, plus vite et sans blessure.</div>
      <div class="big-cta-url">theultimateacademy.fr</div>
    </div>

    <div class="fin-url">© The Ultimate Academy — Alexis Élie, Coach Athlétisme</div>
    ${pageNum('10')}
  </div>`
}

// ─── HTML complet ─────────────────────────────────────────────────────────────
function buildHtml() {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
  <style>${CSS}</style>
</head>
<body>
${pageCover()}
${pageSommaire()}
${pageIntro()}
${pageBlessures()}
${pageRenforcement()}
${pageEtirements()}
${pageCharge()}
${pagePeaceLove()}
${pageChaussures()}
${pageCTA()}
</body>
</html>`
}

// ─── Génération PDF ───────────────────────────────────────────────────────────
;(async () => {
  const html = buildHtml()
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })
  await new Promise(r => setTimeout(r, 1500))
  const outPath = path.join(OUT_DIR, 'guide-antiblessure.pdf')
  await page.pdf({
    path: outPath,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
  })
  await browser.close()
  const size = fs.statSync(outPath).size
  console.log(`PDF généré: ${outPath} (${Math.round(size/1024)} KB)`)
})()
