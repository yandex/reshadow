const fs = require('fs');
const path = require('path');
const t = require('@babel/types');
const template = require('@babel/template').default;
const syntaxJsx = require('@babel/plugin-syntax-jsx').default;
const {addDefault} = require('@babel/helper-module-imports');
const {stripIndent} = require('common-tags');
const stringHash = require('string-hash');

const utils = require('../common/utils');

const buildClassName = template.expression(`
    NAME.styles["ELEMENT"]
`);

const toObjectExpression = obj =>
    t.objectExpression(
        Object.entries(obj).map(([key, value]) =>
            t.objectProperty(
                t.stringLiteral(key),
                t.templateLiteral(
                    [
                        t.templateElement({
                            raw: value,
                            cooked: value,
                        }),
                    ],
                    [],
                ),
            ),
        ),
    );

/**
 * Basic React.Fragment check
 * We can improve it by checking import aliases if needs
 */
const isReactFragment = node => {
    if (!node) return false;

    if (t.isJSXFragment(node)) return true;

    const [element] = node.arguments || [];

    if (t.isIdentifier(element)) return element.name === 'Fragment';

    if (t.isMemberExpression(element)) {
        return (
            element.object.name === 'React' &&
            element.property.name === 'Fragment'
        );
    }

    return false;
};

const defaultOptions = {
    target: 'react',
    postcss: false,
    elementFallback: true,
    files: false,
    stringStyle: false,
    ignoreProp: null,
    underscore: false,
};

