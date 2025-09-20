// Simple test configuration to verify Cucumber.js setup
const { BeforeAll, AfterAll } = require('@cucumber/cucumber');
const { expect } = require('chai');

// Simple test to verify the setup works
console.log('Cucumber.js test configuration loaded successfully');

BeforeAll(function() {
  console.log('Before all tests');  this.testValue = 'test-value';
});

AfterAll(function() {
  console.log('After all tests');
});
