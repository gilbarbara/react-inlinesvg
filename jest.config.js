module.exports = {
  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.{js,jsx}'],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  moduleDirectories: ['node_modules', 'src', './'],
  moduleFileExtensions: ['js', 'jsx', 'json'],
  setupFiles: ['<rootDir>/test/__setup__/setupFiles.js'],
  setupTestFrameworkScriptFile: '<rootDir>/node_modules/jest-enzyme/lib/index.js',
  testRegex: '/test/.*?\\.(test|spec)\\.js$',
  testURL: 'http://localhost:1337/',
  transform: { '^.+\\.jsx?$': 'babel-jest' },
  verbose: false,
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
};
