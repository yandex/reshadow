module.exports = {
    extends: [
        'standard',
        'plugin:import/recommended',
        'plugin:flowtype/recommended',
        'plugin:react/recommended',
        'plugin:prettier/recommended',
        'prettier/flowtype',
        'prettier/react',
        'prettier/standard',
    ],
    plugins: ['import', 'flowtype', 'react', 'prettier', 'standard'],
    settings: {
        react: {
            version: 'detect',
        },
    },
    parserOptions: {
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },
    env: {
        es6: true,
    },
    overrides: [
        {
            files: ['**/spec/*.js'],
            env: {
                jest: true,
            },
        },
        {
            files: ['*.config.js', '.*.js'],
            parserOptions: {
                sourceType: 'script',
            },
            env: {
                node: true,
            },
        },
        {
            files: ['rollup.config.js'],
            parserOptions: {
                sourceType: 'module',
            },
        },
    ],
    rules: {
        'no-sequences': 'off',
        'import/no-unresolved': ['error', {commonjs: true}],
        "import/no-extraneous-dependencies": ["error"],
    },
};
