const { execSync } = require('child_process');

console.log('Running Cucumber tests...');

try {
  // Run the test with the local installation of cucumber-js
  const result = execSync(
    'npx cucumber-js test/features/integration/usuario_curso.feature --require test/features/integration/steps/curso.steps.js --require test/test-helper.js --format progress-bar',
    { stdio: 'inherit' }
  );
  console.log('Tests completed successfully!');
} catch (error) {
  console.error('Error running tests:', error);
  process.exit(1);
}
