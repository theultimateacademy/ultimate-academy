/**
 * Génère le PDF "Plan 10km — 8 semaines"
 * Usage: node scripts/generate-ebook-10km-8sem.js
 */
const PDFDocument = require('pdfkit');
const fs          = require('fs');
const path        = require('path');

const OUT = path.join(__dirname, '../public/ebooks/10km-8sem.pdf');
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const doc = new PDFDocument({ size: 'A4', margin: 50 });
doc.pipe(fs.createWriteStream(OUT));

// ── Palette ─────────────────────────────────────────────────────────────────
const PURPLE   = '#8B2FC9';
const PINK     = '#E8237A';
const DARK     = '#0C0A18';
const TEXT     = '#1F1F3A';
const MUTED    = '#6B7280';
const SUCCESS  = '#10B981';
const BORDER   = '#E5E7EB';
const W        = 595 - 100; // usable width at margin 50

// ── Helpers ──────────────────────────────────────────────────────────────────
function gradientRect(x, y, w, h) {
  // Simulate gradient with two fills (PDFKit doesn't support CSS gradients)
  doc.save();
  doc.rect(x, y, w, h).fill(PURPLE);
  doc.restore();
}

function chip(text, x, y, color = PURPLE) {
  const pad = 8; const r = 10; const fs = 9;
  doc.save();
  doc.fontSize(fs).font('Helvetica');
  const tw = doc.widthOfString(text);
  doc.roundedRect(x, y, tw + pad * 2, 18, r).fill(color + '22').stroke(color + '66');
  doc.fill(color).text(text, x + pad, y + 4, { lineBreak: false });
  doc.restore();
  return tw + pad * 2 + 8;
}

function section(title, y) {
  doc.save();
  doc.rect(50, y, 4, 22).fill(PURPLE);
  doc.fontSize(14).font('Helvetica-Bold').fill(TEXT).text(title, 62, y + 3);
  doc.restore();
  return y + 32;
}

function hline(y) {
  doc.save().strokeColor(BORDER).lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke().restore();
}

function addPage() { doc.addPage(); return 50; }

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 1 — COUVERTURE
// ══════════════════════════════════════════════════════════════════════════════
doc.rect(0, 0, 595, 842).fill(DARK);

// Gradient orbs
doc.save();
doc.circle(500, 150, 220).fill(PURPLE + '30');
doc.circle(100, 700, 180).fill(PINK + '25');
doc.restore();

// Logo / marque
doc.fontSize(11).font('Helvetica').fill('rgba(255,255,255,0.5)')
   .text('THE ULTIMATE ACADEMY', 0, 120, { align: 'center', characterSpacing: 3 });

// Titre principal
doc.fontSize(52).font('Helvetica-Bold').fill('#FFFFFF')
   .text('PLAN 10KM', 0, 200, { align: 'center' });

// Trait décoratif
doc.save().rect(200, 270, 195, 4).fill(PINK).restore();

// Sous-titre
doc.fontSize(28).font('Helvetica').fill('rgba(255,255,255,0.85)')
   .text('8 SEMAINES', 0, 290, { align: 'center' });

// Description
doc.fontSize(13).font('Helvetica').fill('rgba(255,255,255,0.55)')
   .text('Plan structuré · VMA personnalisée · Stratégie de course', 0, 340, { align: 'center' });

// Chips
const chipY = 440;
const chips = ['Intermédiaire', '5 séances / sem', 'Toutes VMA'];
const totalW = chips.reduce((a, t) => a + doc.fontSize(9).font('Helvetica').widthOfString(t) + 24, 0) + 16 * (chips.length - 1);
let chipX = (595 - totalW) / 2;
chips.forEach(t => {
  doc.save();
  const tw = doc.fontSize(9).font('Helvetica').widthOfString(t) + 24;
  doc.roundedRect(chipX, chipY, tw, 24, 12).stroke('rgba(255,255,255,0.3)');
  doc.fill('rgba(255,255,255,0.85)').fontSize(9).font('Helvetica').text(t, chipX + 12, chipY + 7, { lineBreak: false });
  doc.restore();
  chipX += tw + 16;
});

