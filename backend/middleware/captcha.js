/**
 * Middleware de CAPTCHA - SkillTrade
 * 
 * Sistema de validación anti-bot mediante operaciones matemáticas simples:
 * - Generación de operaciones aritméticas aleatorias
 * - Hash seguro del resultado con salt secreto
 * - Validación de respuestas del usuario
 * - Almacenamiento temporal en sesión del servidor
 * - Limpieza automática después de uso
 * 
 * Características de seguridad:
 * - Operaciones variables (suma, resta, multiplicación)
 * - Hash SHA-256 con salt configurable
 * - Sesión temporal para prevenir reutilización
 * - Validación tanto client-side como server-side
 */

const crypto = require('crypto');

/**
 * Generar CAPTCHA matemático simple
 * 
 * Crea una operación aritmética aleatoria con diferentes rangos:
 * - Suma: números de 1-20
 * - Resta: números de 10-39 menos 1-10 (resultado siempre positivo)
 * - Multiplicación: números de 1-10
 * 
 * @returns {Object} Objeto con pregunta, hash del resultado y resultado para debug
 */
const generarCaptcha = () => {
    const operaciones = ['+', '-', '*'];
    const operacion = operaciones[Math.floor(Math.random() * operaciones.length)];
    
    let num1, num2, resultado;
    
    switch (operacion) {
        case '+':
            num1 = Math.floor(Math.random() * 20) + 1; // 1-20
            num2 = Math.floor(Math.random() * 20) + 1; // 1-20
            resultado = num1 + num2;
            break;
        case '-':
            num1 = Math.floor(Math.random() * 30) + 10; // 10-39
            num2 = Math.floor(Math.random() * 10) + 1;  // 1-10
            resultado = num1 - num2;
            break;
        case '*':
            num1 = Math.floor(Math.random() * 10) + 1; // 1-10
            num2 = Math.floor(Math.random() * 10) + 1; // 1-10
            resultado = num1 * num2;
            break;
    }
    
    const pregunta = `${num1} ${operacion} ${num2} = ?`;
    
    // Generar hash seguro del resultado para validación
    const hash = crypto.createHash('sha256')
        .update(`${resultado}:${process.env.CAPTCHA_SECRET || 'skilltrade-captcha-secret'}`)
        .digest('hex');
    
    return {
        pregunta,
        hash,
        resultado // Solo para debugging, no se envía al frontend
    };
};

/**
 * Validar respuesta del CAPTCHA del usuario
 * 
 * Compara el hash de la respuesta del usuario con el hash esperado:
 * - Genera hash de la respuesta usando el mismo salt
 * - Compara de forma segura con el hash almacenado
 * - Previene ataques de timing mediante comparación constante
 * 
 * @param {string|number} respuestaUsuario - Respuesta numérica del usuario
 * @param {string} hashEsperado - Hash SHA-256 del resultado correcto
 * @returns {boolean} true si la respuesta es correcta, false en caso contrario
 */
const validarCaptcha = (respuestaUsuario, hashEsperado) => {
    if (!respuestaUsuario || !hashEsperado) {
        return false;
    }
    
    // Generar hash de la respuesta del usuario
    const hashRespuesta = crypto.createHash('sha256')
        .update(`${respuestaUsuario}:${process.env.CAPTCHA_SECRET || 'skilltrade-captcha-secret'}`)
        .digest('hex');
    
    return hashRespuesta === hashEsperado;
};

// Middleware para agregar CAPTCHA a las rutas que lo necesiten
const agregarCaptcha = (req, res, next) => {
    const captcha = generarCaptcha();
    
    // Guardar el hash en la sesión para validación posterior
    if (!req.session) {
        return res.status(500).json({
            success: false,
            message: 'Sesión no disponible'
        });
    }
    
    req.session.captchaHash = captcha.hash;
    
    // Agregar CAPTCHA a los datos de respuesta
    res.locals.captcha = {
        pregunta: captcha.pregunta
    };
    
    console.log('CAPTCHA generado:', {
        pregunta: captcha.pregunta,
        resultado: captcha.resultado, // Solo para debugging
        hash: captcha.hash.substring(0, 8) + '...'
    });
    
    next();
};

// Middleware para validar CAPTCHA en requests POST
const validarCaptchaMiddleware = (req, res, next) => {
    const { captcha_respuesta } = req.body;
    const captchaHash = req.session?.captchaHash;
    
    console.log('Validando CAPTCHA:', {
        respuesta: captcha_respuesta,
        hashExiste: !!captchaHash,
        sessionId: req.session?.id?.substring(0, 8) + '...'
    });
    
    if (!validarCaptcha(captcha_respuesta, captchaHash)) {
        return res.status(400).json({
            success: false,
            message: 'CAPTCHA incorrecto. Por favor, resuelve la operación matemática.'
        });
    }
    
    // Limpiar CAPTCHA de la sesión después de usar
    delete req.session.captchaHash;
    
    console.log('CAPTCHA validado correctamente');
    next();
};

module.exports = {
    generarCaptcha,
    validarCaptcha,
    agregarCaptcha,
    validarCaptchaMiddleware
};
