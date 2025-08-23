const Venta = require('../model/venta.model');
const Curso = require('../model/curso.model');
const Usuario = require('../model/usuario.model');
const Carrito = require('../model/carrito.model');
const Notificacion = require('../model/notificacion.model');

// RF-VEN-01: Comprar curso
const crearVenta = async (req, res) => {
    try {
        const { items, metodoPago, direccionEnvio } = req.body;
        const compradorId = req.usuario._id;

        // Validaciones básicas
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'Debe incluir al menos un curso para comprar'
            });
        }

        if (!metodoPago) {
            return res.status(400).json({
                error: 'Método de pago es obligatorio'
            });
        }

        // Validar método de pago
        if (!['tarjeta', 'paypal', 'transferencia'].includes(metodoPago)) {
            return res.status(400).json({
                error: 'Método de pago no válido'
            });
        }

        // Verificar que los cursos existen y calcular total
        let total = 0;
        const itemsValidados = [];

        for (const item of items) {
            const curso = await Curso.findById(item.curso);
            if (!curso) {
                return res.status(404).json({
                    error: `Curso con ID ${item.curso} no encontrado`
                });
            }

            if (curso.estadoCurso !== 'activo') {
                return res.status(400).json({
                    error: `El curso "${curso.titulo}" no está disponible para compra`
                });
            }

            const cantidad = item.cantidad || 1;
            if (!Number.isInteger(cantidad) || cantidad < 1) {
                return res.status(400).json({
                    error: 'La cantidad debe ser un número entero mayor a 0'
                });
            }

            const precioItem = curso.precio * cantidad;
            total += precioItem;

            itemsValidados.push({
                curso: curso._id,
                precio: curso.precio,
                cantidad,
                subtotal: precioItem
            });
        }

        // Crear venta
        const venta = new Venta({
            comprador: compradorId,
            items: itemsValidados,
            total,
            metodoPago: { tipo: metodoPago },
            direccionEnvio,
            estado: 'pendiente'
        });

        await venta.save();

        // Notificar a los creadores de los cursos
        for (const item of itemsValidados) {
            const curso = await Curso.findById(item.curso).populate('owner');
            if (curso && curso.owner) {
                try {
                    const notificacion = new Notificacion({
                        usuario: curso.owner._id,
                        tipo: 'venta',
                        titulo: 'Nueva venta realizada',
                        mensaje: `${req.usuario.nombre} ha comprado tu curso "${curso.titulo}"`,
                        accion: {
                            tipo: 'navegar',
                            url: `/ventas/${venta._id}`
                        }
                    });
                    await notificacion.save();
                } catch (notifError) {
                    console.warn('Error al crear notificación:', notifError.message);
                }
            }
        }

        res.status(201).json({
            mensaje: 'Venta creada exitosamente',
            venta: {
                _id: venta._id,
                total: venta.total,
                estado: venta.estado,
                fechaCompra: venta.fechaCompra
            }
        });

    } catch (error) {
        console.error('Error al crear venta:', error);
        res.status(500).json({
            error: 'Error interno del servidor al crear venta'
        });
    }
};

// RF-VEN-02: Acceso permanente tras compra
const confirmarVenta = async (req, res) => {
    try {
        const { id } = req.params;
        const { confirmacionPago } = req.body;

        if (!confirmacionPago) {
            return res.status(400).json({
                error: 'Confirmación de pago es requerida'
            });
        }

        const venta = await Venta.findById(id);
        if (!venta) {
            return res.status(404).json({
                error: 'Venta no encontrada'
            });
        }

        if (venta.estado !== 'pendiente') {
            return res.status(400).json({
                error: 'La venta ya no está pendiente'
            });
        }

        // Confirmar venta (en un sistema real, esto vendría de la pasarela de pago)
        venta.estado = 'completada';
        venta.fechaConfirmacion = new Date();
        await venta.save();

        // Actualizar estadísticas de los cursos
        for (const item of venta.items) {
            await Curso.findByIdAndUpdate(item.curso, {
                $inc: { 'estadisticas.ventasRealizadas': 1 }
            });
        }

        res.json({
            mensaje: 'Venta confirmada exitosamente',
            venta: {
                _id: venta._id,
                estado: venta.estado,
                fechaConfirmacion: venta.fechaConfirmacion
            }
        });

    } catch (error) {
        console.error('Error al confirmar venta:', error);
        res.status(500).json({
            error: 'Error interno del servidor al confirmar venta'
        });
    }
};

