import { useState, useMemo } from 'react'

/* ─── Illustration ──────────────────────────────────────────────────── */
function FoodIllustration({ emoji, color, size = 76 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 20, flexShrink: 0,
      background: `linear-gradient(135deg, ${color}1A 0%, ${color}3D 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.44, boxShadow: `0 4px 16px ${color}25`,
      border: `1.5px solid ${color}30`,
    }}>
      {emoji}
    </div>
  )
}

/* ─── Recipe Modal ──────────────────────────────────────────────────── */
function RecipeModal({ recipe, color, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-handle" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1 }}>
            <FoodIllustration emoji={recipe.emoji} color={color} size={64} />
            <div>
              <h3 style={{ marginBottom: '.25rem' }}>{recipe.name}</h3>
              <div style={{ display: 'flex', gap: '.75rem', fontSize: '.82rem', color: 'var(--text-muted)' }}>
                <span>⏱ {recipe.time}</span>
                <span style={{ color }}>🔥 {recipe.kcal}</span>
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ flexShrink: 0 }}>✕</button>
        </div>

        {recipe.nutrition?.kcal && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.5rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Calories',  val: recipe.nutrition.kcal,  unit: 'kcal', c: color },
              { label: 'Protéines', val: recipe.nutrition.prot,  unit: 'g',    c: '#10B981' },
              { label: 'Glucides',  val: recipe.nutrition.carbs, unit: 'g',    c: '#F59E0B' },
              { label: 'Lipides',   val: recipe.nutrition.fat,   unit: 'g',    c: '#6B7280' },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center', padding: '.75rem .5rem',
                background: 'var(--surface-2)', borderRadius: 'var(--radius)', borderTop: `3px solid ${m.c}` }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: m.c }}>{m.val}{m.unit}</div>
                <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginTop: '.2rem' }}>{m.label}</div>
              </div>
            ))}
          </div>
        )}

        <h4 style={{ marginBottom: '.75rem' }}>Ingrédients</h4>
        <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
          {recipe.ingredients.map((ing, i) => (
            <li key={i} style={{ fontSize: '.9rem', lineHeight: 1.5 }}>{ing}</li>
          ))}
        </ul>

        <h4 style={{ marginBottom: '.75rem' }}>Préparation</h4>
        <ol style={{ paddingLeft: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          {recipe.steps.map((s, i) => (
            <li key={i} style={{ fontSize: '.9rem', lineHeight: 1.6 }}>{s}</li>
          ))}
        </ol>

        {recipe.tip && (
          <div style={{ padding: '1rem', borderRadius: 'var(--radius)',
            background: `linear-gradient(135deg, ${color}0F, ${color}1E)`,
            border: `1.5px solid ${color}30` }}>
            <div style={{ fontWeight: 700, marginBottom: '.4rem', fontSize: '.875rem', color }}>
              💡 Pourquoi c'est parfait pour toi
            </div>
            <p style={{ fontSize: '.875rem', lineHeight: 1.65 }}>{recipe.tip}</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Recipe Card (horizontal) ──────────────────────────────────────── */
function RecipeCard({ recipe, color, onSelect }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem',
      cursor: 'pointer', transition: 'transform .15s, box-shadow .15s', padding: '.875rem' }}
      onClick={() => onSelect(recipe)}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
      <FoodIllustration emoji={recipe.emoji} color={color} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ marginBottom: '.25rem' }}>{recipe.name}</h4>
        <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '.5rem',
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {recipe.shortDesc}
        </p>
        <div style={{ display: 'flex', gap: '.75rem', fontSize: '.78rem', fontWeight: 600 }}>
          <span style={{ color: 'var(--text-muted)' }}>⏱ {recipe.time}</span>
          <span style={{ color }}>🔥 {recipe.kcal}</span>
        </div>
      </div>
      <span style={{ color: 'var(--text-muted)', fontSize: '1rem', flexShrink: 0 }}>›</span>
    </div>
  )
}

/* ─── Data ──────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'quotidien', icon: '🍽️', label: 'Quotidien',  color: '#0EA5E9' },
  { id: 'avant',     icon: '⚡',  label: 'Avant',      color: '#F59E0B' },
  { id: 'pendant',   icon: '🏃',  label: 'Pendant',    color: '#E8237A' },
  { id: 'apres',     icon: '💪',  label: 'Après',      color: '#10B981' },
  { id: 'course',    icon: '🏅',  label: 'Course',     color: '#8B2FC9' },
]

const CONTENT = {
  quotidien: {
    subtitle: 'Tous les jours',
    tips: [
      'Privilégier 3 vrais repas plutôt que de grignoter, les coureurs ont besoin de régularité',
      'Inclure une source de protéines à chaque repas pour la réparation musculaire',
      'Hydratation : minimum 2 L d\'eau par jour, 2,5 L les jours d\'entraînement',
      'Légumes à chaque repas, fruits en collation, les antioxydants accélèrent la récupération',
    ],
    recipes: [
      {
        id: 'pdj-classique', name: 'Petit-déjeuner de champion', emoji: '🌅',
        shortDesc: 'Flocons d\'avoine, œuf, fruit et café. Le petit-déjeuner complet qui couvre tous les besoins du coureur au quotidien.',
        time: '10 min', kcal: '450 kcal',
        nutrition: { kcal: 450, prot: 22, carbs: 58, fat: 14 },
        ingredients: [
          '70 g de flocons d\'avoine',
          '1 œuf dur ou à la coque',
          '1 banane ou une orange',
          '250 ml de lait demi-écrémé ou végétal',
          '1 café noir (optionnel)',
          '1 c.c. de miel',
          '10 g d\'amandes ou noix',
        ],
        steps: [
          'Préparer les flocons avec le lait chaud (micro-ondes 2 min) ou la veille en overnight oats.',
          'Cuire l\'œuf dur 9 min ou à la coque 4 min dans l\'eau bouillante.',
          'Ajouter le miel et les amandes sur les flocons.',
          'Servir avec le fruit et le café.',
        ],
        tip: 'Ce petit-déjeuner apporte les 3 macronutriments dans des proportions idéales pour un coureur actif. L\'avoine libère l\'énergie progressivement pendant 3h. L\'œuf fournit la leucine nécessaire à la synthèse musculaire. À faire chaque matin, même les jours sans entraînement.',
      },
      {
        id: 'dejeuner-complet', name: 'Déjeuner riz-légumes-protéines', emoji: '🍱',
        shortDesc: 'Riz basmati, poulet ou thon, légumes rôtis et huile d\'olive. Le repas de midi équilibré du coureur.',
        time: '25 min', kcal: '560 kcal',
        nutrition: { kcal: 560, prot: 40, carbs: 62, fat: 14 },
        ingredients: [
          '100 g de riz basmati (ou quinoa)',
          '150 g de blanc de poulet, thon en boîte ou tofu',
          '1 courgette + 1 poivron + 1 carotte',
          '2 c.s. d\'huile d\'olive',
          '1 c.c. de curcuma + paprika + sel',
          'Jus de citron frais',
          '1 yaourt nature en dessert',
        ],
        steps: [
          'Cuire le riz à l\'eau salée selon les instructions.',
          'Couper les légumes en dés, faire rôtir 15 min à 200°C avec huile + épices.',
          'Faire cuire la protéine choisie à la poêle ou égoutter le thon.',
          'Assembler : riz + légumes + protéine, arroser de citron.',
          'Terminer avec le yaourt nature (calcium + probiotiques).',
        ],
        tip: 'Ce déjeuner constitue le pilier nutritionnel du coureur actif. Le curcuma est un anti-inflammatoire puissant qui réduit les courbatures musculaires. Le riz basmati a un IG modéré (58), parfait pour maintenir l\'énergie sans pic glycémique. À préparer en batch-cooking le dimanche pour la semaine.',
      },
      {
        id: 'collation-runner', name: 'Collation 16h du coureur', emoji: '🍎',
        shortDesc: 'Pomme, fromage blanc, amandes et miel. La collation idéale 2h avant un entraînement en fin de journée.',
        time: '3 min', kcal: '280 kcal',
        nutrition: { kcal: 280, prot: 18, carbs: 32, fat: 9 },
        ingredients: [
          '150 g de fromage blanc 0% ou 3,2%',
          '1 pomme (ou poire)',
          '15 g d\'amandes (environ 15 pièces)',
          '1 c.c. de miel',
          '1 pincée de cannelle',
        ],
        steps: [
          'Verser le fromage blanc dans un bol.',
          'Couper la pomme en quartiers.',
          'Disposer les amandes, arroser de miel, saupoudrer de cannelle.',
          'Consommer 1h30 à 2h avant l\'entraînement du soir.',
        ],
        tip: 'La collation idéale avant une séance du soir : assez glucidique pour l\'énergie, assez protéinée pour protéger le muscle, assez légère pour ne pas gêner la digestion. Le fromage blanc est la meilleure source de caséine (protéine lente) pour protéger le muscle pendant un entraînement à jeun relatif.',
      },
      {
        id: 'diner-leger', name: 'Dîner récupération saumon-vapeur', emoji: '🐟',
        shortDesc: 'Saumon vapeur, patate douce et haricots verts. Le dîner anti-inflammatoire parfait les soirs sans entraînement.',
        time: '20 min', kcal: '480 kcal',
        nutrition: { kcal: 480, prot: 38, carbs: 42, fat: 16 },
        ingredients: [
          '150 g de pavé de saumon (ou maquereau)',
          '1 patate douce moyenne',
          '200 g de haricots verts',
          '1 c.s. d\'huile d\'olive',
          'Sel, poivre, aneth frais',
          'Jus de citron + zestes',
          '1 c.c. de moutarde à l\'ancienne',
        ],
        steps: [
          'Cuire la patate douce à la vapeur ou au four 20 min.',
          'Cuire le saumon vapeur ou à la poêle avec un filet d\'huile, 4 min / face.',
          'Blanchir les haricots verts 5 min dans l\'eau bouillante salée.',
          'Dresser l\'assiette, assaisonner avec citron, aneth et moutarde.',
        ],
        tip: 'Le saumon est une des meilleures sources d\'oméga-3 EPA/DHA, des acides gras qui réduisent l\'inflammation des tissus musculaires et tendineux. 150 g de saumon couvrent 100% des apports quotidiens recommandés en oméga-3. La patate douce apporte du bêta-carotène (antioxydant) et des glucides complexes pour la récupération nocturne.',
      },
      {
        id: 'diner-effort', name: 'Dîner après entraînement tardif', emoji: '🌙',
        shortDesc: 'Omelette protéinée et tartines complets. Rapide, digeste et efficace quand on rentre tard après une séance.',
        time: '15 min', kcal: '420 kcal',
        nutrition: { kcal: 420, prot: 36, carbs: 38, fat: 16 },
        ingredients: [
          '3 œufs + 2 blancs d\'œufs',
          '80 g de jambon blanc ou saumon fumé',
          '2 tranches de pain complet',
          '1 grande poignée d\'épinards',
          '20 g de fromage râpé',
          'Sel, poivre, herbes',
          '1 fruit (pour les glucides de récupération)',
        ],
        steps: [
          'Battre les œufs et blancs avec sel, poivre, herbes.',
          'Faire tomber les épinards 1 min à feu vif.',
          'Verser les œufs, ajouter jambon et fromage.',
          'Couvrir feu doux 3–4 min. Servir avec les tartines grillées.',
          'Terminer avec le fruit pour compléter la recharge glucidique.',
        ],
        tip: 'Quand on rentre après 21h d\'un entraînement, l\'objectif est de couvrir la fenêtre anabolique sans trop charger l\'estomac. L\'omelette est parfaite : rapide, digeste, protéinée. Les blancs d\'œufs ajoutés augmentent les protéines sans graisses supplémentaires. Pain complet pour les glucides de récupération.',
      },
      {
        id: 'batch-cooking', name: 'Batch cooking du dimanche', emoji: '🥘',
        shortDesc: 'Riz + quinoa + légumes rôtis + poulet + œufs durs. 3h de préparation pour manger équilibré toute la semaine.',
        time: '3h', kcal: 'Selon portion',
        nutrition: { kcal: null, prot: null, carbs: null, fat: null },
        ingredients: [
          '500 g de riz (ou quinoa)',
          '1 kg de blanc de poulet',
          '4 patates douces',
          '2 courgettes + 2 poivrons + 2 carottes',
          '8 œufs (œufs durs pour la semaine)',
          '1 bocal de légumineuses (pois chiches, lentilles)',
          'Herbes, épices, huile d\'olive',
        ],
        steps: [
          'Préchauffer le four à 200°C. Couper tous les légumes en dés.',
          'Disposer légumes + patates douces sur une plaque, huiler, assaisonner. Enfourner 25 min.',
          'Cuire le riz et le quinoa séparément dans des grandes casseroles.',
          'Griller les blancs de poulet à la poêle en 2 fournées. Trancher quand refroidi.',
          'Cuire les œufs durs 9 min. Réserver les pois chiches.',
          'Répartir dans des boîtes hermétiques. Étiqueter. Conservation 4–5 jours au frais.',
        ],
        tip: 'Le batch cooking est la meilleure stratégie nutritionnelle pour un coureur actif qui manque de temps. En 3h le dimanche, tu élimines les mauvaises décisions alimentaires de la semaine : plus de restaurant rapide, plus de repas déséquilibrés. Astuce : varier les sauces (vinaigrette, sauce soja-citron, yaourt-curry) pour éviter la monotonie.',
      },
      {
        id: 'smoothie-quotidien', name: 'Smoothie vert quotidien', emoji: '🥬',
        shortDesc: 'Épinards, banane, pomme, gingembre et lait d\'avoine. Le concentré de micronutriments à boire chaque matin.',
        time: '5 min', kcal: '220 kcal',
        nutrition: { kcal: 220, prot: 6, carbs: 44, fat: 3 },
        ingredients: [
          '2 grandes poignées d\'épinards frais',
          '1 banane (de préférence congelée)',
          '1 pomme épépinée',
          '1 cm de gingembre frais',
          '200 ml de lait d\'avoine',
          '1 jus de citron',
          '1 c.c. de graines de lin moulues (optionnel)',
        ],
        steps: [
          'Tout dans le blender, épinards en premier.',
          'Mixer 45 sec à pleine puissance.',
          'Goûter, ajuster en citron si trop sucré.',
          'Boire immédiatement ou conserver 12h max au frais.',
        ],
        tip: 'Les épinards ont un goût neutre dans ce smoothie, tu ne les sens pas mais ils apportent fer, magnésium, vitamine K et folates. La banane congelée donne la texture crémeuse. Le gingembre a des propriétés anti-nauséeuses et anti-inflammatoires prouvées par plusieurs études sur les courbatures post-exercice. À adopter comme rituel matinal.',
      },
      {
        id: 'salade-lentilles', name: 'Salade lentilles-feta-tomates séchées', emoji: '🥗',
        shortDesc: 'Lentilles vertes, feta, tomates séchées et noix. Le plat du midi végétarien complet en protéines pour les runners.',
        time: '15 min', kcal: '490 kcal',
        nutrition: { kcal: 490, prot: 28, carbs: 54, fat: 18 },
        ingredients: [
          '200 g de lentilles vertes (cuites ou en boîte)',
          '80 g de feta émiettée',
          '8 tomates séchées à l\'huile',
          '30 g de noix concassées',
          '1 poignée de roquette ou mâche',
          '1 c.s. de vinaigre balsamique',
          '2 c.s. d\'huile d\'olive',
          'Sel, poivre, origan',
        ],
        steps: [
          'Égoutter et rincer les lentilles si en boîte.',
          'Mélanger lentilles, tomates séchées coupées, noix et verdure.',
          'Émietter la feta par-dessus.',
          'Assaisonner avec huile, vinaigre, origan, sel et poivre.',
        ],
        tip: 'Les lentilles sont une des meilleures sources de protéines végétales (9g/100g cuites) et de fer non-héminique (3,3mg/100g). Pour optimiser l\'absorption du fer végétal, toujours l\'associer à de la vitamine C, les tomates séchées et le vinaigre balsamique jouent ce rôle ici. Idéal pour les coureurs végétariens ou qui veulent réduire la viande.',
      },
    ]
  },
  avant: {
    subtitle: '2–3h avant l\'effort',
    tips: [
      'Miser sur les glucides complexes : pâtes, riz, pain complet',
      'Limiter les graisses et fibres (digestion lente = risque d\'inconfort)',
      'S\'hydrater : 500 ml d\'eau dans les 2h précédant l\'effort',
      '15–20 min avant : 1 banane ou un gel pour la dernière impulsion',
    ],
    recipes: [
      {
        id: 'porridge', name: 'Porridge banane-miel-chia', emoji: '🥣',
        shortDesc: 'Flocons d\'avoine, banane écrasée, miel et graines de chia. Énergie progressive pour 2–3h d\'effort.',
        time: '10 min', kcal: '380 kcal',
        nutrition: { kcal: 380, prot: 12, carbs: 65, fat: 8 },
        ingredients: [
          '80 g de flocons d\'avoine',
          '1 banane mûre',
          '250 ml de lait d\'avoine (ou lait entier)',
          '1 c.s. de miel',
          '1 c.s. de graines de chia',
          '1 pincée de cannelle',
          'Fruits rouges en décoration (optionnel)',
        ],
        steps: [
          'Porter le lait à frémissement dans une casserole à feu moyen.',
          'Ajouter les flocons et cuire 3–4 min en remuant pour éviter que ça colle.',
          'Écraser la banane à la fourchette, l\'incorporer hors du feu.',
          'Ajouter le miel, les graines de chia et la cannelle. Mélanger.',
          'Laisser gonfler 2 min dans le bol avant de déguster.',
        ],
        tip: 'L\'avoine contient du bêta-glucane qui ralentit l\'absorption des sucres et stabilise la glycémie pendant 2–3h, idéal pour une sortie longue. Les graines de chia apportent des oméga-3 anti-inflammatoires bénéfiques pour les tendons.',
      },
      {
        id: 'pates-saumon', name: 'Pâtes saumon-épinards-citron', emoji: '🍝',
        shortDesc: 'Le plat parfait 3h avant une compétition. Glucides complexes et protéines légères sans charger la digestion.',
        time: '20 min', kcal: '560 kcal',
        nutrition: { kcal: 560, prot: 32, carbs: 72, fat: 14 },
        ingredients: [
          '120 g de pâtes semi-complètes (penne ou fusilli)',
          '100 g de saumon fumé ou un pavé cuit',
          '2 grandes poignées d\'épinards frais',
          '2 c.s. de crème fraîche allégée à 15%',
          'Jus + zestes d\'un demi-citron',
          'Sel, poivre, aneth frais',
          'Un filet d\'huile d\'olive',
        ],
        steps: [
          'Cuire les pâtes al dente selon le paquet. Réserver 3 c.s. d\'eau de cuisson.',
          'Faire tomber les épinards à feu vif dans une poêle huilée, 2 min.',
          'Ajouter la crème fraîche et l\'eau de cuisson réservée, mélanger.',
          'Intégrer le saumon effiloché, les pâtes, le citron. Assaisonner.',
          'Parsemer d\'aneth frais et servir immédiatement.',
        ],
        tip: 'Éviter les pâtes à la carbonara ou aux graisses saturées avant une course. Elles ralentissent la vidange gastrique de 30–60 min. Le saumon apporte des protéines légères et des oméga-3 qui réduisent l\'inflammation musculaire.',
      },
      {
        id: 'toast-avocat', name: 'Toast avocat-œufs pochés', emoji: '🥑',
        shortDesc: 'Graisses mono-insaturées et protéines digestes. Parfait pour les sorties courtes matinales (< 60 min).',
        time: '15 min', kcal: '420 kcal',
        nutrition: { kcal: 420, prot: 22, carbs: 38, fat: 20 },
        ingredients: [
          '2 tranches de pain de campagne ou pain complet',
          '1 avocat bien mûr',
          '2 œufs frais',
          '1 c.s. de vinaigre blanc',
          'Jus d\'un demi-citron, sel, poivre',
          'Piment d\'Espelette ou paprika fumé',
          'Feuilles de roquette (optionnel)',
        ],
        steps: [
          'Toaster les tranches de pain jusqu\'à légère dorure.',
          'Écraser l\'avocat avec le citron, sel et poivre. Étaler généreusement.',
          'Porter 1 L d\'eau à frémissement avec le vinaigre dans une casserole.',
          'Casser chaque œuf dans un ramequin, plonger délicatement dans l\'eau frémissante.',
          'Pocher 3 min pour un jaune coulant. Égoutter et poser sur les toasts.',
          'Saupoudrer de piment, poivre et roquette. Servir immédiatement.',
        ],
        tip: 'Contrairement aux idées reçues, les graisses de l\'avocat (acides gras mono-insaturés) sont bien tolérées avant un effort modéré. Elles ne surchargent pas la digestion comme les graisses saturées. Idéal si tu t\'entraînes 2h après le repas.',
      },
      {
        id: 'galettes-sarrasin', name: 'Galettes sarrasin-beurre d\'amande', emoji: '🥞',
        shortDesc: 'Sarrasin sans gluten, beurre d\'amande et banane. Énergie durable avec un IG modéré.',
        time: '25 min', kcal: '360 kcal',
        nutrition: { kcal: 360, prot: 14, carbs: 52, fat: 12 },
        ingredients: [
          '100 g de farine de sarrasin',
          '1 œuf',
          '200 ml de lait (végétal ou animal)',
          '1 pincée de sel',
          '2 c.s. de beurre d\'amande',
          '1 banane mûre en rondelles',
          '1 filet de miel',
        ],
        steps: [
          'Mélanger farine, œuf, lait et sel jusqu\'à pâte lisse sans grumeaux.',
          'Laisser reposer 15 min (optionnel mais améliore la texture).',
          'Cuire les galettes dans une poêle légèrement huilée, 2 min / face.',
          'Garnir de beurre d\'amande, rondelles de banane et miel. Plier et servir.',
        ],
        tip: 'Le sarrasin a un IG modéré (50 vs 70 pour le blé) et une teneur élevée en magnésium, minéral essentiel à la contraction musculaire. L\'association avec du beurre d\'amande ralentit encore la digestion pour une énergie très stable.',
      },
      {
        id: 'smoothie-bowl', name: 'Smoothie bowl mangue-granola', emoji: '🥭',
        shortDesc: 'Mangue, banane congelée, lait de coco et granola croquant. Frais, digeste et glucidique.',
        time: '10 min', kcal: '340 kcal',
        nutrition: { kcal: 340, prot: 8, carbs: 68, fat: 7 },
        ingredients: [
          '1 mangue mûre (ou 150 g congelée)',
          '1 banane congelée (texture crémeuse)',
          '100 ml de lait de coco léger',
          '30 g de granola nature ou maison',
          '1 c.s. de noix de coco râpée',
          'Fruits frais pour garnir (kiwi, fruits rouges)',
          '1 filet de miel',
        ],
        steps: [
          'Mixer mangue, banane congelée et lait de coco 30 sec jusqu\'à consistance épaisse.',
          'Verser dans un bol froid.',
          'Garnir de granola, fruits frais, noix de coco et miel.',
          'Déguster immédiatement avant que la base ne fonde.',
        ],
        tip: 'La base congelée ralentit la digestion des sucres naturels des fruits. Le granola ajoute des glucides à libération progressive. Option idéale en été ou pour les coureurs qui ont du mal à manger solide le matin, la texture légère est très digeste.',
      },
      {
        id: 'riz-miel-raisin', name: 'Riz gluant miel-raisins-cannelle', emoji: '🍯',
        shortDesc: 'Riz gluant ou riz rond, miel, raisins secs. Le classique japonais adapté pour le coureur, pure charge glucidique.',
        time: '20 min', kcal: '400 kcal',
        nutrition: { kcal: 400, prot: 7, carbs: 85, fat: 2 },
        ingredients: [
          '100 g de riz rond (ou riz gluant)',
          '300 ml d\'eau',
          '2 c.s. de miel',
          '30 g de raisins secs',
          '1/2 c.c. de cannelle',
          '1 pincée de sel',
        ],
        steps: [
          'Rincer le riz, cuire dans l\'eau salée à feu doux 18 min à couvert.',
          'Hors du feu, incorporer miel, raisins et cannelle. Mélanger.',
          'Laisser reposer 5 min pour que les raisins gonflent.',
          'Consommer tiède, 2h–2h30 avant l\'effort.',
        ],
        tip: 'Le riz rond a un IG élevé (70–80), parfait avant un effort car il recharge rapidement le glycogène. Les sportifs de haut niveau (cyclistes, triathlètes) consomment ce type de préparation avant les épreuves longues. Très bien toléré par les estomacs sensibles car sans graisses et sans fibres agressives.',
      },
      {
        id: 'wrap-poulet-avant', name: 'Wrap poulet-riz-légumes doux', emoji: '🌯',
        shortDesc: 'Tortilla de blé, riz, poulet et légumes sans fibre. Compact, facile à transporter et parfait 2h30 avant.',
        time: '15 min', kcal: '480 kcal',
        nutrition: { kcal: 480, prot: 30, carbs: 62, fat: 12 },
        ingredients: [
          '2 tortillas de blé',
          '80 g de riz blanc cuit',
          '100 g de blanc de poulet grillé en lanières',
          '1/2 courgette cuite (pas crue, fibres)',
          '2 c.s. de sauce tomate légère',
          'Sel, origan',
        ],
        steps: [
          'Réchauffer les tortillas 20 sec au micro-ondes.',
          'Étaler la sauce tomate sur chaque tortilla.',
          'Disposer riz, poulet et courgette cuite.',
          'Rouler fermement, couper en deux en biais.',
          'Emballer dans film alimentaire pour emporter.',
        ],
        tip: 'Idéal pour les courses du matin avec un long trajet. Le wrap se prépare la veille, se conserve bien au frais 24h. Utiliser des légumes cuits (pas crus) pour limiter les fibres qui peuvent causer des inconforts digestifs. Le poulet apporte des protéines légères sans ralentir la digestion.',
      },
    ]
  },
  pendant: {
    subtitle: 'Sorties > 60 min',
    tips: [
      '30 à 60 g de glucides par heure d\'effort soutenu',
      'Un gel ou une prise solide toutes les 30–45 min',
      '400 à 800 ml d\'eau par heure selon la chaleur et l\'intensité',
      'Au-delà de 90 min : électrolytes indispensables (sodium, magnésium)',
    ],
    recipes: [
      {
        id: 'gel-dattes', name: 'Gel énergie dattes-gingembre', emoji: '🌴',
        shortDesc: 'Dattes mixées, gingembre frais et sel marin. 30 g de glucides naturels, digeste et anti-nausée.',
        time: '5 min', kcal: '120 kcal / dose',
        nutrition: { kcal: 120, prot: 1, carbs: 30, fat: 0 },
        ingredients: [
          '6 dattes Medjool dénoyautées (environ 80 g)',
          '40–50 ml d\'eau (ajuster la texture)',
          '1 cm de gingembre frais râpé',
          '1/4 c.c. de sel de mer',
          '1 c.c. de jus de citron',
        ],
        steps: [
          'Mixer dattes et eau au blender 45 sec jusqu\'à consistance très lisse.',
          'Ajouter gingembre, sel et citron. Mixer 15 sec supplémentaires.',
          'Goûter et ajuster : plus d\'eau pour liquéfier, plus de sel si effort intense.',
          'Transférer dans des sachets souples réutilisables. Conserver au frais max 48h.',
        ],
        tip: 'Les dattes ont un IG de 42–55, plus bas qu\'un gel commercial (IG 80+). Elles libèrent l\'énergie plus progressivement. Le gingembre est cliniquement prouvé pour réduire les nausées à l\'effort. Le sel remplace le sodium perdu en sueur (environ 600–1000 mg/L de sueur).',
      },
      {
        id: 'boisson-iso', name: 'Boisson isotonique orange-sel', emoji: '🍊',
        shortDesc: 'Eau, jus d\'orange frais, sel et sucre. Hydratation + électrolytes pour efforts > 60 min.',
        time: '3 min', kcal: '70 kcal / 500 ml',
        nutrition: { kcal: 70, prot: 0, carbs: 17, fat: 0 },
        ingredients: [
          '500 ml d\'eau plate',
          '100 ml de jus d\'orange fraîchement pressé',
          '1/4 c.c. de sel de mer (environ 1 g)',
          '1 c.c. de sucre roux ou de miel',
          'Jus d\'un quart de citron (optionnel)',
        ],
        steps: [
          'Verser l\'eau dans un bidon de 600 ml.',
          'Ajouter jus d\'orange, sel et sucre. Bien agiter jusqu\'à dissolution.',
          'Ajouter le citron pour la fraîcheur. Goûter, doit être légèrement salé.',
          'Refroidir avant l\'effort si possible. Boire 150–200 ml toutes les 15–20 min.',
        ],
        tip: 'Une boisson isotonique optimale contient 40–80 g de glucides/L et 500–700 mg de sodium/L. En dessous, tu t\'hydrates sans recharger. Au-dessus, risque de troubles digestifs. Cette recette est à 34 g/L, idéale pour les efforts modérés (< 75% FCmax).',
      },
      {
        id: 'barre-avoine', name: 'Barre avoine-miel-fruits secs', emoji: '🌾',
        shortDesc: 'Barre énergétique maison à croquer. 32 g de glucides, facile à mâcher, idéale dès 45 min d\'effort.',
        time: '35 min', kcal: '190 kcal / barre',
        nutrition: { kcal: 190, prot: 5, carbs: 32, fat: 6 },
        ingredients: [
          '150 g de flocons d\'avoine',
          '3 c.s. de miel (80 g)',
          '2 c.s. de beurre d\'amande',
          '50 g de raisins secs ou dattes hachées',
          '30 g de graines de tournesol',
          '30 g de cranberries séchées',
          '1 pincée de sel',
        ],
        steps: [
          'Préchauffer le four à 170°C. Tapisser un moule rectangulaire de papier cuisson.',
          'Faire fondre ensemble miel et beurre d\'amande 30 sec au micro-ondes.',
          'Mélanger avec les flocons, fruits secs, graines et sel.',
          'Presser TRÈS fermement dans le moule (clé d\'une barre qui ne s\'émiette pas).',
          'Enfourner 15–18 min. Refroidir 30 min AVANT de découper en barres.',
          'Emballer individuellement dans film alimentaire. Se conserve 5 jours.',
        ],
        tip: 'Avantage sur le gel commercial : les fibres de l\'avoine ralentissent légèrement l\'absorption, moins de pic glycémique. Inconvénient : nécessite de mastiquer et plus d\'eau pour la digestion. Ne pas utiliser si tu as tendance aux troubles digestifs à l\'effort.',
      },
      {
        id: 'compote-poche', name: 'Compote pomme-banane-datte', emoji: '🍎',
        shortDesc: 'Compote maison en poche. Alternative douce aux gels pour les estomacs sensibles.',
        time: '15 min', kcal: '95 kcal / poche',
        nutrition: { kcal: 95, prot: 1, carbs: 23, fat: 0 },
        ingredients: [
          '2 pommes pelées et coupées',
          '1 banane mûre',
          '3 dattes dénoyautées',
          '2 c.s. d\'eau',
          '1 pincée de cannelle',
        ],
        steps: [
          'Cuire les pommes et les dattes à feu doux avec 2 c.s. d\'eau, 8–10 min.',
          'Ajouter la banane, cuire encore 2 min.',
          'Mixer jusqu\'à consistance lisse. Ajouter la cannelle.',
          'Transférer chaud dans des sachets pour compotes réutilisables.',
          'Laisser refroidir avant de fermer. Conserver au frais 3 jours.',
        ],
        tip: 'Solution idéale pour les coureurs souffrant de reflux ou de côlon irritable. La compote de pomme a un IG plus bas que les gels et contient des pectines qui protègent la muqueuse intestinale, souvent irritée à l\'effort intense.',
      },
      {
        id: 'boisson-cafe-glucose', name: 'Boisson caféine-glucose (sortie intense)', emoji: '☕',
        shortDesc: 'Café froid, miel, sel et citron. Le pré-workout naturel pour les sorties en fractionné ou compétition.',
        time: '5 min', kcal: '80 kcal',
        nutrition: { kcal: 80, prot: 0, carbs: 20, fat: 0 },
        ingredients: [
          '200 ml de café froid ou espresso refroidi',
          '300 ml d\'eau',
          '2 c.s. de miel',
          '1/4 c.c. de sel de mer',
          'Jus d\'un demi-citron',
        ],
        steps: [
          'Mélanger tous les ingrédients dans un bidon.',
          'Bien agiter jusqu\'à dissolution du miel.',
          'Boire 200 ml dans les 30 min précédant l\'effort intense.',
          'Finir le reste au cours des 45 premières minutes.',
        ],
        tip: 'La caféine (3–6 mg/kg) augmente la puissance musculaire de 3–5% et réduit la perception de l\'effort. Elle est plus efficace chez les sujets non-habitués, si tu bois du café quotidiennement, l\'effet sera moindre. À réserver aux sorties importantes ou aux compétitions.',
      },
      {
        id: 'rice-balls', name: 'Onigiris énergétiques (rice balls)', emoji: '🍙',
        shortDesc: 'Boulettes de riz au sel, faciles à manger en courant. Utilisées par les équipes WorldTour de cyclisme.',
        time: '20 min', kcal: '160 kcal / boulette',
        nutrition: { kcal: 160, prot: 4, carbs: 34, fat: 1 },
        ingredients: [
          '200 g de riz à sushi (riz japonais collant)',
          '1 c.c. de sel',
          '1 c.c. de vinaigre de riz (optionnel)',
          'Facultatif : jambon, thon ou saumon au centre',
        ],
        steps: [
          'Cuire le riz selon paquet. Assaisonner avec sel et vinaigre chaud.',
          'Laisser tiédir 10 min (pas totalement froid).',
          'Mouiller les mains à l\'eau salée. Prendre une boule de riz, former un triangle.',
          'Insérer la garniture si désiré.',
          'Emballer dans film alimentaire ou feuille de nori. Conserver au frais.',
        ],
        tip: 'Les onigiris sont devenus le ravitaillement préféré des équipes WorldTour de cyclisme pour leur digestibilité parfaite à l\'effort. Le riz gluant se mange sans mordre, avantage crucial quand on est à 90% FCmax. Une boulette = environ 25 g de glucides. Idéal tous les 30–40 min au-delà de 2h d\'effort.',
      },
    ]
  },
  apres: {
    subtitle: 'Dans les 30 min',
    tips: [
      'Fenêtre anabolique : manger dans les 30 min post-effort',
      'Viser 20–25 g de protéines pour la récupération musculaire',
      'Associer glucides rapides + protéines pour reconstituer le glycogène',
      'Réhydrater : 1,5 L d\'eau par kg de poids perdu à l\'effort',
    ],
    recipes: [
      {
        id: 'smoothie-recup', name: 'Smoothie récupération turbo', emoji: '🍌',
        shortDesc: 'Banane, whey, lait, beurre de cacahuètes. 30 g de protéines prêts en 3 min, la fenêtre anabolique n\'attend pas.',
        time: '3 min', kcal: '380 kcal',
        nutrition: { kcal: 380, prot: 30, carbs: 42, fat: 11 },
        ingredients: [
          '1 banane congelée (texture plus crémeuse)',
          '250 ml de lait demi-écrémé (ou lait végétal fortifié)',
          '1 dose de whey vanille ou protéine végétale (25 g)',
          '1 c.s. de beurre de cacahuètes (ou beurre d\'amande)',
          '1 c.c. de miel (si effort > 90 min)',
          'Glaçons pour rafraîchir (optionnel)',
        ],
        steps: [
          'Tout dans le blender, mixer 30–45 sec jusqu\'à consistance homogène.',
          'Boire dans les 15–30 min suivant l\'effort.',
          'Préparer les ingrédients à l\'avance pour gagner du temps au retour.',
        ],
        tip: 'La "fenêtre anabolique" est maximale dans les 30 min post-effort : les transporteurs de glucose GLUT4 sont 3× plus actifs. Le whey est la source de protéines la mieux assimilée (absorption en 30–60 min vs 3–4h pour la caséine). La banane recharge le glycogène musculaire en apportant des sucres rapides + du potassium.',
      },
      {
        id: 'bowl-quinoa', name: 'Bowl récup quinoa-poulet-avocat', emoji: '🥗',
        shortDesc: 'Quinoa complet, poulet grillé, avocat et légumes rôtis. Le repas de récupération le plus complet.',
        time: '30 min', kcal: '520 kcal',
        nutrition: { kcal: 520, prot: 42, carbs: 48, fat: 16 },
        ingredients: [
          '80 g de quinoa sec',
          '150 g de blanc de poulet',
          '1/2 avocat mûr',
          '1 poivron rouge rôti',
          '1 grande poignée d\'épinards',
          '1 c.s. de graines de courge',
          'Huile d\'olive, jus de citron, sel, cumin',
        ],
        steps: [
          'Rincer le quinoa, cuire dans 2× son volume d\'eau salée 12 min à couvert.',
          'Faire griller le poulet à la poêle avec huile, cumin, sel. Laisser reposer 5 min avant de trancher.',
          'Rôtir le poivron au four (200°C, 15 min) ou utiliser des poivrons en bocal.',
          'Assembler le bol : quinoa tiède, épinards, poulet tranché, poivron, avocat en éventail.',
          'Arroser d\'huile d\'olive et citron, parsemer de graines. Assaisonner.',
        ],
        tip: 'Le quinoa est l\'une des rares protéines végétales complètes (les 9 acides aminés essentiels). Les phytonutriments du poivron et des épinards (vitamine C, fer, antioxydants) accélèrent la récupération cellulaire. L\'avocat apporte des graisses anti-inflammatoires qui réduisent les courbatures.',
      },
      {
        id: 'omelette-recup', name: 'Omelette jambon-légumes-parmesan', emoji: '🍳',
        shortDesc: '3 œufs, jambon, courgette et parmesan. 34 g de protéines en 10 min, option idéale sans préparation.',
        time: '10 min', kcal: '390 kcal',
        nutrition: { kcal: 390, prot: 34, carbs: 8, fat: 24 },
        ingredients: [
          '3 œufs entiers + 1 blanc d\'œuf',
          '80 g de jambon blanc en dés',
          '1/2 courgette en petits dés',
          '1 poignée d\'épinards',
          '20 g de parmesan râpé',
          'Sel, poivre, herbes de Provence',
          'Huile d\'olive',
        ],
        steps: [
          'Faire revenir courgette et épinards 3 min à feu vif avec un peu d\'huile.',
          'Battre les œufs avec sel, poivre, herbes. Verser sur les légumes.',
          'Ajouter le jambon en dés. Couvrir, feu doux, 3–4 min.',
          'Parsemer de parmesan, plier en deux et servir avec une tranche de pain complet.',
        ],
        tip: 'Les œufs contiennent tous les acides aminés essentiels dans des proportions quasi idéales, c\'est l\'aliment de référence (score DIAAS = 1,13). Pour les efforts < 45 min, l\'omelette seule suffit. Pour les longues sorties, ajouter du pain pour reconstituer le glycogène.',
      },
      {
        id: 'yaourt-grec', name: 'Yaourt grec fruits rouges-granola', emoji: '🫐',
        shortDesc: 'Yaourt grec 0%, fruits rouges et granola. 20 g de protéines + antioxydants en 5 min.',
        time: '5 min', kcal: '290 kcal',
        nutrition: { kcal: 290, prot: 20, carbs: 34, fat: 7 },
        ingredients: [
          '200 g de yaourt grec 0% ou 2%',
          '100 g de fruits rouges frais ou décongelés',
          '30 g de granola sans sucre ajouté',
          '1 c.s. de miel',
          'Menthe fraîche',
        ],
        steps: [
          'Verser le yaourt dans un bol.',
          'Garnir de fruits rouges, parsemer de granola.',
          'Arroser de miel, décorer de menthe.',
        ],
        tip: 'Les fruits rouges (myrtilles, framboises, cassis) sont parmi les aliments les plus riches en anthocyanes, des antioxydants qui réduisent l\'inflammation musculaire et accélèrent la réparation des microlésions après l\'effort. Le yaourt grec contient 2× plus de protéines que le yaourt classique.',
      },
      {
        id: 'riz-lait-recup', name: 'Riz au lait vanille-cannelle', emoji: '🍚',
        shortDesc: 'Riz, lait et protéines de lactosérum. La version sportive du classique réconfortant.',
        time: '25 min', kcal: '350 kcal',
        nutrition: { kcal: 350, prot: 22, carbs: 52, fat: 6 },
        ingredients: [
          '80 g de riz rond',
          '400 ml de lait demi-écrémé',
          '1/2 dose de whey vanille ou protéine neutre',
          '1 c.s. de miel',
          '1 c.c. de cannelle',
          'Extrait de vanille',
        ],
        steps: [
          'Faire cuire le riz dans le lait à feu très doux en remuant souvent, 18–20 min.',
          'Retirer du feu quand le riz est fondant et le lait absorbé.',
          'Laisser tiédir 5 min (important : ne pas ajouter la whey sur riz bouillant).',
          'Incorporer la whey, le miel, la cannelle et la vanille. Mélanger.',
          'Servir tiède ou froid selon préférence.',
        ],
        tip: 'Idéal après un entraînement intense en soirée. Le riz rechargue rapidement le glycogène. La combinaison caséine du lait (lente) + whey (rapide) couvre à la fois la fenêtre anabolique immédiate ET la récupération nocturne. La cannelle améliore la sensibilité à l\'insuline.',
      },
      {
        id: 'cottage-fruit', name: 'Cottage cheese fruits frais-noix', emoji: '🧀',
        shortDesc: 'Cottage cheese, kiwi, noix de cajou et miel. 28 g de protéines légères pour une récupération douce.',
        time: '5 min', kcal: '320 kcal',
        nutrition: { kcal: 320, prot: 28, carbs: 28, fat: 11 },
        ingredients: [
          '200 g de cottage cheese',
          '2 kiwis pelés et coupés',
          '20 g de noix de cajou non salées',
          '1 c.s. de miel',
          'Zestes de citron vert',
        ],
        steps: [
          'Verser le cottage cheese dans un bol.',
          'Disposer les kiwis en éventail.',
          'Parsemer de noix de cajou, arroser de miel, ajouter les zestes.',
        ],
        tip: 'Le cottage cheese est l\'un des aliments les plus sous-utilisés en nutrition sportive. Il contient 12g de protéines pour 100g, principalement de la caséine micellaire, la protéine la plus lente à digérer (6–8h). Idéal avant de dormir pour alimenter la récupération musculaire nocturne.',
      },
      {
        id: 'soupe-miso-tofu', name: 'Soupe miso-tofu-algues', emoji: '🍜',
        shortDesc: 'Soupe miso, tofu ferme, algues wakame et champignons. Récupération minérale et protéique en 10 min.',
        time: '10 min', kcal: '180 kcal',
        nutrition: { kcal: 180, prot: 16, carbs: 14, fat: 7 },
        ingredients: [
          '700 ml d\'eau chaude (pas bouillante)',
          '2 c.s. de pâte miso blanche',
          '100 g de tofu ferme en dés',
          '1 c.s. d\'algues wakame séchées',
          '4 champignons shiitake séchés (réhydratés)',
          '2 oignons verts émincés',
          '1 c.c. de sauce soja',
        ],
        steps: [
          'Réhydrater les algues et champignons 10 min dans l\'eau tiède.',
          'Porter l\'eau à 80°C (ne pas faire bouillir, détruit les probiotiques du miso).',
          'Délayer la pâte miso dans une louche d\'eau avant d\'incorporer.',
          'Ajouter tofu, algues, champignons et sauce soja. Réchauffer 2 min.',
          'Parsemer d\'oignons verts. Servir immédiatement.',
        ],
        tip: 'Le miso est un aliment fermenté riche en probiotiques qui renforcent le microbiote intestinal, souvent perturbé par les efforts longs (ischémie intestinale). Les algues wakame sont une source unique d\'iode et de minéraux marins (sodium, potassium, magnésium) perdus en sueur. Idéal après une sortie longue par temps chaud.',
      },
    ]
  },
  course: {
    subtitle: 'Protocole complet',
    tips: [
      'La veille : pasta party, pâtes blanches, sauce légère, rien de nouveau',
      '3h avant : ton repas pré-course habituel (testé à l\'entraînement)',
      '45 min avant : gel ou banane + café si tu en bois habituellement',
      'Ravitaillement : gel toutes les 7–8 km sur semi et marathon',
    ],
    recipes: [
      {
        id: 'pasta-party', name: 'Pasta party de la veille', emoji: '🫕',
        shortDesc: 'Pâtes blanches, sauce tomate maison et poulet grillé. La recharge glucidique classique et éprouvée, rien de nouveau.',
        time: '30 min', kcal: '680 kcal',
        nutrition: { kcal: 680, prot: 42, carbs: 90, fat: 12 },
        ingredients: [
          '150 g de pâtes blanches (penne, spaghetti ou rigatoni)',
          '150 g de blanc de poulet',
          '200 ml de sauce tomate maison (ail, oignon, basilic)',
          '1 tranche de pain blanc',
          '20 g de parmesan râpé',
          'Huile d\'olive, sel, poivre (pas d\'épices agressives)',
          'Un grand verre d\'eau aromatisé (citron)',
        ],
        steps: [
          'Cuire les pâtes al dente (pas trop, éviter la bouillie pour préserver l\'IG).',
          'Faire griller le poulet simplement, sel + poivre uniquement. Laisser reposer.',
          'Réchauffer la sauce tomate à feu doux. Assaisonner légèrement.',
          'Mélanger pâtes et sauce, garnir de parmesan, poser le poulet tranché.',
          'Dîner entre 18h et 19h30 pour avoir 10–12h de digestion.',
        ],
        tip: 'RÈGLE D\'OR : rien de nouveau la veille. Utiliser exactement les mêmes aliments qu\'à l\'entraînement. Pâtes BLANCHES (les complètes contiennent trop de fibres). Sauce LÉGÈRE (pas de crème, pas d\'ail en excès). Quantité : 1,5× ta portion habituelle. Boire 500 ml d\'eau supplémentaires dans la soirée pour une hyperhydratation préventive.',
      },
      {
        id: 'petit-dej-j', name: 'Petit-déjeuner jour de course', emoji: '☕',
        shortDesc: 'Pain, confiture, banane, café. Le protocole éprouvé, simple, digeste, reproductible à 100%.',
        time: '5 min', kcal: '380 kcal',
        nutrition: { kcal: 380, prot: 10, carbs: 72, fat: 5 },
        ingredients: [
          '2–3 tranches de pain de mie blanc ou baguette blanche',
          '2 c.s. de confiture (IG élevé, voulu ici)',
          '1 banane mûre',
          '1 café (seulement si tu en bois habituellement)',
          '500 ml d\'eau à température ambiante',
          '1–2 carrés de chocolat noir 70% (optionnel, caféine + théobromine)',
        ],
        steps: [
          'Se lever 3h minimum avant le départ (2h30 si épreuve > 10h).',
          'Manger lentement, sans te forcer, même si pas faim, manger quand même.',
          'Boire les 500 ml d\'eau sur 30–45 min (pas d\'une traite).',
          'NE PAS tester un nouvel aliment ce matin-là.',
          '30 min avant le départ : 1 gel ou la moitié d\'une banane pour la dernière charge.',
        ],
        tip: 'Le timing est crucial. 2h30–3h avant permet la vidange gastrique complète. Si tu coures tôt (6h), le repas peut être réduit à une banane + café. Ton glycogène hépatique (foie) s\'est vidé pendant la nuit, même sans appétit, ce repas est essentiel pour prévenir le "mur" sur 10 km+.',
      },
      {
        id: 'ravitaillement', name: 'Plan de ravitaillement selon la distance', emoji: '🏅',
        shortDesc: 'Protocole gel + eau par distance. À personnaliser selon ta sensibilité digestive, testez à l\'entraînement.',
        time: '—', kcal: 'Selon distance',
        nutrition: { kcal: null, prot: null, carbs: null, fat: null },
        ingredients: [
          '5 km : eau seule, aucun ravitaillement glucidique nécessaire',
          '10 km (> 40 min) : 1 gel au km 5 + eau à chaque ravitaillement',
          'Semi-marathon : gel km 7, km 14, km 18 + boisson iso',
          'Marathon : gel toutes les 7–8 km dès km 10, alterner eau/iso',
          'Tous formats : pastille électrolytes si T° > 22°C',
        ],
        steps: [
          'Prendre le gel 1–2 min AVANT le ravitaillement, rincer avec l\'eau (évite les troubles digestifs).',
          'Ne jamais dépasser 60 g de glucides/h (risque de diarrhée du coureur au-dessus).',
          'En cas de chaleur > 25°C : augmenter sodium à 800 mg/h et réduire l\'intensité de 5%.',
          'Post-course (dans les 30 min) : banane + eau sucrée même sans faim.',
        ],
        tip: 'La "diarrhée du coureur" touche 30–50% des marathoniens. Causes : ischémie intestinale (sang vers les muscles), chocs mécaniques répétés, déshydratation. Prévention : tester TOUS tes gels à l\'entraînement, éviter l\'ibuprofène avant/pendant, ne pas manger moins de 2h avant. Les boissons froides très sucrées (> 10%) aggravent les symptômes.',
      },
      {
        id: 'recup-post-course', name: 'Repas récupération post-course', emoji: '🎯',
        shortDesc: 'Quinoa, légumes, poisson et fruits. Le repas complet pour relancer la récupération après l\'effort maximal.',
        time: '20 min', kcal: '580 kcal',
        nutrition: { kcal: 580, prot: 45, carbs: 55, fat: 18 },
        ingredients: [
          '80 g de quinoa ou riz complet',
          '150 g de thon ou saumon grillé',
          '1/2 avocat',
          '1 tomate, 1 concombre, quelques feuilles de salade',
          'Jus de citron, huile d\'olive',
          '1 banane ou 1 compote en dessert',
          '500 ml d\'eau + 1 verre de lait (pour le sodium)',
        ],
        steps: [
          'Cuire le quinoa rapidement (type quinoa précuit en sachet pour aller vite).',
          'Griller le poisson simplement ou ouvrir une boîte de thon à l\'eau.',
          'Assembler une assiette colorée avec tous les légumes.',
          'Arroser généreusement d\'huile d\'olive (graisses anti-inflammatoires).',
          'Terminer avec la banane pour finir la recharge glucidique.',
        ],
        tip: 'Après une course, tu as perdu en moyenne 1–2 L d\'eau, 1 000–2 000 mg de sodium et vidangé 80% de ton glycogène. Ce repas adresse les 3. Le lait contient naturellement du sodium + calcium + caséine, triple action. Éviter l\'alcool les 24h post-course (perturbe la synthèse protéique de 37%).',
      },
      {
        id: 'boisson-recup-course', name: 'Boisson de récupération immédiate', emoji: '🧃',
        shortDesc: 'Eau de coco, jus de cerise griotte et sel. La boisson de récupération anti-inflammatoire des coureurs d\'élite.',
        time: '2 min', kcal: '110 kcal',
        nutrition: { kcal: 110, prot: 1, carbs: 26, fat: 0 },
        ingredients: [
          '300 ml d\'eau de coco nature',
          '100 ml de jus de cerise griotte (ou cranberry)',
          '1 pincée de sel de mer',
          'Glaçons',
        ],
        steps: [
          'Mélanger eau de coco, jus de cerise et sel dans un grand verre.',
          'Ajouter des glaçons (les boissons froides sont absorbées 30% plus vite).',
          'Boire immédiatement après avoir franchi la ligne d\'arrivée.',
        ],
        tip: 'L\'eau de coco contient naturellement 600 mg de potassium/330 ml et 160 mg de sodium, les deux électrolytes les plus perdus en sueur. Le jus de cerise griotte est l\'un des seuls aliments à avoir des preuves cliniques solides sur la réduction des courbatures (anthocyanes, proanthocyanidines). Consommé 2× / jour les 48h post-course, il réduit les DOMS de 20–25%.',
      },
    ]
  }
}

/* ─── All recipes flat list for search ─────────────────────────────── */
const ALL_RECIPES_FLAT = Object.entries(CONTENT).flatMap(([tabId, content]) =>
  content.recipes.map(r => ({
    ...r,
    tabId,
    color: TABS.find(t => t.id === tabId)?.color || '#8B2FC9',
    tabLabel: TABS.find(t => t.id === tabId)?.label || tabId,
  }))
)

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function AthleteNutrition() {
  const [activeTab,      setActiveTab]      = useState('quotidien')
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [search,         setSearch]         = useState('')

  const tab     = TABS.find(t => t.id === activeTab)
  const content = CONTENT[activeTab]

  const searchQuery = search.trim().toLowerCase()
  const searchResults = useMemo(() => {
    if (!searchQuery) return []
    return ALL_RECIPES_FLAT.filter(r =>
      r.name.toLowerCase().includes(searchQuery) ||
      r.shortDesc.toLowerCase().includes(searchQuery) ||
      r.ingredients?.some(i => i.toLowerCase().includes(searchQuery)) ||
      r.tabLabel.toLowerCase().includes(searchQuery)
    )
  }, [searchQuery])

  return (
    <div className="page">
      <h2 className="page-heading" style={{ marginBottom: '.35rem' }}>Nutrition du coureur</h2>
      <p className="text-muted text-sm" style={{ marginBottom: '1.25rem' }}>
        Bien manger pour mieux courir, mes conseils. Clique sur une recette pour les détails.
      </p>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
        <span style={{ position: 'absolute', left: '.875rem', top: '50%', transform: 'translateY(-50%)',
          fontSize: '1rem', pointerEvents: 'none' }}>🔍</span>
        <input
          type="text"
          placeholder="Rechercher une recette, un ingrédient…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '.65rem .875rem .65rem 2.5rem',
            borderRadius: 'var(--radius)', border: '1.5px solid var(--border)',
            background: 'var(--surface)', fontFamily: 'inherit', fontSize: '.9rem',
            outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        {search && (
          <button onClick={() => setSearch('')}
            style={{ position: 'absolute', right: '.75rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}>
            ✕
          </button>
        )}
      </div>

      {/* Search results */}
      {searchQuery && (
        <div style={{ marginBottom: '1.5rem' }}>
          {searchResults.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)',
              background: 'var(--surface-2)', borderRadius: 'var(--radius)', fontSize: '.9rem' }}>
              Aucune recette trouvée pour "{search}"
            </div>
          ) : (
            <>
              <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '.75rem' }}>
                {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                {searchResults.map(r => (
                  <div key={r.id}>
                    <div style={{ fontSize: '.72rem', fontWeight: 700, color: r.color,
                      marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                      {r.tabLabel}
                    </div>
                    <RecipeCard recipe={r} color={r.color} onSelect={setSelectedRecipe} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!searchQuery && (
        <>
          {/* Tabs */}
          <style>{`
            .nutri-tabs { display: flex; flex-wrap: wrap; gap: .45rem; }
            @media (max-width: 699px) {
              .nutri-tabs { display: grid; grid-template-columns: repeat(3, 1fr); }
            }
          `}</style>
          <div className="nutri-tabs" style={{ marginBottom: '1.5rem' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '.48rem .8rem', borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${activeTab === t.id ? t.color : 'var(--border)'}`,
                  background: activeTab === t.id ? t.color + '18' : 'var(--surface)',
                  color: activeTab === t.id ? t.color : 'var(--text-muted)',
                  fontWeight: 600, fontSize: '.875rem', fontFamily: 'inherit',
                  textAlign: 'center', whiteSpace: 'nowrap',
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Tips */}
          <div className="card" style={{ marginBottom: '1.5rem', borderLeft: `4px solid ${tab.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '1.75rem' }}>{tab.icon}</div>
              <div>
                <h3 style={{ marginBottom: '.2rem' }}>
                  {tab.id === 'avant' ? "Avant l'effort"
                    : tab.id === 'pendant' ? "Pendant l'effort"
                    : tab.id === 'apres' ? "Après l'effort"
                    : tab.id === 'course' ? 'Jour de course'
                    : 'Alimentation quotidienne'}
                </h3>
                <span style={{ fontSize: '.75rem', fontWeight: 700, color: tab.color,
                  background: tab.color + '18', padding: '.15rem .55rem', borderRadius: 99 }}>
                  {content.subtitle}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              {content.tips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '.65rem' }}>
                  <span style={{ color: tab.color, fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: '.9rem', lineHeight: 1.55 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recipes */}
          <h3 style={{ marginBottom: '1rem' }}>
            {tab.id === 'quotidien' ? 'Repas & idées du quotidien' : 'Recettes & idées repas'}
            <span style={{ fontSize: '.8rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '.5rem' }}>
              ({content.recipes.length} recettes)
            </span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginBottom: '1.5rem' }}>
            {content.recipes.map(r => (
              <RecipeCard key={r.id} recipe={r} color={tab.color} onSelect={setSelectedRecipe} />
            ))}
          </div>

          {/* Coach note */}
          <div className="card" style={{ background: 'var(--surface-2)' }}>
            <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
              <img src="/Coach.JPG" alt="Alexis"
                style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '.875rem', marginBottom: '.35rem' }}>Mon mot</div>
                <p style={{ fontSize: '.875rem', lineHeight: 1.65, fontStyle: 'italic', color: 'var(--text-muted)' }}>
                  "La nutrition, c'est le carburant de ta performance. Expérimente toujours à l'entraînement,
                  jamais le jour de la course. Ce qui marche pour les autres ne fonctionnera pas forcément pour toi :
                  teste, ajuste, répète."
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          color={searchQuery ? selectedRecipe.color : tab.color}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  )
}
