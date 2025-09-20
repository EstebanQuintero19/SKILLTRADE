const request = require('supertest');
const { expect } = require('chai');
const app = require('../../index'); // Asegúrate de que esto apunte a tu archivo principal
const mongoose = require('mongoose');
const { createTestUser, getAuthToken } = require('../test-helper');

// Datos de prueba
const testUser = {
  nombre: 'Usuario de Prueba',
  email: 'test@example.com',
  password: 'Clave123!',
  biografia: 'Biografía de prueba',
  telefono: '1234567890',
  rol: 'usuario'
};

// Variables para almacenar datos entre pruebas
let authToken;
let userId;

// Configuración de tiempo de espera extendido para pruebas
this.timeout(10000);

describe('Pruebas de Integración: Autenticación y Usuarios', function() {
  // Datos para las pruebas
  let testUserData;
  
  // Antes de todas las pruebas
  before(async function() {
    // Crear un usuario de prueba
    testUserData = await createTestUser(testUser);
    // Obtener token de autenticación
    authToken = await getAuthToken(testUserData);
    userId = testUserData._id.toString();
  });

  // Prueba 1: Obtener perfil del usuario autenticado
  describe('GET /api/usuarios/perfil', function() {
    it('debería devolver el perfil del usuario autenticado', async function() {
      const res = await request(app)
        .get('/api/usuarios/perfil')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('nombre', testUser.nombre);
      expect(res.body.data).to.have.property('email', testUser.email);
      expect(res.body.data).to.have.property('biografia', testUser.biografia);
      expect(res.body.data).to.have.property('telefono', testUser.telefono);
    });

    it('debería fallar sin token de autenticación', async function() {
      const res = await request(app)
        .get('/api/usuarios/perfil')
        .expect(401);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'No se proporcionó token de autenticación');
    });
  });

  // Prueba 2: Actualizar perfil del usuario
  describe('PUT /api/usuarios/perfil', function() {
    const updates = {
      nombre: 'Usuario Modificado',
      biografia: 'Nueva biografía de prueba',
      telefono: '9876543210'
    };

    it('debería actualizar el perfil del usuario', async function() {
      const res = await request(app)
        .put('/api/usuarios/perfil')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('message', 'Perfil actualizado exitosamente');
      expect(res.body.data).to.have.property('nombre', updates.nombre);
      expect(res.body.data).to.have.property('biografia', updates.biografia);
      expect(res.body.data).to.have.property('telefono', updates.telefono);
    });

    it('debería fallar al actualizar con datos inválidos', async function() {
      const res = await request(app)
        .put('/api/usuarios/perfil')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'nuevo@email.com' }) // Email no se puede actualizar así
        .expect(400);

      expect(res.body).to.have.property('success', false);
    });
  });

  // Prueba 3: Cambiar contraseña
  describe('PUT /api/usuarios/cambiar-password', function() {
    const newPassword = 'NuevaClave123!';
    
    it('debería permitir cambiar la contraseña', async function() {
      const res = await request(app)
        .put('/api/usuarios/cambiar-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: newPassword,
          confirmPassword: newPassword
        })
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('message', 'Contraseña actualizada exitosamente');
      
      // Actualizar la contraseña para pruebas posteriores
      testUser.password = newPassword;
    });

    it('debería fallar con la contraseña actual incorrecta', async function() {
      const res = await request(app)
        .put('/api/usuarios/cambiar-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'contraseñaIncorrecta',
          newPassword: 'OtraClave123!',
          confirmPassword: 'OtraClave123!'
        })
        .expect(400);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'La contraseña actual es incorrecta');
    });
  });

  // Prueba 4: Cerrar sesión
  describe('POST /api/usuarios/logout', function() {
    it('debería cerrar la sesión del usuario', async function() {
      const res = await request(app)
        .post('/api/usuarios/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('message', 'Sesión cerrada exitosamente');
      
      // Verificar que el token ya no es válido
      const res2 = await request(app)
        .get('/api/usuarios/perfil')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(res2.body).to.have.property('success', false);
      expect(res2.body).to.have.property('message', 'Token inválido o expirado');
    });
  });
});
