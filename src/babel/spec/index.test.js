const {stripIndent} = require('common-tags');
const {transformAsync} = require('@babel/core');

const defaultOptions = {
    root: __dirname,
    filename: __filename,
    babelrc: false,
    configFile: false,
    presets: [
        ['@babel/preset-react', {throwIfNamespace: false, useBuiltIns: true}],
    ],
    plugins: [[require.resolve('..'), {useBuiltIns: true}]],
};

const transformCode = (code, options = defaultOptions) =>
    transformAsync(stripIndent(code), options);

const transform = code => transformCode(code);
transform.with = params => code => transformCode(code, params);

describe('babel', () => {
    it('should transform the code', async () => {
        const {code} = await transform`
            import React from 'react'
            import styled from 'reshadow'

            import styles from './styles'

            const App = ({disabled, type}) => styled(styles)(
                <button type={type} disabled={disabled} use:theme="normal">
                    content
                </button>
            )

            export default App
        `;

        expect(code).toMatchSnapshot();
    });

    it('should transform the nested code', async () => {
        const {code} = await transform`
            import React from 'react'
            import styled from 'reshadow'

            import styles from './styles'
            import styles2 from './styles2'

            const App = ({disabled, type}) => styled(styles)(
                <button type={type} disabled={disabled} use:theme="normal">
                    {styled(styles2)(
                        <content>content</content>
                    )}

                    <button>click</button>
                </button>
            )

            export default App
        `;

        expect(code).toMatchSnapshot();
    });

    it('should transform with css-in-js code', async () => {
        const {code} = await transform`
            import React from 'react'
            import styled from 'reshadow'

            const App = ({disabled, type}) => styled\`
                button[disabled] {
                    color: red;
                }
            \`(
                <button type={type} disabled={disabled} use:theme="normal">
                    content
                </button>
            )

            export default App
        `;

        expect(code).toMatchSnapshot();
    });

    it('should transform with css-in-js code with styles', async () => {
        const {code} = await transform`
            import React from 'react'
            import styled from 'reshadow'

            import styles from './styles'

            const App = ({disabled, type}) => styled(styles)\`
                button[disabled] {
                    color: red;
                }
            \`(
                <button type={type} disabled={disabled} use:theme="normal">
                    content
                </button>
            )

            export default App
        `;

        expect(code).toMatchSnapshot();
    });

    it('should transform with css-in-js code with variables', async () => {
        const {code} = await transform`
            import React from 'react'
            import styled from 'reshadow'

            import styles from './styles'

            const App = ({disabled, type, color, bgcolor}) => styled(styles)\`
                button[disabled] {
                    color: \${color};
                    background-color: \${bgcolor};
                }
            \`(
                <button type={type} disabled={disabled} use:theme="normal">
                    content
                </button>
            )

            export default App
        `;

        expect(code).toMatchSnapshot();
    });

    it('should transform with css-in-js code with variables with string inline style', async () => {
        const {code} = await transform.with({
            ...defaultOptions,
            plugins: [[require.resolve('..'), {stringStyle: true}]],
        })`
            import React from 'react'
            import styled from 'reshadow'

            import styles from './styles'

            const App = ({disabled, type, color, bgcolor}) => styled(styles)\`
                button[disabled] {
                    color: \${color};
                    background-color: \${bgcolor};
                }
            \`(
                <button type={type} disabled={disabled} use:theme="normal">
                    content
                </button>
            )

            export default App
        `;

        expect(code).toMatchSnapshot();
    });

    it('should transform with css-in-js code with variables in sibling nodes', async () => {
        const {code} = await transform`
            import React from 'react'
            import styled from 'reshadow'

            import styles from './styles'

            const App = ({disabled, type, color, bgcolor}) => styled(styles)\`
                button[disabled] {
                    color: \${color};
                    background-color: \${bgcolor};
                }
            \`(
                <>
                    <button type={type} disabled={disabled} use:theme="normal">
                        content
                    </button>
                    <button type={type} disabled={disabled} use:theme="action">
                        content 2
                    </button>
                </>
            )

            export default App
        `;

        expect(code).toMatchSnapshot();
    });

    it('should keep the links to styles if they cant hoist', async () => {
        const {code} = await transform`
            import React from 'react'
            import styled from 'reshadow'

            import baseStyles from './styles'

            const App = ({disabled, styles, type, color, bgcolor}) => styled(styles, baseStyles)\`
                button {
                    color: red;
                }
            \`(
                <button type={type} disabled={disabled} use:theme="normal">
                    content
                </button>
            )

            export default App
        `;

        expect(code).toMatchSnapshot();
    });

    it('should transform tag with namespace', async () => {
        const {code} = await transform`
            import React from 'react'
            import styled, {use} from 'reshadow'

            import styles from './styles'

            const App = ({disabled, type}) => styled(styles)(
                <use:button type={type} disabled={disabled}>
                    <use:content as="span">content</use:content>
                </use:button>
            )

            export default App
        `;

        expect(code).toMatchSnapshot();
    });

    it('should transform tag with dot element', async () => {
        const {code} = await transform`
            import React from 'react'
            import styled, {use} from 'reshadow'

            import styles from './styles'

            const App = ({disabled, type}) => styled(styles)(
                <use.button type={type} disabled={disabled}>
                    <use.content as="span">content</use.content>
                </use.button>
            )

            export default App
        `;

        expect(code).toMatchSnapshot();
    });

    it('should merge attributes well', async () => {
        const {code} = await transform`
            import React from 'react'
            import styled, {use} from 'reshadow'

            import styles from './styles'

            const App = ({disabled, type, ...props}) => styled(styles)(
                <button
                    disabled
                    name="button"
                    {...props}
                    type="submit"
                    autofocus
                    use:theme="normal"
                    {...use({size: 's'})}
                >
                    content
                </button>
            )

            export default App
        `;

        expect(code).toMatchSnapshot();
    });

    it('should work with just spread', async () => {
        const {code} = await transform`
            import React from 'react'
            import styled from 'reshadow'

            const Button = (props) => styled\`
                button {
                    padding: 5px 10px;
                }
            \`(
                <button {...props} />
            )

            export default Button
        `;

        expect(code).toMatchSnapshot();
    });

    describe('macro', () => {
        const options = {
            ...defaultOptions,
            plugins: ['babel-plugin-macros'],
        };

        it('should process module with macro', async () => {
            const {code} = await transform.with(options)`
                import React from 'react'
                import styled from '../../macro'

                const App = ({disabled, type}) => styled(styles)\`
                    button {
                        color: red;
                    }
                \`(
                    <button type={type} disabled={disabled} use:theme="normal">
                        content
                    </button>
                )

                export default App
            `;

            expect(code).toMatchSnapshot();
        });

        it('should keep named imports', async () => {
            const {code} = await transform.with(options)`
                import React from 'react'
                import styled, {use} from '../../macro'

                const App = ({disabled, type}) => styled(styles)\`
                    button {
                        color: red;
                    }
                \`(
                    <button type={type} disabled={disabled} {...use({theme: 'normal'})}>
                        content
                    </button>
                )

                export default App
            `;

            expect(code).toMatchSnapshot();
        });

        it('should merge use', async () => {
            const {code} = await transform.with(options)`
                import React from 'react'
                import styled, {use} from '../../macro'

                const App = ({disabled, type}) => styled(styles)\`
                    button {
                        color: red;
                    }
                \`(
                    <button use:size="s" {...use({theme: 'normal'})}>
                        content
                    </button>
                )

                export default App
            `;

            expect(code).toMatchSnapshot();
        });
    });

    describe('postcss', () => {
        const options = {
            ...defaultOptions,
            plugins: [
                [
                    require.resolve('..'),
                    {postcss: true, useBuiltIns: true, files: /\.css$/},
                ],
            ],
        };

        it('should process styles and add them runtime', async () => {
            const {code} = await transform.with(options)`
                import React from 'react'
                import styled from 'reshadow'

                const App = ({disabled, type}) => styled\`
                    button {
                        color: red;
                    }
                \`(
                    <button type={type} disabled={disabled} use:theme="normal">
                        content
                    </button>
                )

                export default App
            `;

            expect(code).toMatchSnapshot();
        });

        it('should process styles with css', async () => {
            const {code} = await transform.with(options)`
                import React from 'react'
                import styled, {css} from 'reshadow'

                const styles = css\`
                    button {
                        color: red;
                    }
                \`

                const App = ({disabled, type}) => styled(styles)(
                    <button type={type} disabled={disabled} use:theme="normal">
                        content
                    </button>
                )

                export default App
            `;

            expect(code).toMatchSnapshot();
        });

        it('should process styles with css local name', async () => {
            const {code} = await transform.with(options)`
                import React from 'react'
                import styled, {css as localCss} from 'reshadow'

                const styles = localCss\`
                    button {
                        color: red;
                    }
                \`

                const App = ({disabled, type}) => styled(styles)(
                    <button type={type} disabled={disabled} use:theme="normal">
                        content
                    </button>
                )

                export default App
            `;

            expect(code).toMatchSnapshot();
        });

        it('should process styles from file', async () => {
            const {code} = await transform.with(options)`
                import React from 'react'
                import styled from 'reshadow'

                import styles from './styles.css'

                const App = ({disabled, type}) => styled(styles)(
                    <button type={type} disabled={disabled} use:theme="normal">
                        content
                    </button>
                )

                export default App
            `;

            expect(code).toMatchSnapshot();
        });

        it('should work with css-modules imports', async () => {
            const {code} = await transform.with(options)`
                import React from 'react'
                import styled from 'reshadow'

                const App = ({disabled, type}) => styled\`
                    @value title from './classes.css';

                    button {
                        composes: title;

                        color: red;
                    }
                \`(
                    <button type={type} disabled={disabled} use:theme="normal">
                        content
                    </button>
                )

                export default App
            `;

            expect(code).toMatchSnapshot();
        });
    });
});
