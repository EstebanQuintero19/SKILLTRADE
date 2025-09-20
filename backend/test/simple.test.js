const { expect } = require('chai');

describe('Prueba Simple', function() {
  it('debería pasar esta prueba básica', function() {
    expect(true).to.be.true;
  });

  it('debería sumar números correctamente', function() {
    expect(1 + 1).to.equal(2);
  });
});