// Ligne bas
doc.save().rect(0, 800, 595, 42).fill(PURPLE + 'AA').restore();
doc.fontSize(10).font('Helvetica').fill('rgba(255,255,255,0.7)')
   .text('by Alexis — The Ultimate Academy · theultimateacademy.fr', 0, 814, { align: 'center' });

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 2 — INTRODUCTION
// ══════════════════════════════════════════════════════════════════════════════
let y = addPage();
y = section('Bienvenue dans ton plan', y);

doc.fontSize(11).font('Helvetica').fill(TEXT).text(
  'Ce plan de 8 semaines est conçu pour les coureurs ayant déjà une base d\'endurance solide — capables de courir 30 minutes sans s\'arrêter — et souhaitant préparer sérieusement un 10km.',
  50, y, { width: W, lineGap: 4 }
);
y += 65;

doc.fontSize(11).font('Helvetica').fill(TEXT).text(
  'Il combine les trois piliers de la progression en running : l\'endurance fondamentale (80% du volume), le développement VMA (fractionnés), et la spécificité course (tempo et allure objectif). Chaque semaine est pensée pour construire progressivement tes capacités sans te blesser.',
  50, y, { width: W, lineGap: 4 }
);
y += 80;

hline(y); y += 20;
y = section('Ce que ce plan va t\'apporter', y);

const bullets = [
  ['📈', 'Progression VMA', 'Des séances de fractionné court et long pour reculer tes limites aérobies.'],
  ['⏱', 'Endurance spécifique', 'Tempos et allures ciblées pour tenir le rythme sur 10km.'],
  ['💪', 'Solidité musculaire', 'Volume progressif pour construire la résistance sans blessure.'],
  ['🎯', 'Stratégie de course', 'Un plan km par km pour bien gérer ton effort le jour J.'],
];

bullets.forEach(([icon, title, text]) => {
  doc.save();
  doc.roundedRect(50, y, W, 54, 8).fill('#F9F5FF').stroke(PURPLE + '30');
  doc.fontSize(18).text(icon, 68, y + 17, { lineBreak: false });
  doc.fontSize(10).font('Helvetica-Bold').fill(PURPLE).text(title, 100, y + 10, { lineBreak: false });
  doc.fontSize(9.5).font('Helvetica').fill(MUTED).text(text, 100, y + 26, { width: W - 70, lineBreak: false });
  doc.restore();
  y += 64;
});

hline(y); y += 20;
y = section('Comment utiliser ce plan', y);

doc.fontSize(10.5).font('Helvetica').fill(TEXT).text(
  'Chaque semaine contient 4 à 5 séances. Respecte l\'ordre des séances et ne saute pas l\'échauffement (minimum 15 minutes de footing EF) ni le retour au calme (10 minutes). Adapte les allures à ta VMA réelle — voir page suivante.',
  50, y, { width: W, lineGap: 4 }
);

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 3 — CALCULE TES ALLURES
// ══════════════════════════════════════════════════════════════════════════════
y = addPage();
y = section('Calcule tes allures personnalisées', y);

doc.fontSize(11).font('Helvetica').fill(TEXT).text(
  'Toutes les séances de ce plan sont exprimées en % de ta VMA (Vitesse Maximale Aérobie). C\'est la méthode la plus précise pour s\'entraîner efficacement quelle que soit ton niveau.',
  50, y, { width: W, lineGap: 4 }
);
y += 55;

// Encadré calculateur
doc.save();
doc.roundedRect(50, y, W, 80, 12).fill(PURPLE + '15').stroke(PURPLE + '60');
doc.fontSize(11).font('Helvetica-Bold').fill(PURPLE)
   .text('⚡ Calcule ta VMA et tes allures gratuitement', 70, y + 12, { width: W - 40 });
doc.fontSize(10).font('Helvetica').fill(TEXT)
   .text('Rends-toi sur : theultimateacademy.fr/calculateur/vma', 70, y + 32, { width: W - 40 });
