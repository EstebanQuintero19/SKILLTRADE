// Prueba simple de Mocha
const assert = require('assert');

describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.strictEqual([1, 2, 3].indexOf(4), -1);
    });
  });

  describe('Matemáticas básicas', function() {
    it('debería sumar correctamente', function() {
      assert.strictEqual(2 + 2, 4);
    });
  });
});
