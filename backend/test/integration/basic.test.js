const { expect } = require('chai');
const request = require('supertest');
const app = require('../../index');

// Prueba básica de conexión
describe('Prueba de conexión básica', function() {
  it('debería devolver un mensaje de bienvenida', async function() {
    const res = await request(app)
      .get('/')
      .expect(200);

    expect(res.body).to.have.property('message');
    expect(res.body.message).to.be.a('string');
  });
});
