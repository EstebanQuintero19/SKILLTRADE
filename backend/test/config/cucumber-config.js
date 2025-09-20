module.exports = {
  default: {
    require: [
      'test/features/integration/steps/*.js',
      'test/test-helper.js'
    ],
    format: [
      'progress-bar',
      'html:test/reports/cucumber-report.html',
      'json:test/reports/cucumber-report.json'
    ],
    tags: '@integracion',
    publishQuiet: true,
    parallel: 1
  }
};