doc.fontSize(9).font('Helvetica').fill(MUTED)
   .text('Tu obtiens instantanément tes allures personnalisées pour chaque zone d\'entraînement.', 70, y + 50, { width: W - 40 });
doc.restore();
y += 96;

// Tableau d'exemple VMA 14 km/h
hline(y); y += 16;
doc.fontSize(11).font('Helvetica-Bold').fill(TEXT).text('Exemple : VMA 14 km/h', 50, y); y += 24;

const tableHeaders = ['Zone', '% VMA', 'Vitesse', 'Allure /km', 'Ressenti'];
const tableRows = [
  ['EF',     '65%',  '9,1 km/h',  "6'36/km", 'Conversation facile'],
  ['Endurance', '75%', '10,5 km/h', "5'43/km", 'Comfortable mais soutenu'],
  ['Seuil',  '85%',  '11,9 km/h', "5'02/km", 'Difficile, tenu 30-40 min'],
  ['VMA',    '95%',  '13,3 km/h', "4'30/km", 'Très difficile, 6-8 min'],
  ['VMA max','100%', '14,0 km/h', "4'17/km", 'Effort maximal, 3-4 min'],
];

const colW = [55, 55, 75, 75, W - 260];
let tx = 50;

// En-têtes tableau
doc.save().rect(50, y, W, 22).fill(PURPLE).restore();
tableHeaders.forEach((h, i) => {
  doc.fontSize(8.5).font('Helvetica-Bold').fill('#FFFFFF').text(h, tx + 4, y + 7, { width: colW[i] - 4, lineBreak: false });
  tx += colW[i];
});
y += 22;

tableRows.forEach(([zone, pct, spd, pace, feel], ri) => {
  const bg = ri % 2 === 0 ? '#FAFAFA' : '#FFFFFF';
  doc.save().rect(50, y, W, 22).fill(bg).restore();
  tx = 50;
  [zone, pct, spd, pace, feel].forEach((cell, i) => {
    const color = i === 0 ? PURPLE : TEXT;
    const font  = i === 0 ? 'Helvetica-Bold' : 'Helvetica';
    doc.fontSize(8.5).font(font).fill(color).text(cell, tx + 4, y + 7, { width: colW[i] - 4, lineBreak: false });
    tx += colW[i];
  });
  // Horizontal border
  doc.save().strokeColor(BORDER).lineWidth(0.4).moveTo(50, y + 22).lineTo(545, y + 22).stroke().restore();
  y += 22;
});

y += 20;
doc.save().rect(50, y, W, 48).roundedRect(50, y, W, 48, 8).fill('#FFF7ED').stroke('#F59E0B44').restore();
doc.fontSize(9).font('Helvetica-Bold').fill('#D97706').text('💡 Conseil', 68, y + 8, { lineBreak: false });
doc.fontSize(9).font('Helvetica').fill(TEXT)
   .text('Si tu ne connais pas ta VMA, commence par le test Cooper sur notre site. Il te donnera une estimation précise en 12 minutes.', 68, y + 22, { width: W - 36 });

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 4 — PRINCIPES DU PLAN
// ══════════════════════════════════════════════════════════════════════════════
y = addPage();
y = section('Les principes de ce plan', y);

const principles = [
  { icon: '80/20', color: SUCCESS, title: 'La règle 80/20', body: '80% de ton volume à faible intensité (EF), 20% à haute intensité. Cette répartition est validée scientifiquement pour progresser durablement sans surentraînement.' },
  { icon: '🔥',   color: PURPLE,  title: 'Échauffement minimum 15 min', body: 'Chaque séance commence par 15 minutes de footing EF. L\'échauffement réduit drastiquement le risque de blessure et améliore la qualité de la séance principale.' },
  { icon: '❄️',   color: '#06B6D4', title: 'Retour au calme minimum 10 min', body: '10 minutes de footing lent après chaque séance intense. Accélère la récupération, élimine les déchets métaboliques, réduit les courbatures.' },
  { icon: '+10%', color: '#F59E0B', title: 'Progressivité du volume', body: 'Le volume kilométrique augmente de 10% maximum par semaine. Dépasser ce seuil est la première cause de blessure chez les coureurs.' },
  { icon: '💪',  color: PINK,    title: 'Renforcement musculaire', body: '1 séance de gainage et renforcement par semaine est recommandée. Elle n\'est pas dans le plan mais dans le guide anti-blessure. Genoux, hanches, chevilles — les zones clés du coureur.' },
];

