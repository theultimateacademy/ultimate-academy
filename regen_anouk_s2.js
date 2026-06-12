const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY)

async function main() {
  console.log('Fetching Anouk profile...')
  const { data: profile } = await sb.from('profiles').select('*').eq('id','081c46fb-f843-4734-a14e-bbfebc750c9a').single()
  console.log('Profile:', profile.first_name, 'VMA:', profile.vma, 'objective:', profile.objective)
  
  console.log('Calling plan generation...')
  const res = await fetch('http://localhost:3001/api/plans/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: profile.id, profile })
  })
  const data = await res.json()
  if (data.error) { console.error('ERROR:', data.error); return }
  
  const newPlanId = data.plan?.id
  console.log('New plan id:', newPlanId)
  
  const { data: newPlan } = await sb.from('training_plans').select('plan_data').eq('id', newPlanId).single()
  const s2 = newPlan?.plan_data?.semaines?.[1]
  if (!s2) { console.error('No S2 found'); return }
  
  console.log('New S2:', s2.charge)
  s2.seances?.forEach((s,i) => {
    console.log('['+i+']', s.type, '|', s.titre, '|', s.duree_min+'min |', s.jour)
    console.log('  corps:', (s.corps||'VIDE').slice(0,80))
    console.log('  allures:', s.allures?.length, '| echauff:', !!(s.echauffement))
  })
  
  const { data: activePlan } = await sb.from('training_plans').select('plan_data').eq('id','b9ed8365-eb5b-439b-85d2-383b845bc025').single()
  const updated = JSON.parse(JSON.stringify(activePlan.plan_data))
  updated.semaines[1] = s2
  const { error } = await sb.from('training_plans').update({ plan_data: updated }).eq('id','b9ed8365-eb5b-439b-85d2-383b845bc025')
  if (error) { console.error('DB error:', error.message); return }
  
  await sb.from('training_plans').update({ status: 'archived' }).eq('id', newPlanId)
  console.log('\n✅ S2 replaced with properly generated content. Temp plan archived.')
}
main().catch(console.error)
