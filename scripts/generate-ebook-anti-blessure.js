#!/usr/bin/env node
// Génère public/ebooks/anti-blessure/guide-antiblessure.pdf — v4
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

function gradNum(n) {
  const gid = `gn${gidSeq++}`
  return `<svg viewBox="0 0 52 42" width="52" height="42" style="display:block;flex-shrink:0">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#8B2FC9"/><stop offset="100%" stop-color="#E8237A"/>
    </linearGradient></defs>
    <text x="26" y="33" text-anchor="middle" font-family="Poppins" font-weight="900" font-size="30" fill="url(#${gid})" opacity="0.85">${n}</text>
  </svg>`
}

function hl(t) {
  return `<span style="background:linear-gradient(135deg,#8B2FC9,#E8237A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-weight:700">${t}</span>`
}

// ─── SVG déco ─────────────────────────────────────────────────────────────────
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

// ─── Pictogrammes exercices : grands emojis dans un cadre stylisé ─────────────
// Remplace les silhouettes SVG par un visuel emoji clair + label zone ciblée
function exoPicto(emoji, zoneColor) {
  return `<div style="width:92px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;background:rgba(255,255,255,.02);border-right:1px solid rgba(255,255,255,.06);padding:8px 6px">
    <div style="font-size:34px;line-height:1">${emoji}</div>
    <div style="width:32px;height:3px;border-radius:2px;background:${zoneColor}"></div>
  </div>`
}

// Pictogrammes étirements : emoji + fond coloré
function etirPicto(emoji, color) {
  return `<div style="border-radius:10px;padding:10px;background:${color};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-bottom:6px">
    <span style="font-size:28px;line-height:1">${emoji}</span>
  </div>`
}

// ─── CSS — tailles de police UNIFIÉES ────────────────────────────────────────
// Corps de texte : 10pt partout
// Titres de section (ex: "Symptômes") : 8pt majuscule
// Sous-titres de carte : 8pt
// Titre de page : via gradText 28-30pt
// Titre chapitre secondaire : 11pt bold
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
@page { size: A4; margin: 0; }
html, body { margin: 0; padding: 0; background: #0C0A18; overflow-x: hidden; max-width: 210mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Poppins', sans-serif; color: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact;
  font-size: 10pt; line-height: 1.65; }

/* ─ mise en page ─ */
.page {
  width: 210mm; height: 297mm; overflow: hidden;
  padding: 11mm 13mm 18mm;
  background: #0C0A18;
  page-break-after: always; break-after: page;
  position: relative;
  display: flex; flex-direction: column; gap: 10px;
}
.blob-tr,.blob-bl,.blob-tl,.blob-br { position:absolute;border-radius:50%;pointer-events:none;z-index:0; }
.blob-tr{top:-80px;right:-70px;width:300px;height:300px;background:radial-gradient(ellipse,rgba(139,47,201,.22) 0%,transparent 65%);}
.blob-bl{bottom:-70px;left:-60px;width:260px;height:260px;background:radial-gradient(ellipse,rgba(232,35,122,.16) 0%,transparent 65%);}
.blob-tl{top:-60px;left:-60px;width:250px;height:250px;background:radial-gradient(ellipse,rgba(139,47,201,.22) 0%,transparent 65%);}
.blob-br{bottom:-60px;right:-50px;width:230px;height:230px;background:radial-gradient(ellipse,rgba(232,35,122,.16) 0%,transparent 65%);}
.page > *:not([class^="blob"]):not(.pnum) { position:relative;z-index:1; }
.pnum { position:absolute;bottom:9mm;right:13mm;z-index:10; }

