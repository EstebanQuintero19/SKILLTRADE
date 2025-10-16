// JavaScript para la página de ver usuario del administrador

// Datos de sesión para autenticación
window.sessionData = {
    signedIn: typeof signedIn !== 'undefined' ? signedIn : false,
    token: typeof token !== 'undefined' ? token : '',
    user: typeof user !== 'undefined' ? user : null
};

// Función para inicializar la página
function initAdminVerUsuario() {
    console.log('Página de ver usuario del administrador cargada');
    
    // Aquí se pueden agregar más funcionalidades específicas
    // como animaciones adicionales, validaciones, etc.
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initAdminVerUsuario);