// RF-VEN-03: Historial de compras
const obtenerHistorialCompras = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { page = 1, limit = 10, estado } = req.query;

        // Construir filtros
        const filtros = { comprador: usuarioId };
        if (estado) filtros.estado = estado;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const ventas = await Venta.find(filtros)
            .populate('items.curso', 'titulo imagen categoria')
            .sort({ fechaCompra: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Venta.countDocuments(filtros);

        res.json({
            ventas,
            paginacion: {
                pagina: parseInt(page),
                totalPaginas: Math.ceil(total / parseInt(limit)),
                totalElementos: total,
                elementosPorPagina: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener historial de compras:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener historial'
        });
    }
};

// RF-VEN-04: Descargar comprobante
const obtenerComprobante = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario._id;

        const venta = await Venta.findById(id)
            .populate('comprador', 'nombre email')
            .populate('items.curso', 'titulo precio');

        if (!venta) {
            return res.status(404).json({
                error: 'Venta no encontrada'
            });
        }

        // Verificar que el usuario es el comprador
        if (venta.comprador._id.toString() !== usuarioId.toString()) {
            return res.status(403).json({
                error: 'No tienes permisos para ver este comprobante'
            });
        }

        // Generar comprobante (en un sistema real, esto sería un PDF)
        const comprobante = {
            numeroVenta: venta._id,
            fecha: venta.fechaCompra,
            comprador: {
                nombre: venta.comprador.nombre,
                email: venta.comprador.email
            },
            items: venta.items.map(item => ({
                curso: item.curso.titulo,
                precio: item.curso.precio,
                cantidad: item.cantidad,
                subtotal: item.subtotal
            })),
            total: venta.total,
            metodoPago: venta.metodoPago.tipo,
            estado: venta.estado
        };

        res.json({
            comprobante,
            mensaje: 'Comprobante generado exitosamente'
        });

    } catch (error) {
        console.error('Error al obtener comprobante:', error);
        res.status(500).json({
            error: 'Error interno del servidor al generar comprobante'
        });
    }
};

// RF-VEN-05: Calificar curso comprado
const calificarCursoComprado = async (req, res) => {
    try {
        const { id } = req.params;
        const { cursoId, puntuacion, comentario } = req.body;
        const usuarioId = req.usuario._id;

        if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
            return res.status(400).json({
                error: 'La puntuación debe ser un número entre 1 y 5'
            });
        }

        // Verificar que la venta existe y pertenece al usuario
        const venta = await Venta.findById(id);
        if (!venta) {
            return res.status(404).json({
                error: 'Venta no encontrada'
            });
        }

        if (venta.comprador.toString() !== usuarioId.toString()) {
            return res.status(403).json({
                error: 'No tienes permisos para calificar esta compra'
            });
        }

        // Verificar que la venta esté completada
        if (venta.estado !== 'completada') {
            return res.status(400).json({
                error: 'Solo se pueden calificar compras completadas'
            });
        }

        // Verificar que el curso esté en la venta
        const itemVenta = venta.items.find(item => 
            item.curso.toString() === cursoId
        );

        if (!itemVenta) {
            return res.status(400).json({
                error: 'El curso no está en esta venta'
            });
        }

        // Agregar calificación a la venta
        venta.calificacion = {
            puntuacion,
            comentario: comentario || '',
            fecha: new Date()
        };

        await venta.save();

        // Agregar calificación al curso
        const curso = await Curso.findById(cursoId);
        if (curso) {
            await curso.agregarCalificacion(usuarioId, puntuacion, comentario);
        }

        res.json({
            mensaje: 'Calificación agregada exitosamente',
            calificacion: venta.calificacion
        });

    } catch (error) {
        console.error('Error al calificar curso:', error);
        res.status(500).json({
            error: 'Error interno del servidor al calificar curso'
        });
    }
};

