const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const Carrito = require('../model/carrito.model');
const Venta = require('../model/venta.model');
const Curso = require('../model/curso.model');
const Usuario = require('../model/usuario.model');

// Configuración de MercadoPago
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'APP_USR-8399021515903188-101212-305b6cfb27c418f7d29694aeaffa5e92-2919258121'
});

// Crear preferencia de pago para el carrito
const crearPreferenciaPago = async (req, res) => {
    try {
        console.log('MercadoPago - Iniciando creación de preferencia');
        console.log('MercadoPago - Usuario ID:', req.usuario._id);
        console.log('MercadoPago - Usuario email:', req.usuario.email);
        
        const usuarioId = req.usuario._id;

        // Obtener carrito del usuario
        const carrito = await Carrito.findOne({ usuario: usuarioId })
            .populate('items.curso', 'titulo imagen precio');

        console.log('MercadoPago - Carrito encontrado:', carrito ? 'Sí' : 'No');
        
        if (!carrito || carrito.items.length === 0) {
            console.log('MercadoPago - Carrito vacío o no encontrado');
            return res.status(400).json({
                error: 'El carrito está vacío'
            });
        }

        console.log('MercadoPago - Items en carrito:', carrito.items.length);
        console.log('MercadoPago - Primer item:', carrito.items[0]);

        // Validar que todos los items tengan curso válido
        const itemsValidos = carrito.items.filter(item => item.curso && item.curso._id);
        
        if (itemsValidos.length === 0) {
            console.log('MercadoPago - No hay items válidos en el carrito');
            return res.status(400).json({
                error: 'No hay cursos válidos en el carrito'
            });
        }

        // Preparar items para MercadoPago
        const items = itemsValidos.map(item => ({
            id: item.curso._id.toString(),
            title: item.curso.titulo,
            description: `Curso online: ${item.curso.titulo}`,
            picture_url: item.curso.imagen || '',
            category_id: 'education',
            quantity: item.cantidad,
            currency_id: 'COP',
            unit_price: Number(item.precio)
        }));

        console.log('MercadoPago - Items preparados para MercadoPago:', items.length);
        console.log('MercadoPago - Items detalle:', JSON.stringify(items, null, 2));

        // Crear preferencia
        const preference = new Preference(client);
        
        const preferenceData = {
            items: items,
            payer: {
                name: req.usuario.nombre,
                email: req.usuario.email
            },
            back_urls: {
                success: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pago/exito`,
                failure: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pago/fallo`,
                pending: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pago/pendiente`
            },
            external_reference: `carrito_${usuarioId}_${Date.now()}`,
            notification_url: `${process.env.BACKEND_URL || 'http://localhost:9090'}/api/mercadopago/webhook`,
            statement_descriptor: 'SKILLTRADE',
            metadata: {
                usuario_id: usuarioId.toString(),
                carrito_id: carrito._id.toString(),
                total: carrito.total
            }
        };

        console.log('MercadoPago - Datos de preferencia:', JSON.stringify(preferenceData, null, 2));
        
        const result = await preference.create({ body: preferenceData });
        
        console.log('MercadoPago - Preferencia creada exitosamente:', result.id);

        // Limpiar items nulos antes de guardar
        carrito.items = carrito.items.filter(item => item.curso && item.curso._id);
        
        // Recalcular total después de limpiar items nulos
        carrito.total = carrito.items.reduce((total, item) => 
            total + (item.precio * item.cantidad), 0
        );
        
        // Guardar referencia de la preferencia en el carrito
        carrito.mercadopago_preference_id = result.id;
        await carrito.save();

        res.json({
            mensaje: 'Preferencia de pago creada exitosamente',
            preference_id: result.id,
            init_point: result.init_point,
            sandbox_init_point: result.sandbox_init_point,
            total: carrito.total,
            items: carrito.items.length
        });

    } catch (error) {
        console.error('Error al crear preferencia de pago:', error);
        res.status(500).json({
            error: 'Error interno del servidor al crear preferencia de pago',
            details: error.message
        });
    }
};

// Procesar webhook de MercadoPago
const procesarWebhook = async (req, res) => {
    try {
        console.log('Webhook recibido:', req.body);
        
        const { type, data } = req.body;

        if (type === 'payment') {
            const paymentId = data.id;
            
            // Obtener información del pago
            const payment = new Payment(client);
            const paymentInfo = await payment.get({ id: paymentId });
            
            console.log('Información del pago:', paymentInfo);

            if (paymentInfo.status === 'approved') {
                await procesarPagoAprobado(paymentInfo);
            } else if (paymentInfo.status === 'rejected') {
                await procesarPagoRechazado(paymentInfo);
            }
        }

        res.status(200).json({ mensaje: 'Webhook procesado' });

    } catch (error) {
        console.error('Error al procesar webhook:', error);
        res.status(500).json({
            error: 'Error al procesar webhook',
            details: error.message
        });
    }
};

// Procesar pago aprobado
const procesarPagoAprobado = async (paymentInfo) => {
    try {
        const externalReference = paymentInfo.external_reference;
        const metadata = paymentInfo.metadata;
        
        if (!metadata || !metadata.usuario_id || !metadata.carrito_id) {
            console.error('Metadata incompleta en el pago');
            return;
        }

        const usuarioId = metadata.usuario_id;
        const carritoId = metadata.carrito_id;

        // Obtener carrito
        const carrito = await Carrito.findById(carritoId)
            .populate('items.curso', 'titulo precio');

        if (!carrito) {
            console.error('Carrito no encontrado:', carritoId);
            return;
        }

        // Crear venta
        const venta = new Venta({
            comprador: usuarioId,
            items: carrito.items.map(item => ({
                curso: item.curso._id,
                precio: item.precio,
                cantidad: item.cantidad,
                subtotal: item.precio * item.cantidad
            })),
            total: carrito.total,
            metodoPago: { 
                tipo: 'mercadopago',
                transaccionId: paymentInfo.id,
                estado: paymentInfo.status,
                metodoPago: paymentInfo.payment_method_id
            },
            estado: 'completada',
            fechaConfirmacion: new Date(),
            mercadopago: {
                payment_id: paymentInfo.id,
                preference_id: carrito.mercadopago_preference_id,
                status: paymentInfo.status,
                status_detail: paymentInfo.status_detail,
                payment_method_id: paymentInfo.payment_method_id,
                transaction_amount: paymentInfo.transaction_amount
            }
        });

        await venta.save();

        // Actualizar estadísticas de los cursos
        for (const item of carrito.items) {
            await Curso.findByIdAndUpdate(item.curso._id, {
                $inc: { 'estadisticas.ventasRealizadas': item.cantidad }
            });
        }

        // Limpiar carrito
        carrito.items = [];
        carrito.total = 0;
        carrito.estado = 'convertido';
        carrito.mercadopago_preference_id = null;
        await carrito.save();

        console.log('Pago procesado exitosamente:', venta._id);

    } catch (error) {
        console.error('Error al procesar pago aprobado:', error);
    }
};

// Procesar pago rechazado
const procesarPagoRechazado = async (paymentInfo) => {
    try {
        console.log('Pago rechazado:', paymentInfo.id, paymentInfo.status_detail);
        // Aquí podrías implementar lógica adicional para pagos rechazados
        // como notificar al usuario, limpiar referencias, etc.
    } catch (error) {
        console.error('Error al procesar pago rechazado:', error);
    }
};

// Obtener estado del pago
const obtenerEstadoPago = async (req, res) => {
    try {
        const { paymentId } = req.params;
        
        const payment = new Payment(client);
        const paymentInfo = await payment.get({ id: paymentId });

        res.json({
            payment_id: paymentInfo.id,
            status: paymentInfo.status,
            status_detail: paymentInfo.status_detail,
            transaction_amount: paymentInfo.transaction_amount,
            payment_method_id: paymentInfo.payment_method_id,
            external_reference: paymentInfo.external_reference
        });

    } catch (error) {
        console.error('Error al obtener estado del pago:', error);
        res.status(500).json({
            error: 'Error al obtener estado del pago',
            details: error.message
        });
    }
};

// Procesar pago exitoso (callback desde frontend)
const procesarPagoExitoso = async (req, res) => {
    try {
        const { payment_id, status, external_reference } = req.query;
        
        if (status === 'approved' && payment_id) {
            // El webhook ya debería haber procesado el pago
            // Aquí solo confirmamos y redirigimos
            res.redirect('/pago/exito?payment_id=' + payment_id);
        } else {
            res.redirect('/pago/fallo');
        }

    } catch (error) {
        console.error('Error al procesar callback de pago:', error);
        res.redirect('/pago/fallo');
    }
};

module.exports = {
    crearPreferenciaPago,
    procesarWebhook,
    obtenerEstadoPago,
    procesarPagoExitoso
};