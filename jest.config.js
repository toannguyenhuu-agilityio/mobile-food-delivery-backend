/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!<rootDir>/node_modules/',
    '!<rootDir>/path/to/dir/',
  ],
  coveragePathIgnorePatterns: [
    'node_modules',
    'test-config',
    'interfaces',
    'jestGlobalMocks.ts',
    '.module.ts',
    '<rootDir>/src/index.ts',
    '<rootDir>/src/constants/*',
    '<rootDir>/src/__mockData__/*',
    '<rootDir>/src/migrations/*',
    '<rootDir>/src/entities/*',
    '<rootDir>/src/data-source.ts',
    '<rootDir>/src/vite-env.d.ts',
    '.mock.ts',
    '^.*\\.stories\\.[jt]sx?$',
  ],
};
