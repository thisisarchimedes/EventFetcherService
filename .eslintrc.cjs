const { off } = require('process');

module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'google',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  rules: {
    complexity: ['error', { max: 8 }],
    'valid-jsdoc': 'off',
    'require-jsdoc': 'off',
    'max-len': ['error', { code: 140 }],
  },
};
