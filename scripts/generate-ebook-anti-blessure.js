#!/usr/bin/env node
// Génère public/ebooks/anti-blessure/guide-antiblessure.pdf — v6
// RÈGLE FONDAMENTALE : chaque .page = 210mm × 297mm, overflow:hidden
// Tous les gaps, paddings et font-sizes sont calibrés pour tenir dans la page.
const puppeteer = require('puppeteer')
const fs  = require('fs')
const path = require('path')

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

function gradText(text, { sizePt, weight=800, width=670, height, align='center' }={}) {
  const fs = ptToPx(sizePt)
  const h  = height || Math.ceil(fs * 1.35)
  const gid = `gt${gidSeq++}`
  const x = align==='center'? width/2 : align==='start'? 0 : width
  const anchor = align==='center'?'middle': align==='start'?'start':'end'
  const y = Math.round(h * 0.78)
  return `<svg viewBox="0 0 ${width} ${h}" width="${width}" height="${h}" style="display:block;margin:0 auto;overflow:visible;max-width:100%;flex-shrink:0">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#8B2FC9"/><stop offset="100%" stop-color="#E8237A"/>
    </linearGradient></defs>
    <text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Poppins" font-weight="${weight}" font-size="${fs}" fill="url(#${gid})">${escXml(text)}</text>
  </svg>`
}

function gradNum(n) {
  const gid = `gn${gidSeq++}`
  return `<svg viewBox="0 0 40 34" width="40" height="34" style="display:block;flex-shrink:0">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#8B2FC9"/><stop offset="100%" stop-color="#E8237A"/>
    </linearGradient></defs>
    <text x="20" y="26" text-anchor="middle" font-family="Poppins" font-weight="900" font-size="22" fill="url(#${gid})" opacity="0.85">${n}</text>
  </svg>`
}

function hl(t) {
  return `<span style="background:linear-gradient(135deg,#8B2FC9,#E8237A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-weight:700">${t}</span>`
}

function svgTitleDeco() {
  const id1=`td${gidSeq++}`, id2=`td${gidSeq++}`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 16" width="100%" height="16" style="display:block;flex-shrink:0">
    <defs>
      <linearGradient id="${id1}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#8B2FC9" stop-opacity="0"/>
        <stop offset="40%" stop-color="#8B2FC9"/>
        <stop offset="60%" stop-color="#E8237A"/>
        <stop offset="100%" stop-color="#E8237A" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <line x1="0" y1="5" x2="500" y2="5" stroke="url(#${id1})" stroke-width="2" stroke-linecap="round"/>
    <circle cx="250" cy="5" r="3.5" fill="#E8237A" opacity="0.7"/>
    <circle cx="130" cy="5" r="1.8" fill="#8B2FC9" opacity="0.5"/>
    <circle cx="370" cy="5" r="1.8" fill="#8B2FC9" opacity="0.5"/>
  </svg>`
}

function svgWave() {
  const id=`wv${gidSeq++}`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 14" width="100%" height="14" style="display:block;flex-shrink:0">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8B2FC9" stop-opacity="0"/>
      <stop offset="20%" stop-color="#8B2FC9"/>
      <stop offset="80%" stop-color="#E8237A"/>
      <stop offset="100%" stop-color="#E8237A" stop-opacity="0"/>
    </linearGradient></defs>
    <path d="M0,8 Q125,2 250,8 Q375,14 500,8" fill="none" stroke="url(#${id})" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`
}

