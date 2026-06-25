const fs   = require('fs')
const path = require('path')
const { OBJ_PCT, formatPace, formatPaceRange, formatSpeed, formatObjPace } = require('./paces')

const LOGO = path.join(__dirname, '../../public/Logo.png')
const logoB64 = fs.existsSync(LOGO)
  ? `data:image/png;base64,${fs.readFileSync(LOGO).toString('base64')}`
  : ''

const TC = {
  'EF':            { b:'#06B6D4', bg:'rgba(6,182,212,.1)',   hd:'rgba(6,182,212,.18)',   tx:'#67E8F9' },
  'Fractionné':    { b:'#F97316', bg:'rgba(249,115,22,.1)',  hd:'rgba(249,115,22,.18)',  tx:'#FDBA74' },
  'Tempo':         { b:'#A855F7', bg:'rgba(168,85,247,.1)',  hd:'rgba(168,85,247,.18)',  tx:'#D8B4FE' },
  'Côtes':         { b:'#EF4444', bg:'rgba(239,68,68,.1)',   hd:'rgba(239,68,68,.18)',   tx:'#FCA5A5' },
  'Sortie longue': { b:'#22C55E', bg:'rgba(34,197,94,.1)',   hd:'rgba(34,197,94,.18)',   tx:'#86EFAC' },
  'Activation':    { b:'#EAB308', bg:'rgba(234,179,8,.1)',   hd:'rgba(234,179,8,.18)',   tx:'#FDE047' },
  'Course':        { b:'#EC4899', bg:'rgba(236,72,153,.12)', hd:'rgba(236,72,153,.22)',  tx:'#F9A8D4' },
  'Spécifique':    { b:'#3B82F6', bg:'rgba(59,130,246,.1)',  hd:'rgba(59,130,246,.18)',  tx:'#93C5FD' },
  'Renforcement':  { b:'#F472B6', bg:'rgba(244,114,182,.1)', hd:'rgba(244,114,182,.18)', tx:'#FBCFE8' },
}

// ─── SVG décoratifs ──────────────────────────────────────────────────────────
const SVG_HEARTBEAT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 28" width="100%" height="28" style="display:block;flex-shrink:0">
  <defs><linearGradient id="hb-g" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#8B2FC9" stop-opacity="0"/>
    <stop offset="15%" stop-color="#8B2FC9"/><stop offset="85%" stop-color="#E8237A"/>
    <stop offset="100%" stop-color="#E8237A" stop-opacity="0"/>
  </linearGradient></defs>
  <polyline fill="none" stroke="url(#hb-g)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    points="0,14 45,14 60,14 70,3 80,25 88,10 96,20 104,14 175,14 190,14 203,3 216,25 224,14 295,14 310,14 323,3 336,25 344,14 415,14 500,14"/>
</svg>`

const SVG_TRACK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 90" width="150" height="75" style="display:block;margin:0 auto">
  <defs>
    <linearGradient id="tk-g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8B2FC9" stop-opacity="0.4"/>
      <stop offset="50%" stop-color="#E8237A" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#8B2FC9" stop-opacity="0.4"/>
    </linearGradient>
  </defs>
  <ellipse cx="90" cy="45" rx="82" ry="36" fill="none" stroke="url(#tk-g)" stroke-width="2"/>
  <ellipse cx="90" cy="45" rx="56" ry="22" fill="none" stroke="url(#tk-g)" stroke-width="1.5" stroke-dasharray="3,5" opacity="0.6"/>
  <circle cx="172" cy="45" r="5" fill="#E8237A"/>
  <circle cx="8" cy="45" r="3.5" fill="rgba(139,47,201,.6)"/>
</svg>`

const SVG_COVER_CIRCLES = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs><radialGradient id="cv-cg" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#E8237A" stop-opacity="0.7"/>
    <stop offset="100%" stop-color="#8B2FC9" stop-opacity="0.2"/>
  </radialGradient></defs>
  <circle cx="60" cy="60" r="56" fill="none" stroke="url(#cv-cg)" stroke-width="1.5"/>
  <circle cx="60" cy="60" r="40" fill="none" stroke="url(#cv-cg)" stroke-width="1.5" stroke-dasharray="4,6"/>
  <circle cx="60" cy="60" r="24" fill="none" stroke="url(#cv-cg)" stroke-width="1.5"/>
  <circle cx="60" cy="60" r="9" fill="url(#cv-cg)"/>
</svg>`

const SVG_COVER_LINES = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 65" width="100" height="65">
  <defs><linearGradient id="cv-lg" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#8B2FC9" stop-opacity="0"/>
    <stop offset="50%" stop-color="#8B2FC9" stop-opacity="0.7"/>
    <stop offset="100%" stop-color="#E8237A" stop-opacity="0.5"/>
  </linearGradient></defs>
  <line x1="0" y1="10" x2="95" y2="10" stroke="url(#cv-lg)" stroke-width="2" stroke-linecap="round"/>
  <line x1="10" y1="25" x2="95" y2="25" stroke="url(#cv-lg)" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="22" y1="40" x2="95" y2="40" stroke="url(#cv-lg)" stroke-width="1" stroke-linecap="round"/>
  <line x1="34" y1="55" x2="95" y2="55" stroke="url(#cv-lg)" stroke-width="0.8" stroke-linecap="round"/>
</svg>`

const SVG_COVER_DOTS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 48" width="64" height="48">
  <defs><radialGradient id="cv-dg"><stop offset="0%" stop-color="#E8237A" stop-opacity="0.7"/><stop offset="100%" stop-color="#8B2FC9" stop-opacity="0.3"/></radialGradient></defs>
  ${[0,1,2,3].map(i=>[0,1,2].map(j=>`<circle cx="${8+i*16}" cy="${8+j*16}" r="${2-j*0.3}" fill="url(#cv-dg)"/>`).join('')).join('')}
