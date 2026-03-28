import base from '@gilbarbara/eslint-config';
import testingLibrary from '@gilbarbara/eslint-config/testing-library';
import vitest from '@gilbarbara/eslint-config/vitest';

export default [
  ...base,
  ...vitest,
  ...testingLibrary,
  {
    rules: {
      'react-compiler/react-compiler': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['test/**/*.ts?(x)'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-console': 'off',
      'testing-library/no-container': 'off',
      'testing-library/no-node-access': 'off',
    },
  },
];
