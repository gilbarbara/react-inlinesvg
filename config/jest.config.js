module.exports = {
  rootDir: '../',
  transform: {
    '.*': '<rootDir>/node_modules/babel-jest',
  },
  moduleFileExtensions: [
    'js',
    'jsx',
    'json',
  ],
  moduleDirectories: [
    'node_modules',
    'src',
    './',
  ],
  setupTestFrameworkScriptFile: './node_modules/jest-enzyme/lib/index.js',
  setupFiles: [
    '<rootDir>/test/__setup__/shim.js',
    '<rootDir>/test/__setup__/index.js',
  ],
  testRegex: '/test/.*?\\.(test|spec)\\.js$',
  testURL: 'http://localhost:1337/',
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  verbose: true,
};
