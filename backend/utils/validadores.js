/**
 * Valida que una contraseña cumpla con los requisitos de seguridad
 * @param {string} contrasena - La contraseña a validar
 * @returns {Object} - Objeto con el resultado de la validación y mensaje de error si aplica
 */
const validarContrasena = (contrasena) => {
  // Verificar longitud mínima
  if (contrasena.length < 8) {
    return {
      valida: false,
      mensaje: 'La contraseña debe tener al menos 8 caracteres'
    };
  }

  // Verificar mayúsculas
  if (!/[A-Z]/.test(contrasena)) {
    return {
      valida: false,
      mensaje: 'La contraseña debe contener al menos una letra mayúscula'
    };
  }

  // Verificar minúsculas
  if (!/[a-z]/.test(contrasena)) {
    return {
      valida: false,
      mensaje: 'La contraseña debe contener al menos una letra minúscula'
    };
  }

  // Verificar números
  if (!/\d/.test(contrasena)) {
    return {
      valida: false,
      mensaje: 'La contraseña debe contener al menos un número'
    };
  }

  // Verificar caracteres especiales
  if (!/[@$!%*?&]/.test(contrasena)) {
    return {
      valida: false,
      mensaje: 'La contraseña debe contener al menos un carácter especial (@$!%*?&)'
    };
  }

  return {
    valida: true,
    mensaje: 'Contraseña válida'
  };
};

module.exports = {
  validarContrasena
};
