const path = require('path');
const stringHash = require('string-hash');
const tags = require('./html-tags');

const componentRe = /^[A-Z]/;
const isCustomElement = name => !(componentRe.test(name) || tags.has(name));

const ROOT = process.cwd();

const getFileHash = filename => stringHash(path.relative(ROOT, filename));

module.exports = {
    isCustomElement,
    getFileHash,
};
