/**
 * Rutas de Autenticación
 * Maneja registro, login, logout y verificación de tokens
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - correo
 *               - contraseña
 *             properties:
 *               nombre:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               correo:
 *                 type: string
 *                 format: email
 *               contraseña:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Correo ya registrado
 */
router.post('/register', [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('correo')
    .isEmail()
    .normalizeEmail()
    .withMessage('Ingresa un correo válido'),
  body('contraseña')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
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

  const { nombre, correo, contraseña } = req.body;

  // Verificar si el correo ya existe
  const existingUser = await User.findByEmail(correo);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'El correo ya está registrado'
    });
  }

  // Crear nuevo usuario
  const user = new User({
    nombre,
    correo,
    contraseña
  });

  await user.save();

  // Generar token
  const token = generateToken(user._id, user.tokenVersion);

  // Actualizar último acceso
  await user.actualizarUltimoAcceso();

  res.status(201).json({
    success: true,
    message: 'Usuario registrado exitosamente',
    data: user.toPublicJSON(),
    token
  });
}));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - contraseña
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *               contraseña:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', [
  body('correo')
    .isEmail()
    .normalizeEmail()
    .withMessage('Ingresa un correo válido'),
  body('contraseña')
    .notEmpty()
    .withMessage('La contraseña es requerida')
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

  const { correo, contraseña } = req.body;

  // Buscar usuario por correo (incluyendo contraseña)
  const user = await User.findOne({ correo }).select('+contraseña');
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Credenciales inválidas'
    });
  }

  // Verificar si el usuario está activo
  if (!user.activo) {
    return res.status(401).json({
      success: false,
      message: 'Cuenta desactivada'
    });
  }

  // Verificar contraseña
  const isPasswordValid = await user.compararContraseña(contraseña);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Credenciales inválidas'
    });
  }

  // Generar token
  const token = generateToken(user._id, user.tokenVersion);

  // Actualizar último acceso
  await user.actualizarUltimoAcceso();

  res.json({
    success: true,
    message: 'Login exitoso',
    data: user.toPublicJSON(),
    token
  });
}));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: No autorizado
 */
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  // Invalidar tokens del usuario
  await req.user.invalidarTokens();

  res.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
}));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener información del usuario actual
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: No autorizado
 */
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user.toPublicJSON()
  });
}));

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renovar token
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token renovado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       401:
 *         description: No autorizado
 */
router.post('/refresh', authenticateToken, asyncHandler(async (req, res) => {
  // Generar nuevo token
  const token = generateToken(req.user._id, req.user.tokenVersion);

  res.json({
    success: true,
    message: 'Token renovado exitosamente',
    token
  });
}));

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Cambiar contraseña
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contraseñaActual
 *               - nuevaContraseña
 *             properties:
 *               contraseñaActual:
 *                 type: string
 *               nuevaContraseña:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Contraseña cambiada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Contraseña actual incorrecta
 */
router.put('/change-password', [
  authenticateToken,
  body('contraseñaActual')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),
  body('nuevaContraseña')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
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

  const { contraseñaActual, nuevaContraseña } = req.body;

  // Obtener usuario con contraseña
  const user = await User.findById(req.user._id).select('+contraseña');

  // Verificar contraseña actual
  const isCurrentPasswordValid = await user.compararContraseña(contraseñaActual);
  if (!isCurrentPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'La contraseña actual es incorrecta'
    });
  }

  // Actualizar contraseña
  user.contraseña = nuevaContraseña;
  await user.save();

  // Invalidar tokens para forzar nuevo login
  await user.invalidarTokens();

  res.json({
    success: true,
    message: 'Contraseña cambiada exitosamente. Por favor, inicia sesión nuevamente.'
  });
}));

module.exports = router;