</svg>`

const SVG_NUT_MOON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">
  <defs><linearGradient id="nm-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8B2FC9"/><stop offset="100%" stop-color="#A855F7"/></linearGradient></defs>
  <path d="M24 18 A10 10 0 1 1 14 8 A7 7 0 1 0 24 18" fill="url(#nm-g)" opacity="0.9"/>
  <circle cx="22" cy="9" r="2" fill="rgba(232,35,122,.6)"/>
  <circle cx="26" cy="14" r="1.5" fill="rgba(232,35,122,.4)"/>
</svg>`

const SVG_NUT_SUN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">
  <defs><linearGradient id="ns-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#F59E0B"/><stop offset="100%" stop-color="#E8237A"/></linearGradient></defs>
  <circle cx="18" cy="18" r="8" fill="url(#ns-g)" opacity="0.9"/>
  <line x1="18" y1="4" x2="18" y2="8" stroke="url(#ns-g)" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="18" y1="28" x2="18" y2="32" stroke="url(#ns-g)" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="4" y1="18" x2="8" y2="18" stroke="url(#ns-g)" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="28" y1="18" x2="32" y2="18" stroke="url(#ns-g)" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="8" y1="8" x2="11" y2="11" stroke="url(#ns-g)" stroke-width="2" stroke-linecap="round"/>
  <line x1="25" y1="25" x2="28" y2="28" stroke="url(#ns-g)" stroke-width="2" stroke-linecap="round"/>
  <line x1="28" y1="8" x2="25" y2="11" stroke="url(#ns-g)" stroke-width="2" stroke-linecap="round"/>
  <line x1="8" y1="28" x2="11" y2="25" stroke="url(#ns-g)" stroke-width="2" stroke-linecap="round"/>
</svg>`

const SVG_NUT_BOLT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">
  <defs><linearGradient id="nb-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#22C55E"/><stop offset="100%" stop-color="#06B6D4"/></linearGradient></defs>
  <path d="M20 4 L11 20 L17 20 L16 32 L25 16 L19 16 Z" fill="url(#nb-g)" opacity="0.9"/>
</svg>`

const SVG_FIN_TROPHY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 88" width="220" height="88">
  <defs>
    <linearGradient id="ft-g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8B2FC9"/><stop offset="100%" stop-color="#E8237A"/></linearGradient>
    <linearGradient id="ft-g2" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#8B2FC9" stop-opacity="0"/><stop offset="50%" stop-color="#8B2FC9" stop-opacity="0.25"/><stop offset="100%" stop-color="#E8237A" stop-opacity="0"/></linearGradient>
  </defs>
  <path d="M88 14 Q83 14 80 22 L76 64 L144 64 L140 22 Q137 14 132 14 Z" fill="url(#ft-g1)" opacity="0.14"/>
  <path d="M88 14 Q83 14 80 22 L76 64 L144 64 L140 22 Q137 14 132 14 Z" fill="none" stroke="url(#ft-g1)" stroke-width="2" stroke-linejoin="round"/>
  <path d="M80 27 Q60 27 60 42 Q60 56 77 56" fill="none" stroke="url(#ft-g1)" stroke-width="2" stroke-linecap="round"/>
  <path d="M140 27 Q160 27 160 42 Q160 56 143 56" fill="none" stroke="url(#ft-g1)" stroke-width="2" stroke-linecap="round"/>
  <path d="M110 30 L113 39 L123 39 L115 45 L118 54 L110 49 L102 54 L105 45 L97 39 L107 39 Z" fill="url(#ft-g1)" opacity="0.75"/>
  <rect x="103" y="64" width="14" height="6" fill="url(#ft-g1)" opacity="0.5"/>
  <rect x="88" y="70" width="44" height="7" rx="3.5" fill="url(#ft-g1)" opacity="0.75"/>
  <line x1="15" y1="79" x2="205" y2="79" stroke="url(#ft-g2)" stroke-width="1"/>
  <circle cx="44" cy="24" r="2.5" fill="rgba(234,179,8,.75)"/>
  <circle cx="176" cy="20" r="2" fill="rgba(234,179,8,.65)"/>
  <circle cx="30" cy="50" r="1.5" fill="rgba(139,47,201,.6)"/>
  <circle cx="192" cy="48" r="1.5" fill="rgba(232,35,122,.6)"/>
  <circle cx="55" cy="68" r="1" fill="rgba(255,255,255,.35)"/>
  <circle cx="168" cy="66" r="1" fill="rgba(255,255,255,.35)"/>
  <line x1="12" y1="37" x2="56" y2="37" stroke="rgba(139,47,201,.3)" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="18" y1="46" x2="58" y2="46" stroke="rgba(139,47,201,.2)" stroke-width="1" stroke-linecap="round"/>
  <line x1="162" y1="37" x2="206" y2="37" stroke="rgba(232,35,122,.3)" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="162" y1="46" x2="202" y2="46" stroke="rgba(232,35,122,.2)" stroke-width="1" stroke-linecap="round"/>
