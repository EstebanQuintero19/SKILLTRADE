module.exports = {
  default: '--publish-quiet',
  format: [
    'progress-bar', 
    'html:test/reports/cucumber-report.html',
    'json:test/reports/cucumber-report.json'
  ],
  require: [
    'test/unit/steps/**/*.js',
    'test/integration/steps/**/*.js',
    'test/support/**/*.js',
    'test/test-helper.js'
  ],
  parallel: 1,
  retry: 1,
  retryTagFilter: '@flaky',
  tags: 'not @wip',
  worldParameters: {
    appUrl: 'http://localhost:3000'
  }
};
