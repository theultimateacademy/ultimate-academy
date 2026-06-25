// Applique des surcharges par semaine/jour à une trame "intermédiaire" pour produire
// une variante de palier (débutant/avancé) : on ne réécrit que les séances qui changent
// réellement (volume, type, allure), le reste (EF, sortie longue de base) est hérité.
function applyOverrides(base, overridesByWeek) {
  return base.map(week => {
    const ov = overridesByWeek[week.num]
    if (!ov) return week
    let seances = week.seances
    if (ov.replace) {
      seances = seances.map(s => {
        const r = ov.replace[s.jour]
        if (!r) return s
        return typeof r === 'function' ? r(s) : { ...s, ...r }
      })
    }
    if (ov.add) {
      seances = [...seances, ...ov.add]
    }
    const { replace, add, ...weekFields } = ov
    return { ...week, ...weekFields, seances }
  })
}

module.exports = { applyOverrides }
