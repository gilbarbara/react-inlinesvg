import '@testing-library/jest-dom';

import { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';
import * as matchers from 'jest-extended';

expect.extend(matchers);

// TODO(testing-library/jest-dom#738): jest-dom 7 augments vitest 4's `Assertion<T>`, which no longer
// merges with vitest 5's `Assertion<R, T>`. Remove once jest-dom ships vitest 5 types.
declare module 'vitest' {
  // jest-extended only declares a global `CustomMatchers`. Augmenting `Assertion` rather than
  // `Matchers` keeps those signatures out of `expect.extend`'s `MatchersObject` type.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
  interface Assertion<R, T> extends CustomMatchers<R> {}

  // Merged declarations must repeat vitest's type parameters.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
  interface Matchers<R, T> extends TestingLibraryMatchers<unknown, R> {}
}