// RF-VEN-06: Aplicar cupón
const aplicarCupon = async (req, res) => {
    try {
        const { codigo, ventaId } = req.body;

        if (!codigo || !ventaId) {
            return res.status(400).json({
                error: 'Código de cupón y ID de venta son obligatorios'
            });
        }

        // Verificar que la venta existe
        const venta = await Venta.findById(ventaId);
        if (!venta) {
            return res.status(404).json({
                error: 'Venta no encontrada'
            });
        }

        if (venta.estado !== 'pendiente') {
            return res.status(400).json({
                error: 'Solo se pueden aplicar cupones a ventas pendientes'
            });
        }

        // En un sistema real, aquí se validaría el cupón en la base de datos
        // Por ahora, simulamos un cupón de descuento del 10%
        if (codigo === 'DESCUENTO10') {
            const descuento = venta.total * 0.1;
            venta.total = venta.total - descuento;
            venta.cupon = {
                codigo,
                descuento,
                porcentaje: 10
            };
            await venta.save();

            res.json({
                mensaje: 'Cupón aplicado exitosamente',
                descuento,
                totalFinal: venta.total
            });
        } else {
            return res.status(400).json({
                error: 'Código de cupón inválido'
            });
        }

    } catch (error) {
        console.error('Error al aplicar cupón:', error);
        res.status(500).json({
            error: 'Error interno del servidor al aplicar cupón'
        });
    }
};

// RF-VEN-07: Carrito
const agregarAlCarrito = async (req, res) => {
    try {
        const { cursoId, cantidad = 1 } = req.body;
        const usuarioId = req.usuario._id;

        if (!cursoId) {
            return res.status(400).json({
                error: 'ID del curso es obligatorio'
            });
        }

        if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 10) {
            return res.status(400).json({
                error: 'La cantidad debe ser un número entero entre 1 y 10'
            });
        }

        // Verificar que el curso existe
        const curso = await Curso.findById(cursoId);
        if (!curso) {
            return res.status(404).json({
                error: 'Curso no encontrado'
            });
        }

        if (curso.estadoCurso !== 'activo') {
            return res.status(400).json({
                error: 'El curso no está disponible para compra'
            });
        }

        // Obtener o crear carrito del usuario
        let carrito = await Carrito.findOne({ usuario: usuarioId });
        if (!carrito) {
            carrito = new Carrito({ usuario: usuarioId });
        }

        // Verificar si el curso ya está en el carrito
        const itemExistente = carrito.items.find(item => 
            item.curso.toString() === cursoId
        );

        if (itemExistente) {
            // Actualizar cantidad
            itemExistente.cantidad = Math.min(itemExistente.cantidad + cantidad, 10);
            itemExistente.precio = curso.precio;
        } else {
            // Agregar nuevo item
            carrito.items.push({
                curso: cursoId,
                precio: curso.precio,
                cantidad
            });
        }

        // Recalcular total
        carrito.total = carrito.items.reduce((total, item) => 
            total + (item.precio * item.cantidad), 0
        );

        await carrito.save();

        res.json({
            mensaje: 'Curso agregado al carrito exitosamente',
            carrito: {
                items: carrito.items.length,
                total: carrito.total
            }
        });

    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        res.status(500).json({
            error: 'Error interno del servidor al agregar al carrito'
        });
    }
};

const obtenerCarrito = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;

        const carrito = await Carrito.findOne({ usuario: usuarioId })
            .populate('items.curso', 'titulo imagen categoria precio');

        if (!carrito) {
            return res.json({
                items: [],
                total: 0,
                mensaje: 'Carrito vacío'
            });
        }

        res.json({
            carrito,
            mensaje: 'Carrito obtenido exitosamente'
        });

    } catch (error) {
        console.error('Error al obtener carrito:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener carrito'
        });
    }
};

