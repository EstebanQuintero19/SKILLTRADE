const { runCucumber, loadConfiguration } = require('@cucumber/cucumber/api');
const { execSync } = require('child_process');

console.log('Starting simple Cucumber.js test...');

// Simple test to verify the setup
async function runSimpleTest() {
  try {
    // Run a simple command to verify Node.js is working
    console.log('Running Node.js version:', process.version);
    
    // Verify Cucumber is installed
    const cucumberVersion = execSync('npx cucumber-js --version').toString().trim();
    console.log('Cucumber.js version:', cucumberVersion);
    
    // Run a simple test
    console.log('Running a simple test...');
    const testValue = 'test';
    if (testValue !== 'test') {
      throw new Error('Test failed: Values do not match');
    }
    
    console.log('✅ Simple test passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runSimpleTest();
