/** @type {import('@types/eslint').Linter.BaseConfig} */
module.exports = {
  extends: [
    '@remix-run/eslint-config',
    '@remix-run/eslint-config/node',
    '@remix-run/eslint-config/jest-testing-library',
    'prettier',
  ],
  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        endOfLine: 'auto',
        tabWidth: 2,
      },
    ],
    'import/order': [
      'error',
      {
        alphabetize: {
          order: 'asc',
        },
        groups: [
          'type',
          'builtin',
          'external',
          'internal',
          'parent',
          ['sibling', 'index'],
        ],
        'newlines-between': 'always',
        pathGroups: [],
        pathGroupsExcludedImportTypes: [],
      },
    ],
  },
  env: {
    'cypress/globals': true,
  },
  plugins: ['cypress', 'prettier'],
  // we're using vitest which has a very similar API to jest
  // (so the linting plugins work nicely), but it means we have to explicitly
  // set the jest version.
  settings: {
    jest: {
      version: 28,
    },
  },
};