const pagarCarrito = async (req, res) => {
    try {
        const { metodoPago, direccionEnvio } = req.body;
        const usuarioId = req.usuario._id;

        if (!metodoPago) {
            return res.status(400).json({
                error: 'Método de pago es obligatorio'
            });
        }

        // Obtener carrito del usuario
        const carrito = await Carrito.findOne({ usuario: usuarioId });
        if (!carrito || carrito.items.length === 0) {
            return res.status(400).json({
                error: 'El carrito está vacío'
            });
        }

        // Crear venta desde el carrito
        const venta = new Venta({
            comprador: usuarioId,
            items: carrito.items,
            total: carrito.total,
            metodoPago: { tipo: metodoPago },
            direccionEnvio,
            estado: 'pendiente'
        });

        await venta.save();

        // Limpiar carrito
        carrito.items = [];
        carrito.total = 0;
        carrito.estado = 'convertido';
        await carrito.save();

        res.status(201).json({
            mensaje: 'Compra realizada exitosamente',
            venta: {
                _id: venta._id,
                total: venta.total,
                estado: venta.estado
            }
        });

    } catch (error) {
        console.error('Error al pagar carrito:', error);
        res.status(500).json({
            error: 'Error interno del servidor al procesar pago'
        });
    }
};

// RF-VEN-08: Reembolso
const solicitarReembolso = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;
        const usuarioId = req.usuario._id;

        if (!motivo) {
            return res.status(400).json({
                error: 'Motivo del reembolso es obligatorio'
            });
        }

        const venta = await Venta.findById(id);
        if (!venta) {
            return res.status(404).json({
                error: 'Venta no encontrada'
            });
        }

        // Verificar que el usuario es el comprador
        if (venta.comprador.toString() !== usuarioId.toString()) {
            return res.status(403).json({
                error: 'No tienes permisos para solicitar reembolso de esta venta'
            });
        }

        // Verificar que la venta esté completada
        if (venta.estado !== 'completada') {
            return res.status(400).json({
                error: 'Solo se pueden solicitar reembolsos de ventas completadas'
            });
        }

        // Verificar que no haya pasado mucho tiempo (ej: 30 días)
        const diasTranscurridos = Math.floor((new Date() - venta.fechaCompra) / (1000 * 60 * 60 * 24));
        if (diasTranscurridos > 30) {
            return res.status(400).json({
                error: 'El plazo para solicitar reembolso ha expirado (30 días)'
            });
        }

        // Crear solicitud de reembolso
        venta.reembolso = {
            solicitado: true,
            fechaSolicitud: new Date(),
            motivo,
            estado: 'pendiente'
        };

        await venta.save();

        res.json({
            mensaje: 'Solicitud de reembolso creada exitosamente',
            reembolso: venta.reembolso
        });

    } catch (error) {
        console.error('Error al solicitar reembolso:', error);
        res.status(500).json({
            error: 'Error interno del servidor al solicitar reembolso'
        });
    }
};

// Obtener todas las ventas (solo admin)
const obtenerVentas = async (req, res) => {
    try {
        if (req.usuario.rol !== 'admin') {
            return res.status(403).json({
                error: 'Acceso denegado. Solo administradores'
            });
        }

        const { page = 1, limit = 20, estado } = req.query;

        const filtros = {};
        if (estado) filtros.estado = estado;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const ventas = await Venta.find(filtros)
            .populate('comprador', 'nombre email')
            .populate('items.curso', 'titulo precio')
            .sort({ fechaCompra: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Venta.countDocuments(filtros);

        res.json({
            ventas,
            paginacion: {
                pagina: parseInt(page),
                totalPaginas: Math.ceil(total / parseInt(limit)),
                totalElementos: total,
                elementosPorPagina: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener ventas:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Obtener venta por ID
const obtenerVentaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario._id;

        const venta = await Venta.findById(id)
            .populate('comprador', 'nombre email')
            .populate('items.curso', 'titulo imagen categoria precio');

        if (!venta) {
            return res.status(404).json({
                error: 'Venta no encontrada'
            });
        }

        // Verificar permisos
        if (venta.comprador._id.toString() !== usuarioId.toString() && 
            req.usuario.rol !== 'admin') {
            return res.status(403).json({
                error: 'No tienes permisos para ver esta venta'
            });
        }

        res.json({
            venta,
            mensaje: 'Venta obtenida exitosamente'
        });

    } catch (error) {
        console.error('Error al obtener venta:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

module.exports = {
    crearVenta,
    confirmarVenta,
    obtenerHistorialCompras,
    obtenerComprobante,
    calificarCursoComprado,
    aplicarCupon,
    agregarAlCarrito,
    obtenerCarrito,
    pagarCarrito,
    solicitarReembolso,
    obtenerVentas,
    obtenerVentaPorId
};