/* ─ couverture ─ */
.cover-page { width:210mm;height:297mm;overflow:hidden;background:#0C0A18;page-break-after:always;break-after:page;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center; }
.cover-wm { position:absolute;font-size:200pt;font-weight:800;line-height:1;letter-spacing:-.05em;background:linear-gradient(135deg,#8B2FC9,#E8237A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;opacity:.035;pointer-events:none;top:50%;left:50%;transform:translate(-50%,-50%); }
.cover-deco-tr{position:absolute;top:14mm;right:12mm;opacity:.65;}
.cover-deco-bl{position:absolute;bottom:32mm;left:10mm;opacity:.75;}
.cover-deco-br{position:absolute;bottom:16mm;right:14mm;opacity:.55;}
.cover-inner{display:flex;flex-direction:column;align-items:center;gap:0;position:relative;z-index:1;padding:0 14mm;}
.cover-logo{width:118px;opacity:.95;margin-bottom:18px;}
.cover-sep{width:60px;height:2px;background:linear-gradient(90deg,#8B2FC9,#E8237A);border-radius:1px;margin:18px auto;}
.cover-eyebrow{font-size:10pt;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.38);margin-bottom:8px;}
.cover-subtitle{font-size:14pt;font-weight:600;color:rgba(255,255,255,.72);letter-spacing:.04em;margin-top:10px;line-height:1.5;}
.cover-tags{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:18px;}
.cover-tag{font-size:10pt;font-weight:700;border-radius:20px;padding:5px 13px;border:1px solid;}
.cover-academy{font-size:10pt;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.25);margin-top:30px;}

/* ─ sommaire ─ */
.som-label{font-size:11pt;font-weight:500;color:rgba(255,255,255,.88);flex-shrink:0;}
.som-dots{flex:1;border-bottom:1px dotted rgba(255,255,255,.15);margin:0 12px;align-self:flex-end;margin-bottom:4px;}
.som-page{font-size:11pt;font-weight:800;flex-shrink:0;color:#C084FC;width:44px;}

/* ─ titres de page ─ */
.page-tag{display:inline-block;font-size:10pt;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.38);margin-bottom:5px;}
.page-intro{font-size:10pt;color:rgba(255,255,255,.72);line-height:1.7;text-align:justify;flex-shrink:0;}

/* ─ blessures ─ */
.blessure-grid{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:8px;min-height:0;}
.blessure-card{border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:4px;border:1px solid;overflow:hidden;}
.bl-title{font-size:10pt;font-weight:800;line-height:1.2;}
.bl-subtitle{font-size:10pt;color:rgba(255,255,255,.45);margin-top:1px;}
.bl-sep{height:1px;background:rgba(255,255,255,.06);flex-shrink:0;margin:2px 0;}
.bl-section-title{font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px;}
.bl-text{font-size:10pt;color:rgba(255,255,255,.8);line-height:1.55;text-align:justify;}
.bl-tag{display:inline-block;font-size:8pt;font-weight:700;border-radius:10px;padding:2px 8px;margin-top:3px;}

/* ─ exercices ─ */
.exo-list{flex:1;display:flex;flex-direction:column;gap:8px;min-height:0;}
.exo-row{flex:1;display:flex;gap:0;align-items:stretch;border-radius:12px;overflow:hidden;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);}
.exo-content{flex:1;padding:9px 13px;display:flex;flex-direction:column;gap:4px;}
.exo-header{display:flex;align-items:center;gap:8px;}
.exo-title{font-size:11pt;font-weight:800;line-height:1.2;}
.exo-muscle{font-size:10pt;color:rgba(255,255,255,.45);}
.exo-sep{height:1px;background:rgba(255,255,255,.06);}
.exo-body{display:flex;gap:10px;align-items:flex-start;}
.exo-dose-chip{font-size:10pt;font-weight:700;border-radius:8px;padding:3px 10px;flex-shrink:0;white-space:nowrap;}
.exo-desc{font-size:10pt;color:rgba(255,255,255,.78);line-height:1.55;text-align:justify;}
.exo-tip{font-size:10pt;color:rgba(255,255,255,.4);font-style:italic;}

/* ─ étirements ─ */
.etir-grid{flex:1;display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px;min-height:0;}
.etir-card{border-radius:12px;padding:11px 12px;display:flex;flex-direction:column;gap:4px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);}
.etir-title{font-size:11pt;font-weight:800;}
.etir-muscle{font-size:10pt;color:rgba(255,255,255,.4);}
.etir-dose{font-size:10pt;font-weight:700;color:#C084FC;}
.etir-sep{height:1px;background:rgba(255,255,255,.06);}
.etir-desc{font-size:10pt;color:rgba(255,255,255,.75);line-height:1.55;text-align:justify;}

/* ─ charge ─ */
.charge-row{display:flex;align-items:center;gap:12px;}
.charge-label{font-size:10pt;font-weight:600;width:140px;flex-shrink:0;}
.charge-bar-wrap{flex:1;height:16px;background:rgba(255,255,255,.06);border-radius:8px;overflow:hidden;}
.charge-bar{height:100%;border-radius:8px;}
.charge-val{font-size:10pt;font-weight:800;width:40px;text-align:right;flex-shrink:0;}
.charge-desc-val{font-size:10pt;color:rgba(255,255,255,.5);flex-shrink:0;width:180px;text-align:right;}

/* ─ PEACE & LOVE ─ */
.peace-grid{flex:1;display:flex;flex-direction:column;gap:6px;min-height:0;}
.peace-row{flex:1;display:flex;align-items:stretch;gap:0;border-radius:12px;overflow:hidden;}
.peace-letter-block{width:52px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.peace-letter{font-size:26pt;font-weight:900;line-height:1;}
.peace-divider{width:1px;flex-shrink:0;}
.peace-body{flex:1;padding:7px 13px;display:flex;flex-direction:column;justify-content:center;gap:2px;}
.peace-title{font-size:11pt;font-weight:800;}
.peace-desc{font-size:10pt;color:rgba(255,255,255,.75);line-height:1.5;text-align:justify;}

/* ─ chaussures ─ */
.shoe-cards{flex:1;display:flex;flex-direction:column;gap:9px;justify-content:space-evenly;min-height:0;}
.shoe-card{flex:1;border-radius:12px;padding:10px 15px;display:flex;gap:13px;align-items:center;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);}
.shoe-icon{font-size:28px;flex-shrink:0;}
.shoe-title{font-size:11pt;font-weight:800;margin-bottom:3px;}
.shoe-desc{font-size:10pt;color:rgba(255,255,255,.78);line-height:1.55;text-align:justify;}

/* ─ CTA ─ */
.cta-page{justify-content:space-between;}
`

// ─── Données ──────────────────────────────────────────────────────────────────
const BLESSURES = [
  {
    icon:'🦴', color:'#06B6D4', bg:'rgba(6,182,212,.08)', border:'rgba(6,182,212,.25)',
    title:'Périostite tibiale', sub:'Syndrome de stress du tibia',
    symptomes:'Douleur diffuse le long du tibia, aggravée à l\'effort et en début de séance.',
    prevention:'Progression de 10% max/semaine. '+hl('Renforcement du mollet')+' et tibialis. Varier les surfaces.',
    soins:'Repos relatif, glace 15 min x3/j. Reprise progressive sur surfaces souples.',
    tag:'Fréquente chez les débutants', tagColor:'rgba(6,182,212,.2)', tagBorder:'rgba(6,182,212,.4)',
  },
  {
    icon:'🦵', color:'#F97316', bg:'rgba(249,115,22,.08)', border:'rgba(249,115,22,.25)',
    title:'Tendinite d\'Achille', sub:'Tendinopathie du tendon calcanéen',
    symptomes:'Raideur matinale au talon, douleur à la palpation, gonflement possible.',
    prevention:hl('Montées excentriques')+' sur marche, échauffement soigneux, semelles adaptées.',
    soins:'Repos 2 à 4 semaines, massage transverse profond, kinésithérapie précoce.',
    tag:'Coureurs confirmés', tagColor:'rgba(249,115,22,.2)', tagBorder:'rgba(249,115,22,.4)',
  },
  {
    icon:'🔩', color:'#A855F7', bg:'rgba(168,85,247,.08)', border:'rgba(168,85,247,.25)',
    title:'Syndrome de l\'essuie-glace', sub:'Bandelette ilio-tibiale (BIT)',
    symptomes:'Douleur vive sur la face externe du genou, surtout après 20 à 30 min d\'effort.',
    prevention:hl('Renforcement des fessiers')+' et abducteurs. Foam roller BIT. Cadence 170-180 pas/min.',
    soins:'Stop si douleur vive. Anti-inflammatoires, étirements spécifiques BIT.',
    tag:'Longue distance', tagColor:'rgba(168,85,247,.2)', tagBorder:'rgba(168,85,247,.4)',
  },
  {
    icon:'🦶', color:'#22C55E', bg:'rgba(34,197,94,.08)', border:'rgba(34,197,94,.25)',
    title:'Fasciite plantaire', sub:'Aponévrosite plantaire',
    symptomes:'Douleur intense sous le pied au réveil ou en début de séance, talon et voûte.',
    prevention:hl('Renforcement intrinsèque du pied')+', billes sous le pied, semelles si besoin.',
    soins:'Étirements du fascia et du mollet, botte de nuit, ondes de choc si chronique.',
    tag:'Route et piste', tagColor:'rgba(34,197,94,.2)', tagBorder:'rgba(34,197,94,.4)',
  },
  {
    icon:'💥', color:'#EF4444', bg:'rgba(239,68,68,.08)', border:'rgba(239,68,68,.25)',
    title:'Claquage musculaire', sub:'Déchirure de fibre ou de faisceau',
    symptomes:'Douleur brutale type "coup de couteau", contracture, hématome possible.',
    prevention:hl('Échauffement progressif')+' 15 min minimum. Hydratation et alimentation soignées.',
    soins:'Protocole PEACE & LOVE (p.9). Arrêt immédiat, pas de chaleur les 72 premières heures.',
    tag:'Séances intenses', tagColor:'rgba(239,68,68,.2)', tagBorder:'rgba(239,68,68,.4)',
  },
  {
    icon:'🦿', color:'#EAB308', bg:'rgba(234,179,8,.08)', border:'rgba(234,179,8,.25)',
    // Titre corrigé : Syndrome fémoro-patellaire en titre, "Genou du coureur" en sous-titre
    title:'Syndrome fémoro-patellaire', sub:'Genou du coureur',
    symptomes:'Douleur sous ou autour de la rotule, en descente et en position assise prolongée.',
    prevention:hl('Squats et fentes')+' unilatéraux, travail de la hanche, réduction du volume.',
    soins:'Repos relatif, glace, kiné pour rééquilibrage musculaire, taping rotulien si besoin.',
    tag:'Tous niveaux', tagColor:'rgba(234,179,8,.2)', tagBorder:'rgba(234,179,8,.4)',
  },
]

// Emoji parlants + couleur de zone ciblée pour chaque exercice
const EXERCICES = [
  { num:'01', emoji:'🏋️', zoneColor:'#A855F7', title:'Squat unilatéral',   muscle:'Quadriceps · fessiers · stabilisateurs', dose:'3 × 12 reps', dc:'rgba(139,47,201,.25)', db:'rgba(139,47,201,.5)', desc:'Debout sur une jambe, descends lentement jusqu\'à 90°. Garde le genou dans l\'axe du pied. Remonte en contrôlant.', tip:'Variation avancée : squat bulgare avec pied arrière surélevé sur banc' },
  { num:'02', emoji:'🍑', zoneColor:'#E8237A', title:'Hip thrust',          muscle:'Grand fessier · ischio-jambiers',         dose:'3 × 15 reps', dc:'rgba(232,35,122,.25)', db:'rgba(232,35,122,.5)', desc:'Dos sur banc, pieds à plat, pousse le bassin vers le haut en contractant fort les fessiers. Pause 1 sec en haut.', tip:'Essentiel pour prévenir toutes les blessures au genou et à la hanche' },
  { num:'03', emoji:'🦶', zoneColor:'#06B6D4', title:'Mollet excentrique',  muscle:'Soléaire · gastrocnémien · Achille',      dose:'3 × 15 lentes', dc:'rgba(6,182,212,.25)', db:'rgba(6,182,212,.5)', desc:'Sur une marche, monte sur les deux pieds puis redescends lentement sur une seule jambe en 4 secondes.', tip:'Prophylaxie numéro 1 contre la tendinite d\'Achille — à faire chaque semaine' },
  { num:'04', emoji:'🚶', zoneColor:'#F97316', title:'Fente marchée',       muscle:'Quadriceps · fessiers · soléaire',         dose:'3 × 10/côté', dc:'rgba(249,115,22,.25)', db:'rgba(249,115,22,.5)', desc:'Pas en avant, genou avant à 90°, genou arrière effleure le sol. Pousse sur le talon avant pour remonter.', tip:'Améliore l\'équilibre dynamique et la proprioception globale du coureur' },
  { num:'05', emoji:'🌉', zoneColor:'#22C55E', title:'Pont fessier',        muscle:'Grand fessier · core · ischios',           dose:'3 × 20 reps', dc:'rgba(34,197,94,.25)', db:'rgba(34,197,94,.5)', desc:'Allongé dos au sol, genoux fléchis à 90°, pousse le bassin vers le haut. Tiens 2 sec en haut, redescends lentement.', tip:'Version avancée : une jambe tendue à l\'horizontal, alternance gauche/droite' },
  { num:'06', emoji:'🐚', zoneColor:'#A855F7', title:'Clam shell',          muscle:'Moyen fessier · abducteurs',               dose:'3 × 20/côté', dc:'rgba(168,85,247,.25)', db:'rgba(168,85,247,.5)', desc:'Allongé sur le côté, hanches fléchies à 60°. Ouvre et ferme le genou supérieur comme une palourde. Lent et contrôlé.', tip:'Idéal pour prévenir le syndrome de l\'essuie-glace et les douleurs de hanche' },
  { num:'07', emoji:'📐', zoneColor:'#EF4444', title:'Planche latérale',    muscle:'Obliques · carré des lombes · abducteurs', dose:'3 × 30 sec',   dc:'rgba(239,68,68,.25)', db:'rgba(239,68,68,.5)', desc:'Sur l\'avant-bras, corps aligné des pieds à la tête. Hanches hautes, ne laisse pas la hanche s\'affaisser.', tip:'Progression : planche latérale avec levée de jambe supérieure, 15 reps' },
  { num:'08', emoji:'🦿', zoneColor:'#EAB308', title:'Tibialis raise',      muscle:'Tibial antérieur · extenseurs des orteils', dose:'3 × 20 reps', dc:'rgba(234,179,8,.25)', db:'rgba(234,179,8,.5)', desc:'Dos contre un mur, talons à 30 cm du mur. Lève la pointe des pieds vers le haut en gardant les talons au sol. Mouvement lent et contrôlé.', tip:'Prévention directe et très efficace contre la périostite tibiale' },
  { num:'09', emoji:'🌉', zoneColor:'#06B6D4', title:'Copenhagen plank',    muscle:'Adducteurs · core · stabilisateurs',        dose:'3 × 20 sec',   dc:'rgba(6,182,212,.25)', db:'rgba(6,182,212,.5)', desc:'Planche latérale avec pied supérieur posé sur un banc. Soulève la hanche inférieure pour créer un pont. Respire normalement.', tip:'Un des meilleurs exercices de prévention toutes catégories confondues' },
  { num:'10', emoji:'🪑', zoneColor:'#E8237A', title:'Chaise au mur',       muscle:'Quadriceps · genou · isométrique',          dose:'3 × 45 sec',   dc:'rgba(232,35,122,.25)', db:'rgba(232,35,122,.5)', desc:'Dos contre le mur, genoux à 90°. Tiens la position sans bouger. La brûlure dans les quadriceps est tout à fait normale.', tip:'Excellent pour renforcer la rotule et prévenir le syndrome fémoro-patellaire' },
]

const ETIREMENTS = [
  { emoji:'🦵', color:'rgba(139,47,201,.2)', border:'rgba(139,47,201,.4)', title:'Quadriceps',       muscle:'Face avant de la cuisse',   dose:'30 sec × 3', desc:'Debout sur une jambe, saisir le pied derrière. Genou vers le bas, hanche droite, bassin neutre. Maintiens la position en respirant.' },
  { emoji:'🔗', color:'rgba(6,182,212,.2)',  border:'rgba(6,182,212,.4)',  title:'Ischio-jambiers',  muscle:'Face arrière de la cuisse',  dose:'30 sec × 3', desc:'Assis, jambe tendue devant toi, penche le buste vers l\'avant en gardant le dos bien droit. Sens l\'étirement sous la cuisse.' },
  { emoji:'🦶', color:'rgba(232,35,122,.2)', border:'rgba(232,35,122,.4)', title:'Mollet et Achille', muscle:'Mollet et tendon calcanéen', dose:'45 sec × 3', desc:'Main contre un mur, pied arrière à plat, genou tendu. Pousse le talon vers le sol en contractant légèrement les abdos.' },
  { emoji:'↔️', color:'rgba(168,85,247,.2)', border:'rgba(168,85,247,.4)', title:'Bandelette IT',     muscle:'Hanche externe',            dose:'30 sec × 3', desc:'Debout, croise les jambes, penche le buste du côté opposé en appuyant la hanche vers l\'extérieur. Bras au-dessus.' },
  { emoji:'🍑', color:'rgba(34,197,94,.2)',  border:'rgba(34,197,94,.4)',  title:'Fessier piriforme', muscle:'Fessier profond',            dose:'30 sec × 3', desc:'Allongé, cheville sur genou opposé, tire doucement la cuisse vers la poitrine. Maintiens sans forcer sur la hanche.' },
  { emoji:'🦷', color:'rgba(249,115,22,.2)', border:'rgba(249,115,22,.4)', title:'Fascia plantaire',  muscle:'Voûte plantaire et talon',   dose:'60 sec × 2', desc:'Assis, saisir les orteils et les tirer vers le tibia. Tenir 30 sec. Masser ensuite la voûte avec une balle de tennis ou de golf.' },
]

const PEACE_LOVE = [
  { letter:'P', title:'Protection',               desc:'Limiter les activités douloureuses les 1 à 3 premiers jours. Repos relatif, sans immobilisation totale, pour éviter d\'aggraver la lésion.' },
  { letter:'E', title:'Élévation',                desc:'Élever le membre blessé au-dessus du niveau du cœur le plus souvent possible pour réduire l\'enflure et accélérer le drainage lymphatique.' },
  { letter:'A', title:'Anti-inflammatoires : non', desc:'Dans les 72 premières heures, ils freinent l\'inflammation naturelle, pourtant essentielle à la cicatrisation. Les éviter sauf prescription médicale.' },
  { letter:'C', title:'Compression',              desc:'Bandage compressif pour limiter l\'oedème et soutenir les tissus. Bien serré mais sans couper la circulation : les doigts ne doivent pas bleuir.' },
  { letter:'E', title:'Éducation',                desc:'Comprendre sa blessure pour mieux la gérer. La douleur est un signal utile, pas un ennemi. La reprise progressive est toujours supérieure à l\'arrêt total.' },
  { letter:'L', title:'Loading progressif',        desc:'Reprendre la mise en charge dès que possible. Le mouvement contrôlé favorise la guérison et prévient la perte musculaire et de proprioception.' },
  { letter:'O', title:'Optimisme',                desc:'L\'état d\'esprit positif influence directement la guérison. Les patients optimistes récupèrent plus vite et font moins de rechutes, selon la littérature scientifique.' },
  { letter:'V', title:'Vascularisation',          desc:'Cardio non douloureux (vélo, natation, marche) pour maintenir le flux sanguin, accélérer la cicatrisation et préserver la condition physique.' },
  { letter:'E', title:'Exercice ciblé',           desc:'Reprendre les exercices de renforcement spécifiques dès que possible. La rééducation active est toujours supérieure au repos passif prolongé.' },
]

const PEACE_COLORS = [
  { bg:'rgba(6,182,212,.12)',  border:'rgba(6,182,212,.3)',  letter:'#06B6D4' },
  { bg:'rgba(34,197,94,.12)', border:'rgba(34,197,94,.3)',  letter:'#22C55E' },
  { bg:'rgba(139,47,201,.12)',border:'rgba(139,47,201,.3)', letter:'#A855F7' },
  { bg:'rgba(249,115,22,.12)',border:'rgba(249,115,22,.3)', letter:'#F97316' },
  { bg:'rgba(234,179,8,.12)', border:'rgba(234,179,8,.3)',  letter:'#EAB308' },
  { bg:'rgba(232,35,122,.12)',border:'rgba(232,35,122,.3)', letter:'#E8237A' },
  { bg:'rgba(168,85,247,.12)',border:'rgba(168,85,247,.3)', letter:'#A855F7' },
  { bg:'rgba(59,130,246,.12)',border:'rgba(59,130,246,.3)', letter:'#3B82F6' },
  { bg:'rgba(16,185,129,.12)',border:'rgba(16,185,129,.3)', letter:'#10B981' },
]

// ─── SVG couverture ───────────────────────────────────────────────────────────
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

// ─── Pages ────────────────────────────────────────────────────────────────────
function pageCover() {
  return `<div class="cover-page">
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
    { label:'Introduction',                         page:'3' },
    { label:'Les 6 blessures courantes',             page:'4' },
    { label:'Programme de renforcement — Partie 1',  page:'5' },
    { label:'Programme de renforcement — Partie 2',  page:'6' },
    { label:'Étirements essentiels',                page:'7' },
    { label:'Gestion de la charge d\'entraînement', page:'8' },
    { label:'Protocole PEACE & LOVE',               page:'9' },
    { label:'Chaussures et matériel',               page:'10' },
    { label:'Passer à l\'action',                   page:'11' },
  ]
  return `<div class="page">
    ${blobs('A')}
    <div style="text-align:center;flex-shrink:0">
      <div class="page-tag">Guide Anti-Blessure</div>
      ${gradText('Sommaire', { sizePt:30, weight:800 })}
      ${svgTitleDeco()}
    </div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:space-evenly;min-height:0">
      ${items.map(it=>`<div style="display:flex;align-items:baseline;width:100%">
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
  const stats = [
    { n:'65%', label:'des coureurs se blessent chaque année', color:'#E8237A' },
    { n:'3×', label:'plus lent : l\'adaptation des tendons vs muscles', color:'#8B2FC9' },
    { n:'10%', label:'d\'augmentation de charge maximum par semaine', color:'#06B6D4' },
    { n:'2×', label:'plus de risques avec moins de 7h de sommeil', color:'#22C55E' },
  ]
  const causes = [
    { icon:'📈', title:'Progression trop rapide', desc:'L\'erreur la plus fréquente. Le corps a besoin de temps pour s\'adapter : les tendons, os et articulations s\'adaptent 3 fois plus lentement que les muscles. Le corps peut sembler "en forme" alors que les structures passives sont déjà en surcharge.', color:'rgba(232,35,122,.15)', border:'rgba(232,35,122,.3)' },
    { icon:'🔧', title:'Manque de renforcement', desc:'Un coureur qui ne fait que courir accumule des déséquilibres musculaires dangereux. Les fessiers, les tibias antérieurs et le gainage sont souvent trop faibles pour protéger efficacement les genoux, les hanches et les chevilles lors des impacts répétés.', color:'rgba(249,115,22,.15)', border:'rgba(249,115,22,.3)' },
    { icon:'😴', title:'Récupération sous-estimée', desc:'La performance et l\'adaptation se construisent pendant le repos, pas pendant l\'effort. C\'est lors du sommeil que le corps répare les micro-lésions et renforce les tissus. Moins de 7h de sommeil par nuit multiplie par deux le risque de blessure selon les études.', color:'rgba(139,47,201,.15)', border:'rgba(139,47,201,.3)' },
    { icon:'👟', title:'Équipement inadapté', desc:'Une chaussure usée après 800 km ou mal adaptée à ta morphologie peut créer des douleurs chroniques sur toute la chaîne cinétique : pied, cheville, genou, hanche et dos. La rotation de deux paires différentes réduit de 40% le risque de blessure.', color:'rgba(6,182,212,.15)', border:'rgba(6,182,212,.3)' },
  ]
  return `<div class="page">
    ${blobs('B')}
    <div style="text-align:center;flex-shrink:0">
      <div class="page-tag">Préambule</div>
      ${gradText('Introduction', { sizePt:30, weight:800 })}
      ${svgTitleDeco()}
    </div>
    <div class="page-intro">
      Courir, c'est l'une des activités les plus naturelles et accessibles qui soit. Pourtant, les statistiques sont sans appel : ${hl('près de 65% des coureurs se blessent chaque année')}, souvent pour des raisons qui auraient pu être évitées avec un peu de méthode.
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;flex-shrink:0">
      ${stats.map(s=>`<div style="border-radius:11px;padding:11px 10px;text-align:center;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)">
        <div style="font-size:20pt;font-weight:900;background:linear-gradient(135deg,${s.color},#E8237A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1.1">${s.n}</div>
        <div style="font-size:10pt;color:rgba(255,255,255,.62);line-height:1.45;margin-top:4px">${s.label}</div>
      </div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;flex-shrink:0">
      ${causes.map(c=>`<div style="border-radius:12px;padding:12px 13px;background:${c.color};border:1px solid ${c.border}">
        <div style="font-size:20px;margin-bottom:5px">${c.icon}</div>
        <div style="font-size:11pt;font-weight:800;margin-bottom:4px">${c.title}</div>
        <div style="font-size:10pt;color:rgba(255,255,255,.78);line-height:1.55;text-align:justify">${c.desc}</div>
      </div>`).join('')}
    </div>
    <div style="background:linear-gradient(135deg,rgba(139,47,201,.12),rgba(232,35,122,.08));border:1px solid rgba(139,47,201,.25);border-radius:12px;padding:12px 16px;flex-shrink:0">
      <div style="font-size:10pt;color:rgba(255,255,255,.82);line-height:1.65;text-align:justify">
        Ce guide est le fruit d'années d'expérience sur le terrain avec des coureurs de tous niveaux. Les protocoles présentés ici sont issus des ${hl('dernières recherches en médecine du sport')} et adaptés à la réalité de l'entraînement quotidien. L'objectif n'est pas de te faire peur, mais de te donner les outils concrets pour rester sur les routes le plus longtemps possible et progresser ${hl('sans interruption forcée')}.
      </div>
    </div>
    ${pageNum('3')}
  </div>`
}

function pageBlessures() {
  return `<div class="page">
    ${blobs('A')}
    <div style="text-align:center;flex-shrink:0">
      <div class="page-tag">Chapitre 1</div>
      ${gradText('Les 6 blessures courantes', { sizePt:26, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    <div class="blessure-grid">
      ${BLESSURES.map(b=>`<div class="blessure-card" style="background:${b.bg};border-color:${b.border}">
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
          <div style="width:32px;height:32px;border-radius:8px;background:${b.bg};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${b.icon}</div>
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

function pageRenforcement(exos, pageN, part) {
  return `<div class="page">
    ${blobs(part===1?'B':'A')}
    <div style="text-align:center;flex-shrink:0">
      <div class="page-tag">Chapitre 2 — Partie ${part}/2</div>
      ${gradText('Programme de renforcement', { sizePt:26, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    ${part===1?`<div class="page-intro" style="text-align:justify">${hl('2 séances/semaine')} suffisent pour construire une armure musculaire solide. Ces exercices ciblent les zones les plus sollicitées en course. Respecte le temps de récupération entre les séries : 60 à 90 secondes.</div>`:''}
    <div class="exo-list">
      ${exos.map(e=>`<div class="exo-row">
        ${exoPicto(e.emoji, e.zoneColor)}
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
  return `<div class="page">
    ${blobs('B')}
    <div style="text-align:center;flex-shrink:0">
      <div class="page-tag">Chapitre 3</div>
      ${gradText('Étirements essentiels', { sizePt:27, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    <div class="page-intro" style="text-align:justify">
      Les étirements doivent être pratiqués ${hl('après l\'effort uniquement')}, jamais à froid avant de courir. Tiens chaque position sans rebonds, en respirant lentement et régulièrement. La régularité quotidienne prime sur l'intensité.
    </div>
    <div class="etir-grid">
      ${ETIREMENTS.map(e=>`<div class="etir-card">
        ${etirPicto(e.emoji, e.color)}
        <div class="etir-title">${e.title}</div>
        <div class="etir-muscle">${e.muscle}</div>
        <div class="etir-dose">${e.dose}</div>
        <div class="etir-sep"></div>
        <div class="etir-desc">${e.desc}</div>
      </div>`).join('')}
    </div>
    <div style="background:rgba(139,47,201,.1);border:1px solid rgba(139,47,201,.3);border-radius:12px;padding:12px 16px;flex-shrink:0">
      <div style="font-size:11pt;font-weight:700;color:#C084FC;margin-bottom:4px">Règle d'or</div>
      <div style="font-size:10pt;color:rgba(255,255,255,.8);line-height:1.6;text-align:justify">
        Ne jamais s'étirer sur une douleur aiguë. Si une zone est douloureuse, consulte un kinésithérapeute avant de reprendre. La douleur pendant un étirement n'est ${hl('jamais normale')} et doit alerter immédiatement.
      </div>
    </div>
    ${pageNum('7')}
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
    { icon:'📊', title:'Règle des 10%', desc:'N\'augmente jamais ton volume de plus de 10% par semaine. Applique un cycle 3 semaines de charge / 1 semaine de décharge pour optimiser la surcompensation.', color:'rgba(139,47,201,.15)', border:'rgba(139,47,201,.3)' },
    { icon:'🌡️', title:'Signaux d\'alarme', desc:'Un RPE constamment élevé, des douleurs inhabituelles ou une fatigue persistante au réveil sont des signaux d\'alarme. Réduire immédiatement la charge avant d\'aggraver.', color:'rgba(232,35,122,.15)', border:'rgba(232,35,122,.3)' },
    { icon:'💤', title:'Sommeil = récupération', desc:'Moins de 7h de sommeil multiplie par 2 le risque de blessure. Priorise le sommeil autant que l\'entraînement : c\'est pendant la nuit que le corps se renforce vraiment.', color:'rgba(6,182,212,.15)', border:'rgba(6,182,212,.3)' },
    { icon:'🔄', title:'Semaine de décharge', desc:'Toutes les 3 à 4 semaines, réduis le volume de 30 à 40%. Cette décharge planifiée déclenche la surcompensation et permet les progrès durables sur la longue durée.', color:'rgba(34,197,94,.15)', border:'rgba(34,197,94,.3)' },
  ]
  return `<div class="page">
    ${blobs('A')}
    <div style="text-align:center;flex-shrink:0">
      <div class="page-tag">Chapitre 4</div>
      ${gradText('Gestion de la charge', { sizePt:27, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    <div class="page-intro" style="text-align:justify">
      La ${hl('surcharge chronique')} est la première cause de blessure chez le coureur. Le corps s'adapte si on lui laisse le temps. La règle d'or : n'augmenter qu'un seul paramètre à la fois et planifier la récupération comme une séance à part entière.
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;flex-shrink:0">
      ${infoCards.map(c=>`<div style="border-radius:12px;padding:11px 13px;background:${c.color};border:1px solid ${c.border}">
        <div style="font-size:20px;margin-bottom:4px">${c.icon}</div>
        <div style="font-size:11pt;font-weight:800;margin-bottom:4px">${c.title}</div>
        <div style="font-size:10pt;color:rgba(255,255,255,.78);line-height:1.55;text-align:justify">${c.desc}</div>
      </div>`).join('')}
    </div>
    <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:13px 15px;flex-shrink:0">
      <div style="font-size:10pt;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px">Variables à surveiller et équilibrer</div>
      <div style="display:flex;flex-direction:column;gap:9px">
        ${barData.map(b=>`<div class="charge-row">
          <div class="charge-label">${b.label}</div>
          <div class="charge-bar-wrap">
            <div class="charge-bar" style="width:${b.pct}%;background:linear-gradient(90deg,${b.c1},${b.c2})"></div>
          </div>
          <div style="font-size:10pt;font-weight:800;color:${b.c1};width:40px;text-align:right;flex-shrink:0">${b.pct}%</div>
          <div style="font-size:10pt;color:rgba(255,255,255,.45);width:200px;text-align:right;flex-shrink:0">${b.note}</div>
        </div>`).join('')}
      </div>
    </div>
    ${pageNum('8')}
  </div>`
}

function pagePeaceLove() {
  return `<div class="page">
    ${blobs('B')}
    <div style="text-align:center;flex-shrink:0">
      <div class="page-tag">Chapitre 5</div>
      ${gradText('Protocole PEACE & LOVE', { sizePt:26, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    <div class="page-intro" style="text-align:justify">
      Le protocole PEACE & LOVE remplace l'ancien RICE (Repos, Glace, Compression, Élévation). Il intègre les ${hl('dernières recherches en médecine du sport')} pour une gestion complète et éprouvée des blessures aiguës.
    </div>
    <div class="peace-grid">
      ${PEACE_LOVE.map((p,i)=>{
        const col = PEACE_COLORS[i]
        return `<div class="peace-row" style="background:${col.bg};border:1px solid ${col.border}">
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
    { icon:'🏃', title:'Chaussure d\'entraînement daily', desc:'Amorti modéré, durabilité maximale. Pour les footings quotidiens. À renouveler tous les 600 à 800 km : les propriétés amorties disparaissent avant que la semelle ne soit usée visuellement. Base indispensable.', color:'rgba(139,47,201,.15)', border:'rgba(139,47,201,.3)' },
    { icon:'⚡', title:'Chaussure de vitesse / plaquée', desc:'Carbone ou nylon rigide pour les séances intenses et les compétitions. Ne pas utiliser pour les footings quotidiens : le drop très bas et la rigidité entraînent une surcharge tendineuse avérée si l\'usage est trop fréquent.', color:'rgba(232,35,122,.15)', border:'rgba(232,35,122,.3)' },
    { icon:'🏔️', title:'Trail et chaussure de stabilité', desc:'Drop bas et semelle adhérente pour le trail. Sur route, la chaussure de stabilité est recommandée en cas de pronation excessive confirmée par un podologue. Elle corrige le valgus sans pour autant rigidifier le pied.', color:'rgba(6,182,212,.15)', border:'rgba(6,182,212,.3)' },
    { icon:'🔄', title:'Rotation de 2 à 3 paires', desc:'Alterner plusieurs paires différentes réduit de 40% le risque de blessure selon les études. Chaque modèle sollicite différemment le pied et les articulations, permettant une meilleure récupération des tissus entre les sorties.', color:'rgba(34,197,94,.15)', border:'rgba(34,197,94,.3)' },
    { icon:'📏', title:'Bilan podologique régulier', desc:'Un bilan biomécanique est conseillé tous les 2 ans ou après une blessure répétée. Des semelles orthopédiques sur-mesure peuvent corriger des déséquilibres structurels qui fragilisent l\'ensemble de la chaîne cinétique du bas du corps.', color:'rgba(234,179,8,.15)', border:'rgba(234,179,8,.3)' },
  ]
  return `<div class="page">
    ${blobs('A')}
    <div style="text-align:center;flex-shrink:0">
      <div class="page-tag">Chapitre 6</div>
      ${gradText('Chaussures et matériel', { sizePt:27, weight:800 })}
      ${svgTitleDeco()}
      ${svgWave()}
    </div>
    <div class="page-intro" style="text-align:justify">
      Le choix de la chaussure est souvent ${hl('sous-estimé')}, alors qu'il est l'un des facteurs les plus importants dans la prévention des blessures. Une chaussure inadaptée peut créer des problèmes sur toute la chaîne cinétique.
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
    ${pageNum('10')}
  </div>`
}

function pageCTA() {
  const plans = [
    { icon:'🏃', name:'Plan 10 km',     duration:'8 semaines',  price:'14,99€', color:'rgba(6,182,212,.15)',  border:'rgba(6,182,212,.35)',  tc:'#67E8F9' },
    { icon:'🏃', name:'Plan 10 km',     duration:'12 semaines', price:'17,99€', color:'rgba(6,182,212,.1)',   border:'rgba(6,182,212,.25)',  tc:'#67E8F9' },
    { icon:'🏅', name:'Semi-Marathon',  duration:'12 semaines', price:'19,99€', color:'rgba(139,47,201,.15)', border:'rgba(139,47,201,.35)', tc:'#C084FC' },
    { icon:'🏆', name:'Marathon',       duration:'12 semaines', price:'22,99€', color:'rgba(232,35,122,.15)', border:'rgba(232,35,122,.35)', tc:'#F9A8D4' },
    { icon:'🏆', name:'Marathon',       duration:'16 semaines', price:'24,99€', color:'rgba(232,35,122,.1)',  border:'rgba(232,35,122,.25)', tc:'#F9A8D4' },
  ]
  return `<div class="page cta-page">
    ${blobs('B')}
    <div style="text-align:center;flex-shrink:0">
      <div class="page-tag">Passe à l'action</div>
      ${gradText('Prêt à courir plus intelligent ?', { sizePt:24, weight:800 })}
      ${svgDiamond()}
      <div style="font-size:10pt;color:rgba(255,255,255,.65);margin-top:6px;line-height:1.6">Tu as maintenant toutes les clés. La prochaine étape : un plan structuré qui respecte tes capacités et te fait progresser sans te blesser.</div>
    </div>
    <div style="flex-shrink:0">
      ${gradText('Nos plans d\'entraînement PDF', { sizePt:13, weight:700 })}
      <div style="height:8px"></div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px">
        ${plans.map(p=>`<div style="border-radius:12px;padding:11px 9px;background:${p.color};border:1px solid ${p.border};display:flex;flex-direction:column;gap:5px;text-align:center">
          <div style="font-size:22px">${p.icon}</div>
          <div style="font-size:10pt;font-weight:800;color:#fff;line-height:1.2">${p.name}</div>
          <div style="font-size:10pt;color:${p.tc};font-weight:700">${p.duration}</div>
          <div style="font-size:16pt;font-weight:900;background:linear-gradient(135deg,#8B2FC9,#E8237A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-top:3px">${p.price}</div>
        </div>`).join('')}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;flex-shrink:0">
      <div style="border-radius:14px;padding:16px;background:linear-gradient(135deg,rgba(139,47,201,.2),rgba(232,35,122,.15));border:1px solid rgba(139,47,201,.4)">
        <div style="font-size:22px;margin-bottom:6px">🎯</div>
        <div style="font-size:11pt;font-weight:800;margin-bottom:5px">Guide Anti-Blessure</div>
        <div style="font-size:10pt;color:rgba(255,255,255,.72);line-height:1.55;margin-bottom:8px">Tu lis ce guide. Partage-le à un coureur qui en a besoin pour courir plus longtemps.</div>
        <div style="font-size:16pt;font-weight:900;background:linear-gradient(135deg,#8B2FC9,#E8237A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">14,99€</div>
      </div>
      <div style="border-radius:14px;padding:16px;background:linear-gradient(135deg,rgba(234,179,8,.15),rgba(249,115,22,.1));border:1px solid rgba(234,179,8,.35)">
        <div style="font-size:22px;margin-bottom:6px">🏆</div>
        <div style="font-size:11pt;font-weight:800;margin-bottom:5px">Coaching personnalisé</div>
        <div style="font-size:10pt;color:rgba(255,255,255,.72);line-height:1.55;margin-bottom:8px">Plan 100% sur-mesure, suivi hebdomadaire et messagerie directe avec ton coach Alexis.</div>
        <div style="font-size:10pt;font-weight:700;color:#FDE047">Disponible sur theultimateacademy.fr</div>
      </div>
    </div>
    <div style="flex-shrink:0;border-radius:16px;padding:18px 22px;background:linear-gradient(135deg,#8B2FC9,#E8237A);text-align:center;position:relative;overflow:hidden">
      <div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.08)"></div>
      <div style="position:absolute;bottom:-20px;left:-20px;width:80px;height:80px;border-radius:50%;background:rgba(0,0,0,.1)"></div>
      <div style="position:relative;z-index:1">
        <div style="font-size:14pt;font-weight:900;color:white;margin-bottom:5px">Rejoins The Ultimate Academy</div>
        <div style="font-size:10pt;color:rgba(255,255,255,.9);line-height:1.6;margin-bottom:10px">Des centaines de coureurs ont déjà transformé leur entraînement.<br>C'est ton tour de courir plus loin, plus vite et sans blessure.</div>
        <div style="font-size:14pt;font-weight:900;color:white;letter-spacing:.06em">theultimateacademy.fr</div>
      </div>
    </div>
    <div style="flex-shrink:0;text-align:center;font-size:10pt;color:rgba(255,255,255,.25);letter-spacing:.06em">
      © The Ultimate Academy — Alexis Élie, Coach Athlétisme
    </div>
    ${pageNum('11')}
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
${pageBlessures()}
${pageRenforcement(EXERCICES.slice(0,5), 5, 1)}
${pageRenforcement(EXERCICES.slice(5,10), 6, 2)}
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
  console.log(`PDF généré : ${outPath} (${Math.round(size/1024)} KB, 11 pages)`)
})()
