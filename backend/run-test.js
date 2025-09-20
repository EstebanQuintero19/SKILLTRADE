const { runCucumber } = require('@cucumber/cucumber');
const { loadConfiguration } = require('@cucumber/cucumber/api');

async function run() {
  const configuration = await loadConfiguration({
    provided: {
      require: ['test/features/step_definitions/test_steps.js'],
      format: ['progress'],
      paths: ['test/features/test.feature']
    }
  });

  const { success } = await runCucumber(configuration);
  process.exit(success ? 0 : 1);
}

run().catch(console.error);