principles.forEach(p => {
  doc.save().roundedRect(50, y, W, 62, 10).fill('#F9F5FF').stroke(p.color + '40').restore();
  // Icône / badge
  doc.save().circle(76, y + 31, 18).fill(p.color + '22').restore();
  doc.fontSize(p.icon.length > 2 ? 8 : 13).font('Helvetica-Bold').fill(p.color)
     .text(p.icon, 58, p.icon.length > 2 ? y + 26 : y + 22, { width: 36, align: 'center', lineBreak: false });
  // Texte
  doc.fontSize(10).font('Helvetica-Bold').fill(TEXT).text(p.title, 104, y + 10, { width: W - 64 });
  doc.fontSize(9).font('Helvetica').fill(MUTED).text(p.body, 104, y + 26, { width: W - 64, lineGap: 2 });
  doc.restore();
  y += 72;
});

// ══════════════════════════════════════════════════════════════════════════════
// PAGES 5-12 — LE PLAN SEMAINE PAR SEMAINE
// ══════════════════════════════════════════════════════════════════════════════
const WEEKS = [
  { num: 1, phase: 'Adaptation', charge: 'Modérée', seances: [
    { jour: 'Lun', type: 'Repos', titre: 'Repos actif ou étirements', duree: '', detail: '' },
    { jour: 'Mar', type: 'EF', titre: 'Footing endurance fondamentale', duree: '40 min', detail: 'EF continu 65-70% VMA' },
    { jour: 'Mer', type: 'Repos', titre: 'Repos', duree: '', detail: '' },
    { jour: 'Jeu', type: 'Fractionné', titre: '10×400m à 95-100% VMA', duree: '55 min', detail: 'Échauff. 15 min · 10×400m (récup. 90s) · Retour 10 min' },
    { jour: 'Ven', type: 'Repos', titre: 'Repos', duree: '', detail: '' },
    { jour: 'Sam', type: 'EF', titre: 'Footing récupération', duree: '30 min', detail: '65% VMA — très facile' },
    { jour: 'Dim', type: 'Sortie Longue', titre: 'Sortie longue 75 min', duree: '75 min', detail: '70-75% VMA — conversation possible' },
  ]},
  { num: 2, phase: 'Adaptation', charge: 'Modérée +', seances: [
    { jour: 'Lun', type: 'Repos', titre: 'Repos', duree: '', detail: '' },
    { jour: 'Mar', type: 'EF', titre: 'Footing endurance fondamentale', duree: '45 min', detail: 'EF continu 65-70% VMA' },
    { jour: 'Mer', type: 'Repos', titre: 'Repos actif', duree: '', detail: '' },
    { jour: 'Jeu', type: 'Fractionné', titre: '12×400m à 95-100% VMA', duree: '60 min', detail: 'Échauff. 15 min · 12×400m (récup. 90s) · Retour 10 min' },
    { jour: 'Ven', type: 'Repos', titre: 'Repos', duree: '', detail: '' },
    { jour: 'Sam', type: 'EF', titre: 'Footing récupération', duree: '35 min', detail: '65% VMA' },
    { jour: 'Dim', type: 'Sortie Longue', titre: 'Sortie longue 80 min', duree: '80 min', detail: '70-75% VMA' },
  ]},
  { num: 3, phase: 'Développement', charge: 'Élevée', seances: [
    { jour: 'Lun', type: 'Repos', titre: 'Repos', duree: '', detail: '' },
    { jour: 'Mar', type: 'EF', titre: 'Footing long EF', duree: '50 min', detail: '70% VMA — volume' },
    { jour: 'Mer', type: 'Tempo', titre: 'Tempo continu 20 min', duree: '50 min', detail: 'Échauff. 15 min · Tempo 20 min à 85% VMA · Retour 15 min' },
    { jour: 'Jeu', type: 'Repos', titre: 'Repos actif', duree: '', detail: '' },
    { jour: 'Ven', type: 'Fractionné', titre: '5×1000m à 85-88% VMA', duree: '60 min', detail: 'Échauff. 15 min · 5×1000m (récup. 2 min) · Retour 10 min' },
    { jour: 'Sam', type: 'Repos', titre: 'Repos', duree: '', detail: '' },
    { jour: 'Dim', type: 'Sortie Longue', titre: 'Sortie longue avec accélération finale', duree: '85 min', detail: '70-75% VMA · Derniers 15 min à 80-82% VMA' },
  ]},
  { num: 4, phase: 'Développement', charge: 'Élevée', seances: [
    { jour: 'Lun', type: 'Repos', titre: 'Repos', duree: '', detail: '' },
    { jour: 'Mar', type: 'EF', titre: 'Footing long EF', duree: '55 min', detail: '70% VMA' },
    { jour: 'Mer', type: 'Tempo', titre: 'Tempo 2×15 min', duree: '55 min', detail: 'Échauff. 15 min · 2×15 min à 85% VMA (récup. 3 min) · Retour 10 min' },
    { jour: 'Jeu', type: 'Repos', titre: 'Repos actif', duree: '', detail: '' },
    { jour: 'Ven', type: 'Fractionné', titre: '6×1000m à 87-90% VMA', duree: '65 min', detail: 'Échauff. 15 min · 6×1000m (récup. 2 min) · Retour 10 min' },
    { jour: 'Sam', type: 'Repos', titre: 'Repos', duree: '', detail: '' },
    { jour: 'Dim', type: 'Sortie Longue', titre: 'Sortie longue 90 min', duree: '90 min', detail: '72-75% VMA — focus régularité' },
  ]},
  { num: 5, phase: 'Intensification', charge: 'Élevée +', seances: [
    { jour: 'Lun', type: 'Repos', titre: 'Repos', duree: '', detail: '' },
    { jour: 'Mar', type: 'Côtes', titre: '10×côtes 150m', duree: '55 min', detail: 'Échauff. 20 min · 10×côtes 150m sprint · Retour 15 min' },
    { jour: 'Mer', type: 'Repos', titre: 'Repos actif', duree: '', detail: '' },
    { jour: 'Jeu', type: 'Fractionné', titre: '16×300m à 100-105% VMA', duree: '60 min', detail: 'Échauff. 15 min · 16×300m (récup. 60s) · Retour 10 min' },
    { jour: 'Ven', type: 'Repos', titre: 'Repos', duree: '', detail: '' },
    { jour: 'Sam', type: 'EF', titre: 'Footing récupération', duree: '35 min', detail: '65% VMA' },
    { jour: 'Dim', type: 'Sortie Longue', titre: 'Sortie longue 90 min', duree: '90 min', detail: 'Mi-course : 5 km à allure cible 10km' },
  ]},
  { num: 6, phase: 'Intensification', charge: 'Maximale', seances: [
    { jour: 'Lun', type: 'Repos', titre: 'Repos', duree: '', detail: '' },
    { jour: 'Mar', type: 'Tempo', titre: '3×10 min seuil', duree: '60 min', detail: 'Échauff. 15 min · 3×10 min à 87-90% VMA (récup. 3 min) · Retour 10 min' },
    { jour: 'Mer', type: 'Repos', titre: 'Repos actif', duree: '', detail: '' },
    { jour: 'Jeu', type: 'Spécifique', titre: 'Blocs allure objectif 10km', duree: '60 min', detail: 'Échauff. 15 min · 4×2 km à allure cible 10km (récup. 90s) · Retour 10 min' },
    { jour: 'Ven', type: 'Repos', titre: 'Repos', duree: '', detail: '' },
    { jour: 'Sam', type: 'EF', titre: 'Footing récupération', duree: '35 min', detail: '65% VMA' },
    { jour: 'Dim', type: 'Sortie Longue', titre: 'Sortie longue 85 min', duree: '85 min', detail: '70-75% VMA — dernière longue sortie avant affûtage' },
  ]},
  { num: 7, phase: 'Affûtage', charge: 'Réduite (-40%)', seances: [
    { jour: 'Lun', type: 'Repos', titre: 'Repos total', duree: '', detail: '' },
    { jour: 'Mar', type: 'EF', titre: 'Footing récupération', duree: '30 min', detail: '65% VMA — très léger' },
    { jour: 'Mer', type: 'Repos', titre: 'Repos actif', duree: '', detail: '' },
    { jour: 'Jeu', type: 'Spécifique', titre: 'Allure objectif courte', duree: '40 min', detail: 'Échauff. 15 min · 2×2 km à allure cible · Retour 10 min' },
    { jour: 'Ven', type: 'Repos', titre: 'Repos total', duree: '', detail: '' },
    { jour: 'Sam', type: 'EF', titre: 'Trot de 15 min', duree: '15 min', detail: '65% VMA — jambes légères avant la course' },
    { jour: 'Dim', type: 'Repos', titre: 'Repos total — visualisation', duree: '', detail: 'Prépare ta stratégie de course' },
  ]},
  { num: 8, phase: 'COURSE', charge: 'Course — Donne tout !', seances: [
    { jour: 'Lun', type: 'Repos', titre: 'Repos total', duree: '', detail: '' },
    { jour: 'Mar', type: 'EF', titre: 'Trot très léger', duree: '20 min', detail: '65% VMA — garder les jambes sans les fatiguer' },
    { jour: 'Mer', type: 'Repos', titre: 'Repos total', duree: '', detail: '' },
    { jour: 'Jeu', type: 'Repos', titre: 'Repos actif', duree: '', detail: 'Marche, étirements doux' },
    { jour: 'Ven', type: 'Repos', titre: 'Repos total', duree: '', detail: 'Prépare ton sac, dors tôt' },
    { jour: 'Sam', type: 'Repos', titre: 'Repos total', duree: '', detail: 'Dernier repas adapté le soir' },
    { jour: 'Dim', type: 'COURSE 🏁', titre: 'COURSE 10KM', duree: '~50 min', detail: 'Donne tout — tu es prêt(e) !' },
  ]},
];