module.exports = (babel, pluginOptions = {}) => {
    const {types: t} = babel;
    const options = Object.assign({}, defaultOptions, pluginOptions);

    let classNameProp = 'className';

    if (options.target === 'preact') {
        if (pluginOptions.stringStyle !== undefined) {
            options.stringStyle = true;
        }
    }

    let moduleName = 'reshadow';

    if (options.target === 'vue') {
        moduleName = 'reshadow/runtime/vue';
        classNameProp = 'class';
    } else if (options.target === 'svelte') {
        moduleName = 'reshadow/runtime/svelte';
        classNameProp = 'class';
    }

    let STYLED = new Set();
    let BINDINGS = {};
    let imports = {};
    let IMPORT = null;
    let cache = new Set();
    let FILE = null;

    let index;
    const hashById = id => Math.round(id * 100).toString(16);
    const getHash = () => hashById(++index);

    let filename;

    let postcss;
    let cssFileRe = null;

    const pre = file => {
        ({filename} = file.opts);

        FILE = file;
        index = 1;
        STYLED = new Set();
        imports = {};
        IMPORT = null;
        cache = new Set();
        BINDINGS = file.scope.bindings;
    };

    const addImport = name => {
        if (!IMPORT) {
            IMPORT = addDefault(FILE.path, moduleName, {nameHint: 'styled'});
        }

        if (imports[name]) return imports[name];

        let localName;

        if (name === 'default') {
            localName = 'styled' in BINDINGS ? '_styled' : 'styled';

            IMPORT.specifiers.push(
                t.importDefaultSpecifier(t.identifier(localName)),
            );
        } else {
            localName = name in BINDINGS ? `_${name}` : name;

            IMPORT.specifiers.push(
                t.importSpecifier(t.identifier(localName), t.identifier(name)),
            );
        }

        imports[name] = localName;

        return localName;
    };

    const appendCode = ({quasi, name, hash}) => {
        const {expressions, quasis} = quasi;
        let code = '';

        quasis.forEach(({value}, i) => {
            code += value.raw;

            if (expressions[i]) {
                code += `var(--${hash}_${i})`;
            }
        });

        code = stripIndent(code);

        const append = t.taggedTemplateExpression(
            t.identifier(addImport('css')),
            t.templateLiteral(
                [
                    t.templateElement({
                        raw: code,
                        cooked: code,
                    }),
                ],
                [],
            ),
        );

        return append;
    };

    const prepareExpressions = (expressions, hash) => {
        if (options.stringStyle) {
            return t.templateLiteral(
                expressions
                    .map((x, i) => {
                        const value = (i > 0 ? ';' : '') + `--${hash}_${i}:`;

                        return t.templateElement({
                            raw: value,
                            cooked: value,
                        });
                    })
                    .concat(
                        t.templateElement(
                            {
                                raw: ';',
                                cooked: ';',
                            },
                            true,
                        ),
                    ),
                expressions,
            );
        }

        return t.objectExpression(
            expressions.map((x, i) =>
                t.objectProperty(t.stringLiteral(`--${hash}_${i}`), x),
            ),
        );
    };

    const traverseStyled = (p, {quasi} = {}) => {
        const {callee} = p.node;
        const {name} = callee.callee || callee;

        const hash = getHash();
        const hashName = `${name}_${hash}`;

        const globalStyles = [];
        const localStyles = [t.identifier(hashName)];

        for (let arg of callee.arguments || []) {
            if (!t.isIdentifier(arg)) {
                localStyles.push(arg);
                continue;
            }

            (arg.name in BINDINGS ? globalStyles : localStyles).push(arg);
        }

        p.node.callee = t.identifier(name);

        const variables =
            quasi &&
            quasi.expressions.length &&
            prepareExpressions(quasi.expressions, hash);

        const [jsxNode] = p.node.arguments;

        const stylesSet = t.sequenceExpression([
            t.callExpression(t.identifier(addImport('set')), [
                t.arrayExpression(localStyles),
            ]),
            jsxNode,
        ]);

        p.node.arguments = [stylesSet];

        let path = p;

        while (path.parentPath.type !== 'Program') {
            path = path.parentPath;
        }

        path.insertBefore(
            t.variableDeclaration('const', [
                t.variableDeclarator(
                    t.identifier(hashName),
                    t.callExpression(t.identifier(addImport('create')), [
                        t.arrayExpression(
                            globalStyles.concat(
                                quasi ? appendCode({quasi, name, hash}) : [],
                            ),
                        ),
                    ]),
                ),
            ]),
        );

        const getElementName = node => {
            if (t.isJSXNamespacedName(node))
                return [
                    getElementName(node.namespace),
                    getElementName(node.name),
                ].join(':');

            if (t.isJSXIdentifier(node)) return node.name;

            if (t.isJSXMemberExpression(node)) {
                return [
                    getElementName(node.object),
                    getElementName(node.property),
                ].join('.');
            }
        };

        let depth = 0;

        const elementMap = new Map();

        p.traverse({
            ...visitor,
            JSXElement(elementPath) {
                const {node} = elementPath;

                if (isReactFragment(node) || cache.has(node)) return;

                cache.add(node);

                if (variables && depth === 0) {
                    for (let x of elementPath.container) {
                        if (!t.isJSXElement(x)) continue;

                        x.openingElement.attributes.push(
                            t.jSXAttribute(
                                t.JSXIdentifier('$$style'),
                                t.JSXExpressionContainer(variables),
                            ),
                        );
                    }
                }

                depth++;

                const {openingElement, closingElement} = node;

                let elementName = getElementName(openingElement.name);

                elementName = elementName.replace(/^use\./, 'use:');

                let isElement = true;

                if (elementName.startsWith('use:')) {
                    elementName = elementName.replace('use:', 'use--');
                    openingElement.name = t.JSXIdentifier('div');
                } else if (utils.isCustomElement(elementName)) {
                    if (options.elementFallback) {
                        openingElement.name = t.JSXIdentifier(
                            typeof options.elementFallback === 'boolean'
                                ? 'div'
                                : options.elementFallback,
                        );
                    }
                } else if (!/[^A-Z]\w+/.test(elementName)) {
                    isElement = false;
                }

                elementMap.set(elementPath, {elementName});

                const spreads = [];
                const filtered = [];

                if (openingElement.attributes.length > 0) {
                    let props = [];
                    const uses = [];
                    const indexesToRemove = [];
                    let useAttr = null;

                    const getProp = (name, valueNode) => {
                        const key = /^[$0-9a-z_]+$/i.test(name)
                            ? t.identifier(name)
                            : t.stringLiteral(name);

                        const value = t.isJSXExpressionContainer(valueNode)
                            ? valueNode.expression
                            : valueNode;

                        return t.objectProperty(
                            key,
                            value || t.booleanLiteral(true),
                        );
                    };

                    openingElement.attributes.forEach((attr, i) => {
                        if (t.isJSXSpreadAttribute(attr)) {
                            if (
                                t.isCallExpression(attr.argument) &&
                                attr.argument.callee.name === 'use'
                            ) {
                                indexesToRemove.push(i);
                                useAttr = attr;
                            } else {
                                if (props.length) {
                                    spreads.push(t.objectExpression(props));
                                    props = [];
                                }

                                spreads.push(attr.argument);
                            }

                            return;
                        }

                        if (
                            isElement &&
                            t.isJSXIdentifier(attr.name) &&
                            attr.name.name === 'as'
                        ) {
                            indexesToRemove.push(i);
                            openingElement.name.name = attr.value.value;
                        } else if (
                            t.isJSXNamespacedName(attr.name) &&
                            attr.name.namespace.name === 'use'
                        ) {
                            indexesToRemove.push(i);
                            const name = attr.name.name.name;

                            uses.push(getProp(name, attr.value));
                        } else {
                            let name = getElementName(attr.name);

                            if (options.underscore && name.startsWith('_')) {
                                indexesToRemove.push(i);
                                name = name.replace('_', '');
                                uses.push(getProp(name, attr.value));
                            } else if (
                                options.ignoreProp &&
                                options.ignoreProp(name)
                            ) {
                                filtered.push(attr);
                            } else {
                                props.push(getProp(name, attr.value));
                            }
                        }
                    });

                    if (props.length > 0) {
                        spreads.push(t.objectExpression(props));
                    }

                    if (useAttr || uses.length > 0) {
                        if (!useAttr) {
                            const USE = addImport('use');

                            useAttr = t.JSXSpreadAttribute(
                                t.callExpression(t.identifier(USE), [
                                    t.objectExpression([]),
                                ]),
                            );
                        }

                        useAttr.argument.arguments[0].properties.push(...uses);

                        spreads.push(useAttr.argument);
                    }

                    if (options.target === 'vue') {
                        indexesToRemove.forEach(i => {
                            openingElement.attributes.splice(i, 1);
                        });

                        if (useAttr) {
                            openingElement.attributes.push(useAttr);
                        }

                        return;
                    }
                }

                if (spreads.length > 0) {
                    openingElement.attributes = [
                        t.JSXSpreadAttribute(
                            t.callExpression(t.identifier(addImport('map')), [
                                t.stringLiteral(elementName),
                                ...spreads,
                            ]),
                        ),
                    ];
                } else {
                    openingElement.attributes = [
                        t.JSXAttribute(
                            t.JSXIdentifier(classNameProp),
                            t.JSXExpressionContainer(
                                buildClassName({
                                    NAME: name,
                                    ELEMENT: t.stringLiteral(
                                        `__${elementName}`,
                                    ),
                                }),
                            ),
                        ),
                    ];
                }

                openingElement.attributes.push(...filtered);

                if (closingElement) {
                    closingElement.name = openingElement.name;
                }
            },
        });

        /**
         * Think about more effective transformations
         */
        if (options.target === 'vue') {
            const transformVueJSX = require('@vue/babel-plugin-transform-vue-jsx')(
                babel,
            );

            const elems = [...elementMap.values()];

            p.traverse({
                JSXElement(elementPath) {
                    transformVueJSX.visitor.JSXElement(elementPath);
                },
                CallExpression(expressionPath) {
                    const {node} = expressionPath;

                    if (
                        !(
                            t.isIdentifier(node.callee) &&
                            node.callee.name === 'h'
                        )
                    ) {
                        return;
                    }

                    const {elementName} = elems.shift();

                    node.arguments[1] = t.callExpression(
                        t.identifier(addImport('map')),
                        [t.stringLiteral(elementName), node.arguments[1]],
                    );
                },
            });
        }
    };

    const traverseTaggedTemplate = p => {
        const {callee} = p.node;

        const {tag, quasi} = callee;

        if (!(isStyledExpression(tag) || STYLED.has(tag.name))) return;

        p.node.callee = tag;

        return traverseStyled(p, {quasi});
    };

    const isStyledExpression = node => {
        if (t.isCallExpression(node)) return STYLED.has(node.callee.name);

        return false;
    };

    const visitor = {
        CallExpression(p) {
            if (STYLED.size === 0) return;

            const {callee} = p.node;

            if (t.isTaggedTemplateExpression(callee)) {
                traverseTaggedTemplate(p);
                return;
            }

            if (isStyledExpression(callee)) {
                traverseStyled(p);
            }
        },

        TaggedTemplateExpression(p) {
            let {node} = p;
            const {quasi, tag} = node;

            if (!imports.css || tag.name !== imports.css) {
                return;
            }

            const {raw} = quasi.quasis[0].value;

            const hash = String(stringHash(raw));

            p.replaceWith(
                t.callExpression(t.identifier(addImport('__css__')), [
                    quasi,
                    t.stringLiteral(hash),
                ]),
            );

            ({node} = p);

            if (!postcss) return;

            const result = postcss.process(raw, {from: filename});
            const code = result.code;
            const tokens = toObjectExpression(result.tokens);

            node.arguments[0] = t.templateLiteral(
                [
                    t.templateElement({
                        raw: code,
                        cooked: code,
                    }),
                ],
                [],
            );

            p.replaceWith(t.sequenceExpression([node, tokens]));
        },
    };

    return {
        pre,
        name: 'babel-plugin-reshadow',
        inherits: syntaxJsx,
        visitor: {
            Program: {
                enter(path, state) {
                    // babel 6 compatibility
                    Object.assign(options, state.opts);
                    if (options.postcss && !postcss) {
                        postcss = require('./postcss')(options.postcss);
                    }
                    if (options.files && !cssFileRe) {
                        cssFileRe = new RegExp(options.files);
                    }

                    pre(state.file);
                },
            },
            ImportDeclaration(p) {
                const {source, specifiers} = p.node;

                if (cssFileRe && cssFileRe.test(source.value)) {
                    const file = utils.resolveDependency({
                        filename: source.value,
                        basedir: path.dirname(filename),
                    });

                    const code = fs.readFileSync(file).toString();

                    const append = t.taggedTemplateExpression(
                        t.identifier(addImport('css')),
                        t.templateLiteral(
                            [
                                t.templateElement({
                                    raw: code,
                                    cooked: code,
                                }),
                            ],
                            [],
                        ),
                    );

                    p.replaceWith(
                        t.variableDeclaration('const', [
                            t.variableDeclarator(
                                t.objectPattern(
                                    specifiers.map(spec => {
                                        if (t.isImportDefaultSpecifier(spec))
                                            return t.restElement(
                                                t.identifier(spec.local.name),
                                            );

                                        return t.objectProperty(
                                            t.identifier(spec.imported.name),
                                            t.identifier(spec.local.name),
                                            false,
                                            spec.imported.name ===
                                                spec.local.name,
                                        );
                                    }),
                                ),
                                append,
                            ),
                        ]),
                    );

                    p.addComment(
                        'leading',
                        `__reshadow-styles__:"${source.value}"`,
                    );

                    return;
                }

                let SOURCE = options.source || 'reshadow';

                if (source.value !== SOURCE) return;

                if (source.value !== moduleName) {
                    source.value = moduleName;
                }

                IMPORT = p.node;

                for (let spec of specifiers) {
                    if (t.isImportDefaultSpecifier(spec)) {
                        const name = spec.local.name;
                        STYLED.add(name);
                        imports.default = name;
                    } else {
                        if (spec.imported.name === 'css') {
                            imports.css = spec.local.name;
                        } else if (spec.imported.name === 'use') {
                            imports.use = spec.local.name;
                        }
                    }
                }
            },
            ...visitor,
        },
    };
};
