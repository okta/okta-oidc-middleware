module.exports = {
  coverageDirectory: '<rootDir>/reports/coverage',
  collectCoverage: true,
  collectCoverageFrom: [
    './src/**'
  ],
  reporters: [
    'default',
    [
      'jest-junit', {
        outputDirectory: './reports/unit/',
        outputName: 'junit-result.xml'
      }
    ]
  ],
  restoreMocks: true,
  roots: [
    './test/unit'
  ],
  testEnvironment: 'node',
  fakeTimers: {
    legacyFakeTimers: true
  },
  moduleNameMapper: {
    '^express$': process.env.EXPRESS5 === '1' ? '<rootDir>/node_modules/express5' : '<rootDir>/node_modules/express4',
    'uuid': '<rootDir>/node_modules/uuid/dist/index.js'
  }
};