const TYPE_COLORS_MAP = {
  'EF': SUCCESS,
  'Fractionné': PURPLE,
  'Tempo': '#F59E0B',
  'Sortie Longue': '#06B6D4',
  'Côtes': '#EF4444',
  'Spécifique': PINK,
  'COURSE 🏁': '#F59E0B',
  'Repos': MUTED,
};

WEEKS.forEach(week => {
  y = addPage();

  // Header semaine
  doc.save().roundedRect(50, y, W, 44, 10)
     .fill(week.phase === 'COURSE' ? PINK : week.phase === 'Affûtage' ? PURPLE + 'CC' : TEXT).restore();
  doc.fontSize(11).font('Helvetica-Bold').fill('#FFFFFF').text(`Semaine ${week.num}`, 68, y + 8, { lineBreak: false });
  doc.fontSize(10).font('Helvetica').fill('rgba(255,255,255,0.7)').text(week.phase, 68, y + 24, { lineBreak: false });
  doc.fontSize(10).font('Helvetica-Bold').fill('rgba(255,255,255,0.85)')
     .text(week.charge, 300, y + 16, { width: W - 260, align: 'right', lineBreak: false });
  y += 56;

  // Tableau des séances
  const cols = [55, 90, 130, 65, W - 340];
  const headers = ['Jour', 'Type', 'Séance', 'Durée', 'Détail'];

  // En-tête tableau
  doc.save().rect(50, y, W, 20).fill('#F3F4F6').restore();
  let tx = 50;
  headers.forEach((h, i) => {
    doc.fontSize(8).font('Helvetica-Bold').fill(MUTED).text(h, tx + 4, y + 6, { width: cols[i] - 4, lineBreak: false });
    tx += cols[i];
  });
  y += 20;

  week.seances.forEach((s, si) => {
    const isRest = s.type === 'Repos';
    const typeColor = TYPE_COLORS_MAP[s.type] || MUTED;
    const rowH = s.detail.length > 50 ? 36 : 28;

    const bg = si % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
    doc.save().rect(50, y, W, rowH).fill(bg).restore();
    // Barre colorée gauche
    if (!isRest) doc.save().rect(50, y, 3, rowH).fill(typeColor).restore();

    tx = 50;
    const vals = [s.jour, s.type, s.titre, s.duree, s.detail];
    vals.forEach((v, i) => {
      const color = i === 1 ? typeColor : (i === 0 ? TEXT : (isRest ? MUTED : TEXT));
      const font  = (i === 0 || i === 1) ? 'Helvetica-Bold' : 'Helvetica';
      doc.fontSize(8).font(font).fill(color).text(v || '', tx + 4, y + 6, { width: cols[i] - 4, lineGap: 2 });
      tx += cols[i];
    });
    doc.save().strokeColor(BORDER).lineWidth(0.3).moveTo(50, y + rowH).lineTo(545, y + rowH).stroke().restore();
    y += rowH;
  });

  // Volume de la semaine
  const runSeances = week.seances.filter(s => s.type !== 'Repos');
  y += 12;
  doc.fontSize(9).font('Helvetica').fill(MUTED)
     .text(`${runSeances.length} séance(s) de course · Repos les autres jours · Écoute ton corps`, 50, y, { width: W });
});

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 13 — STRATÉGIE DE COURSE
// ══════════════════════════════════════════════════════════════════════════════
y = addPage();
y = section('Stratégie de course', y);

