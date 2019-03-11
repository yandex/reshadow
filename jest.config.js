module.exports = {
    roots: ['<rootDir>/src/'],
    setupTestFrameworkScriptFile: 'jest-enzyme',
    testEnvironmentOptions: {
        enzymeAdapter: 'react16',
    },
    testEnvironment: 'node',
    transform: {
        '^.+\\.jsx?$': 'babel-jest',
    },
    collectCoverageFrom: [
        'src/**/*.js',
        '!**/spec/**',
        '!src/index.js',
        '!src/eslint/index.js',
    ],
};
