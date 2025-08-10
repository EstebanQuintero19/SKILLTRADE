const { body, param, query, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const manejarErroresValidacion = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({
            error: 'Datos de entrada inválidos',
            detalles: errores.array()
        });
    }
    next();
};

// Validaciones para usuarios
const validarRegistroUsuario = [
    body('nombre')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('El email debe ser válido'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres'),
    manejarErroresValidacion
];

const validarLoginUsuario = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('El email debe ser válido'),
    body('password')
        .notEmpty()
        .withMessage('La contraseña es requerida'),
    manejarErroresValidacion
];

const validarActualizacionUsuario = [
    body('nombre')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('El email debe ser válido'),
    body('biografia')
        .optional()
        .isLength({ max: 500 })
        .withMessage('La biografía no puede exceder 500 caracteres'),
    body('visibilidadPerfil')
        .optional()
        .isIn(['publico', 'privado'])
        .withMessage('La visibilidad del perfil debe ser público o privado'),
    manejarErroresValidacion
];

const validarCambioPassword = [
    body('passwordActual')
        .notEmpty()
        .withMessage('La contraseña actual es requerida'),
    body('passwordNueva')
        .isLength({ min: 6 })
        .withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
    manejarErroresValidacion
];

// Validaciones para cursos
const validarCreacionCurso = [
    body('titulo')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('El título debe tener entre 5 y 200 caracteres'),
    body('descripcion')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('La descripción debe tener entre 10 y 2000 caracteres'),
    body('categoria')
        .isArray({ min: 1 })
        .withMessage('Debe seleccionar al menos una categoría'),
    body('categoria.*')
        .isString()
        .isLength({ min: 3, max: 50 })
        .withMessage('Cada categoría debe tener entre 3 y 50 caracteres'),
    body('nivel')
        .isIn(['basico', 'intermedio', 'avanzado'])
        .withMessage('El nivel debe ser básico, intermedio o avanzado'),
    body('precio')
        .isFloat({ min: 0 })
        .withMessage('El precio debe ser un número positivo'),
    body('visibilidad')
        .optional()
        .isIn(['publico', 'privado', 'soloSuscriptores'])
        .withMessage('La visibilidad debe ser público, privado o solo suscriptores'),
    manejarErroresValidacion
];

const validarActualizacionCurso = [
    body('titulo')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('El título debe tener entre 5 y 200 caracteres'),
    body('descripcion')
        .optional()
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('La descripción debe tener entre 10 y 2000 caracteres'),
    body('categoria')
        .optional()
        .isArray({ min: 1 })
        .withMessage('Debe seleccionar al menos una categoría'),
    body('categoria.*')
        .optional()
        .isString()
        .isLength({ min: 3, max: 50 })
        .withMessage('Cada categoría debe tener entre 3 y 50 caracteres'),
    body('nivel')
        .optional()
        .isIn(['basico', 'intermedio', 'avanzado'])
        .withMessage('El nivel debe ser básico, intermedio o avanzado'),
    body('precio')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El precio debe ser un número positivo'),
    body('visibilidad')
        .optional()
        .isIn(['publico', 'privado', 'soloSuscriptores'])
        .withMessage('La visibilidad debe ser público, privado o solo suscriptores'),
    manejarErroresValidacion
];

// Validaciones para intercambios
const validarCreacionExchange = [
    body('receptor')
        .isMongoId()
        .withMessage('El ID del receptor debe ser válido'),
    body('cursoEmisor')
        .isMongoId()
        .withMessage('El ID del curso del emisor debe ser válido'),
    body('cursoReceptor')
        .isMongoId()
        .withMessage('El ID del curso del receptor debe ser válido'),
    body('tipo')
        .isIn(['intercambio', 'prestamo'])
        .withMessage('El tipo debe ser intercambio o préstamo'),
    body('duracion')
        .isInt({ min: 1, max: 365 })
        .withMessage('La duración debe estar entre 1 y 365 días'),
    manejarErroresValidacion
];

