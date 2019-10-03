const t = require('@babel/types');
const stringHash = require('string-hash');
const {stripIndent} = require('common-tags');

const PACKAGE_NAME = 'reshadow';

/**
 * Adds a comment which is very useful to extract CSS in the bundler without
 * parsing the code back into AST.
 */
const wrapBundlerComments = node => {
    t.addComment(node, 'leading', `__${PACKAGE_NAME}_css_start__`);
    t.addComment(node, 'trailing', `__${PACKAGE_NAME}_css_end__`);
    return node;
};

class StylesProcessor {
    constructor(utils) {
        this.utils = utils;

        this.hashSet = new Set();
        this.insertPath = utils.path.get('body').find(({node: currentNode}) => {
            return !t.isImportDeclaration(currentNode);
        });
    }

    insert(hash, css, concats) {
        const nodeName = `styles_${hash}`;

        if (this.hashSet.has(hash)) return nodeName;

        this.hashSet.add(hash);

        const args = [
            t.callExpression(t.identifier(this.utils.imports.add('inject')), [
                wrapBundlerComments(t.stringLiteral(css)),
                t.stringLiteral(hash),
            ]),
        ];

        if (Object.keys(concats).length > 0) {
            args.push(
                t.objectExpression(
                    Object.entries(concats).map(([i, v]) =>
                        t.objectProperty(
                            t.identifier(i),
                            t.arrayExpression(v.map(x => t.stringLiteral(x))),
                        ),
                    ),
                ),
            );
        }

        const node = t.variableDeclaration('const', [
            t.variableDeclarator(
                t.identifier(nodeName),
                t.callExpression(
                    t.identifier(this.utils.imports.add('__css__')),
                    args,
                ),
            ),
        ]);

        this.insertPath.insertBefore(node);

        return nodeName;
    }

    process(p) {
        const {node} = p;
        const {quasi} = node;

        const hash = stringHash(quasi.quasis.join('')).toString(36);

        const raw = quasi.quasis.reduce((acc, x, i) => {
            let result = acc + x.value.raw;
            if (quasi.expressions[i]) {
                result += `@__PLACEHOLDER__ _${i}_`;
            }
            return result;
        }, '');

        const concats = {};

        const expressions = [];

        let css = stripIndent(
            raw.replace(
                /([\w-]+):\s*(.*?@__PLACEHOLDER__.*?);/g,
                (match, prop, placeholders) => {
                    const name = `--_${hash}-${expressions.length}`;
                    const propValue = `${prop}: var(${name});`;

                    const chunks = placeholders.split(
                        /@__PLACEHOLDER__\s_\d+_/,
                    );
                    if (chunks.filter(Boolean).length === 0) {
                        placeholders.replace(
                            /@__PLACEHOLDER__\s_(\d+)_/,
                            (_, index) => {
                                expressions.push(quasi.expressions[index]);
                            },
                        );
                    } else {
                        const expression = t.templateLiteral([], []);

                        expression.quasis.push(
                            chunks.map(x =>
                                t.templateElement({raw: x, cooked: x}),
                            ),
                        );

                        placeholders.replace(
                            /@__PLACEHOLDER__\s_(\d+)_/g,
                            (_, index) => {
                                expression.expressions.push(
                                    quasi.expressions[index],
                                );
                            },
                        );

                        // expressions.push(expression);
                    }

                    return propValue;
                },
            ),
        );

        const isFlat = /^(&|[\w-]+:)/.test(css);
        if (isFlat) {
            css = `:root {${css}}`;
        }

        const nodeName = this.insert(hash, css, concats);

        if (expressions.length === 0) {
            return t.identifier(nodeName);
        }

        return t.callExpression(
            t.memberExpression(
                t.identifier(nodeName),
                t.identifier('__with__'),
            ),
            expressions,
        );
    }
}

module.exports = StylesProcessor;
