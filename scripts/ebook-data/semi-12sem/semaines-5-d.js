const { applyOverrides } = require('../../lib/tier-overrides');
module.exports = applyOverrides(require('./semaines-5-i.js'), require('./quality-overrides-d.js'));
