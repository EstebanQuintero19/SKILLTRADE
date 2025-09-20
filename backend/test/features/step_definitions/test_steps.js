const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

Given('a step passes', function () {
  this.testValue = 'test';
});

When('I check something', function () {
  // Just a simple check
});

Then('it should work', function () {
  assert.strictEqual(this.testValue, 'test');
});
