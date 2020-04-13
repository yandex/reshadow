const html = require('html-tags');
const svg = require('svg-tag-names');

module.exports = new Set([...html, ...svg]);
module.exports.html = new Set(html);
module.exports.svg = new Set(svg);
