/**
 * copy.js — backward-compat shim.
 * All copy now lives in languages.js. Import getCopy('en') for English.
 */
const { getCopy } = require('./languages');
module.exports = getCopy('en');