doc.fontSize(11).font('Helvetica').fill(TEXT).text(
  'Le 10km se court en 4 phases. La clé : ne pas partir trop vite. Les 2 premiers kilomètres doivent être légèrement en dessous de ton allure cible.',
  50, y, { width: W, lineGap: 4 }
);
y += 55;

const strategy = [
  { km: 'Km 1-2', allure: '-5s/km vs objectif', conseil: 'Contiens l\'euphorie du départ. Laisse les autres partir. Tu les rattraperas.', color: SUCCESS },
  { km: 'Km 3-8', allure: 'Allure cible exacte', conseil: 'Régularité absolue. Utilise ton GPS ou ta montre. Chaque km identique.', color: PURPLE },
  { km: 'Km 9',   allure: '+5s/km si réserves', conseil: 'Évalue tes réserves. Si tu te sens bien, commence à accélérer progressivement.', color: '#F59E0B' },
  { km: 'Km 10',  allure: 'Tout ce qu\'il reste', conseil: 'Donne absolument tout sur le dernier kilomètre. Visualise la ligne d\'arrivée.', color: PINK },
];

strategy.forEach(s => {
  doc.save().roundedRect(50, y, W, 56, 8)
     .fill(s.color + '0F').stroke(s.color + '35').restore();
  doc.fontSize(10).font('Helvetica-Bold').fill(s.color).text(s.km, 68, y + 8, { lineBreak: false });
  doc.fontSize(10).font('Helvetica-Bold').fill(TEXT).text(s.allure, 140, y + 8, { lineBreak: false });
  doc.fontSize(9).font('Helvetica').fill(MUTED).text(s.conseil, 68, y + 26, { width: W - 36 });
  doc.restore();
  y += 66;
});

