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
        console.log('agregarAlCarrito - Request body:', req.body);
        console.log('agregarAlCarrito - Usuario autenticado:', req.usuario ? req.usuario._id : 'No usuario');
        
        const { cursoId, cantidad = 1 } = req.body;
        
        if (!req.usuario || !req.usuario._id) {
            return res.status(401).json({
                error: 'Usuario no autenticado'
            });
        }
        
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

        console.log('agregarAlCarrito - Buscando curso:', cursoId);
        
        // Verificar que el curso existe
        const curso = await Curso.findById(cursoId);
        if (!curso) {
            console.log('agregarAlCarrito - Curso no encontrado:', cursoId);
            return res.status(404).json({
                error: 'Curso no encontrado'
            });
        }

        console.log('agregarAlCarrito - Curso encontrado:', curso.titulo, 'Estado:', curso.estadoCurso);
        console.log('agregarAlCarrito - Precio del curso:', curso.precio);
        console.log('agregarAlCarrito - Datos completos del curso:', {
            id: curso._id,
            titulo: curso.titulo,
            estadoCurso: curso.estadoCurso,
            precio: curso.precio,
            instructor: curso.instructor
        });

        // Permitir cursos activos y en borrador para testing
        if (curso.estadoCurso !== 'activo' && curso.estadoCurso !== 'borrador') {
            console.log('agregarAlCarrito - ERROR: Curso no disponible. Estado actual:', curso.estadoCurso);
            return res.status(400).json({
                error: 'El curso no está disponible para compra'
            });
        }
        
        console.log('agregarAlCarrito - Curso válido para carrito, continuando...');

        // Obtener o crear carrito del usuario
        let carrito = await Carrito.findOne({ usuario: usuarioId });
        if (!carrito) {
            console.log('agregarAlCarrito - Creando nuevo carrito para usuario:', usuarioId);
            carrito = new Carrito({ usuario: usuarioId });
        } else {
            console.log('agregarAlCarrito - Carrito existente encontrado, items actuales:', carrito.items.length);
        }

        // Verificar si el curso ya está en el carrito
        const itemExistente = carrito.items.find(item => 
            item.curso.toString() === cursoId
        );

        if (itemExistente) {
            console.log('agregarAlCarrito - Actualizando cantidad de curso existente');
            // Actualizar cantidad
            itemExistente.cantidad = Math.min(itemExistente.cantidad + cantidad, 10);
            itemExistente.precio = curso.precio;
        } else {
            console.log('agregarAlCarrito - Agregando nuevo curso al carrito');
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

        console.log('agregarAlCarrito - Guardando carrito, total:', carrito.total);
        console.log('agregarAlCarrito - Items en carrito antes de guardar:', carrito.items.length);
        
        const carritoGuardado = await carrito.save();
        console.log('agregarAlCarrito - Carrito guardado exitosamente, ID:', carritoGuardado._id);
        console.log('agregarAlCarrito - Items después de guardar:', carritoGuardado.items.length);

        res.json({
            mensaje: 'Curso agregado al carrito exitosamente',
            carrito: {
                items: carritoGuardado.items.length,
                total: carritoGuardado.total
            }
        });

    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({
            error: 'Error interno del servidor al agregar al carrito',
            details: error.message
        });
    }
};

const obtenerCarrito = async (req, res) => {
    try {
        console.log('obtenerCarrito - Usuario autenticado:', req.usuario ? req.usuario._id : 'No usuario');
        
        if (!req.usuario || !req.usuario._id) {
            return res.status(401).json({
                error: 'Usuario no autenticado'
            });
        }

        const usuarioId = req.usuario._id;
        console.log('obtenerCarrito - Buscando carrito para usuario:', usuarioId);

        const carrito = await Carrito.findOne({ usuario: usuarioId })
            .populate('items.curso', 'titulo imagen categoria precio');

        console.log('obtenerCarrito - Carrito encontrado:', carrito ? 'Sí' : 'No');
        
        if (carrito) {
            console.log('obtenerCarrito - Items en carrito antes de filtrar:', carrito.items.length);
            
            // Filtrar items con cursos válidos (no null)
            const itemsOriginales = carrito.items.length;
            carrito.items = carrito.items.filter(item => item.curso && item.curso._id);
            
            // Si se eliminaron items inválidos, recalcular total y guardar
            if (carrito.items.length !== itemsOriginales) {
                console.log('obtenerCarrito - Eliminando items inválidos:', itemsOriginales - carrito.items.length);
                carrito.total = carrito.items.reduce((total, item) => 
                    total + (item.precio * item.cantidad), 0
                );
                await carrito.save();
                console.log('obtenerCarrito - Carrito limpiado y guardado');
            }
            
            console.log('obtenerCarrito - Items válidos en carrito:', carrito.items.length);
            console.log('obtenerCarrito - Total del carrito:', carrito.total);
            console.log('obtenerCarrito - Estado del carrito:', carrito.estado);
            if (carrito.items.length > 0) {
                console.log('obtenerCarrito - Primer item:', {
                    curso: carrito.items[0].curso,
                    precio: carrito.items[0].precio,
                    cantidad: carrito.items[0].cantidad
                });
            }
        }

        if (!carrito) {
            console.log('obtenerCarrito - Devolviendo carrito vacío');
            return res.json({
                data: {
                    items: [],
                    total: 0
                },
                mensaje: 'Carrito vacío'
            });
        }

        console.log('obtenerCarrito - Devolviendo carrito con items:', carrito.items.length);
        res.json({
            data: {
                items: carrito.items,
                total: carrito.total,
                usuario: carrito.usuario,
                estado: carrito.estado,
                expiraEn: carrito.expiraEn
            },
            mensaje: 'Carrito obtenido exitosamente'
        });

    } catch (error) {
        console.error('Error al obtener carrito:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({
            error: 'Error interno del servidor al obtener carrito',
            details: error.message
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

const removerDelCarrito = async (req, res) => {
    try {
        const { cursoId } = req.body;
        const usuarioId = req.usuario._id;

        if (!cursoId) {
            return res.status(400).json({
                error: 'ID del curso es obligatorio'
            });
        }

        // Obtener carrito del usuario
        const carrito = await Carrito.findOne({ usuario: usuarioId });
        if (!carrito) {
            return res.status(404).json({
                error: 'Carrito no encontrado'
            });
        }

        // Verificar si el curso está en el carrito
        const itemIndex = carrito.items.findIndex(item => 
            item.curso.toString() === cursoId
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                error: 'El curso no está en el carrito'
            });
        }

        // Remover el item del carrito
        carrito.items.splice(itemIndex, 1);

        // Recalcular total
        carrito.total = carrito.items.reduce((total, item) => 
            total + (item.precio * item.cantidad), 0
        );

        await carrito.save();

        res.json({
            mensaje: 'Curso removido del carrito exitosamente',
            carrito: {
                items: carrito.items.length,
                total: carrito.total
            }
        });

    } catch (error) {
        console.error('Error al remover del carrito:', error);
        res.status(500).json({
            error: 'Error interno del servidor al remover del carrito'
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
    removerDelCarrito,
    pagarCarrito,
    solicitarReembolso,
    obtenerVentas,
    obtenerVentaPorId
};
