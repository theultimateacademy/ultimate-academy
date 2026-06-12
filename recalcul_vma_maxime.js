/**
 * Recalcule les allures du plan actif de Maxime avec sa nouvelle VMA (15 km/h).
 * Les séances déjà validées sont préservées.
 * Usage : node recalcul_vma_maxime.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const sb = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY
)

const NEW_VMA = 15

// ─── Helpers ────────────────────────────────────────────────────────────────

function calcPace(vma, pct) {
  const speed   = vma * pct
  const paceMin = 60 / speed
  const m = Math.floor(paceMin)
  const s = Math.round((paceMin - m) * 60)
  return `${m}'${String(s).padStart(2, '0')}`
}

function subsPaces(text, vma) {
  if (!text) return text
  return text.replace(/(\d{2,3})-(\d{2,3})%\s*VMA|(\d{2,3})%\s*VMA/g, (match, lo, hi, single) => {
    if (lo && hi) {
      return `${calcPace(vma, parseInt(lo)/100)}/km – ${calcPace(vma, parseInt(hi)/100)}/km (${lo}-${hi}% VMA)`
    }
    return `${calcPace(vma, parseInt(single)/100)}/km (${single}% VMA)`
  })
}

function buildCorps(lib, vma) {
  const main     = lib.main_set || ''
  const recovery = lib.recovery || ''
  const cat      = (lib.category || '').toLowerCase()
  const type     = (lib.type || '').toLowerCase()

  if (cat === 'endurance_fondamentale' || cat === 'recuperation_active') {
    return subsPaces(main, vma)
  }
  if (cat === 'renforcement') return main

  if (cat === 'sortie_longue') {
    const phases = main.split(/\s+(?:puis|→)\s+/)
    if (phases.length > 1) {
      const labels = ['Endurance fondamentale', 'Blocs tempo / Allure spécifique', 'Allure course']
      return phases.map((p, i) => `BLOC ${labels[i] || 'Phase '+(i+1)}\n• ${subsPaces(p.trim(), vma)}`).join('\n\n')
    }
    return subsPaces(main, vma)
  }

  if (cat === 'footing_progressif') {
    const phases = main.split(/\s*→\s*/)
    return phases.map((p, i) => `BLOC Phase ${i+1}\n• ${subsPaces(p.trim(), vma)}`).join('\n\n')
  }

  const blocLabel = {
    fractionne_court: 'Intervalles',
    fractionne_long:  'Intervalles',
    tempo_seuil:      'Tempo / Seuil',
    cotes:            'Montées',
    specifique:       'Allure course',
  }[cat] || 'Effort'

  let corps = `BLOC ${blocLabel}\n• ${subsPaces(main, vma)}`
  if (recovery) corps += `\n\nBLOC Récupération\n• ${subsPaces(recovery, vma)}`
  return corps
}

