const { expect } = require('chai');

// Prueba simple sin dependencias
describe('Prueba de Mocha', () => {
  it('debería sumar números correctamente', () => {
    expect(1 + 1).to.equal(2);
  });

  it('debería verificar valores booleanos', () => {
    expect(true).to.be.true;
    expect(false).to.be.false;
  });
});