const validarActualizacionExchange = [
    body('estado')
        .optional()
        .isIn(['pendiente', 'aceptado', 'rechazado', 'activo', 'finalizado', 'cancelado'])
        .withMessage('El estado debe ser válido'),
    body('duracion')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('La duración debe estar entre 1 y 365 días'),
    manejarErroresValidacion
];

// Validaciones para suscripciones
const validarCreacionSuscripcion = [
    body('creador')
        .isMongoId()
        .withMessage('El ID del creador debe ser válido'),
    body('plan.tipo')
        .isIn(['mensual', 'trimestral', 'semestral', 'anual'])
        .withMessage('El tipo de plan debe ser válido'),
    body('plan.precio')
        .isFloat({ min: 0 })
        .withMessage('El precio del plan debe ser un número positivo'),
    body('plan.duracion')
        .isInt({ min: 1 })
        .withMessage('La duración del plan debe ser un número positivo'),
    manejarErroresValidacion
];

// Validaciones para ventas
const validarCreacionVenta = [
    body('vendedor')
        .isMongoId()
        .withMessage('El ID del vendedor debe ser válido'),
    body('curso')
        .isMongoId()
        .withMessage('El ID del curso debe ser válido'),
    body('precio')
        .isFloat({ min: 0 })
        .withMessage('El precio debe ser un número positivo'),
    body('metodoPago.tipo')
        .isIn(['tarjeta', 'paypal', 'transferencia', 'efectivo'])
        .withMessage('El tipo de método de pago debe ser válido'),
    manejarErroresValidacion
];

// Validaciones para calificaciones
const validarCalificacion = [
    body('puntuacion')
        .isInt({ min: 1, max: 5 })
        .withMessage('La puntuación debe estar entre 1 y 5'),
    body('comentario')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('El comentario no puede exceder 500 caracteres'),
    manejarErroresValidacion
];

// Validaciones para comentarios
const validarComentario = [
    body('contenido')
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('El comentario debe tener entre 1 y 1000 caracteres'),
    manejarErroresValidacion
];

// Validaciones para parámetros de ID
const validarId = [
    param('id')
        .isMongoId()
        .withMessage('El ID debe ser válido'),
    manejarErroresValidacion
];

const validarCursoId = [
    param('cursoId')
        .isMongoId()
        .withMessage('El ID del curso debe ser válido'),
    manejarErroresValidacion
];

const validarExchangeId = [
    param('exchangeId')
        .isMongoId()
        .withMessage('El ID del intercambio debe ser válido'),
    manejarErroresValidacion
];

// Validaciones para búsquedas
const validarBusqueda = [
    query('search')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El término de búsqueda debe tener entre 2 y 100 caracteres'),
    query('categoria')
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('La categoría debe tener entre 3 y 50 caracteres'),
    query('nivel')
        .optional()
        .isIn(['basico', 'intermedio', 'avanzado'])
        .withMessage('El nivel debe ser básico, intermedio o avanzado'),
    query('precioMin')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El precio mínimo debe ser un número positivo'),
    query('precioMax')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El precio máximo debe ser un número positivo'),
    query('orden')
        .optional()
        .isIn(['fecha', 'nombre', 'precio', 'calificacion', 'popularidad'])
        .withMessage('El orden debe ser válido'),
    query('direccion')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('La dirección debe ser asc o desc'),
    query('pagina')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La página debe ser un número positivo'),
    query('limite')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('El límite debe estar entre 1 y 100'),
    manejarErroresValidacion
];

// Validaciones para paginación
const validarPaginacion = [
    query('pagina')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La página debe ser un número positivo'),
    query('limite')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('El límite debe estar entre 1 y 100'),
    manejarErroresValidacion
];

module.exports = {
    manejarErroresValidacion,
    validarRegistroUsuario,
    validarLoginUsuario,
    validarActualizacionUsuario,
    validarCambioPassword,
    validarCreacionCurso,
    validarActualizacionCurso,
    validarCreacionExchange,
    validarActualizacionExchange,
    validarCreacionSuscripcion,
    validarCreacionVenta,
    validarCalificacion,
    validarComentario,
    validarId,
    validarCursoId,
    validarExchangeId,
    validarBusqueda,
    validarPaginacion
};
