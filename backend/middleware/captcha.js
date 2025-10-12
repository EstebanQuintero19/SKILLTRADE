const crypto = require('crypto');

// Generar CAPTCHA matemático simple
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
    
    // Generar hash del resultado para validación
    const hash = crypto.createHash('sha256')
        .update(`${resultado}:${process.env.CAPTCHA_SECRET || 'skilltrade-captcha-secret'}`)
        .digest('hex');
    
    return {
        pregunta,
        hash,
        resultado // Solo para debugging, no se envía al frontend
    };
};

// Validar respuesta del CAPTCHA
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
