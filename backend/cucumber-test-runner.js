const { execSync } = require('child_process');

console.log('Running Cucumber tests...');

try {
  // Run the test with the local installation of cucumber-js
  const result = execSync(
    'npx cucumber-js test/features/simple.feature --require test/features/steps/simple.steps.js --format progress-bar',
    { stdio: 'inherit' }
  );
  console.log('Tests completed successfully!');
} catch (error) {
  console.error('Error running tests:', error);
  process.exit(1);
}
