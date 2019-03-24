/**
 * This is a trick to extract the prettier internal plugins
 */

const prettier = require('prettier');

const {_parsers, _plugins} = require('./extract-plugin');

prettier.format(`;`, {
    parser: 'css',
    plugins: [require.resolve('./extract-plugin')],
});

prettier.format(`;`, {
    parser: 'babel',
    plugins: [require.resolve('./extract-plugin')],
});

module.exports = {
    _parsers,
    _plugins,
};
