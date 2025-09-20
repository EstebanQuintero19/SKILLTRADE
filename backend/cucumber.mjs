export default {
  import: [
    'test/features/integration/steps/**/*.js',
    'test/features/unit/steps/**/*.js'
  ],
  publishQuiet: true,
  requireModule: ['ts-node/register'],
  format: [
    'progress-bar',
    'html:test/reports/cucumber-report.html',
    'json:test/reports/cucumber-report.json'
  ],
  parallel: 1,
  require: [
    'test/features/integration/steps/**/*.js',
    'test/features/unit/steps/**/*.js',
    'test/test-helper.js'
  ]
};
