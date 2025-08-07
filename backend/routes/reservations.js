/**
 * Rutas de Reservas
 * Maneja creación, cancelación y gestión de reservas
 */

const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Reservation = require('../models/Reservation');
const Course = require('../models/Course');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Obtener reservas del usuario
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [confirmada, cancelada, pendiente, completada]
 *         description: Filtrar por estado
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: Elementos por página
 *     responses:
 *       200:
 *         description: Lista de reservas del usuario
 *       401:
 *         description: No autorizado
 */
router.get('/', [
  authenticateToken,
  query('estado').optional().isIn(['confirmada', 'cancelada', 'pendiente', 'completada']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], asyncHandler(async (req, res) => {
  // Verificar errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Parámetros de consulta inválidos',
      errors: errors.array().map(error => error.msg)
    });
  }

  const { estado, page = 1, limit = 10 } = req.query;

  // Obtener reservas del usuario
  const reservations = await Reservation.findByUser(req.user._id, estado);
  
  // Calcular paginación
  const skip = (page - 1) * limit;
  const total = reservations.length;
  const pages = Math.ceil(total / limit);

  // Aplicar paginación
  const paginatedReservations = reservations.slice(skip, skip + parseInt(limit));

  res.json({
    success: true,
    data: paginatedReservations,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages
    }
  });
}));

/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     summary: Obtener reserva por ID
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la reserva
 *     responses:
 *       200:
 *         description: Reserva encontrada
 *       404:
 *         description: Reserva no encontrada
 *       403:
 *         description: No tienes permisos para ver esta reserva
 */
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id)
    .populate('curso', 'titulo fechaInicio fechaFin instructor modalidad')
    .populate('usuario', 'nombre correo');

  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: 'Reserva no encontrada'
    });
  }

  // Verificar que el usuario sea propietario o admin
  if (reservation.usuario._id.toString() !== req.user._id.toString() && req.user.rol !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para ver esta reserva'
    });
  }

  res.json({
    success: true,
    data: reservation
  });
}));

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Crear nueva reserva
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cursoId
 *             properties:
 *               cursoId:
 *                 type: string
 *                 description: ID del curso a reservar
 *               notas:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Notas adicionales
 *               metodoPago:
 *                 type: string
 *                 enum: [efectivo, tarjeta, transferencia, gratuito]
 *                 default: gratuito
 *     responses:
 *       201:
 *         description: Reserva creada exitosamente
 *       400:
 *         description: Datos inválidos o curso no disponible
 *       409:
 *         description: Ya tienes una reserva para este curso
 */
router.post('/', [
  authenticateToken,
  body('cursoId')
    .notEmpty()
    .withMessage('El ID del curso es requerido'),
  body('notas')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Las notas no pueden exceder 1000 caracteres'),
  body('metodoPago')
    .optional()
    .isIn(['efectivo', 'tarjeta', 'transferencia', 'gratuito'])
    .withMessage('Método de pago inválido')
], asyncHandler(async (req, res) => {
  // Verificar errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: errors.array().map(error => error.msg)
    });
  }

  const { cursoId, notas, metodoPago = 'gratuito' } = req.body;

  // Verificar que el curso existe y está activo
  const course = await Course.findById(cursoId);
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Curso no encontrado'
    });
  }

  if (course.estado !== 'activo') {
    return res.status(400).json({
      success: false,
      message: 'El curso no está disponible para reservas'
    });
  }

  // Verificar que se puede reservar
  if (!course.sePuedeReservar()) {
    return res.status(400).json({
      success: false,
      message: 'No se puede reservar este curso (cupo lleno o fecha pasada)'
    });
  }

  // Verificar que el usuario no tenga ya una reserva para este curso
  const existingReservation = await Reservation.userHasReservation(req.user._id, cursoId);
  if (existingReservation) {
    return res.status(409).json({
      success: false,
      message: 'Ya tienes una reserva activa para este curso'
    });
  }

  // Crear reserva
  const reservation = new Reservation({
    usuario: req.user._id,
    curso: cursoId,
    notas,
    metodoPago,
    precioPagado: course.precio
  });

  await reservation.save();

  // Reservar cupo en el curso
  await course.reservarCupo();

  // Poblar datos para la respuesta
  await reservation.populate('curso', 'titulo fechaInicio fechaFin instructor modalidad');

  res.status(201).json({
    success: true,
    message: 'Reserva creada exitosamente',
    data: reservation
  });
}));

/**
 * @swagger
 * /api/reservations/{id}/cancel:
 *   put:
 *     summary: Cancelar reserva
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la reserva
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               motivo:
 *                 type: string
 *                 maxLength: 500
 *                 description: Motivo de la cancelación
 *     responses:
 *       200:
 *         description: Reserva cancelada exitosamente
 *       400:
 *         description: No se puede cancelar esta reserva
 *       404:
 *         description: Reserva no encontrada
 *       403:
 *         description: No tienes permisos para cancelar esta reserva
 */
