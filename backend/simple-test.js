// Simple test to verify Node.js and basic imports are working
console.log('Running simple test...');

try {
  const { Given, When, Then } = require('@cucumber/cucumber');
  const assert = require('assert');
  
  console.log('Cucumber imports are working!');
  
  // Simple test
  let testValue = 'test';
  assert.strictEqual(testValue, 'test');
  
  console.log('✅ All tests passed!');
  process.exit(0);
} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
}