y += 10;
doc.save().rect(50, y, W, 48).roundedRect(50, y, W, 48, 8).fill('#FFF7ED').stroke('#F59E0B44').restore();
doc.fontSize(10).font('Helvetica-Bold').fill('#D97706').text('Ravitaillement', 68, y + 8);
doc.fontSize(9).font('Helvetica').fill(TEXT)
   .text('Eau au km 5 si disponible. Ne t\'arrête pas — prends le gobelet en courant. Pas de gel pour un 10km sauf si tu as l\'habitude.', 68, y + 24, { width: W - 36 });

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 14 — NUTRITION
// ══════════════════════════════════════════════════════════════════════════════
y = addPage();
y = section('Nutrition du coureur', y);

const nutri = [
  {
    title: 'J-1 avant la course', color: PURPLE, icon: '🍝',
    items: [
      'Dîner riche en glucides complexes (pâtes, riz, pain)',
      'Évite les légumineuses et les crudités (ballonnements)',
      'Pas de nouvel aliment — reste sur ce que tu connais',
      'Bois 1,5 à 2L d\'eau dans la journée',
    ]
  },
  {
    title: 'Matin de la course', color: SUCCESS, icon: '🌅',
    items: [
      'Dernier repas 2h30 à 3h avant le départ',
      'Pain blanc, banane, flocons d\'avoine — facile à digérer',
      'Café si tu en as l\'habitude, pas d\'essai le jour J',
      'Bois 500ml d\'eau jusqu\'au départ',
    ]
  },
  {
    title: 'Récupération après course', color: PINK, icon: '💪',
    items: [
      'Dans les 30 min : eau ou boisson isotonique + banane',
      'Dans les 2h : repas complet protéines + glucides',
      'Évite l\'alcool les 24h suivantes',
      'Continue à t\'hydrater toute la journée',
    ]
  },
];

