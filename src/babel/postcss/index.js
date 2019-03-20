const fs = require('fs');

const postcss = require('postcss');
const postcssPresetEnv = require('postcss-preset-env');
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

/**
 * Babel is synchronous, so we need to use synchronous plugins
 * We can use something like `deasync` and other hacks, but it's not stable and platform-agnostic
 * The most of the postcss plugin features are sync (not to mention `fs` and so on),
 * and this wrapper should cover the most of the use cases for `preset-env`, for example
 *
 * Anyway it's highly recommended to use `reshadow/webpack` + `reshadow/postcss`
 */
const syncPlugin = plugin => (root, result) => {
    const {SynchronousPromise} = require('synchronous-promise');
    const realPromise = global.Promise;
    global.Promise = SynchronousPromise;
    plugin(root, result);
    global.Promise = realPromise;
};

module.exports = ({plugins = [], options = {}, generateScopedName}) => {
    generateScopedName = getScopedNameGenerator({generateScopedName});

    /* css-modules */
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

    const processorPlugins = [
        atImport({
            ...options.import,
            sync: true,
        }),
        ...plugins,
        syncPlugin(
            postcssPresetEnv(
                options.presetEnv || {
                    features: {
                        'nesting-rules': true,
                    },
                },
            ),
        ),
        reshadow(options.reshadow),
        ...modulesPlugins,
        parser.plugin,
    ];

    if (options.cssnano || process.env.NODE_ENV === 'production') {
        /**
         * `preset` option is required to force `cssnano` use `preset` istead of config search
         */
        const nanoOptions = Object.assign({preset: 'default'}, options.cssnano);
        processorPlugins.push(syncPlugin(require('cssnano')(nanoOptions)));
    }

    const processor = postcss(processorPlugins);

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
