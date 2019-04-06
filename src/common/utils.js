const path = require('path');
const stringHash = require('string-hash');
const tags = require('./html-tags');

const componentRe = /^[A-Z][a-zA-Z]*/;
const isCustomElement = name =>
    !(tags.has(name) || componentRe.test(name) || name.includes('.'));

const ROOT = process.cwd();

const getFileHash = filename => stringHash(path.relative(ROOT, filename));

module.exports = {
    isCustomElement,
    getFileHash,
};