function recalculateDistances(planData, vma) {
  for (const sem of (planData.semaines || [])) {
    for (const s of (sem.seances || [])) {
      if (s.est_course || !s.duree_min) continue
      const type = (s.type || '').toLowerCase()
      if (type.includes('renforcement') || type.includes('repos')) { s.distance_km = 0; continue }
      if (type.includes('natation') || type.includes('vélo') || type.includes('velo') || type.includes('brique')) {
        s.distance_km = null; continue
      }
      const validAllures = (s.allures || []).filter(a => typeof a.vitesse_kmh === 'number' && a.vitesse_kmh > 0)
      let avgSpeed
      if (validAllures.length > 0) {
        avgSpeed = validAllures.reduce((sum, a) => sum + a.vitesse_kmh, 0) / validAllures.length
        if (type.includes('fractionné') || type.includes('vma')) avgSpeed *= 0.85
      } else {
        const pct = (type.includes('tempo') || type.includes('seuil')) ? 0.73
          : (type.includes('fractionné') || type.includes('vma'))     ? 0.70
          : 0.67
        avgSpeed = vma * pct
      }
      s.distance_km = Math.round((s.duree_min / 60) * avgSpeed * 10) / 10
    }
    sem.volume_total_km = Math.round(
      (sem.seances || []).reduce((sum, s) => {
        const t = (s.type || '').toLowerCase()
        if (t.includes('natation') || t.includes('vélo') || t.includes('velo') || t.includes('brique')) return sum
        return sum + (s.distance_km || 0)
      }, 0) * 10
    ) / 10
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Trouver Maxime
  const { data: profiles } = await sb
    .from('profiles')
    .select('id, first_name, last_name, vma, vma_known, level, objective')
    .ilike('first_name', 'maxime')

  if (!profiles?.length) {
    console.error('❌ Aucun profil "Maxime" trouvé.')
    return
  }
  if (profiles.length > 1) {
    console.log('⚠️  Plusieurs Maxime trouvés :')
    profiles.forEach(p => console.log(' -', p.first_name, p.last_name, '|', p.id))
    console.log('Utilisation du premier.')
  }
  const profile = profiles[0]
  console.log(`✓ Profil : ${profile.first_name} ${profile.last_name || ''} (${profile.id})`)
  console.log(`  VMA actuelle dans profil : ${profile.vma} | objective : ${profile.objective}`)
  console.log(`  Nouvelle VMA à appliquer : ${NEW_VMA}`)

  // 2. Plan actif
  const { data: plan } = await sb
    .from('training_plans')
    .select('*')
    .eq('user_id', profile.id)
    .eq('status', 'active')
    .single()

  if (!plan) {
    console.error('❌ Aucun plan actif trouvé pour Maxime.')
    return
  }
  console.log(`✓ Plan actif : ${plan.id}`)

  // 3. Séances validées
  const { data: completions } = await sb
    .from('session_completions')
    .select('week_number, session_index')
    .eq('plan_id', plan.id)

  const validatedKeys = new Set((completions || []).map(c => `${c.week_number}-${c.session_index}`))
  console.log(`✓ Séances déjà validées : ${validatedKeys.size}`)
  if (validatedKeys.size > 0) {
    console.log('  Clés préservées :', [...validatedKeys].join(', '))
  }

  // 4. Bibliothèque de séances
  const { data: libData } = await sb
    .from('session_library')
    .select('code, category, name, duration_min, warmup, main_set, recovery, cooldown, coach_notes, type')
    .order('code')

  const libMap = Object.fromEntries((libData || []).map(s => [s.code, s]))
  console.log(`✓ Bibliothèque : ${Object.keys(libMap).length} séances chargées`)

  // 5. Recalcul
  const planData = JSON.parse(JSON.stringify(plan.plan_data))
  let updatedCount = 0

  for (const week of (planData.semaines || [])) {
    for (let idx = 0; idx < (week.seances || []).length; idx++) {
      const seance = week.seances[idx]
      const key = `${week.numero}-${idx}`

      if (validatedKeys.has(key)) {
        console.log(`  ⏭ Semaine ${week.numero} séance [${idx}] "${seance.titre}" → validée, ignorée`)
        continue
      }

      // Réinjection contenu bibliothèque avec nouvelle VMA
      const lib = libMap[seance.id_seance]
      if (lib) {
        seance.echauffement    = lib.warmup   ? subsPaces(lib.warmup,   NEW_VMA) : ''
        seance.retour_au_calme = lib.cooldown ? subsPaces(lib.cooldown, NEW_VMA) : ''
        seance.corps           = buildCorps(lib, NEW_VMA)
      }

      // Recalcul allures[]
      if (Array.isArray(seance.allures)) {
        seance.allures = seance.allures.map(a => {
          if (!a.pourcentage_vma) return a
          const speed   = NEW_VMA * (a.pourcentage_vma / 100)
          const paceMin = 60 / speed
          const m = Math.floor(paceMin)
          const s = Math.round((paceMin - m) * 60)
          return {
            ...a,
            vitesse_kmh:   Math.round(speed * 10) / 10,
            allure_min_km: `${m}'${String(s).padStart(2, '0')}/km`,
          }
        })
      }

      console.log(`  ✓ Semaine ${week.numero} séance [${idx}] "${seance.titre}" → mise à jour`)
      updatedCount++
    }
  }

  recalculateDistances(planData, NEW_VMA)

  // 6. Sauvegarde
  const { error } = await sb
    .from('training_plans')
    .update({ plan_data: planData })
    .eq('id', plan.id)

  if (error) {
    console.error('❌ Erreur sauvegarde :', error.message)
    return
  }

  console.log(`\n✅ Plan mis à jour avec VMA ${NEW_VMA} km/h.`)
  console.log(`   ${updatedCount} séance(s) recalculée(s) | ${validatedKeys.size} séance(s) validée(s) préservée(s).`)
}

main().catch(console.error)
