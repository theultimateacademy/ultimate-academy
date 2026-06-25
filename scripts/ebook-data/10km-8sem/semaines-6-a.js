// Trame 6 séances/semaine — palier Avancé (VMA 19 à 24).
const { applyOverrides } = require('../../lib/tier-overrides')
module.exports = applyOverrides(require('./semaines-6-i.js'), require('./quality-overrides-a.js'))
