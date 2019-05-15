const t = require('@babel/types');

const utils = require('@reshadow/utils');
const tags = require('@reshadow/utils/html-tags');

module.exports = {
    meta: {
        type: 'suggestion',

        docs: {
            description: '`as` attribute usage',
            category: 'Possible Errors',
            recommended: false,
        },

        schema: [
            {
                type: 'object',
                properties: {
                    always: {
                        type: 'boolean',
                    },
                    onlyString: {
                        type: 'boolean',
                    },
                    onlyExisting: {
                        type: 'boolean',
                    },
                },
            },
        ],
    },
    create: function(context) {
        let [options = {}] = context.options;

        return {
            JSXOpeningElement(node) {
                if (!(node.name && t.isJSXIdentifier(node.name))) return;

                const {name} = node.name;

                if (!utils.isCustomElement(name)) return;

                let asAttr;
                for (let attr of node.attributes) {
                    if (
                        !(
                            t.isJSXAttribute(attr) &&
                            t.isJSXIdentifier(attr.name)
                        )
                    )
                        continue;
                    if (attr.name.name === 'as') {
                        asAttr = attr;
                        break;
                    }
                }

                if (!asAttr) {
                    if (options.always) {
                        context.report({
                            node,
                            message:
                                'Nonexistent tag should have `as` attribute',
                        });
                    }

                    return;
                }

                let value;
                const attrValue = asAttr.value;

                if (t.isJSXExpressionContainer(attrValue)) {
                    if (t.isStringLiteral(attrValue.expression)) {
                        value = attrValue.expression.value;
                    } else if (
                        t.isTemplateLiteral(attrValue.expression) &&
                        attrValue.expression.quasis.length === 1
                    ) {
                        value = attrValue.expression.quasis[0].value.raw;
                    } else if (options.onlyString) {
                        context.report({
                            node: asAttr.value,
                            message:
                                '`as` attribute should be the static string',
                        });

                        return;
                    }
                } else {
                    value = attrValue.value;
                }

                if (options.onlyExisting && !tags.has(value)) {
                    context.report({
                        node: asAttr.value,
                        message: 'Nonexistent html tag',
                    });
                }
            },
        };
    },
};
