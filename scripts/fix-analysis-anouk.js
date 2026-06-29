require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

const intro = "Coucou Anouk ! C'était vraiment **une super semaine de reprise**, honnêtement je suis bluffé par le niveau que tu maintiens après ta course. Les côtes du lundi étaient costauds à cette période de l'année et t'as géré ça **nickel**. Sur la natation t'as bien dosé l'effort. La sortie longue du dimanche c'était exactement ce qu'il fallait pour retrouver les appuis sans forcer. Continue comme ça, **la forme est bien là** !"

const conseil = "Cette semaine tu as les **12x300m sur piste**, c'est la distance que tu aimes alors lâche-toi mais reste **régulière sur les répétitions**. Pour les sorties vélo, **hydrate-toi dès le départ**, pas seulement quand tu as soif."

const sessions = [
  {
    titre: "Côtes 8x80m",
    jour: "Lundi",
    type: "Cotes",
    done: true,
    rpe: 7,
    note: "**Top exécution.** Tu as relancé direct dans l'intensité après la course, c'est **courageux**. Appuis solides, bras actifs, exactement ce qu'il faut pour réactiver le système neuromusculaire.",
  },
  {
    titre: "Natation 5x200m seuil",
    jour: "Mardi",
    type: "Natation",
    done: true,
    rpe: 5,
    note: "Bonne gestion. RPE 5 sur une séance seuil en début de bloc, c'est **l'intelligence de l'entraînement**. Tu as su doser sans te cramer et c'est souvent là que les athlètes se plantent en début de cycle.",
  },
  {
    titre: "Vélo endurance 1h30",
    jour: "Mercredi",
    type: "Velo",
    done: true,
    rpe: 4,
    note: "Sortie endurance bien gérée. Mercredi de récupération active propre, c'est souvent là que les athlètes font l'erreur de trop pousser. **Toi tu as su rester dans la zone.**",
  },
  {
    titre: "EF 45 min",
    jour: "Jeudi",
    type: "Endurance Fondamentale",
    done: true,
    rpe: 4,
    note: "Parfait pour un jeudi de récupération. Ces séances EF construisent l'endurance en profondeur sans créer de fatigue supplémentaire. C'est le **travail invisible** qui fait la différence.",
  },
  {
    titre: "Sortie longue 80 min",
    jour: "Dimanche",
    type: "Sortie Longue",
    done: true,
    rpe: 7,
    note: "**Belle gestion de l'effort** sur 80 min. Tu commences à construire ta base pour Dinard. Continue à gérer l'allure en endurance fondamentale, surtout avec la chaleur de juillet.",
  },
]

async function run() {
  const { error } = await sb
    .from('weekly_analyses')
    .update({
      coach_message: intro,
      analysis_data: {
        intro,
        mood: 'fire',
        rpe_moyen: 6.2,
        conseil,
        sessions_comments: sessions,
      },
    })
    .eq('id', 'b4cdbba6-5213-4042-b369-42f1d7e821fe')

  if (error) { console.error('Erreur :', error.message); process.exit(1) }
  console.log('OK : marqueurs **texte** ajoutés pour le rendu gras coloré.')
}

run()
