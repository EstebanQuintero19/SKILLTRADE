module.exports = {
  default: {
    require: [
      'tests/step_definitions/**/*.js',
      'tests/support/**/*.js'
    ],
    format: [
      'progress-bar',
      'json:reports/cucumber_report.json',
      'html:reports/cucumber_report.html'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    publishQuiet: true,
    dryRun: false,
    failFast: false,
    strict: true,
    tags: 'not @skip'
  }
};
