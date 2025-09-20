module.exports = {
  timeout: 10000, // 10 seconds timeout for tests
  require: ['ts-node/register', 'test/test-helper.js'],
  extension: ['ts', 'js'],
  watch: false,
  'full-trace': true,
  bail: false,
  exit: true,
  recursive: true,
  reporter: 'spec',
  slow: 75,
  ui: 'bdd'
};
