const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

Given('a step passes', function () {
  // This step will pass
});

When('I do something', function () {
  this.result = 'done';
});

Then('I should see a result', function () {
  expect(this.result).to.equal('done');
});