nutri.forEach(n => {
  doc.save().roundedRect(50, y, W, 100, 10).fill('#F9F5FF').stroke(n.color + '30').restore();
  doc.fontSize(11).font('Helvetica-Bold').fill(n.color).text(`${n.icon}  ${n.title}`, 68, y + 12);
  n.items.forEach((item, i) => {
    doc.fontSize(9).font('Helvetica').fill(TEXT)
       .text(`• ${item}`, 80, y + 34 + i * 15, { width: W - 60 });
  });
  doc.restore();
  y += 112;
});

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 15 — POUR ALLER PLUS LOIN
// ══════════════════════════════════════════════════════════════════════════════
y = addPage();

doc.save().rect(0, 0, 595, 842).fill(DARK).restore();
doc.save().circle(500, 200, 200).fill(PURPLE + '25').restore();
doc.save().circle(80, 650, 160).fill(PINK + '20').restore();

doc.fontSize(32).font('Helvetica-Bold').fill('#FFFFFF')
   .text('Pour aller plus loin', 50, 120, { align: 'center', width: W });

doc.fontSize(13).font('Helvetica').fill('rgba(255,255,255,0.6)')
   .text('Ce plan t\'a plu et tu veux aller encore plus loin dans ta progression ?', 50, 185, { align: 'center', width: W });

// Encadré coaching
doc.save().roundedRect(70, 250, 455, 200, 16)
   .fill('rgba(139,47,201,0.2)').stroke('rgba(139,47,201,0.5)').restore();

doc.fontSize(16).font('Helvetica-Bold').fill('#FFFFFF')
   .text('Coaching personnalisé The Ultimate Academy', 90, 275, { width: 415, align: 'center' });

const benefits = [
  '✓ Plan 100% personnalisé selon ta VMA réelle',
  '✓ Adaptation chaque semaine selon tes retours',
  '✓ Messages du coach Alexis après chaque séance',
  '✓ Analyses VMA, pré-course et post-course',
  '✓ 14 jours d\'essai gratuit — sans engagement',
];

benefits.forEach((b, i) => {
  doc.fontSize(10).font('Helvetica').fill('rgba(255,255,255,0.85)')
     .text(b, 90, 315 + i * 20, { width: 415 });
});

doc.fontSize(14).font('Helvetica-Bold').fill(PINK)
   .text('theultimateacademy.fr', 50, 475, { align: 'center', width: W });

doc.fontSize(10).font('Helvetica').fill('rgba(255,255,255,0.4)')
   .text('© 2025 The Ultimate Academy — Tous droits réservés', 50, 790, { align: 'center', width: W });

// ── Fin ───────────────────────────────────────────────────────────────────────
doc.end();
console.log('PDF généré :', OUT);
