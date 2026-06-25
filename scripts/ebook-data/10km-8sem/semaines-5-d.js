// Trame 5 séances/semaine — palier Débutant (VMA 10 à 13.5).
const { applyOverrides } = require('../../lib/tier-overrides')
module.exports = applyOverrides(require('./semaines-5-i.js'), require('./quality-overrides-d.js'))
