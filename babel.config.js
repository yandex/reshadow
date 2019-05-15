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
            test: ['./packages/reshadow'],
            presets: ['@babel/preset-env'],
        },
        {
            test: ['./packages/reshadow/**/spec/**'],
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
