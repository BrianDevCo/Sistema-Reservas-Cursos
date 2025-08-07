/**
 * Rutas de Usuarios
 * Maneja gestión de perfiles y administración de usuarios
 */

const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Obtener perfil del usuario actual
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *       401:
 *         description: No autorizado
 */
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user.toPublicJSON()
  });
}));

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Actualizar perfil del usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               correo:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Correo ya existe
 */
router.put('/profile', [
  authenticateToken,
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('correo')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Ingresa un correo válido')
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

  const { nombre, correo } = req.body;

  // Verificar si el correo ya existe (si se está cambiando)
  if (correo && correo !== req.user.correo) {
    const existingUser = await User.findByEmail(correo);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El correo ya está registrado'
      });
    }
  }

  // Actualizar usuario
  if (nombre) req.user.nombre = nombre;
  if (correo) req.user.correo = correo;

  await req.user.save();

  res.json({
    success: true,
    message: 'Perfil actualizado exitosamente',
    data: req.user.toPublicJSON()
  });
}));

/**
 * @swagger
 * /api/users/admin:
 *   get:
 *     summary: Obtener lista de usuarios (solo admin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: rol
 *         schema:
 *           type: string
 *           enum: [usuario, admin]
 *         description: Filtrar por rol
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
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
 *         description: Lista de usuarios
 *       403:
 *         description: Se requieren permisos de administrador
 */
router.get('/admin', [
  authenticateToken,
  requireAdmin,
  query('rol').optional().isIn(['usuario', 'admin']),
  query('activo').optional().isBoolean(),
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

  const { rol, activo, page = 1, limit = 20 } = req.query;

  // Construir filtros
  const filters = {};
  if (rol) filters.rol = rol;
  if (activo !== undefined) filters.activo = activo === 'true';

  // Calcular paginación
  const skip = (page - 1) * limit;

  // Obtener usuarios
  const users = await User.find(filters)
    .sort({ fechaCreacion: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Contar total de documentos
  const total = await User.countDocuments(filters);
  const pages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: users.map(user => user.toPublicJSON()),
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
 * /api/users/admin/{id}:
 *   get:
 *     summary: Obtener usuario por ID (solo admin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *       404:
 *         description: Usuario no encontrado
 *       403:
 *         description: Se requieren permisos de administrador
 */
router.get('/admin/:id', [
  authenticateToken,
  requireAdmin
], asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Usuario no encontrado'
    });
  }

  res.json({
    success: true,
    data: user.toPublicJSON()
  });
}));

/**
 * @swagger
 * /api/users/admin/{id}:
 *   put:
 *     summary: Actualizar usuario (solo admin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               correo:
 *                 type: string
 *                 format: email
 *               rol:
 *                 type: string
 *                 enum: [usuario, admin]
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Usuario no encontrado
 *       403:
 *         description: Se requieren permisos de administrador
 */
router.put('/admin/:id', [
  authenticateToken,
  requireAdmin,
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('correo')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Ingresa un correo válido'),
  body('rol')
    .optional()
    .isIn(['usuario', 'admin'])
    .withMessage('Rol inválido'),
  body('activo')
    .optional()
    .isBoolean()
    .withMessage('Estado activo debe ser true o false')
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

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Usuario no encontrado'
    });
  }

  // Verificar si el correo ya existe (si se está cambiando)
  if (req.body.correo && req.body.correo !== user.correo) {
    const existingUser = await User.findByEmail(req.body.correo);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El correo ya está registrado'
      });
    }
  }

  // Actualizar usuario
  Object.assign(user, req.body);
  await user.save();

  res.json({
    success: true,
    message: 'Usuario actualizado exitosamente',
    data: user.toPublicJSON()
  });
}));

/**
 * @swagger
 * /api/users/admin/{id}/toggle-status:
 *   put:
 *     summary: Activar/desactivar usuario (solo admin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Estado del usuario cambiado exitosamente
 *       404:
 *         description: Usuario no encontrado
 *       403:
 *         description: Se requieren permisos de administrador
 */
router.put('/admin/:id/toggle-status', [
  authenticateToken,
  requireAdmin
], asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Usuario no encontrado'
    });
  }

  // Cambiar estado
  user.activo = !user.activo;
  await user.save();

  res.json({
    success: true,
    message: `Usuario ${user.activo ? 'activado' : 'desactivado'} exitosamente`,
    data: user.toPublicJSON()
  });
}));

/**
 * @swagger
 * /api/users/admin/{id}:
 *   delete:
 *     summary: Eliminar usuario (solo admin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *       404:
 *         description: Usuario no encontrado
 *       403:
 *         description: Se requieren permisos de administrador
 */
router.delete('/admin/:id', [
  authenticateToken,
  requireAdmin
], asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Usuario no encontrado'
    });
  }

  // No permitir eliminar el propio usuario
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'No puedes eliminar tu propia cuenta'
    });
  }

  await User.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Usuario eliminado exitosamente'
  });
}));

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Obtener estadísticas de usuarios (solo admin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de usuarios
 *       403:
 *         description: Se requieren permisos de administrador
 */
router.get('/stats', [
  authenticateToken,
  requireAdmin
], asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ activo: true });
  const adminUsers = await User.countDocuments({ rol: 'admin' });
  const regularUsers = await User.countDocuments({ rol: 'usuario' });

  // Usuarios por mes (últimos 6 meses)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const usersByMonth = await User.aggregate([
    {
      $match: {
        fechaCreacion: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$fechaCreacion' },
          month: { $month: '$fechaCreacion' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      admins: adminUsers,
      regular: regularUsers,
      usersByMonth
    }
  });
}));

module.exports = router;
