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
  testEnvironment: 'jsdom',
};
