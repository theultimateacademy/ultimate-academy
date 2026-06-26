const { applyOverrides } = require('../../lib/tier-overrides');
module.exports = applyOverrides(require('./semaines-3-i.js'), require('./quality-overrides-3-d.js'));