router.put('/:id/cancel', [
  authenticateToken,
  body('motivo')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('El motivo no puede exceder 500 caracteres')
], asyncHandler(async (req, res) => {
  // Verificar errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: errors.array().map(error => error.msg)
    });
  }

  const { motivo } = req.body;

  const reservation = await Reservation.findById(req.params.id)
    .populate('curso');

  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: 'Reserva no encontrada'
    });
  }

  // Verificar que el usuario sea propietario o admin
  if (reservation.usuario.toString() !== req.user._id.toString() && req.user.rol !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para cancelar esta reserva'
    });
  }

  try {
    // Cancelar reserva
    await reservation.cancelar(motivo);

    // Liberar cupo en el curso
    await reservation.curso.liberarCupo();

    res.json({
      success: true,
      message: 'Reserva cancelada exitosamente',
      data: reservation
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}));

/**
 * @swagger
 * /api/reservations/{id}/rate:
 *   put:
 *     summary: Calificar curso completado
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la reserva
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - calificacion
 *             properties:
 *               calificacion:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Calificación del curso (1-5)
 *               comentario:
 *                 type: string
 *                 maxLength: 500
 *                 description: Comentario sobre el curso
 *     responses:
 *       200:
 *         description: Calificación enviada exitosamente
 *       400:
 *         description: No se puede calificar este curso
 *       404:
 *         description: Reserva no encontrada
 */
router.put('/:id/rate', [
  authenticateToken,
  body('calificacion')
    .isInt({ min: 1, max: 5 })
    .withMessage('La calificación debe estar entre 1 y 5'),
  body('comentario')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('El comentario no puede exceder 500 caracteres')
], asyncHandler(async (req, res) => {
  // Verificar errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: errors.array().map(error => error.msg)
    });
  }

  const { calificacion, comentario } = req.body;

  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: 'Reserva no encontrada'
    });
  }

  // Verificar que el usuario sea propietario
  if (reservation.usuario.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para calificar esta reserva'
    });
  }

  try {
    // Calificar curso
    await reservation.calificar(calificacion, comentario);

    res.json({
      success: true,
      message: 'Calificación enviada exitosamente',
      data: reservation
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}));

/**
 * @swagger
 * /api/reservations/admin/all:
 *   get:
 *     summary: Obtener todas las reservas (solo admin)
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [confirmada, cancelada, pendiente, completada]
 *         description: Filtrar por estado
 *       - in: query
 *         name: cursoId
 *         schema:
 *           type: string
 *         description: Filtrar por curso
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Elementos por página
 *     responses:
 *       200:
 *         description: Lista de todas las reservas
 *       403:
 *         description: Se requieren permisos de administrador
 */
router.get('/admin/all', [
  authenticateToken,
  requireAdmin,
  query('estado').optional().isIn(['confirmada', 'cancelada', 'pendiente', 'completada']),
  query('cursoId').optional().trim(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  // Verificar errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Parámetros de consulta inválidos',
      errors: errors.array().map(error => error.msg)
    });
  }

  const { estado, cursoId, page = 1, limit = 20 } = req.query;

  // Construir filtros
  const filters = {};
  if (estado) filters.estado = estado;
  if (cursoId) filters.curso = cursoId;

  // Calcular paginación
  const skip = (page - 1) * limit;

  // Obtener reservas con población
  const reservations = await Reservation.find(filters)
    .populate('usuario', 'nombre correo')
    .populate('curso', 'titulo fechaInicio fechaFin instructor')
    .sort({ fechaReserva: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Contar total de documentos
  const total = await Reservation.countDocuments(filters);
  const pages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: reservations,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages
    }
  });
}));

/**
 * @swagger
 * /api/reservations/admin/{id}/confirm:
 *   put:
 *     summary: Confirmar reserva (solo admin)
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la reserva
 *     responses:
 *       200:
 *         description: Reserva confirmada exitosamente
 *       404:
 *         description: Reserva no encontrada
 *       403:
 *         description: Se requieren permisos de administrador
 */
router.put('/admin/:id/confirm', [
  authenticateToken,
  requireAdmin
], asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: 'Reserva no encontrada'
    });
  }

  try {
    await reservation.confirmar();

    res.json({
      success: true,
      message: 'Reserva confirmada exitosamente',
      data: reservation
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}));

/**
 * @swagger
 * /api/reservations/admin/{id}/complete:
 *   put:
 *     summary: Marcar reserva como completada (solo admin)
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la reserva
 *     responses:
 *       200:
 *         description: Reserva marcada como completada
 *       404:
 *         description: Reserva no encontrada
 *       403:
 *         description: Se requieren permisos de administrador
 */
router.put('/admin/:id/complete', [
  authenticateToken,
  requireAdmin
], asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: 'Reserva no encontrada'
    });
  }

  try {
    await reservation.completar();

    res.json({
      success: true,
      message: 'Reserva marcada como completada',
      data: reservation
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}));

module.exports = router;
