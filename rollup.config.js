const json = require('rollup-plugin-json');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');

module.exports = {
    plugins: [
        json(),
        resolve(),
        commonjs({
            ignore: id => /^[^.]/.test(id),
        }),
    ],
};
