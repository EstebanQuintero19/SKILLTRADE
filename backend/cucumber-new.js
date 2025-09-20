module.exports = {
  default: {
    require: [
      'test/unit/steps/**/*.js',
      'test/integration/steps/**/*.js',
      'test/support/**/*.js'
    ],
    format: [
      'progress-bar',
      'html:test/reports/cucumber-report.html',
      'json:test/reports/cucumber-report.json'
    ],
    tags: 'not @wip',
    publishQuiet: true
  }
};
