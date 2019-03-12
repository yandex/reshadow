const fs = require('fs');

const postcss = require('postcss');
const nesting = require('postcss-nesting');
const atImport = require('postcss-import-sync2');

const localByDefault = require('postcss-modules-local-by-default');
const extractImports = require('postcss-modules-extract-imports');
const scope = require('postcss-modules-scope');
const values = require('postcss-modules-values');

const Parser = require('./parser');

const reshadow = require('../../postcss');

const stringHash = require('string-hash');
const genericNames = require('generic-names');

/**
 *
 * @see https://github.com/css-modules/postcss-modules/blob/60920a97b165885683c41655e4ca594d15ec2aa0/src/generateScopedName.js
 */
function generateScopedName(name, filename, css) {
    const i = css.indexOf(`.${name}`);
    const lineNumber = css.substr(0, i).split(/[\r\n]/).length;
    const hash = stringHash(css)
        .toString(36)
        .substr(0, 5);

    return `_${name}_${hash}_${lineNumber}`;
}

function getScopedNameGenerator(opts) {
    const scopedNameGenerator = opts.generateScopedName || generateScopedName;

    if (typeof scopedNameGenerator === 'function') return scopedNameGenerator;
    return genericNames(scopedNameGenerator, {context: process.cwd()});
}

/* css-modules */

module.exports = ({plugins = [], options = {}, generateScopedName}) => {
    generateScopedName = getScopedNameGenerator({generateScopedName});

    const modulesPlugins = [
        values,
        localByDefault,
        extractImports,
        scope({generateScopedName}),
    ];

    const cache = {};

    const pathFetcher = (filepath, relativeTo) => {
        const sourcePath = Parser.pathFetcher(filepath, relativeTo);

        if (sourcePath in cache) return cache[sourcePath];

        const source = fs.readFileSync(sourcePath);

        cache[sourcePath] = load(source, {filename: sourcePath});

        return cache[sourcePath].tokens;
    };

    const parser = new Parser(pathFetcher);

    const processor = postcss([
        atImport({
            ...options.import,
            sync: true,
        }),
        ...plugins,
        nesting(options.nesting),
        reshadow(options.reshadow),
        ...modulesPlugins,
        parser.plugin,
    ]);

    const load = (css, options = {}) => {
        if (options.from in cache) return cache[options.from];

        parser.exportTokens = {};

        const result = processor.process(css, options);

        const {root, css: code} = result;

        return {
            root,
            code,
            tokens: parser.exportTokens,
        };
    };

    return {
        process: load,
    };
};
