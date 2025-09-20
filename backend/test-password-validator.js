// Test file for password validator
const { validarContrasena } = require('./utils/validadores');
const assert = require('assert');

console.log('=== Iniciando pruebas de validación de contraseña ===\n');

// Test cases
const testCases = [
  { 
    password: 'Clave123!', 
    expected: true, 
    description: 'Contraseña válida con todos los requisitos' 
  },
  { 
    password: 'clave123!', 
    expected: false, 
    description: 'Falta letra mayúscula' 
  },
  { 
    password: 'CLAVE123!', 
    expected: false, 
    description: 'Falta letra minúscula' 
  },
  { 
    password: 'Claveabc!', 
    expected: false, 
    description: 'Falta número' 
  },
  { 
    password: 'Clave1234', 
    expected: false, 
    description: 'Falta carácter especial' 
  },
  { 
    password: 'Cl1!', 
    expected: false, 
    description: 'Demasiado corta (mínimo 8 caracteres)' 
  },
];

// Run tests
let passed = 0;
let failed = 0;

console.log('Detalles de las pruebas:');
console.log('------------------------');

testCases.forEach((test, index) => {
  try {
    const result = validarContrasena(test.password);
    // For expected valid passwords
    if (test.expected) {
      assert.strictEqual(result.valida, true, `Se esperaba que la contraseña fuera válida pero se marcó como inválida: ${result.mensaje}`);
    } 
    // For expected invalid passwords
    else {
      if (result.valida) {
        throw new Error(`Se esperaba que la contraseña fuera inválida pero se marcó como válida`);
      }
    }
    
    console.log(`✅ Prueba ${index + 1}: ${test.description}`);
    console.log(`   Contraseña: "${test.password}"`);
    console.log(`   Resultado: ${result.valida ? 'VÁLIDA' : 'INVÁLIDA'} (esperado: ${test.expected ? 'VÁLIDA' : 'INVÁLIDA'})`);
    console.log(`   Mensaje: ${result.mensaje}\n`);
    passed++;
  } catch (error) {
    const result = validarContrasena(test.password);
    console.error(`❌ Prueba ${index + 1} falló: ${test.description}`);
    console.error(`   Contraseña: "${test.password}"`);
    console.error(`   Resultado: ${result.valida ? 'VÁLIDA' : 'INVÁLIDA'} (esperado: ${test.expected ? 'VÁLIDA' : 'INVÁLIDA'})`);
    console.error(`   Mensaje: ${result.mensaje}`);
    console.error(`   Error: ${error.message}\n`);
    failed++;
  }
});

// Summary
console.log('=== Resumen de resultados ===');
console.log(`✅ Aprobadas: ${passed}`);
console.log(`❌ Fallidas: ${failed}`);
console.log('============================');

process.exit(failed > 0 ? 1 : 0);