function svgDiamond() {
  const id=`dm${gidSeq++}`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 12" width="80" height="12" style="display:block;margin:2px auto;flex-shrink:0">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8B2FC9" stop-opacity="0.4"/>
      <stop offset="50%" stop-color="#E8237A"/>
      <stop offset="100%" stop-color="#8B2FC9" stop-opacity="0.4"/>
    </linearGradient></defs>
    <line x1="0" y1="6" x2="28" y2="6" stroke="url(#${id})" stroke-width="1.5" stroke-linecap="round"/>
    <polygon points="40,1 46,6 40,11 34,6" fill="url(#${id})"/>
    <line x1="52" y1="6" x2="80" y2="6" stroke="url(#${id})" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`
}

function pageNum(n) {
  const id=`pn${gidSeq++}`, id2=`pn${gidSeq++}`
  return `<div class="pnum">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20" width="40" height="20">
      <defs>
        <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#8B2FC9" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="#E8237A" stop-opacity="0.2"/>
        </linearGradient>
        <linearGradient id="${id2}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#C084FC"/><stop offset="100%" stop-color="#F472B6"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="40" height="20" rx="10" fill="url(#${id})" stroke="rgba(139,47,201,0.5)" stroke-width="1"/>
      <text x="20" y="14" text-anchor="middle" font-family="Poppins" font-weight="800" font-size="10" fill="url(#${id2})">${n}</text>
    </svg>
  </div>`
}

function blobs(v='A') {
  return v==='A'
    ? '<div class="blob-tr"></div><div class="blob-bl"></div>'
    : '<div class="blob-tl"></div><div class="blob-br"></div>'
}

function exoPicto(emoji, zoneColor) {
  return `<div style="width:70px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;background:rgba(255,255,255,.02);border-right:1px solid rgba(255,255,255,.06);padding:6px 4px">
    <div style="font-size:26px;line-height:1">${emoji}</div>
    <div style="width:24px;height:2px;border-radius:2px;background:${zoneColor}"></div>
  </div>`
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
// Toutes les tailles en pt. Corps: 8.5pt. Titres section: 9.5pt. PageTitle via gradText.
// paddings réduits au strict minimum pour que tout tienne.
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
@page { size: A4; margin: 0; }
html, body { margin: 0; padding: 0; background: #0C0A18; overflow: hidden; width: 210mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Poppins', sans-serif; color: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 8.5pt; line-height: 1.55; }

/* ── page ── */
.page {
  width: 210mm; height: 297mm;
  overflow: hidden;
  padding: 9mm 12mm 14mm;
  background: #0C0A18;
  page-break-after: always; break-after: page;
  position: relative;
  display: flex; flex-direction: column; gap: 7px;
}
.blob-tr,.blob-bl,.blob-tl,.blob-br { position:absolute;border-radius:50%;pointer-events:none;z-index:0; }
.blob-tr{top:-80px;right:-70px;width:260px;height:260px;background:radial-gradient(ellipse,rgba(139,47,201,.2) 0%,transparent 65%);}
.blob-bl{bottom:-70px;left:-60px;width:220px;height:220px;background:radial-gradient(ellipse,rgba(232,35,122,.14) 0%,transparent 65%);}
.blob-tl{top:-60px;left:-60px;width:220px;height:220px;background:radial-gradient(ellipse,rgba(139,47,201,.2) 0%,transparent 65%);}
.blob-br{bottom:-60px;right:-50px;width:200px;height:200px;background:radial-gradient(ellipse,rgba(232,35,122,.14) 0%,transparent 65%);}
.page > *:not([class^="blob"]):not(.pnum) { position:relative;z-index:1; }
.pnum { position:absolute;bottom:8mm;right:12mm;z-index:10; }

/* ── couverture ── */
.cover-page { width:210mm;height:297mm;overflow:hidden;background:#0C0A18;page-break-after:always;break-after:page;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center; }
.cover-wm { position:absolute;font-size:180pt;font-weight:800;line-height:1;background:linear-gradient(135deg,#8B2FC9,#E8237A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;opacity:.03;pointer-events:none;top:50%;left:50%;transform:translate(-50%,-50%); }
.cover-deco-tr{position:absolute;top:12mm;right:10mm;opacity:.6;}
.cover-deco-bl{position:absolute;bottom:28mm;left:8mm;opacity:.7;}
.cover-inner{display:flex;flex-direction:column;align-items:center;position:relative;z-index:1;padding:0 12mm;gap:0;}
.cover-logo{width:100px;opacity:.95;margin-bottom:14px;}
.cover-sep{width:50px;height:2px;background:linear-gradient(90deg,#8B2FC9,#E8237A);border-radius:1px;margin:14px auto;}
.cover-eyebrow{font-size:8.5pt;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.35);}
.cover-subtitle{font-size:12pt;font-weight:600;color:rgba(255,255,255,.7);letter-spacing:.03em;margin-top:8px;line-height:1.45;}
.cover-tags{display:flex;gap:7px;flex-wrap:wrap;justify-content:center;margin-top:14px;}
.cover-tag{font-size:8.5pt;font-weight:700;border-radius:18px;padding:4px 11px;border:1px solid;}
.cover-academy{font-size:8.5pt;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.22);margin-top:24px;}

/* ── sommaire ── */
.som-label{font-size:9.5pt;font-weight:500;color:rgba(255,255,255,.85);flex-shrink:0;}
.som-dots{flex:1;border-bottom:1px dotted rgba(255,255,255,.15);margin:0 10px;align-self:flex-end;margin-bottom:3px;}
.som-page{font-size:9.5pt;font-weight:800;flex-shrink:0;color:#C084FC;width:38px;}

/* ── titres de page ── */
.page-tag{display:inline-block;font-size:8pt;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.35);margin-bottom:3px;}
.page-intro{font-size:8.5pt;color:rgba(255,255,255,.72);line-height:1.6;text-align:justify;flex-shrink:0;}

/* ── blessures ── */
.blessure-grid{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:7px;min-height:0;}
.blessure-card{border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:3px;border:1px solid;overflow:hidden;min-height:0;}
.bl-header{display:flex;align-items:center;gap:7px;flex-shrink:0;}
.bl-icon{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;}
.bl-title{font-size:8.5pt;font-weight:800;line-height:1.2;}
.bl-subtitle{font-size:7.5pt;color:rgba(255,255,255,.42);line-height:1.2;}
.bl-sep{height:1px;background:rgba(255,255,255,.06);flex-shrink:0;}
.bl-section-title{font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:.07em;margin-bottom:1px;}
.bl-text{font-size:8pt;color:rgba(255,255,255,.78);line-height:1.5;text-align:justify;}
.bl-tag{display:inline-flex;align-items:center;font-size:7pt;font-weight:700;border-radius:8px;padding:2px 7px;margin-top:3px;flex-shrink:0;align-self:flex-start;}

/* ── exercices ── */
.exo-list{flex:1;display:flex;flex-direction:column;gap:6px;min-height:0;}
.exo-row{flex:1;display:flex;gap:0;align-items:stretch;border-radius:10px;overflow:hidden;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);}
.exo-content{flex:1;padding:7px 11px;display:flex;flex-direction:column;gap:3px;}
.exo-header{display:flex;align-items:center;gap:7px;flex-shrink:0;}
.exo-title{font-size:9pt;font-weight:800;line-height:1.2;}
.exo-muscle{font-size:7.5pt;color:rgba(255,255,255,.42);}
.exo-sep{height:1px;background:rgba(255,255,255,.06);flex-shrink:0;}
.exo-body{display:flex;gap:8px;align-items:flex-start;flex:1;}
.exo-dose-chip{font-size:7.5pt;font-weight:700;border-radius:7px;padding:2px 8px;flex-shrink:0;white-space:nowrap;align-self:flex-start;}
.exo-desc{font-size:8pt;color:rgba(255,255,255,.75);line-height:1.5;text-align:justify;}
.exo-tip{font-size:7.5pt;color:rgba(255,255,255,.38);font-style:italic;margin-top:2px;}

/* ── étirements ── */
.etir-grid{flex:1;display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;min-height:0;}
.etir-card{border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:3px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);overflow:hidden;}
.etir-header{display:flex;align-items:center;gap:8px;flex-shrink:0;}
.etir-icon{font-size:20px;flex-shrink:0;}
.etir-title-block{display:flex;flex-direction:column;gap:1px;}
.etir-title{font-size:8.5pt;font-weight:800;line-height:1.2;}
.etir-muscle{font-size:7.5pt;color:rgba(255,255,255,.4);}
.etir-dose{font-size:7.5pt;font-weight:700;color:#C084FC;flex-shrink:0;}
.etir-sep{height:1px;background:rgba(255,255,255,.06);flex-shrink:0;}
.etir-desc{font-size:7.5pt;color:rgba(255,255,255,.72);line-height:1.5;text-align:justify;}
.etir-coach{margin-top:3px;padding:4px 7px;border-radius:6px;background:rgba(255,255,255,.03);border-left:2px solid rgba(192,132,252,.4);}
.etir-coach-label{font-size:7pt;color:#C084FC;font-weight:700;margin-bottom:1px;}
.etir-coach-text{font-size:7pt;color:rgba(255,255,255,.5);font-style:italic;line-height:1.45;}

/* ── charge ── */
.charge-row{display:flex;align-items:center;gap:10px;}
.charge-label{font-size:8pt;font-weight:600;width:130px;flex-shrink:0;line-height:1.3;}
.charge-bar-wrap{flex:1;height:13px;background:rgba(255,255,255,.06);border-radius:7px;overflow:hidden;}
.charge-bar{height:100%;border-radius:7px;}
.charge-val{font-size:8pt;font-weight:800;width:36px;text-align:right;flex-shrink:0;}
.charge-note{font-size:7.5pt;color:rgba(255,255,255,.4);width:175px;text-align:right;flex-shrink:0;}

/* ── PEACE & LOVE ── */
.peace-grid{flex:1;display:flex;flex-direction:column;gap:5px;min-height:0;}
.peace-row{flex:1;display:flex;align-items:stretch;border-radius:10px;overflow:hidden;}
.peace-letter-block{width:44px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.15);}
.peace-letter{font-size:20pt;font-weight:900;line-height:1;}
.peace-divider{width:1px;flex-shrink:0;}
.peace-body{flex:1;padding:5px 11px;display:flex;flex-direction:column;justify-content:center;gap:1px;}
.peace-title{font-size:8.5pt;font-weight:800;line-height:1.2;}
.peace-desc{font-size:8pt;color:rgba(255,255,255,.72);line-height:1.5;text-align:justify;}

/* ── chaussures ── */
.shoe-cards{flex:1;display:flex;flex-direction:column;gap:8px;min-height:0;}
.shoe-card{flex:1;border-radius:10px;padding:8px 13px;display:flex;gap:11px;align-items:center;border:1px solid;overflow:hidden;}
.shoe-icon{font-size:24px;flex-shrink:0;}
.shoe-title{font-size:9pt;font-weight:800;margin-bottom:2px;line-height:1.2;}
.shoe-desc{font-size:8pt;color:rgba(255,255,255,.75);line-height:1.5;text-align:justify;}
`

// ─── Données ─────────────────────────────────────────────────────────────────
const BLESSURES_P1 = [
  {
    icon:'🦴', color:'#06B6D4', bg:'rgba(6,182,212,.08)', border:'rgba(6,182,212,.22)',
    title:'Périostite tibiale', sub:'Syndrome de stress du tibia',
    symptomes:'Douleur diffuse le long du tibia, aggravée à l\'effort et au début de séance.',
    prevention:'Progression de 10% max/semaine. '+hl('Renforcement du tibialis')+' et du mollet. Varier les surfaces.',
    soins:'Repos relatif 2 sem., glace 15 min × 3/j. Reprise progressive sur surfaces souples.',
    tag:'Débutants', tagColor:'rgba(6,182,212,.18)', tagBorder:'rgba(6,182,212,.4)',
  },
  {
    icon:'🦵', color:'#F97316', bg:'rgba(249,115,22,.08)', border:'rgba(249,115,22,.22)',
    title:'Tendinite d\'Achille', sub:'Tendinopathie calcanéenne',
    symptomes:'Raideur matinale au talon, douleur à la palpation, gonflement possible.',
    prevention:hl('Montées excentriques')+' sur marche (protocole Alfredson). Échauffement 15 min.',
    soins:'Repos 2 à 4 sem., massage transverse profond, kinésithérapie précoce.',
    tag:'Coureurs confirmés', tagColor:'rgba(249,115,22,.18)', tagBorder:'rgba(249,115,22,.4)',
  },
  {
    icon:'🔩', color:'#A855F7', bg:'rgba(168,85,247,.08)', border:'rgba(168,85,247,.22)',
    title:'Syndrome de l\'essuie-glace', sub:'Bandelette ilio-tibiale (BIT)',
    symptomes:'Douleur vive face externe du genou après 20 à 30 min d\'effort continu.',
    prevention:hl('Renforcement des fessiers')+' et abducteurs. Foam roller BIT. Cadence 175+ pas/min.',
    soins:'Arrêt dès la douleur. AINS si besoin. Kiné pour bilan biomécanique.',
    tag:'Longue distance', tagColor:'rgba(168,85,247,.18)', tagBorder:'rgba(168,85,247,.4)',
  },
  {
    icon:'🦶', color:'#22C55E', bg:'rgba(34,197,94,.08)', border:'rgba(34,197,94,.22)',
    title:'Fasciite plantaire', sub:'Aponévrosite plantaire',
    symptomes:'Douleur intense sous le pied au lever du lit, talon et voûte plantaire.',
    prevention:hl('Renforcement intrinsèque du pied')+', semelles si besoin, étirements du mollet.',
    soins:'Étirements fascia + mollet, botte de nuit, ondes de choc si chronique.',
    tag:'Route et piste', tagColor:'rgba(34,197,94,.18)', tagBorder:'rgba(34,197,94,.4)',
  },
]

const BLESSURES_P2 = [
  {
    icon:'💥', color:'#EF4444', bg:'rgba(239,68,68,.08)', border:'rgba(239,68,68,.22)',
    title:'Claquage musculaire', sub:'Déchirure de fibre ou de faisceau',
    symptomes:'Douleur brutale type "coup de couteau", contracture immédiate, hématome possible.',
    prevention:hl('Échauffement 15 min')+' minimum. Hydratation optimale, récupération respectée.',
    soins:'Arrêt immédiat. Protocole PEACE & LOVE (p.10). Pas de chaleur les 72 premières heures.',
    tag:'Séances intenses', tagColor:'rgba(239,68,68,.18)', tagBorder:'rgba(239,68,68,.4)',
  },
  {
    icon:'🦿', color:'#EAB308', bg:'rgba(234,179,8,.08)', border:'rgba(234,179,8,.22)',
    title:'Syndrome fémoro-patellaire', sub:'Genou du coureur',
    symptomes:'Douleur sous ou autour de la rotule, aggravée en descente et assis prolongé.',
    prevention:hl('Squats et fentes unilatéraux')+'. Travail de la hanche. Réduction du volume.',
    soins:'Repos relatif, glace, kiné pour rééquilibrage. Taping rotulien si besoin.',
    tag:'Tous niveaux', tagColor:'rgba(234,179,8,.18)', tagBorder:'rgba(234,179,8,.4)',
  },
  {
    icon:'🦷', color:'#3B82F6', bg:'rgba(59,130,246,.08)', border:'rgba(59,130,246,.22)',
    title:'Fracture de stress', sub:'Ostéopathie de contrainte',
    symptomes:'Douleur localisée précise sur le tibia ou métatarses, aggravée à la percussion.',
    prevention:hl('Apports calciques et vitamine D')+'. Augmentation de volume très progressive.',
    soins:'Arrêt complet 6 à 12 sem. IRM ou scintigraphie indispensable. Reprise médicale.',
    tag:'Kilométrage élevé', tagColor:'rgba(59,130,246,.18)', tagBorder:'rgba(59,130,246,.4)',
  },
  {
    icon:'🌀', color:'#10B981', bg:'rgba(16,185,129,.08)', border:'rgba(16,185,129,.22)',
    title:'Tendinopathie de la hanche', sub:'Psoas ou moyen fessier',
    symptomes:'Douleur profonde à l\'aine ou face latérale hanche, en côte ou début de séance.',
    prevention:hl('Gainage et renforcement fessiers')+'. Étirements psoas après chaque séance.',
    soins:'Repos relatif, kiné, exercices excentriques. Infiltration si chronicité > 3 mois.',
    tag:'Trail et côtes', tagColor:'rgba(16,185,129,.18)', tagBorder:'rgba(16,185,129,.4)',
  },
]

const EXERCICES = [
  { num:'01', emoji:'🏋️', zoneColor:'#A855F7', title:'Squat unilatéral',  muscle:'Quadriceps · fessiers · stabilisateurs', dose:'3 × 12 reps', dc:'rgba(139,47,201,.2)', db:'rgba(139,47,201,.45)', desc:'Debout sur une jambe, descends lentement à 90°. Genou dans l\'axe du pied. Remonte en contrôlant.', tip:'Version avancée : squat bulgare pied arrière surélevé' },
  { num:'02', emoji:'🍑', zoneColor:'#E8237A', title:'Hip thrust',         muscle:'Grand fessier · ischio-jambiers',        dose:'3 × 15 reps', dc:'rgba(232,35,122,.2)', db:'rgba(232,35,122,.45)', desc:'Dos sur banc, pieds à plat, pousse le bassin vers le haut. Contraction forte des fessiers. Pause 1 sec.', tip:'Capital pour prévenir toutes les blessures au genou' },
  { num:'03', emoji:'🦶', zoneColor:'#06B6D4', title:'Mollet excentrique', muscle:'Soléaire · gastrocnémien · Achille',     dose:'3 × 15 lentes', dc:'rgba(6,182,212,.2)', db:'rgba(6,182,212,.45)', desc:'Monte sur deux pieds depuis une marche, redescends lentement sur une jambe en 4 secondes.', tip:'Prophylaxie n°1 contre la tendinite d\'Achille' },
  { num:'04', emoji:'🚶', zoneColor:'#F97316', title:'Fente marchée',      muscle:'Quadriceps · fessiers · soléaire',        dose:'3 × 10/côté', dc:'rgba(249,115,22,.2)', db:'rgba(249,115,22,.45)', desc:'Pas en avant, genou avant à 90°, genou arrière effleure le sol. Pousse sur le talon pour remonter.', tip:'Améliore l\'équilibre dynamique du coureur' },
  { num:'05', emoji:'🌉', zoneColor:'#22C55E', title:'Pont fessier',       muscle:'Grand fessier · core · ischios',          dose:'3 × 20 reps', dc:'rgba(34,197,94,.2)', db:'rgba(34,197,94,.45)', desc:'Allongé dos au sol, genoux à 90°, pousse le bassin vers le haut. Tiens 2 sec, redescends lentement.', tip:'Version avancée : une jambe tendue en alternance' },
  { num:'06', emoji:'🐚', zoneColor:'#A855F7', title:'Clam shell',         muscle:'Moyen fessier · abducteurs',              dose:'3 × 20/côté', dc:'rgba(168,85,247,.2)', db:'rgba(168,85,247,.45)', desc:'Allongé sur le côté, hanches à 60°. Ouvre le genou supérieur comme une palourde. Lent et contrôlé.', tip:'Prévient le syndrome de l\'essuie-glace' },
  { num:'07', emoji:'📐', zoneColor:'#EF4444', title:'Planche latérale',   muscle:'Obliques · carré lombaire · abducteurs',  dose:'3 × 30 sec',  dc:'rgba(239,68,68,.2)', db:'rgba(239,68,68,.45)', desc:'Sur l\'avant-bras, corps aligné. Hanches hautes, ne laisse pas la hanche s\'affaisser.', tip:'Progression : levée de la jambe supérieure' },
  { num:'08', emoji:'🦿', zoneColor:'#EAB308', title:'Tibialis raise',     muscle:'Tibial antérieur · extenseurs orteils',   dose:'3 × 20 reps', dc:'rgba(234,179,8,.2)', db:'rgba(234,179,8,.45)', desc:'Dos contre un mur, talons à 30 cm. Lève la pointe des pieds vers le haut, talons au sol. Lent.', tip:'Prévention directe de la périostite tibiale' },
  { num:'09', emoji:'🌉', zoneColor:'#06B6D4', title:'Copenhagen plank',   muscle:'Adducteurs · core · stabilisateurs',      dose:'3 × 20 sec',  dc:'rgba(6,182,212,.2)', db:'rgba(6,182,212,.45)', desc:'Planche latérale, pied supérieur sur banc. Soulève la hanche inférieure en pont. Respire normalement.', tip:'Un des meilleurs exercices de prévention globale' },
  { num:'10', emoji:'🪑', zoneColor:'#E8237A', title:'Chaise au mur',      muscle:'Quadriceps · rotule · isométrique',       dose:'3 × 45 sec',  dc:'rgba(232,35,122,.2)', db:'rgba(232,35,122,.45)', desc:'Dos contre le mur, genoux à 90°. Tiens la position. La brûlure dans les quadriceps est normale.', tip:'Prévient le syndrome fémoro-patellaire' },
]

const ETIREMENTS = [
  {
    emoji:'🦵', color:'rgba(139,47,201,.15)', border:'rgba(139,47,201,.35)',
    title:'Quadriceps', muscle:'Face avant de la cuisse', dose:'30 sec × 3',
    desc:'Debout sur une jambe, saisir le pied derrière, ramener le talon vers la fesse. Genou vers le bas, bassin neutre. Respire lentement.',
    coach:'Essentiel après les séances de fractionné ou de côtes.',
  },
  {
    emoji:'🔗', color:'rgba(6,182,212,.15)', border:'rgba(6,182,212,.35)',
    title:'Ischio-jambiers', muscle:'Face arrière de la cuisse', dose:'30 sec × 3',
    desc:'Assis, jambe tendue, dos droit. Penche le buste vers l\'avant depuis les hanches. Maintiens sans rebond, expire à chaque relâchement.',
    coach:'Ischio souple = moins de claquage et meilleure foulée.',
  },
  {
    emoji:'🦶', color:'rgba(232,35,122,.15)', border:'rgba(232,35,122,.35)',
    title:'Mollet et Achille', muscle:'Gastrocnémien · Achille', dose:'45 sec × 3',
    desc:'Main contre mur, pied arrière à plat, genou tendu. Pousse le talon vers le sol. Faire les 2 versions : genou tendu puis fléchi.',
    coach:'À faire chaque soir, même sans blessure déclarée.',
  },
  {
    emoji:'↔️', color:'rgba(168,85,247,.15)', border:'rgba(168,85,247,.35)',
    title:'Bandelette IT', muscle:'Hanche externe · BIT', dose:'30 sec × 3',
    desc:'Debout, croise la jambe à étirer derrière l\'autre. Penche le buste du côté opposé en appuyant la hanche vers l\'extérieur.',
    coach:'Indispensable dès 3+ séances par semaine.',
  },
  {
    emoji:'🍑', color:'rgba(34,197,94,.15)', border:'rgba(34,197,94,.35)',
    title:'Piriforme', muscle:'Fessier profond · rotateurs', dose:'30 sec × 3',
    desc:'Allongé, cheville sur genou opposé. Tire la cuisse vers la poitrine. Sens l\'étirement dans la fesse. Respire régulièrement.',
    coach:'Cause cachée de nombreuses douleurs de sciatique.',
  },
  {
    emoji:'🦷', color:'rgba(249,115,22,.15)', border:'rgba(249,115,22,.35)',
    title:'Fascia plantaire', muscle:'Voûte plantaire · talon', dose:'60 sec × 2',
    desc:'Assis, tirer les orteils vers le tibia, tenir 30 sec. Masser ensuite la voûte avec une balle de tennis ou de golf.',
    coach:'À faire dès le réveil avant le premier pas au sol.',
  },
]

const PEACE_LOVE = [
  { letter:'P', title:'Protection',                desc:'Limiter les activités douloureuses les 1 à 3 premiers jours. Repos relatif sans immobilisation totale pour éviter d\'aggraver la lésion.' },
  { letter:'E', title:'Élévation',                 desc:'Élever le membre blessé au-dessus du niveau du cœur pour réduire l\'enflure et accélérer le drainage lymphatique.' },
  { letter:'A', title:'Anti-inflammatoires : non', desc:'Dans les 72 premières heures, ils freinent l\'inflammation naturelle essentielle à la cicatrisation. Les éviter sauf prescription médicale.' },
  { letter:'C', title:'Compression',               desc:'Bandage compressif pour limiter l\'œdème et soutenir les tissus. Serré sans couper la circulation : les doigts ne doivent pas bleuir.' },
  { letter:'E', title:'Éducation',                 desc:'Comprendre sa blessure pour mieux la gérer. La douleur est un signal utile. La reprise progressive est supérieure à l\'arrêt total.' },
  { letter:'L', title:'Loading progressif',         desc:'Reprendre la mise en charge dès que possible. Le mouvement contrôlé favorise la guérison et prévient la perte musculaire.' },
  { letter:'O', title:'Optimisme',                 desc:'L\'état d\'esprit positif influence directement la guérison. Les patients optimistes récupèrent plus vite et font moins de rechutes.' },
  { letter:'V', title:'Vascularisation',           desc:'Cardio non douloureux (vélo, natation, marche) pour maintenir le flux sanguin et accélérer la cicatrisation des tissus.' },
  { letter:'E', title:'Exercice ciblé',            desc:'Reprendre les exercices de renforcement spécifiques dès que possible. La rééducation active est supérieure au repos passif prolongé.' },
]

const PEACE_COLORS = [
  { bg:'rgba(6,182,212,.1)',   border:'rgba(6,182,212,.28)',   letter:'#06B6D4' },
  { bg:'rgba(34,197,94,.1)',  border:'rgba(34,197,94,.28)',   letter:'#22C55E' },
  { bg:'rgba(139,47,201,.1)', border:'rgba(139,47,201,.28)',  letter:'#A855F7' },
  { bg:'rgba(249,115,22,.1)', border:'rgba(249,115,22,.28)',  letter:'#F97316' },
  { bg:'rgba(234,179,8,.1)',  border:'rgba(234,179,8,.28)',   letter:'#EAB308' },
  { bg:'rgba(232,35,122,.1)', border:'rgba(232,35,122,.28)',  letter:'#E8237A' },
  { bg:'rgba(168,85,247,.1)', border:'rgba(168,85,247,.28)',  letter:'#A855F7' },
  { bg:'rgba(59,130,246,.1)', border:'rgba(59,130,246,.28)',  letter:'#3B82F6' },
  { bg:'rgba(16,185,129,.1)', border:'rgba(16,185,129,.28)',  letter:'#10B981' },
]

// ─── SVG couverture ───────────────────────────────────────────────────────────
const SVG_COVER_SHIELD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 108" width="100" height="108">
  <defs>
    <linearGradient id="sh-g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8B2FC9" stop-opacity="0.55"/><stop offset="100%" stop-color="#E8237A" stop-opacity="0.38"/></linearGradient>
    <linearGradient id="sh-g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8B2FC9"/><stop offset="100%" stop-color="#E8237A"/></linearGradient>
  </defs>
  <path d="M50 5 L88 20 L88 55 Q88 83 50 98 Q12 83 12 55 L12 20 Z" fill="url(#sh-g1)" stroke="url(#sh-g2)" stroke-width="2"/>
  <path d="M35 54 L46 65 L66 43" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
</svg>`
const SVG_COVER_CIRCLES = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 110" width="110" height="110"><defs><radialGradient id="cv-cg"><stop offset="0%" stop-color="#E8237A" stop-opacity="0.65"/><stop offset="100%" stop-color="#8B2FC9" stop-opacity="0.12"/></radialGradient></defs><circle cx="55" cy="55" r="52" fill="none" stroke="url(#cv-cg)" stroke-width="1.5"/><circle cx="55" cy="55" r="38" fill="none" stroke="url(#cv-cg)" stroke-width="1.5" stroke-dasharray="4,6"/><circle cx="55" cy="55" r="22" fill="none" stroke="url(#cv-cg)" stroke-width="1.5"/><circle cx="55" cy="55" r="8" fill="url(#cv-cg)"/></svg>`

// ─── Pages ────────────────────────────────────────────────────────────────────
function pageCover() {
  return `<div class="cover-page">
    <div class="blob-tr"></div><div class="blob-bl"></div>
    <div class="cover-wm">RUN</div>
    <div class="cover-deco-tr">${SVG_COVER_CIRCLES}</div>
    <div class="cover-deco-bl"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 58 44" width="58" height="44"><defs><radialGradient id="cv-dg"><stop offset="0%" stop-color="#E8237A" stop-opacity="0.65"/><stop offset="100%" stop-color="#8B2FC9" stop-opacity="0.28"/></radialGradient></defs>${[0,1,2,3].map(i=>[0,1,2].map(j=>`<circle cx="${7+i*15}" cy="${7+j*15}" r="1.8" fill="url(#cv-dg)"/>`).join('')).join('')}</svg></div>
    <div class="cover-inner">
      ${logoB64 ? `<img src="${logoB64}" class="cover-logo" alt="Logo"/>` : ''}
      <div class="cover-eyebrow">The Ultimate Academy</div>
      <div class="cover-sep"></div>
      ${SVG_COVER_SHIELD}
      <div style="height:12px"></div>
      ${gradText('GUIDE', { sizePt:64, weight:900 })}
      ${gradText('ANTI-BLESSURE', { sizePt:34, weight:800 })}
      <div class="cover-subtitle">Prévenir, détecter et soigner<br>les blessures du coureur</div>
      <div class="cover-tags">
        <span class="cover-tag" style="background:rgba(6,182,212,.1);color:#67E8F9;border-color:rgba(6,182,212,.4)">🦴 8 Blessures</span>
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
    { label:'Introduction',                              page:'3' },
    { label:'Les 8 blessures du coureur — Partie 1/2',  page:'4' },
    { label:'Les 8 blessures du coureur — Partie 2/2',  page:'5' },
    { label:'Programme de renforcement — Partie 1',     page:'6' },
    { label:'Programme de renforcement — Partie 2',     page:'7' },
    { label:'Étirements essentiels',                    page:'8' },
    { label:'Gestion de la charge d\'entraînement',     page:'9' },
    { label:'Protocole PEACE & LOVE',                   page:'10' },
    { label:'Chaussures et matériel',                   page:'11' },
    { label:'Passer à l\'action',                       page:'12' },
  ]
  return `<div class="page">
    ${blobs('A')}
    <div style="text-align:center;flex-shrink:0">
      <div class="page-tag">Guide Anti-Blessure</div>
      ${gradText('Sommaire', { sizePt:28, weight:800 })}
      ${svgTitleDeco()}
    </div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:space-evenly;min-height:0">
      ${items.map(it=>`<div style="display:flex;align-items:baseline;width:100%">
        <span class="som-label">${it.label}</span>
        <span class="som-dots"></span>
        <span class="som-page">${it.page}</span>
      </div>`).join('')}
    </div>
    ${pageNum('2')}
  </div>`
}

function pageIntro() {
  const stats = [
    { n:'65%', label:'des coureurs se blessent chaque année', color:'#E8237A' },
    { n:'3×',  label:'plus lent : adaptation des tendons vs muscles', color:'#8B2FC9' },
    { n:'10%', label:'d\'augmentation de charge max par semaine', color:'#06B6D4' },
    { n:'2×',  label:'plus de risques avec moins de 7h de sommeil', color:'#22C55E' },
  ]
  const causes = [
    { icon:'📈', title:'Progression trop rapide', desc:'L\'erreur la plus fréquente. Les tendons s\'adaptent 3 fois plus lentement que les muscles. Augmente toujours ta charge par paliers de 10% maximum.', color:'rgba(232,35,122,.12)', border:'rgba(232,35,122,.28)' },
    { icon:'🔧', title:'Manque de renforcement',  desc:'Un coureur qui ne fait que courir accumule des déséquilibres dangereux. Fessiers, tibialis et gainage insuffisants exposent genoux et chevilles.', color:'rgba(249,115,22,.12)', border:'rgba(249,115,22,.28)' },
    { icon:'😴', title:'Récupération négligée',   desc:'La performance se construit pendant le repos. Moins de 7h de sommeil par nuit multiplie par deux le risque de blessure selon les études.', color:'rgba(139,47,201,.12)', border:'rgba(139,47,201,.28)' },
    { icon:'👟', title:'Équipement inadapté',     desc:'Une chaussure usée ou mal adaptée crée des douleurs sur toute la chaîne cinétique. La rotation de deux paires réduit de 40% le risque de blessure.', color:'rgba(6,182,212,.12)', border:'rgba(6,182,212,.28)' },
  ]
  const conseils = [
    { icon:'🎯', text:hl('Écoute ton corps')+' : une douleur qui dure plus de 3 jours n\'est pas anodine. 3 jours de repos valent mieux que 3 mois d\'arrêt.' },
    { icon:'📋', text:hl('Planifie la récupération')+' comme une séance : elle fait partie de l\'entraînement au même titre qu\'un fractionné.' },
    { icon:'💪', text:hl('2 séances de renforcement/semaine')+' suffisent pour diviser par trois le risque de blessure sur la saison.' },
  ]
  return `<div class="page">
    ${blobs('B')}
    <div style="text-align:center;flex-shrink:0">
      <div class="page-tag">Préambule</div>
      ${gradText('Introduction', { sizePt:28, weight:800 })}
      ${svgTitleDeco()}
    </div>
    <div class="page-intro">
      Courir est l'une des activités les plus naturelles qui soit. Pourtant ${hl('65% des coureurs se blessent chaque année')}, souvent pour des raisons évitables avec un peu de méthode et de régularité dans la prévention.
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;flex-shrink:0">
      ${stats.map(s=>`<div style="border-radius:9px;padding:9px 8px;text-align:center;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07)">
        <div style="font-size:16pt;font-weight:900;background:linear-gradient(135deg,${s.color},#E8237A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1.1">${s.n}</div>
        <div style="font-size:7.5pt;color:rgba(255,255,255,.58);line-height:1.4;margin-top:3px">${s.label}</div>
      </div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;flex-shrink:0">
      ${causes.map(c=>`<div style="border-radius:9px;padding:9px 11px;background:${c.color};border:1px solid ${c.border}">
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px">
          <span style="font-size:16px;flex-shrink:0">${c.icon}</span>
          <div style="font-size:8.5pt;font-weight:800">${c.title}</div>
        </div>
        <div style="font-size:8pt;color:rgba(255,255,255,.75);line-height:1.5;text-align:justify">${c.desc}</div>
      </div>`).join('')}
    </div>
    <div style="background:linear-gradient(135deg,rgba(139,47,201,.12),rgba(232,35,122,.07));border:1px solid rgba(139,47,201,.22);border-radius:10px;padding:10px 13px;flex-shrink:0">
      <div style="font-size:8pt;font-weight:700;color:#C084FC;margin-bottom:6px;text-transform:uppercase;letter-spacing:.1em">3 règles pour ne plus se blesser</div>
      <div style="display:flex;flex-direction:column;gap:5px">
        ${conseils.map(c=>`<div style="display:flex;align-items:flex-start;gap:8px">
          <span style="font-size:14px;flex-shrink:0;line-height:1.4">${c.icon}</span>
          <div style="font-size:8pt;color:rgba(255,255,255,.8);line-height:1.55;text-align:justify">${c.text}</div>
        </div>`).join('')}
      </div>
    </div>
    <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:9px 13px;flex-shrink:0">
      <div style="font-size:8pt;color:rgba(255,255,255,.7);line-height:1.6;text-align:justify">
        Ce guide est le fruit d'années d'expérience avec des coureurs de tous niveaux. Les protocoles sont issus des ${hl('dernières recherches en médecine du sport')}. Utilise-le comme référence : consulte la fiche blessure dès les premiers signaux, avant que la douleur ne s'installe.
      </div>
    </div>
    ${pageNum('3')}
  </div>`
}

function blessureCards(list) {
  return list.map(b=>`<div class="blessure-card" style="background:${b.bg};border-color:${b.border}">
    <div class="bl-header">
      <div class="bl-icon" style="background:${b.bg};border:1px solid ${b.border}">${b.icon}</div>
      <div>
        <div class="bl-title">${b.title}</div>
        <div class="bl-subtitle">${b.sub}</div>
      </div>
    </div>
    <div class="bl-sep"></div>
    <div class="bl-section-title" style="color:${b.color}">Symptômes</div>
    <div class="bl-text">${b.symptomes}</div>
    <div class="bl-section-title" style="color:${b.color};margin-top:2px">Prévention</div>
    <div class="bl-text">${b.prevention}</div>
    <div class="bl-section-title" style="color:${b.color};margin-top:2px">Traitement</div>
    <div class="bl-text">${b.soins}</div>
    <span class="bl-tag" style="background:${b.tagColor};border:1px solid ${b.tagBorder};color:${b.color}">${b.tag}</span>
  </div>`).join('')
}

function pageBlessures1() {
  return `<div class="page">
    ${blobs('A')}
    <div style="text-align:center;flex-shrink:0">
      <div class="page-tag">Chapitre 1 — Partie 1/2</div>
      ${gradText('Les 8 blessures du coureur', { sizePt:24, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    <div class="blessure-grid">
      ${blessureCards(BLESSURES_P1)}
    </div>
    ${pageNum('4')}
  </div>`
}

function pageBlessures2() {
  return `<div class="page">
    ${blobs('B')}
    <div style="text-align:center;flex-shrink:0">
      <div class="page-tag">Chapitre 1 — Partie 2/2</div>
      ${gradText('Les 8 blessures du coureur', { sizePt:24, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    <div class="blessure-grid">
      ${blessureCards(BLESSURES_P2)}
    </div>
    ${pageNum('5')}
  </div>`
}

function pageRenforcement(exos, pageN, part) {
  return `<div class="page">
    ${blobs(part===1?'B':'A')}
    <div style="text-align:center;flex-shrink:0">
      <div class="page-tag">Chapitre 2 — Partie ${part}/2</div>
      ${gradText('Programme de renforcement', { sizePt:24, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    ${part===1?`<div class="page-intro">${hl('2 séances/semaine')} suffisent pour construire une armure musculaire solide. Cible les zones les plus sollicitées en course. Récupération : 60 à 90 sec entre les séries.</div>`:''}
    <div class="exo-list">
      ${exos.map(e=>`<div class="exo-row">
        ${(() => `<div style="width:70px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;background:rgba(255,255,255,.02);border-right:1px solid rgba(255,255,255,.06);padding:5px 3px">
          <div style="font-size:26px;line-height:1">${e.emoji}</div>
          <div style="width:22px;height:2px;border-radius:2px;background:${e.zoneColor}"></div>
        </div>`)()}
        <div class="exo-content">
          <div class="exo-header">
            ${gradNum(e.num)}
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
              <div class="exo-tip">Conseil : ${e.tip}</div>
            </div>
          </div>
        </div>
      </div>`).join('')}
    </div>
    ${pageNum(String(pageN))}
  </div>`
}

function pageEtirements() {
  return `<div class="page">
    ${blobs('B')}
    <div style="text-align:center;flex-shrink:0">
      <div class="page-tag">Chapitre 3</div>
      ${gradText('Étirements essentiels', { sizePt:24, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    <div class="page-intro">
      Uniquement ${hl('après l\'effort')}, jamais à froid. Tiens chaque position sans rebonds, en respirant lentement. La régularité quotidienne prime sur l'intensité.
    </div>
    <div class="etir-grid">
      ${ETIREMENTS.map(e=>`<div class="etir-card" style="border-color:${e.border};background:${e.color}">
        <div class="etir-header">
          <span class="etir-icon">${e.emoji}</span>
          <div class="etir-title-block">
            <div class="etir-title">${e.title}</div>
            <div class="etir-muscle">${e.muscle}</div>
            <div class="etir-dose">${e.dose}</div>
          </div>
        </div>
        <div class="etir-sep"></div>
        <div class="etir-desc">${e.desc}</div>
        <div class="etir-coach">
          <div class="etir-coach-label">Note du coach</div>
          <div class="etir-coach-text">${e.coach}</div>
        </div>
      </div>`).join('')}
    </div>
    <div style="background:rgba(139,47,201,.08);border:1px solid rgba(139,47,201,.25);border-radius:9px;padding:8px 13px;flex-shrink:0">
      <div style="font-size:8.5pt;font-weight:700;color:#C084FC;margin-bottom:2px">Règle d'or</div>
      <div style="font-size:8pt;color:rgba(255,255,255,.78);line-height:1.55;text-align:justify">Ne jamais s'étirer sur une douleur aiguë. Si une zone est douloureuse, consulte un kinésithérapeute. La douleur pendant un étirement n'est ${hl('jamais normale')}.</div>
    </div>
    ${pageNum('8')}
  </div>`
}

function pageCharge() {
  const barData = [
    { label:'Volume hebdomadaire', pct:70, c1:'#8B2FC9', c2:'#A855F7', note:'+ 10% max / semaine' },
    { label:'Intensité des séances', pct:80, c1:'#E8237A', c2:'#F472B6', note:'Contrôle via fréquence cardiaque' },
    { label:'Fréquence de séances',  pct:60, c1:'#06B6D4', c2:'#67E8F9', note:'Augmenter progressivement' },
    { label:'Dénivelé positif',      pct:45, c1:'#22C55E', c2:'#86EFAC', note:'Variable souvent négligée' },
    { label:'Allure spécifique',     pct:35, c1:'#F97316', c2:'#FDBA74', note:'Introduire en phase finale' },
    { label:'Récupération active',   pct:90, c1:'#EAB308', c2:'#FDE047', note:'Ne jamais sacrifier le repos' },
  ]
  const infoCards = [
    { icon:'📊', title:'Règle des 10%', desc:'N\'augmente jamais le volume de plus de 10%/semaine. Cycle conseillé : 3 semaines de charge puis 1 semaine de décharge à −30%.', color:'rgba(139,47,201,.1)', border:'rgba(139,47,201,.25)' },
    { icon:'🌡️', title:'Signaux d\'alarme', desc:'RPE constamment élevé, douleurs inhabituelles ou fatigue persistante au réveil sont des signaux à ne pas ignorer. Réduire la charge immédiatement.', color:'rgba(232,35,122,.1)', border:'rgba(232,35,122,.25)' },
    { icon:'💤', title:'Sommeil prioritaire', desc:'Moins de 7h multiplie par 2 le risque de blessure. Priorise le sommeil autant que l\'entraînement. C\'est la nuit que le corps se renforce.', color:'rgba(6,182,212,.1)', border:'rgba(6,182,212,.25)' },
    { icon:'🔄', title:'Cycle de décharge', desc:'Toutes les 3 à 4 semaines, réduis le volume de 30 à 40%. La décharge planifiée déclenche la surcompensation et les progrès durables.', color:'rgba(34,197,94,.1)', border:'rgba(34,197,94,.25)' },
  ]
  return `<div class="page">
    ${blobs('A')}
    <div style="text-align:center;flex-shrink:0">
      <div class="page-tag">Chapitre 4</div>
      ${gradText('Gestion de la charge', { sizePt:24, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    <div class="page-intro">
      La ${hl('surcharge chronique')} est la première cause de blessure. Le corps s'adapte si on lui laisse le temps. Règle d'or : n'augmenter qu'un seul paramètre à la fois.
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;flex-shrink:0">
      ${infoCards.map(c=>`<div style="border-radius:9px;padding:8px 11px;background:${c.color};border:1px solid ${c.border}">
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px">
          <span style="font-size:16px;flex-shrink:0">${c.icon}</span>
          <div style="font-size:8.5pt;font-weight:800">${c.title}</div>
        </div>
        <div style="font-size:8pt;color:rgba(255,255,255,.75);line-height:1.5;text-align:justify">${c.desc}</div>
      </div>`).join('')}
    </div>
    <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px 13px;flex-shrink:0">
      <div style="font-size:8pt;font-weight:700;color:rgba(255,255,255,.38);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">Variables à surveiller</div>
      <div style="display:flex;flex-direction:column;gap:7px">
        ${barData.map(b=>`<div class="charge-row">
          <div class="charge-label">${b.label}</div>
          <div class="charge-bar-wrap"><div class="charge-bar" style="width:${b.pct}%;background:linear-gradient(90deg,${b.c1},${b.c2})"></div></div>
          <div class="charge-val" style="color:${b.c1}">${b.pct}%</div>
          <div class="charge-note">${b.note}</div>
        </div>`).join('')}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;flex-shrink:0">
      <div style="border-radius:9px;padding:8px 11px;background:linear-gradient(135deg,rgba(139,47,201,.12),rgba(232,35,122,.08));border:1px solid rgba(139,47,201,.22)">
        <div style="font-size:8.5pt;font-weight:800;margin-bottom:3px">Comment lire ce tableau ?</div>
        <div style="font-size:8pt;color:rgba(255,255,255,.72);line-height:1.5;text-align:justify">Les % représentent l\'importance relative de chaque variable. ${hl('Ne modifie jamais deux variables simultanément')} : volume OU intensité, pas les deux en même temps.</div>
      </div>
      <div style="border-radius:9px;padding:8px 11px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08)">
        <div style="font-size:8.5pt;font-weight:800;margin-bottom:4px">Le cycle idéal</div>
        <div style="display:flex;flex-direction:column;gap:4px">
          <div style="display:flex;align-items:center;gap:7px"><span style="font-size:12px">📈</span><div style="font-size:8pt;color:rgba(255,255,255,.75)"><b>Sem. 1-3</b> : charge progressive +5 à +10%</div></div>
          <div style="display:flex;align-items:center;gap:7px"><span style="font-size:12px">📉</span><div style="font-size:8pt;color:rgba(255,255,255,.75)"><b>Sem. 4</b> : décharge −30 à −40% du volume</div></div>
          <div style="display:flex;align-items:center;gap:7px"><span style="font-size:12px">🔁</span><div style="font-size:8pt;color:rgba(255,255,255,.75)">Répéter avec un nouveau palier supérieur</div></div>
        </div>
      </div>
    </div>
    ${pageNum('9')}
  </div>`
}

function pagePeaceLove() {
  return `<div class="page">
    ${blobs('B')}
    <div style="text-align:center;flex-shrink:0">
      <div class="page-tag">Chapitre 5</div>
      ${gradText('Protocole PEACE & LOVE', { sizePt:24, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    <div class="page-intro">
      Remplace l'ancien RICE. Il intègre les ${hl('dernières recherches en médecine du sport')} pour une gestion complète et éprouvée des blessures aiguës.
    </div>
    <div class="peace-grid">
      ${PEACE_LOVE.map((p,i)=>{
        const col = PEACE_COLORS[i]
        return `<div class="peace-row" style="background:${col.bg};border:1px solid ${col.border}">
          <div class="peace-letter-block">
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
    ${pageNum('10')}
  </div>`
}

function pageChaussures() {
  const shoes = [
    { icon:'🏃', title:'Chaussure d\'entraînement daily', desc:'Amorti modéré, durabilité maximale. Pour les footings quotidiens. À renouveler tous les 600 à 800 km : les propriétés amorties disparaissent avant que la semelle ne soit usée visuellement.', color:'rgba(139,47,201,.1)', border:'rgba(139,47,201,.28)' },
    { icon:'⚡', title:'Chaussure de vitesse / plaquée',  desc:'Carbone ou nylon rigide pour les séances intenses et compétitions. Ne pas utiliser pour les footings : le drop bas entraîne une surcharge tendineuse si l\'usage est trop fréquent.', color:'rgba(232,35,122,.1)', border:'rgba(232,35,122,.28)' },
    { icon:'🏔️', title:'Trail et chaussure de stabilité', desc:'Drop bas et semelle adhérente pour le trail. Sur route, la chaussure de stabilité est recommandée en cas de pronation excessive confirmée par un podologue.', color:'rgba(6,182,212,.1)', border:'rgba(6,182,212,.28)' },
    { icon:'🔄', title:'Rotation de 2 à 3 paires',        desc:'Alterner plusieurs paires différentes réduit de 40% le risque de blessure selon les études. Chaque modèle sollicite différemment le pied et les articulations.', color:'rgba(34,197,94,.1)', border:'rgba(34,197,94,.28)' },
    { icon:'📏', title:'Bilan podologique régulier',       desc:'Un bilan biomécanique est conseillé tous les 2 ans ou après une blessure répétée. Des semelles sur-mesure peuvent corriger des déséquilibres structurels importants.', color:'rgba(234,179,8,.1)', border:'rgba(234,179,8,.28)' },
  ]
  return `<div class="page">
    ${blobs('A')}
    <div style="text-align:center;flex-shrink:0">
      <div class="page-tag">Chapitre 6</div>
      ${gradText('Chaussures et matériel', { sizePt:24, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    <div class="page-intro">
      Le choix de la chaussure est souvent ${hl('sous-estimé')}, pourtant c'est l'un des facteurs les plus importants dans la prévention des blessures du coureur.
    </div>
    <div class="shoe-cards">
      ${shoes.map(s=>`<div class="shoe-card" style="background:${s.color};border-color:${s.border}">
        <div class="shoe-icon">${s.icon}</div>
        <div>
          <div class="shoe-title">${s.title}</div>
          <div class="shoe-desc">${s.desc}</div>
        </div>
      </div>`).join('')}
    </div>
    ${pageNum('11')}
  </div>`
}

function pageCTA() {
  const plans = [
    { icon:'🏃', name:'Plan 10 km',    duration:'8 sem.',  color:'rgba(6,182,212,.15)',  border:'rgba(6,182,212,.35)',  tc:'#67E8F9' },
    { icon:'🏃', name:'Plan 10 km',    duration:'12 sem.', color:'rgba(6,182,212,.1)',   border:'rgba(6,182,212,.25)',  tc:'#67E8F9' },
    { icon:'🏅', name:'Semi-Marathon', duration:'12 sem.', color:'rgba(139,47,201,.15)', border:'rgba(139,47,201,.35)', tc:'#C084FC' },
    { icon:'🏆', name:'Marathon',      duration:'12 sem.', color:'rgba(232,35,122,.15)', border:'rgba(232,35,122,.35)', tc:'#F9A8D4' },
    { icon:'🏆', name:'Marathon',      duration:'16 sem.', color:'rgba(232,35,122,.1)',  border:'rgba(232,35,122,.25)', tc:'#F9A8D4' },
  ]
  return `<div class="page" style="justify-content:space-between">
    ${blobs('B')}
    <div style="text-align:center;flex-shrink:0">
      <div class="page-tag">Passe à l'action</div>
      ${gradText('Prêt à courir plus intelligent ?', { sizePt:22, weight:800 })}
      ${svgDiamond()}
      <div style="font-size:8.5pt;color:rgba(255,255,255,.62);margin-top:5px;line-height:1.55">Tu as maintenant toutes les clés. La prochaine étape : un plan structuré qui respecte tes capacités et te fait progresser sans te blesser.</div>
    </div>
    <div style="flex-shrink:0">
      ${gradText('Mes plans d\'entraînement PDF', { sizePt:11, weight:700 })}
      <div style="height:7px"></div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:7px">
        ${plans.map(p=>`<div style="border-radius:10px;padding:10px 7px;background:${p.color};border:1px solid ${p.border};display:flex;flex-direction:column;gap:4px;text-align:center">
          <div style="font-size:20px">${p.icon}</div>
          <div style="font-size:8.5pt;font-weight:800;color:#fff;line-height:1.2">${p.name}</div>
          <div style="font-size:8pt;color:${p.tc};font-weight:700">${p.duration}</div>
          <div style="font-size:8pt;font-weight:800;background:linear-gradient(135deg,#8B2FC9,#E8237A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1.3">à partir de<br>14,99€</div>
        </div>`).join('')}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;flex-shrink:0">
      <div style="border-radius:12px;padding:13px;background:linear-gradient(135deg,rgba(139,47,201,.18),rgba(232,35,122,.12));border:1px solid rgba(139,47,201,.35)">
        <div style="font-size:20px;margin-bottom:5px">🎯</div>
        <div style="font-size:9pt;font-weight:800;margin-bottom:4px">Guide Anti-Blessure</div>
        <div style="font-size:8pt;color:rgba(255,255,255,.7);line-height:1.5;margin-bottom:7px">Tu lis ce guide. Partage-le à un coureur qui en a besoin pour rester longtemps sur les routes.</div>
        <div style="font-size:13pt;font-weight:900;background:linear-gradient(135deg,#8B2FC9,#E8237A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">14,99€</div>
      </div>
      <div style="border-radius:12px;padding:13px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1)">
        <div style="font-size:20px;margin-bottom:5px">🏅</div>
        <div style="font-size:9pt;font-weight:800;margin-bottom:4px">Coaching personnalisé</div>
        <div style="font-size:8pt;color:rgba(255,255,255,.7);line-height:1.5;margin-bottom:7px">Plan 100% sur-mesure, suivi hebdomadaire et messagerie directe avec ton coach Alexis Elie.</div>
        <div style="font-size:13pt;font-weight:900;background:linear-gradient(135deg,#8B2FC9,#E8237A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">à partir de 30€/mois</div>
      </div>
    </div>
    <div style="flex-shrink:0;border-radius:12px;padding:13px 16px;background:rgba(255,255,255,.04);border:1px solid rgba(139,47,201,.28);display:flex;align-items:center;gap:14px">
      <div style="flex-shrink:0;font-size:28px">🎽</div>
      <div style="flex:1">
        <div style="font-size:9.5pt;font-weight:800;margin-bottom:3px">Rejoins The Ultimate Academy</div>
        <div style="font-size:8pt;color:rgba(255,255,255,.7);line-height:1.5">Déjà <b>70 coureurs</b> qui progressent et courent sans blessure. Retrouve tous les plans et le coaching sur :</div>
      </div>
      <div style="flex-shrink:0">
        ${gradText('theultimateacademy.fr', { sizePt:9.5, weight:900, width:200 })}
      </div>
    </div>
    <div style="flex-shrink:0;display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:8pt;color:rgba(255,255,255,.2);letter-spacing:.04em">The Ultimate Academy — Alexis ELIE</div>
      <div style="width:44px"></div>
    </div>
    ${pageNum('12')}
  </div>`
}

// ─── HTML ─────────────────────────────────────────────────────────────────────
function buildHtml() {
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
${pageBlessures1()}
${pageBlessures2()}
${pageRenforcement(EXERCICES.slice(0,5), 6, 1)}
${pageRenforcement(EXERCICES.slice(5,10), 7, 2)}
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
  console.log(`PDF généré : ${outPath} (${Math.round(size/1024)} KB, 12 pages)`)
})()
