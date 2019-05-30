const lib = '/lib/';

const react = ['<rootDir>/packages/react', '<rootDir>/packages/styled'];
const runtime = ['<rootDir>/packages/core'];

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
            roots: [...react, ...runtime],
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
            modulePathIgnorePatterns: [lib, ...react, ...runtime],
            testEnvironment: 'node',
        },
    ],
};
