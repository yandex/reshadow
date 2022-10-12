const fs = require('fs');

const postcss = require('postcss');
const postcssPresetEnv = require('postcss-preset-env');
const atImport = require('postcss-import-sync2');
const mixins = require('postcss-mixins');
const vars = require('postcss-simple-vars');

const localByDefault = require('postcss-modules-local-by-default');
const extractImports = require('postcss-modules-extract-imports');
const scope = require('postcss-modules-scope');
const values = require('postcss-modules-values');

const reshadow = require('@reshadow/postcss');

const stringHash = require('string-hash');
const genericNames = require('generic-names');

const Parser = require('./parser');

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
    return genericNames(scopedNameGenerator, {
        context: process.cwd(),
    });
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
    postcss([plugin]).process(root, result);
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

        cache[sourcePath] = load(source, {
            filename: sourcePath,
        });

        return cache[sourcePath].tokens;
    };

    const parser = new Parser(pathFetcher);
    const processorPlugins = [];

    if (options.import !== null)
        processorPlugins.push(
            atImport({
                ...options.import,
                sync: true,
            }),
        );

    processorPlugins.push(...plugins);

    if (options.mixins !== null) {
        processorPlugins.push(
            mixins({
                ...options.mixins,
            }),
        );
    }

    if (options.vars !== null) {
        processorPlugins.push(
            vars({
                ...options.vars,
            }),
        );
    }

    if (options.presetEnv !== null) {
        processorPlugins.push(
            syncPlugin(
                postcssPresetEnv(
                    options.presetEnv || {
                        features: {
                            'nesting-rules': true,
                        },
                    },
                ),
            ),
        );
    }

    if (options.reshadow !== null) {
        processorPlugins.push(reshadow(options.reshadow));
    }

    processorPlugins.push(...modulesPlugins, parser.plugin);

    if (
        options.cssnano ||
        (options.cssnano !== null && process.env.NODE_ENV === 'production')
    ) {
        /**
         * `preset` option is required to force `cssnano` use `preset` instead of config search
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
