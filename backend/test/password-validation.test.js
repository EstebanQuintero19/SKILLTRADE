const { expect } = require('chai');
const { validarContrasena } = require('../utils/validadores');

describe('Validación de Contraseña', () => {
  it('debería aceptar una contraseña válida', () => {
    const resultado = validarContrasena('Contraseña123!');
    expect(resultado).to.have.property('valida', true);
  });

  it('debería rechazar contraseña muy corta', () => {
    const resultado = validarContrasena('Corta1!');
    expect(resultado).to.have.property('valida', false);
    expect(resultado.mensaje).to.include('al menos 8 caracteres');
  });

  it('debería requerir al menos una mayúscula', () => {
    const resultado = validarContrasena('contraseña123!');
    expect(resultado).to.have.property('valida', false);
    expect(resultado.mensaje).to.include('mayúscula');
  });

  it('debería requerir al menos una minúscula', () => {
    const resultado = validarContrasena('CONTRASEÑA123!');
    expect(resultado).to.have.property('valida', false);
    expect(resultado.mensaje).to.include('minúscula');
  });

  it('debería requerir al menos un número', () => {
    const resultado = validarContrasena('Contraseña!');
    expect(resultado).to.have.property('valida', false);
    expect(resultado.mensaje).to.include('número');
  });

  it('debería requerir al menos un carácter especial', () => {
    const resultado = validarContrasena('Contraseña123');
    expect(resultado).to.have.property('valida', false);
    expect(resultado.mensaje).to.include('carácter especial');
  });
});
