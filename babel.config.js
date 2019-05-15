module.exports = {
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
    overrides: [
        {
            test: ['./packages/core'],
            presets: ['@babel/preset-env'],
        },
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
};
