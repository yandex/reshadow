module.exports = {
    presets: [['@babel/preset-env']],
    overrides: [
        {
            test: ['./packages/core/**/spec/**'],
            presets: [
                [
                    '@babel/preset-react',
                    {
                        throwIfNamespace: false,
                    },
                ],
            ],
            plugins: [
                '@babel/plugin-transform-modules-commonjs',
                './packages/babel',
            ],
        },
    ],
    env: {
        test: {
            presets: [
                [
                    '@babel/preset-env',
                    {
                        targets: {
                            node: 'current',
                        },
                    },
                ],
            ],
        },
    },
};
