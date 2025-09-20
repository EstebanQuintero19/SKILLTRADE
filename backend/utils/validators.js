/**
 * Valida que una contraseña cumpla con los requisitos de seguridad
 * @param {string} password - La contraseña a validar
 * @returns {boolean} - true si la contraseña es válida, false en caso contrario
 */
const validarContrasena = (password) => {
  // Mínimo 8 caracteres, al menos una letra mayúscula, una minúscula, un número y un carácter especial
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

module.exports = {
  validarContrasena
};
