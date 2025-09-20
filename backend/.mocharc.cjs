module.exports = {
  timeout: 10000,
  exit: true,
  recursive: true,
  extension: ['js'],
  spec: ['test/**/*.test.js'],
  require: ['test/test-helper.js']
};
