const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

Given('a basic test', function () {
  this.value = 'test';
});

When('I check the value', function () {
  // Just a simple check
});

Then('it should work', function () {
  assert.strictEqual(this.value, 'test');
});
