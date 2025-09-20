const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

Given('I have a simple test', function () {
  this.testValue = 'Hello, World!';
});

When('I run the test', function () {
  this.testResult = this.testValue;
});

Then('it should pass', function () {
  expect(this.testResult).to.equal('Hello, World!');
});
