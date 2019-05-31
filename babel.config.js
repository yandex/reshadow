const react = ['core', 'react', 'styled'].map(
    x => `./packages/${x}/**/spec/**`,
);

module.exports = {
    presets: [['@babel/preset-env']],
    overrides: [
        {
            test: react,
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
                ['./packages/babel', {postcss: false}],
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
