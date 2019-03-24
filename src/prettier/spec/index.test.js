import prettier from 'prettier';
import {stripIndent} from 'common-tags';

const transform = options => code =>
    prettier.format(stripIndent(code), {
        ...options,
        plugins: [require.resolve('..')],
    });

transform.with = options => code => transform(code, options);

describe('prettier', () => {
    describe('css', () => {
        it('should keep the capitalized tag', () => {
            const code = transform({parser: 'css'})`
                Button {
                    color: red;
                }

                Button[disabled] {
                    color: red;
                }

                Container Button content {
                    font-size: 10px;
                }
            `;

            expect(code).toMatchSnapshot();
        });
    });

    describe('js', () => {
        it('should keep the `styled` tag in arrow function and transform the css', () => {
            const code = transform({parser: 'babel'})`
                const Button = ({children, ...props}) =>
                styled\`Box {margin-top: 10px;}
                \`(
                <Box {...props} size="s">{children}</Box>,
                );
            `;

            expect(code).toMatchSnapshot();
        });

        it('should keep the `styled` tag with composition', () => {
            const code = transform({parser: 'babel'})`
                const Button = ({children, ...props}) =>
                styled(style1, style2)\`Box {margin-top: 10px;} button[disabled] {color: gray;}
                \`(
                <Box {...props} size="s">{children}</Box>,
                );
            `;

            expect(code).toMatchSnapshot();
        });

        it('should keep the `styled` tag with long composition', () => {
            const code = transform({parser: 'babel'})`
                const Button = ({children, ...props}) =>
                styled(style1, style2, style3, style4, style5, style6)\`Box {margin-top: 10px;}
                \`(
                <Box {...props} size="s">{children}</Box>,
                );
            `;

            expect(code).toMatchSnapshot();
        });

        it('should keep process the callback and remove the comma dangle', () => {
            const code = transform({parser: 'babel'})`
            const Button = components.map(x => styled\`
                div {color: green;}
            \`(
                <div {...x.props} size="m">
                    {x.map(child => styled\`
                        child {opacity: .5}
                    \`(
                        <child>{child}</child>
                    ))}
                </div>,
            ));
            `;

            expect(code).toMatchSnapshot();
        });
    });
});
