const {_parsers, _plugins} = require('./extract');

const extend = (name, cb) => ({
    ..._plugins[name].printer,
    ...cb(_plugins[name].printer),
});

const isStyledTag = tag => tag.type === 'Identifier' && tag.name === 'styled';
const isStyledCall = tag =>
    tag.type === 'CallExpression' &&
    tag.callee.type === 'Identifier' &&
    tag.callee.name === 'styled';

const isStyledCallee = callee =>
    callee.type === 'TaggedTemplateExpression' &&
    (isStyledTag(callee.tag) || isStyledCall(callee.tag));

const isStyledBody = node =>
    node.type === 'ArrowFunctionExpression' &&
    node.body.type === 'CallExpression' &&
    isStyledCallee(node.body.callee);

module.exports = {
    parsers: {
        css: {
            ..._parsers.css,
            astFormat: 'reshadow-css',
        },
        babel: {
            ..._parsers.babel,
            astFormat: 'reshadow-babel',
        },
    },
    printers: {
        'reshadow-css': extend('css', printer => ({
            print: (...args) => {
                const [path] = args;
                const node = path.getNode();
                const result = printer.print(...args);

                if (node.type === 'selector-tag') {
                    /**
                     * keep the original tag name
                     * @see https://github.com/prettier/prettier/blob/0d0e88cfdf886f8915d25c64391f27f1a931e32e/src/language-css/printer-postcss.js#L344
                     */
                    result.parts[1] = node.value;
                }

                return result;
            },
        })),
        'reshadow-babel': extend('babel', printer => ({
            print: (...args) => {
                const [path] = args;
                const node = path.getNode();

                const result = printer.print(...args);

                if (!isStyledBody(node)) return result;

                if (!result.parts) return result;

                const [functionGroup] = result.parts;

                // Function presented with a pair of an arrow ('=>') and the body
                let [, bodyGroup] = functionGroup.contents.parts;
                const body = bodyGroup.contents;

                // remove indent
                if (body.parts[0].type === 'indent') {
                    body.parts[0] = body.parts[0].contents;
                }

                // replace newline with whitespace
                body.parts[0].parts[0] = ' ';

                /**
                 * remove unnecessary last comma or newline
                 * we should remove it only for 2 elements
                 * for example:
                 */
                // const Button = children.map(x => styled`
                //     div {
                //         color: green;
                //     }
                // `(
                //     <div {...x} size="m">
                //         {x}
                //     </div>,
                // ),
                // );
                if (body.parts.length === 2) {
                    body.parts.splice(-1);
                }

                return result;
            },
            embed: (...args) => {
                const [path] = args;
                const node = path.getNode();

                let parent;
                let isStyled = false;

                if (node.type === 'TemplateLiteral') {
                    parent = path.getParentNode();

                    /**
                     * A hack to force `embed` function act like it is styled component
                     * @see https://github.com/prettier/prettier/blob/0d0e88cfdf886f8915d25c64391f27f1a931e32e/src/language-js/embed.js#L413
                     */
                    if (parent && parent.type === 'TaggedTemplateExpression') {
                        const {tag} = parent;

                        if (
                            tag.type === 'Identifier' &&
                            tag.name === 'styled'
                        ) {
                            isStyled = true;
                            parent.tag.name = 'css';
                        }
                    }
                }

                const result = printer.embed(...args);

                // restore the original name
                if (isStyled) {
                    parent.tag.name = 'styled';
                }

                return result;
            },
        })),
    },
};
