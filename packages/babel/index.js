const t = require('@babel/types');

const {isCustomElement} = require('@reshadow/utils');

const Utils = require('./utils');
const jsx = require('./utils/jsx');
const {toObjectExpression} = require('./utils/helpers');

module.exports = () => {
    let utils;
    let postcss;

    return {
        name: 'babel-plugin-reshadow',
        inherits: require('@babel/plugin-syntax-jsx').default,
        visitor: {
            Program: {
                enter(p, state) {
                    // init options here for babel 6 compatibility
                    utils = new Utils(p, state);

                    postcss = require('./postcss')(utils.options.postcss);

                    this.filesQueue = new Set();
                },
                exit() {
                    utils.elements.forEach(x => {
                        const pragma = x.path.node;
                        if (x.as) {
                            pragma.arguments[0] = x.as;
                        }

                        const args = [t.stringLiteral(x.name)];

                        if (!t.isNullLiteral(pragma.arguments[1])) {
                            args.push(pragma.arguments[1]);
                        }

                        if (x.root) {
                            x.use.properties.unshift(
                                t.objectProperty(
                                    t.identifier('root'),
                                    t.booleanLiteral(true),
                                ),
                            );
                        }

                        if (x.use.properties.length > 0) {
                            args.push(
                                t.callExpression(
                                    t.identifier(utils.imports.add('use')),
                                    [x.use],
                                ),
                            );
                        }

                        pragma.arguments[1] = t.callExpression(
                            t.identifier(utils.imports.add('map')),
                            args,
                        );
                    });
                },
            },
            ImportDeclaration(p) {
                if (utils.imports.isStylesImport(p.node.source)) {
                    this.filesQueue.add(p);
                }
            },
            TaggedTemplateExpression(p) {
                const {tag} = p.node;

                if (utils.imports.is('css', tag.name)) {
                    const stylesNode = utils.stylesProcessor.process(p);

                    p.replaceWith(stylesNode);

                    return;
                }

                if (utils.imports.is('styled', tag.name)) {
                    const stylesNode = utils.stylesProcessor.process(p);

                    p.replaceWith(
                        t.callExpression(t.identifier(tag.name), [stylesNode]),
                    );

                    return;
                }

                if (
                    t.isCallExpression(tag) &&
                    utils.imports.is('styled', tag.callee.name)
                ) {
                    const stylesNode = utils.stylesProcessor.process(p);

                    p.replaceWith(
                        t.callExpression(t.identifier(tag.callee.name), [
                            ...tag.arguments,
                            stylesNode,
                        ]),
                    );
                }
            },
            CallExpression(p) {
                const {callee} = p.node;

                if (utils.imports.is('inject', callee.name)) {
                    const raw = p.node.arguments[0].value;
                    const css = postcss.process(raw, {from: ''});
                    p.node.arguments[0].value = css.code;
                    p.node.arguments.push(toObjectExpression(css.tokens));
                    return;
                }

                if (!utils.imports.is('styled', callee.name)) return;

                p.parentPath.traverse({
                    JSXElement(elementPath) {
                        if (jsx.isReactFragment(elementPath.node)) {
                            return;
                        }

                        let nodes = elementPath.container;

                        if (t.isConditionalExpression(nodes)) {
                            nodes = [nodes.consequent, nodes.alternate];
                        }

                        if (t.isLogicalExpression(nodes)) {
                            nodes = [nodes.left, nodes.right];
                        }

                        for (const x of nodes) {
                            if (!t.isJSXElement(x)) continue;

                            utils.setElement(x, {root: true});
                        }

                        elementPath.stop();
                    },
                });
            },
            JSXElement(p) {
                const {node} = p;

                if (jsx.isReactFragment(node)) {
                    return;
                }

                const {openingElement, closingElement} = node;

                const use = [];
                let as = null;
                const attrs = [];

                for (const attr of openingElement.attributes) {
                    if (
                        t.isJSXNamespacedName(attr.name) &&
                        attr.name.namespace.name === 'use'
                    ) {
                        use.push(
                            t.objectProperty(
                                jsx.getAttrName(attr.name.name),
                                jsx.getAttrValue(attr.value),
                            ),
                        );
                    } else if (
                        t.isJSXIdentifier(attr.name) &&
                        attr.name.name === 'as'
                    ) {
                        as = jsx.getAttrValue(attr.value);
                    } else if (
                        t.isJSXSpreadAttribute(attr) &&
                        t.isCallExpression(attr.argument) &&
                        utils.imports.is('use', attr.argument.callee.name)
                    ) {
                        for (const arg of attr.argument.arguments) {
                            if (t.isObjectExpression(arg)) {
                                use.push(...arg.properties);
                            } else {
                                use.push(t.spreadElement(arg));
                            }
                        }
                    } else {
                        attrs.push(attr);
                    }
                }

                openingElement.attributes = attrs;

                const name = jsx
                    .getName(openingElement.name)
                    .replace(/^use\./, 'use:');

                if (name.startsWith('use:') || isCustomElement(name)) {
                    openingElement.name = t.jsxIdentifier(
                        utils.options.defaultElement,
                    );

                    if (closingElement) {
                        closingElement.name = openingElement.name;
                    }
                }

                utils.setElement(node, {
                    as,
                    name,
                    use: t.objectExpression(use),
                    path: p,
                });
            },
        },
    };
};
