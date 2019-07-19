const postcssParser = require('prettier/parser-postcss');
const jsParser = require('prettier/parser-babylon');

const _parsers = {
    css: postcssParser.parsers.css,
    babel: jsParser.parsers.babel,
};

const _plugins = {};

const createParser = (parser, printer) => ({
    [parser]: {
        ..._parsers[parser],
        parse(...args) {
            const ast = _parsers[parser].parse(...args);
            const [, , options] = args;

            const plugin = options.plugins.find(
                x => x.printers && x.printers[printer],
            );
            _plugins[parser] = {plugin, printer: plugin.printers[printer]};

            return ast;
        },
    },
});

module.exports = {
    _parsers,
    _plugins,
    parsers: {
        ...createParser('css', 'postcss'),
        ...createParser('babel', 'estree'),
    },
};
