const lib = '/lib/';

module.exports = {
    testPathIgnorePatterns: [lib],
    collectCoverageFrom: [
        'packages/**/*.js',
        '!**/spec/**',
        '!packages/eslint/index.js',
        '!packages/reshadow/index.js',
        '!packages/svelte/index.js',
        '!packages/vue/index.js',
    ],
    transform: {
        '^.+\\.jsx?$': 'babel-jest',
    },
    projects: [
        {
            displayName: 'client',
            roots: ['<rootDir>/packages/core'],
            modulePathIgnorePatterns: [lib],
            setupFilesAfterEnv: ['jest-enzyme'],
            testEnvironment: 'enzyme',
            testEnvironmentOptions: {
                enzymeAdapter: 'react16',
            },
        },
        {
            displayName: 'node',
            roots: ['<rootDir>/packages/'],
            modulePathIgnorePatterns: [lib, '<rootDir>/packages/core'],
            testEnvironment: 'node',
        },
    ],
};