</svg>`

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@page { size: A4; margin: 0; }
html, body { margin: 0; padding: 0; background: #0C0A18; overflow-x: hidden; max-width: 210mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Poppins', sans-serif;
  color: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.page {
  width: 210mm; height: 297mm; overflow: hidden;
  padding: 12mm 13mm 20mm;
  background: #0C0A18;
  page-break-after: always; break-after: page;
  position: relative;
  display: flex; flex-direction: column; gap: 10px;
}

.blob-tr, .blob-bl, .blob-tl, .blob-br {
  position: absolute; border-radius: 50%; pointer-events: none; z-index: 0;
}
.blob-tr { top:-80px; right:-70px; width:300px; height:300px; background:radial-gradient(ellipse,rgba(139,47,201,.24) 0%,transparent 65%); }
.blob-bl { bottom:-70px; left:-60px; width:260px; height:260px; background:radial-gradient(ellipse,rgba(232,35,122,.18) 0%,transparent 65%); }
.blob-tl { top:-60px; left:-60px; width:250px; height:250px; background:radial-gradient(ellipse,rgba(139,47,201,.24) 0%,transparent 65%); }
.blob-br { bottom:-60px; right:-50px; width:230px; height:230px; background:radial-gradient(ellipse,rgba(232,35,122,.18) 0%,transparent 65%); }

.page > *:not([class^="blob"]):not(.pnum) { position: relative; z-index: 1; }

.pnum {
  position: absolute; bottom: 11mm; right: 13mm; z-index: 10;
}

.page-title { flex-shrink: 0; }
.page-intro {
  font-size: 9.5pt; color: rgba(255,255,255,.72); line-height: 1.6;
  text-align: center; flex-shrink: 0;
}
.section-label {
  font-size: 7pt; font-weight: 700; text-transform: uppercase;
  letter-spacing: .1em; color: rgba(255,255,255,.38); margin-bottom: 6px;
}

.cover-page {
  width: 210mm; height: 297mm; overflow: hidden; background: #0C0A18;
  page-break-after: always; break-after: page; position: relative;
  display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
}
.cover-wm {
  position: absolute; font-size: 260pt; font-weight: 800; line-height: 1; letter-spacing: -.05em;
  background: linear-gradient(135deg,#8B2FC9,#E8237A);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  opacity: .04; pointer-events: none; top: 50%; left: 50%; transform: translate(-50%,-50%);
}
.cover-deco-tr { position: absolute; top: 16mm; right: 12mm; opacity: .7; pointer-events: none; }
.cover-deco-bl { position: absolute; bottom: 38mm; left: 10mm; opacity: .8; pointer-events: none; }
.cover-deco-br { position: absolute; bottom: 18mm; right: 14mm; opacity: .6; pointer-events: none; }
.cover-inner {
  display: flex; flex-direction: column; align-items: center; gap: 0;
  position: relative; z-index: 1; padding: 0 14mm;
}
.cover-logo { width: 124px; opacity: .95; margin-bottom: 20px; }
.cover-sep { width: 60px; height: 2px; background: linear-gradient(90deg,#8B2FC9,#E8237A); border-radius: 1px; margin: 20px auto; }
.cover-eyebrow { font-size: 8pt; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: rgba(255,255,255,.38); margin-bottom: 8px; }
.cover-title {
  font-size: 82pt; font-weight: 800; line-height: .9; letter-spacing: -.03em;
  background: linear-gradient(135deg,#8B2FC9,#E8237A);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.cover-subtitle { font-size: 15pt; font-weight: 600; color: rgba(255,255,255,.75); letter-spacing: .05em; margin-top: 10px; }
.cover-academy { font-size: 8pt; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.28); margin-top: 34px; }

.som-track { flex-shrink: 0; }
.som-flat { flex: 1; display: flex; flex-direction: column; justify-content: space-evenly; min-height: 0; }
.som-glbl {
  font-size: 13pt; font-weight: 800; color: #C084FC;
  padding-bottom: 4px; border-bottom: 1px solid rgba(192,132,252,.25);
}
.som-item { display: flex; align-items: baseline; width: 100%; }
.som-label { font-size: 10.5pt; font-weight: 500; color: rgba(255,255,255,.88); flex-shrink: 0; }
.som-dots { flex: 1; border-bottom: 1px dotted rgba(255,255,255,.15); margin: 0 10px; align-self: flex-end; margin-bottom: 3px; }
.som-page { font-size: 10pt; font-weight: 800; flex-shrink: 0; color: #C084FC; width: 42px; }

.zones-wrap { flex: 1; display: flex; flex-direction: column; gap: 5px; min-height: 0; }
.zone-card {
  flex: 1; display: flex; align-items: center; padding: 0 14px;
  border-radius: 10px; gap: 16px;
}
.zone-pct { font-size: 20pt; font-weight: 800; flex-shrink: 0; width: 62px; line-height: 1; }
.zone-info { flex: 1; }
.zone-name { font-size: 10.5pt; font-weight: 700; margin-bottom: 2px; }
.zone-desc { font-size: 9pt; color: rgba(255,255,255,.7); line-height: 1.45; }
.zone-pace { font-size: 17pt; font-weight: 800; flex-shrink: 0; text-align: right; }
.zone-speed { font-size: 7.5pt; color: rgba(255,255,255,.45); text-align: right; margin-top: 1px; }

.principes-wrap { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.principe {
  flex: 1; display: flex; gap: 14px; align-items: center;
  padding: 6px 12px;
  overflow: hidden;
}
.p-num { flex-shrink: 0; width: 28px; align-self: center; }
.p-t { font-size: 10.5pt; font-weight: 700; margin-bottom: 3px; }
.p-d { font-size: 9.5pt; color: rgba(255,255,255,.75); line-height: 1.5; }

.strats-wrap { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.strat { flex: 1; display: flex; gap: 14px; align-items: center; padding: 0; }
.strat-km { width: 54px; flex-shrink: 0; text-align: center; }
.strat-km-l { font-size: 11pt; font-weight: 800; line-height: 1.1; display: inline-block; color: #C084FC; }
.strat-km-a { font-size: 7.5pt; color: rgba(255,255,255,.4); margin-top: 2px; }
.strat-c { flex: 1; padding-left: 12px; border-left: 2px solid rgba(139,47,201,.3); }
.strat-t { font-size: 10.5pt; font-weight: 700; margin-bottom: 3px; }
.strat-d { font-size: 9.5pt; color: rgba(255,255,255,.75); line-height: 1.5; }

.week-hero {
  flex-shrink: 0; padding-bottom: 8px;
  text-align: center;
}
.week-num { margin-bottom: 2px; }
.week-phase { margin-bottom: 2px; }
.week-charge { font-size: 9pt; color: rgba(255,255,255,.45); }

.objectif {
  flex-shrink: 0; padding: 7px 0 7px 11px;
  border-left: 2px solid rgba(139,47,201,.55);
}
.obj-lbl { font-size: 6.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: rgba(139,47,201,.9); margin-bottom: 3px; }
.obj-txt { font-size: 9.5pt; color: rgba(255,255,255,.82); line-height: 1.5; }

.sessions-wrap { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 6px; overflow: hidden; }

.session {
  flex: 1; min-height: 0; display: flex; flex-direction: column;
  border-radius: 12px; overflow: hidden;
}
.s-head {
  flex-shrink: 0; position: relative; height: 40px;
  display: flex; align-items: center; padding: 0 13px;
}
.s-head-row { display: none; }
.s-jour { font-size: 8.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: rgba(255,255,255,.45); flex-shrink: 0; position: relative; z-index: 1; }
.s-badge { font-size: 6.5pt; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; border-radius: 10px; padding: 2px 8px; flex-shrink: 0; white-space: nowrap; }
.s-duree { font-size: 9.5pt; font-weight: 800; flex-shrink: 0; white-space: nowrap; margin-left: auto; position: relative; z-index: 1; }
.s-center { position: absolute; left: 0; right: 0; display: flex; justify-content: center; align-items: center; gap: 8px; pointer-events: none; }
.s-titre { font-size: 10pt; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.s-body {
  flex: 1; min-height: 0; overflow: hidden;
  display: flex; flex-direction: column;
  justify-content: center; align-items: center; text-align: center;
  padding: 8px 14px; gap: 5px;
}
.s-meta { flex-shrink: 0; font-size: 8pt; color: rgba(255,255,255,.4); display: flex; gap: 10px; justify-content: center; }
.s-corps { font-size: 10pt; line-height: 1.55; color: rgba(255,255,255,.9); text-align: center; }
.s-note {
  flex-shrink: 0; padding: 5px 13px;
  font-size: 7.5pt; font-style: italic; color: rgba(255,255,255,.42);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center;
}

.sessions-wrap.dense-5 .s-corps, .sessions-wrap.dense-6 .s-corps { font-size: 9pt; line-height: 1.4; }
.sessions-wrap.dense-5 .s-note, .sessions-wrap.dense-6 .s-note { font-size: 7pt; }
.sessions-wrap.dense-5 .s-head, .sessions-wrap.dense-6 .s-head { height: 32px; }
.sessions-wrap.dense-5 .s-titre, .sessions-wrap.dense-6 .s-titre { font-size: 9pt; }
.sessions-wrap.dense-6 .s-body { padding: 5px 14px; gap: 3px; }

.conseil { flex-shrink: 0; padding: 7px 0 7px 11px; border-left: 2px solid rgba(232,35,122,.5); }
.conseil-lbl { font-size: 6.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: rgba(232,35,122,.9); margin-bottom: 3px; }
.conseil-txt { font-size: 9.5pt; color: rgba(255,255,255,.8); line-height: 1.5; }

.nut-cards-wrap { flex: 1; display: flex; flex-direction: column; gap: 8px; min-height: 0; }
.nut-card {
  flex: 1; display: flex; flex-direction: column; min-height: 0;
  padding: 11px 14px; border-radius: 12px;
  overflow: hidden;
}
.nut-head { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; flex-shrink: 0; }
.nut-icon { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nut-title { font-size: 11pt; font-weight: 800; }
.nut-timing { font-size: 8pt; color: rgba(255,255,255,.45); margin-top: 2px; }
.nut-items { flex: 1; display: flex; flex-direction: column; justify-content: space-around; }
.nut-item { display: flex; gap: 10px; align-items: flex-start; }
.nut-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
.nut-text { font-size: 9.5pt; color: rgba(255,255,255,.82); line-height: 1.45; }
.nut-key { font-weight: 700; color: #fff; }

.fin-hero { flex-shrink: 0; text-align: center; padding: 4px 0 8px; }
.fin-eyebrow { font-size: 8pt; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; color: rgba(255,255,255,.38); margin-bottom: 6px; }
.fin-sub { font-size: 10pt; color: rgba(255,255,255,.6); margin-top: 6px; line-height: 1.5; }
.fin-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.fin-feat {
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); border-radius: 12px;
  padding: 14px; display: flex; flex-direction: column;
}
.page-fin { justify-content: space-between; }
.fin-feat-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.fin-icon {
  width: 38px; height: 38px; border-radius: 10px;
  background: linear-gradient(135deg,#8B2FC9,#E8237A);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.fin-feat-num { font-size: 13pt; font-weight: 800; color: rgba(255,255,255,.07); }
.fin-feat-title { font-size: 10.5pt; font-weight: 700; margin-bottom: 4px; }
.fin-feat-bar { height: 2px; border-radius: 1px; margin-bottom: 8px; }
.fin-feat-desc { font-size: 9pt; color: rgba(255,255,255,.7); line-height: 1.5; }
.fin-feat-tag { display: inline-block; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 12px; padding: 3px 10px; font-size: 7.5pt; font-weight: 700; color: rgba(255,255,255,.5); margin-top: 8px; }
.fin-cta { flex-shrink: 0; background: linear-gradient(135deg,#8B2FC9,#E8237A); border-radius: 10px; padding: 13px; text-align: center; }
.fin-cta-title { font-size: 12pt; font-weight: 800; color: white; }
.fin-cta-sub { font-size: 9pt; color: rgba(255,255,255,.85); margin-top: 3px; }
.fin-url { flex-shrink: 0; text-align: center; padding-top: 8px; }
`

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDur(t, fallback = '25 min') {
  const m = t && t.match(/^(\d+)\s*min/)
  return m ? m[1] + ' min' : fallback
}

