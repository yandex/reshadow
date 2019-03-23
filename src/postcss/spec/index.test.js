const postcss = require('postcss');
const {stripIndent} = require('common-tags');

const reshadow = require('..');

const createTransform = (options = {}) => {
    const processor = postcss([reshadow(options)]);

    return css => processor.process(stripIndent(css), {from: undefined}).css;
};

const transform = createTransform();

describe('postcss', () => {
    it('should transform the code', () => {
        const code = transform`
            button {
                color: red;
            }

            button[disabled] {
                color: grey;
            }

            button[type="submit"] {
                border: 1px solid red;
            }
        `;

        expect(code).toMatchSnapshot();
    });

    it('should transform the code with namespaces', () => {
        const code = transform`
            |button,
            use|button {
                color: red;
            }

            button use|content,
            button |content {
                font-weight: bold;
            }

            button[|disabled],
            button[use|disabled] {
                color: grey;
            }

            button[|size="m"],
            button[use|size="m"] {
                font-size: 14px;
            }
        `;

        expect(code).toMatchSnapshot();
    });

    it('should should keep elements under html namespace', () => {
        const code = transform`
            content html|button {
                color: red;
            }
        `;

        expect(code).toMatchSnapshot();
    });

    it('should should not transform keyframes', () => {
        const code = transform`
            @keyframes anim {
                from {
                    transform: translateX(-10px);
                }
                to {
                    transform: translateX(0);
                }
            }
        `;

        expect(code).toMatchSnapshot();
    });

    describe('stats', () => {
        const transform = createTransform({stats: true});

        it('should transform the code with stats', () => {
            const code = transform`
                [type="submit"] {
                    padding: 10px;
                }

                button {
                    color: red;
                }

                button[disabled] {
                    color: grey;
                }

                button[type="submit"] {
                    border: 1px solid red;
                }

                button[use|size="s"] {
                    font-size: 14px;
                }
            `;

            expect(code).toMatchSnapshot();
        });
    });

    describe('bem', () => {
        const transform = createTransform({bem: true});

        it.skip('should transform the code with bem', () => {
            const code = transform`
                __button {
                    color: red;
                }

                __button[disabled] {
                    color: grey;
                }

                __button[_size="m"] {
                    font-size: 14px;
                }
            `;

            expect(code).toMatchSnapshot();
        });
    });
});
