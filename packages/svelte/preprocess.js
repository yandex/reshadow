const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
const generate = require('@babel/generator').default;
const {parse} = require('@babel/parser');

const {KEYS} = require('@reshadow/core');

const reshadow = require('../babel');

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

const preprocess = options => ({
    markup({content, filename}) {
        const placeholders = {};

        let script = {attributes: '', content: ''};
        let style = {attributes: '', content: ''};

        /**
         * Extract the <script> and <style> contents
         */
        let code = content
            .replace(
                /<script(.*?)>(.*)<\/script>/ms,
                (match, attributes, content) => {
                    script = {attributes, content};
                    return '';
                },
            )
            .replace(
                /<style(.*?)>(.*)<\/style>/ms,
                (match, attributes, content) => {
                    style = {attributes, content};
                    return '';
                },
            );

        /**
         * Get the default reshadow import name
         */
        let [, reshadowImport] =
            script.content.match(
                new RegExp(
                    /import[\s\n\r]+(\w+).*?from[\s\n\r]+['"]reshadow['"]/,
                    'sm',
                ),
            ) || [];

        /**
         * Support the <style reshadow>, if there is no reshadow import
         */
        if (!reshadowImport) {
            if (style.attributes.includes('reshadow')) {
                script.content += `import __styled__ from "reshadow";__styled__\`${style.content.replace(
                    /val\((\w+)\)/gms,
                    // eslint-disable-next-line
                    '${$1}',
                )}\``;
                reshadowImport = '__styled__';
            } else {
                return {code: content};
            }
        }

        let index = 0;

        code = code
            // replace {...} to __PLACEHOLDER__<id>__
            .replace(/(\{\w+\})/gms, (match, $1) => {
                const id = `__PLACEHOLDER__${index++}__`;
                placeholders[id] = $1;
                return id;
            })
            .replace(/use:/gms, '__use__:')
            // replace expressions like (:attr) with (__use__:attr)
            .replace(/([^\]]?[\s\r\n]+):(\w+)/gms, '$1use:$2')
            // replace expression name=value with name="__QUOTE__value__QUOTE__"
            .replace(/(\w+)=(\w+)/gms, '$1="__QUOTE__$2__QUOTE__"')
            // svelte syntax
            .replace(/\{([\s\n\r]*)([#:/])/gms, '__BRACKET__$1$2');

        let ast = parse(
            `${script.content};__reshadow__;${reshadowImport}\`
                color: \${__};
            \`(<>${code}</>);`,
            {
                sourceType: 'module',
                plugins: ['jsx'],
            },
        );

        const plugin = reshadow(
            {types: t},
            {
                ...options,
                stringStyle: true,
                postcss: true,
                classProp: 'class',
                filterElement: name => /^svelte:/.test(name),
                filterProp: prop =>
                    /^(on:|__use__|bind:|class:|in:|out:|transition:|animate:|let:)/.test(
                        prop,
                    ),
            },
        );

        traverse(ast, {
            ...plugin.visitor,
            Program(path) {
                return plugin.visitor.Program.enter(path, {
                    opts: {},
                    file: {opts: {filename}, scope: path.scope},
                });
            },
        });

        /**
         * Get the 'map' import from reshadow
         */
        const imports = {};

        traverse(ast, {
            ImportDeclaration(p) {
                const {source, specifiers} = p.node;
                if (source.value !== '@reshadow/core') return;
                for (let spec of specifiers) {
                    if (!t.isImportSpecifier(spec)) continue;
                    if (spec.imported.name === 'map') {
                        imports.map = spec.local.name;
                    }
                }
            },
        });

        ({code} = generate(ast));

        const chunks = code.split('__reshadow__');
        code = chunks[0];

        /** extract styles and make them reactive */
        code = code.replace(
            `${reshadowImport}(`,
            `$: __styles__ = ${reshadowImport}(`,
        );

        /**
         * Invalidate the map and styled function on styles update
         *
         * require('svelte') - a trick to pass the lifecycle functions
         */
        code =
            code +
            `;require('@reshadow/svelte').__init__(require('svelte'), () => __styles__, () => {
                ${reshadowImport} = ${reshadowImport};
                ${imports.map} = ${imports.map};
            });
            `;

        let [, markup] = chunks[1].match(/<>(.*?)<\/>/ms);

        /**
         * Restore orignial values
         */
        markup = markup
            .replace(/__BRACKET__/g, '{')
            .replace(/__QUOTE__/g, '')
            .replace(/__use__/g, 'use')
            .replace(/__PLACEHOLDER__\d+__/g, match => {
                return placeholders[match];
            })
            .replace(/\{(\w+)\}:/g, '$1:')
            // use __styles__ instead of styled to improve the dynamic values changes reaction
            .replace(
                new RegExp(
                    `${reshadowImport}\\.${escapeRegExp(KEYS.__style__)}`,
                    'g',
                ),
                `__styles__.${KEYS.__style__}`,
            );

        const result = `<script${script.attributes}>${code}</script><style${
            style.attributes
        }>${style.content}</style>${markup}`;

        return {code: result};
    },
});

module.exports = preprocess;