function blobs(v = 'A') {
  return v === 'A'
    ? '<div class="blob-tr"></div><div class="blob-bl"></div>'
    : '<div class="blob-tl"></div><div class="blob-br"></div>'
}

// Largeur de la zone de contenu d'une page A4 avec le padding du .page (12mm/13mm/20mm).
const CONTENT_W = 695
let gradTextIdSeq = 0

function escXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Texte en dégradé violet→rose rendu en SVG (plutôt que -webkit-background-clip:text,
// qui casse avec un artefact visible dès la 2e page d'un PDF multi-pages dans Chrome).
function ptToPx(pt) { return Math.round(pt * 1.3333 * 10) / 10 }

function gradText(text, { sizePt, weight = 800, width = CONTENT_W, height, letterSpacing = 0, align = 'center', uppercase = false, style = '' } = {}) {
  const fontSize = ptToPx(sizePt)
  const h = height || Math.ceil(fontSize * 1.3)
  const gid = `gt${gradTextIdSeq++}`
  const x = align === 'center' ? width / 2 : align === 'end' ? width : 0
  const anchor = align === 'center' ? 'middle' : align === 'end' ? 'end' : 'start'
  const y = Math.round(h * 0.76)
  const marginCss = align === 'center' ? '0 auto' : '0'
  const t = uppercase ? text.toUpperCase() : text
  return `<svg viewBox="0 0 ${width} ${h}" width="${width}" height="${h}" style="display:block;margin:${marginCss};overflow:visible;max-width:100%;${style}">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#8B2FC9"/><stop offset="100%" stop-color="#E8237A"/>
    </linearGradient></defs>
    <text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Poppins" font-weight="${weight}" font-size="${fontSize}" letter-spacing="${letterSpacing}" fill="url(#${gid})">${escXml(t)}</text>
  </svg>`
}

// Remplace {{P}} (séquentiel sur la queue de pct) et {{OBJ}} (allure objectif) dans un texte.
function fillText(text, pctQueue, vma) {
  if (!text) return text
  let out = text.replace(/{{P}}/g, () => {
    const range = pctQueue.shift()
    if (!range) return ''
    const [min, max] = range
    return min === max ? `${formatPace(vma, min)}/km` : formatPaceRange(vma, min, max)
  })
  out = out.replace(/{{OBJ}}/g, () => formatObjPace(vma))
  return out
}

function fillSession(s, vma) {
  const queue = (s.pcts || []).map(p => p.slice())
  return {
    ...s,
    echauff: fillText(s.echauff || '', queue, vma),
    corps:   fillText(s.corps   || '', queue, vma),
    retour:  fillText(s.retour  || '', queue, vma),
    note:    fillText(s.note    || '', queue, vma),
  }
}

function sessionCard(s) {
  const c = TC[s.type] || TC['EF']
  const headSt = `background:linear-gradient(90deg,${c.hd},rgba(255,255,255,.04));`
  const badgeSt = `background:${c.bg};color:${c.tx};border:1px solid ${c.b}55;`
  const cardSt  = `border-left:3px solid ${c.b};background:${c.bg};`
  const durSt   = `color:${c.tx};`
  let meta = ''
  if (s.echauff || s.retour) {
    const parts = []
    if (s.echauff) parts.push(`<span style="color:${c.tx}">Éch. ${getDur(s.echauff)}</span>`)
    if (s.echauff && s.retour) parts.push('<span style="color:rgba(255,255,255,.2)">·</span>')
    if (s.retour)  parts.push(`<span style="color:${c.tx}">Retour ${getDur(s.retour,'10 min')}</span>`)
    meta = `<div class="s-meta">${parts.join('')}</div>`
  }
  return `
  <div class="session" style="${cardSt}">
    <div class="s-head" style="${headSt}">
      <span class="s-jour">${s.jour}</span>
      <div class="s-center">
        <span class="s-badge" style="${badgeSt}">${s.type}</span>
        <span class="s-titre">${s.titre}</span>
      </div>
      <span class="s-duree" style="${durSt}">${s.duree}</span>
    </div>
    <div class="s-body">${meta}<div class="s-corps">${s.corps}</div></div>
    <div class="s-note">${s.note}</div>
  </div>`
}

function weekPage(sem, vma) {
  const seances = sem.seances.map(s => fillSession(s, vma))
  const denseClass = seances.length >= 6 ? 'dense-6' : seances.length === 5 ? 'dense-5' : ''
  return `
  <div class="page">
    ${blobs(sem.num % 2 === 0 ? 'B' : 'A')}
    <div class="week-hero">
      <div class="week-num">${gradText(`Semaine ${sem.num} sur 8`, { sizePt: 11, weight: 700, letterSpacing: '0.07em', uppercase: true })}</div>
      <div class="week-phase">${gradText(sem.phase, { sizePt: 26, weight: 800, uppercase: true })}</div>
    </div>
    <div class="objectif">
      <div class="obj-lbl">Objectif</div>
      <div class="obj-txt">${sem.objectif}</div>
    </div>
    <div class="sessions-wrap ${denseClass}">${seances.map(s => sessionCard(s)).join('')}</div>
    <div class="conseil">
      <div class="conseil-lbl">Conseil de la semaine</div>
      <div class="conseil-txt">${fillText(sem.conseil, [], vma)}</div>
    </div>
    <div class="pnum">${gradText(String(sem.num + 4), { sizePt: 14, weight: 800, width: 40, align: 'end' })}</div>
  </div>`
}

// Zones d'allure : %, nom, description, couleur — calculées depuis la VMA au rendu.
const ZONE_DEFS = [
  { pct:65,        name:'Endurance Fondamentale', desc:'Allure conversation · footing EF · 80% du volume total', c:'#06B6D4', rgb:'6,182,212' },
  { pct:75,        name:'Endurance Active',        desc:'Confortable mais soutenu · phrases courtes', c:'#10B981', rgb:'16,185,129' },
  { pct:85,        name:'Seuil Anaérobie',         desc:'Difficile mais tenable 20-40 min · Tempo', c:'#F59E0B', rgb:'245,158,11' },
  { pct:OBJ_PCT,   name:'Allure objectif 10km',    desc:'Ta cible le jour de la course · à mémoriser', c:'#FBBF24', rgb:'251,191,36', obj:true },
  { pct:95,        name:'VMA 95%',                 desc:'Très difficile · répétitions courtes · fractionnés', c:'#F97316', rgb:'249,115,22' },
  { pct:100,       name:'VMA Max',                 desc:'Effort maximal · côtes et 300 mètres', c:'#EF4444', rgb:'239,68,68' },
]

function buildZones(vma) {
  return ZONE_DEFS.map(z => ({
    ...z,
    pctLabel: `${z.pct}%`,
    pace: formatPace(vma, z.pct),
    speed: formatSpeed(vma, z.pct),
  }))
}

// Paliers de niveau, déterminés par la VMA : la structure des séances de qualité
// (volume, % VMA) diffère par palier, pas seulement l'allure littérale.
function vmaTier(vma) {
  if (vma <= 13.5) return 'd'  // Débutant : 10 à 13.5
  if (vma <= 18.5) return 'i'  // Intermédiaire : 14 à 18.5
  return 'a'                  // Avancé : 19 à 24
}

function renderHtml({ vma, seances }) {
  const tier = vmaTier(vma)
  const SEMAINES = require(`../ebook-data/10km-8sem/semaines-${seances}-${tier}.js`)
  const ZONES = buildZones(vma)
  const objPace = formatObjPace(vma, { suffix: false })

  const HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>

<!-- P.1 COUVERTURE -->
<div class="cover-page">
  <div class="cover-wm">10</div>
  <div class="cover-deco-tr">${SVG_COVER_CIRCLES}</div>
  <div class="cover-deco-bl">${SVG_COVER_LINES}</div>
  <div class="cover-deco-br">${SVG_COVER_DOTS}</div>
  <div class="cover-inner">
    ${logoB64 ? `<img src="${logoB64}" class="cover-logo"/>` : ''}
    <div class="cover-sep"></div>
    <div class="cover-eyebrow">Plan d'entraînement personnalisé</div>
    <div class="cover-title">10 KM</div>
    <div class="cover-subtitle">8 semaines · ${seances} séances/semaine · VMA ${vma} km/h</div>
    <div class="cover-academy">The Ultimate Academy</div>
  </div>
</div>

<!-- P.2 SOMMAIRE -->
<div class="page">
  ${blobs('A')}
  <div class="page-title">${gradText('Sommaire', { sizePt: 27 })}</div>
  <div class="som-track">${SVG_TRACK}</div>
  <div class="som-flat">
    <div class="som-glbl">Introduction</div>
    ${[['01','Tes allures personnalisées','3'],['02','Les principes du plan','4']].map(([n,l,p])=>
      `<div class="som-item"><span class="som-label">${l}</span><span class="som-dots"></span><span class="som-page">p.${p}</span></div>`
    ).join('')}
    <div class="som-glbl">Programme semaine par semaine</div>
    ${[['03','Semaine 1 · Adaptation','5'],['04','Semaine 2 · Adaptation','6'],['05','Semaine 3 · Développement','7'],['06','Semaine 4 · Développement','8'],['07','Semaine 5 · Intensification','9'],['08','Semaine 6 · Intensification','10'],['09','Semaine 7 · Affûtage','11'],['10','Semaine 8 · Semaine de course','12']].map(([n,l,p])=>
      `<div class="som-item"><span class="som-label">${l}</span><span class="som-dots"></span><span class="som-page">p.${p}</span></div>`
    ).join('')}
    <div class="som-glbl">Course &amp; après</div>
    ${[['11','Stratégie de course','13'],['12','Nutrition avant et après','14'],['13','Coaching personnalisé','15']].map(([n,l,p])=>
      `<div class="som-item"><span class="som-label">${l}</span><span class="som-dots"></span><span class="som-page">p.${p}</span></div>`
    ).join('')}
  </div>
  <div class="pnum">${gradText('2', { sizePt: 14, weight: 800, width: 40, align: 'end' })}</div>
</div>

<!-- P.3 ALLURES -->
<div class="page">
  ${blobs('B')}
  <div class="page-title">${gradText('Tes allures personnalisées', { sizePt: 27 })}</div>
  <p class="page-intro">
    Calculées pour ta VMA de <strong style="color:#C084FC">${vma} km/h</strong> et utilisées tout au long de ce plan.
    Si ta VMA évolue, refais le test sur <strong style="color:#C084FC">theultimateacademy.fr/calculateur/vma</strong> pour rester à jour.
  </p>
  ${SVG_HEARTBEAT}
  <div style="flex-shrink:0;text-align:center;font-size:7.5pt;font-weight:700;color:#FBBF24;text-transform:uppercase;letter-spacing:.09em">
    Ton allure objectif course (10km) : ${objPace}/km
  </div>
  <div class="zones-wrap">
    ${ZONES.map(z=>`
    <div class="zone-card" style="border-left:3px solid ${z.c};background:rgba(${z.rgb},${z.obj ? '.16' : '.08'});">
      <div class="zone-pct" style="color:${z.c}">${z.pctLabel}</div>
      <div class="zone-info">
        <div class="zone-name">${z.name}</div>
        <div class="zone-desc">${z.desc}</div>
      </div>
      <div>
        <div class="zone-pace" style="color:${z.c}">${z.pace}</div>
        <div class="zone-speed">${z.speed}</div>
      </div>
    </div>`).join('')}
  </div>
  <div class="pnum">${gradText('3', { sizePt: 14, weight: 800, width: 40, align: 'end' })}</div>
</div>

<!-- P.4 PRINCIPES -->
<div class="page">
  ${blobs('A')}
  <div class="page-title">${gradText('Les principes du plan', { sizePt: 27 })}</div>
  <p class="page-intro">Les règles qui font la différence entre progresser et stagner sur 8 semaines.</p>
  <div class="principes-wrap">
    ${[
      ['01','La règle 80/20','80% du volume en Endurance Fondamentale, 20% à haute intensité. C\'est la répartition des coureurs d\'élite mondiaux. Elle permet de progresser vite sans surentraînement.'],
      ['02','L\'échauffement, 25 min, toujours','25 minutes de footing EF avant chaque séance intense, sans exception. L\'échauffement prépare les muscles, les tendons et le cœur. Si tu manques de temps, raccourcis la séance, jamais l\'échauffement.'],
      ['03','Le retour au calme, 10 min, toujours','10 minutes de jogging léger après chaque séance intense. Accélère l\'élimination des déchets métaboliques et prépare le corps pour la séance suivante. Sur 8 semaines, l\'effet cumulé est significatif.'],
      ['04','La progressivité, la règle des 10%','Le volume augmente de 10% maximum par semaine. Augmenter trop vite est la première cause de blessure : périostite, tendinite, syndrome rotulien. Respecte le plan même si tu te sens bien.'],
      ['05','Le renforcement musculaire',seances===5 ? '1 séance par semaine, directement planifiée dans ton programme puisque tu as choisi 5 séances/semaine. Protège les genoux, les hanches et les chevilles, les zones les plus exposées du coureur.' : '1 séance de 20 min par semaine, à ajouter de ton côté en plus des '+seances+' séances de course à pied de ce plan : gainage, fentes, squats, montées de mollets. Protège les genoux, les hanches et les chevilles.'],
    ].map(([n,t,d])=>`
    <div class="principe">
      <div class="p-num">${gradText(n, { sizePt: 15, weight: 800, width: 30, align: 'start' })}</div>
      <div><div class="p-t">${t}</div><div class="p-d">${d}</div></div>
    </div>`).join('')}
  </div>
  <div class="pnum">${gradText('4', { sizePt: 14, weight: 800, width: 40, align: 'end' })}</div>
</div>

<!-- SEMAINES 1-8 -->
${SEMAINES.map(s => weekPage(s, vma)).join('')}

<!-- P.13 STRATÉGIE -->
<div class="page">
  ${blobs('A')}
  <div class="page-title">${gradText('Stratégie de course', { sizePt: 27 })}</div>
  <p class="page-intro">La majorité des coureurs ratent leur 10km sur les 2 premiers kilomètres. Cette stratégie en 4 phases fonctionne à tous les niveaux.</p>
  ${SVG_HEARTBEAT}
  <div class="strats-wrap">
    ${[
      ['KM 1-2',`${objPace}/km`,'Patience et retenue',`Pars exactement à ton allure objectif ${objPace}/km, ne pars surtout pas plus vite. L\'adrénaline du départ va te pousser à accélérer, résiste. Partir trop vite peut te coûter 30 à 60 secondes sur les 3 derniers kilomètres.`],
      ['KM 3-8',`${objPace}/km`,'Régularité absolue',`Utilise ta montre GPS pour rester sur ${objPace}/km. Un 10km régulier est toujours plus rapide qu\'un 10km en yoyo. Foulée, respiration, posture.`],
      ['KM 9','Si réserves','Évaluation et décision','Fais un bilan honnête. Si tu as des réserves, accélère progressivement sous ton allure objectif. Si tu souffres, maintiens l\'allure, ne t\'engage pas dans une accélération que tu ne pourras pas tenir.'],
      ['KM 10','Tout ce qui reste','Donner absolument tout','Donne tout. La douleur est temporaire, le chrono est permanent. Raccourcis ta foulée, augmente ta cadence. Tout ce que tu as conservé, c\'est maintenant.'],
    ].map(([km,allure,titre,desc])=>`
    <div class="strat">
      <div class="strat-km"><div class="strat-km-l">${km}</div><div class="strat-km-a">${allure}</div></div>
      <div class="strat-c"><div class="strat-t">${titre}</div><div class="strat-d">${desc}</div></div>
    </div>`).join('')}
  </div>
  <div style="flex-shrink:0;padding:8px 0 8px 11px;border-left:2px solid rgba(139,47,201,.4);font-size:9.5pt;color:rgba(255,255,255,.75);line-height:1.5">
    <strong style="color:#C084FC">Hydratation :</strong> Eau au km 5. Pas de gel sauf si ta course dure plus d'une heure et que tu en as l'habitude. Ne jamais tester quelque chose de nouveau le jour J.
  </div>
  <div class="pnum">${gradText('13', { sizePt: 14, weight: 800, width: 40, align: 'end' })}</div>
</div>

<!-- P.14 NUTRITION -->
<div class="page">
  ${blobs('B')}
  <div class="page-title">${gradText('Nutrition de course', { sizePt: 27 })}</div>
  <p class="page-intro">Ce que tu mets dans l'assiette peut faire gagner ou perdre plusieurs minutes. Les 48h avant le départ sont cruciales.</p>
  <div class="nut-cards-wrap">
    <div class="nut-card" style="border-left:3px solid rgba(168,85,247,.7);background:rgba(168,85,247,.07)">
      <div class="nut-head">
        <div class="nut-icon" style="background:rgba(168,85,247,.2)">${SVG_NUT_MOON}</div>
        <div>
          <div class="nut-title">La veille de la course</div>
          <div class="nut-timing">J-1 · Charge en glycogène</div>
        </div>
      </div>
      <div class="nut-items">
        ${[['Dîner glucides','Pâtes, riz, pain complet, constitue tes réserves de glycogène.'],['Aliments à éviter','Légumineuses, crudités, fibres en excès, risque digestif.'],['Règle d\'or','Aucun nouvel aliment. Reste sur ce que ton corps connaît.'],['Hydratation','1,5 à 2 litres d\'eau dans la journée.']].map(([k,v])=>`
        <div class="nut-item">
          <div class="nut-dot" style="background:#A855F7"></div>
          <div class="nut-text"><span class="nut-key">${k}</span> ${v}</div>
        </div>`).join('')}
      </div>
    </div>
    <div class="nut-card" style="border-left:3px solid rgba(245,158,11,.7);background:rgba(245,158,11,.07)">
      <div class="nut-head">
        <div class="nut-icon" style="background:rgba(245,158,11,.2)">${SVG_NUT_SUN}</div>
        <div>
          <div class="nut-title">Le matin de la course</div>
          <div class="nut-timing">Jour J · Dernier repas 2h30-3h avant</div>
        </div>
      </div>
      <div class="nut-items">
        ${[['Que manger','Pain blanc + confiture ou miel, banane, flocons d\'avoine.'],['Café','Si tu en as l\'habitude, oui. Jamais d\'essai le jour J.'],['Hydratation','500 ml d\'eau jusqu\'au départ. Arrête 30 min avant.'],['Timing','Dernier repas obligatoirement 2h30-3h avant le départ.']].map(([k,v])=>`
        <div class="nut-item">
          <div class="nut-dot" style="background:#F59E0B"></div>
          <div class="nut-text"><span class="nut-key">${k}</span> ${v}</div>
        </div>`).join('')}
      </div>
    </div>
    <div class="nut-card" style="border-left:3px solid rgba(34,197,94,.7);background:rgba(34,197,94,.07)">
      <div class="nut-head">
        <div class="nut-icon" style="background:rgba(34,197,94,.2)">${SVG_NUT_BOLT}</div>
        <div>
          <div class="nut-title">Après la course</div>
          <div class="nut-timing">Récupération · Fenêtre anabolique 30 min</div>
        </div>
      </div>
      <div class="nut-items">
        ${[['30 min','Banane ou barre de céréales + eau ou boisson isotonique.'],['2 heures','Repas complet protéines + glucides — poulet-riz, omelette-pain.'],['Alcool','Évite les 24h suivantes — ralentit significativement la récupération.'],['Hydratation','Continue à boire toute la journée. La déshydratation persiste.']].map(([k,v])=>`
        <div class="nut-item">
          <div class="nut-dot" style="background:#22C55E"></div>
          <div class="nut-text"><span class="nut-key">${k}</span> ${v}</div>
        </div>`).join('')}
      </div>
    </div>
  </div>
  <div class="pnum">${gradText('14', { sizePt: 14, weight: 800, width: 40, align: 'end' })}</div>
</div>

<!-- P.15 COACHING -->
<div class="page page-fin">
  ${blobs('A')}
  <div class="fin-hero">
    ${SVG_FIN_TROPHY}
    <div class="fin-eyebrow" style="margin-top:8px">The Ultimate Academy</div>
    <div class="fin-title">${gradText('Passe à la vitesse supérieure', { sizePt: 22 })}</div>
    <div class="fin-sub">Ton prochain plan, conçu sur mesure pour toi chaque semaine.</div>
  </div>
  <div class="fin-grid">
    ${[
      { n:'01', t:'Plan personnalisé', bar:'#8B2FC9', tag:'100% sur mesure',
        d:'Généré selon ta VMA réelle, ton objectif précis et ta disponibilité. Chaque semaine est unique — pas un plan générique copié-collé.',
        icon:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20"><circle cx="10" cy="10" r="8" fill="none" stroke="white" stroke-width="2"/><path d="M7 10 L9 12 L13 8" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
      { n:'02', t:'Suivi chaque semaine', bar:'#E8237A', tag:'Bilan hebdo',
        d:'Un bilan personnalisé chaque semaine. Tu signales de la fatigue — le plan s\'allège. Tu progresses vite — il accélère. Jamais de stagnation.',
        icon:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20"><rect x="3" y="3" width="14" height="14" rx="2" fill="none" stroke="white" stroke-width="2"/><line x1="7" y1="10" x2="13" y2="10" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="10" y1="7" x2="10" y2="13" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>` },
      { n:'03', t:'Analyses de course', bar:'#A855F7', tag:'Avant & après',
        d:'Analyse pré-course J-7 pour finaliser ta stratégie. Analyse post-course pour comprendre tes résultats et identifier les axes de progression.',
        icon:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20"><polyline points="3,15 7,9 11,12 17,5" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17" cy="5" r="2" fill="white"/></svg>` },
      { n:'04', t:'Coach disponible', bar:'#E8237A', tag:'Alexis répond',
        d:'Alexis répond à tes questions directement dans l\'application. Conseil rapide, personnalisé, disponible quand tu en as besoin.',
        icon:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20"><path d="M4 13 Q4 4 10 4 Q16 4 16 9 Q16 14 10 14 L7 17 Z" fill="none" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>` },
    ].map(({n,t,bar,tag,d,icon})=>`
    <div class="fin-feat">
      <div class="fin-feat-header">
        <div class="fin-icon">${icon}</div>
        <div class="fin-feat-num">${n}</div>
      </div>
      <div class="fin-feat-title">${t}</div>
      <div class="fin-feat-bar" style="background:${bar}"></div>
      <div class="fin-feat-desc">${d}</div>
    </div>`).join('')}
  </div>
  <div class="fin-cta">
    <div class="fin-cta-title">14 jours d'essai gratuit — sans engagement</div>
    <div class="fin-cta-sub">Rejoins les athlètes qui progressent chaque semaine avec un plan personnalisé.</div>
  </div>
  <div class="fin-url">
    ${gradText('theultimateacademy.fr', { sizePt: 12, weight: 800 })}
  </div>
  <div class="pnum">${gradText('15', { sizePt: 14, weight: 800, width: 40, align: 'end' })}</div>
</div>

</body></html>`

  return HTML
}

module.exports = { renderHtml }
