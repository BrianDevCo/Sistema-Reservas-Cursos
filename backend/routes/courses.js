/**
 * Rutas de Cursos
 * Maneja CRUD de cursos con validaciones y autorización
 */

const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Course = require('../models/Course');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Obtener lista de cursos
 *     tags: [Cursos]
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [activo, cancelado, completado, borrador]
 *         description: Filtrar por estado
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *         description: Filtrar por categoría
 *       - in: query
 *         name: modalidad
 *         schema:
 *           type: string
 *           enum: [presencial, virtual, hibrido]
 *         description: Filtrar por modalidad
 *       - in: query
 *         name: instructor
 *         schema:
 *           type: string
 *         description: Filtrar por instructor
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
 *         description: Lista de cursos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */
router.get('/', [
  optionalAuth,
  query('estado').optional().isIn(['activo', 'cancelado', 'completado', 'borrador']),
  query('categoria').optional().trim(),
  query('modalidad').optional().isIn(['presencial', 'virtual', 'hibrido']),
  query('instructor').optional().trim(),
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

  const {
    estado,
    categoria,
    modalidad,
    instructor,
    page = 1,
    limit = 10
  } = req.query;

  // Construir filtros
  const filters = {};
  
  if (estado) filters.estado = estado;
  if (categoria) filters.categoria = { $regex: categoria, $options: 'i' };
  if (modalidad) filters.modalidad = modalidad;
  if (instructor) filters.instructor = { $regex: instructor, $options: 'i' };

  // Si no es admin, solo mostrar cursos activos
  if (!req.user || req.user.rol !== 'admin') {
    filters.estado = 'activo';
  }

  // Calcular paginación
  const skip = (page - 1) * limit;
  
  // Obtener cursos con población
  const courses = await Course.find(filters)
    .populate('creadoPor', 'nombre')
    .sort({ fechaInicio: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Contar total de documentos
  const total = await Course.countDocuments(filters);
  const pages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: courses,
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
 * /api/courses/{id}:
 *   get:
 *     summary: Obtener curso por ID
 *     tags: [Cursos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *     responses:
 *       200:
 *         description: Curso encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         description: Curso no encontrado
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('creadoPor', 'nombre');

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Curso no encontrado'
    });
  }

  // Si no es admin, solo mostrar cursos activos
  if (!req.user || req.user.rol !== 'admin') {
    if (course.estado !== 'activo') {
      return res.status(404).json({
        success: false,
        message: 'Curso no encontrado'
      });
    }
  }

  res.json({
    success: true,
    data: course
  });
}));

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Crear nuevo curso (solo admin)
 *     tags: [Cursos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - descripcion
 *               - cupoMaximo
 *               - fechaInicio
 *               - fechaFin
 *               - categoria
 *               - instructor
 *             properties:
 *               titulo:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               descripcion:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               cupoMaximo:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 1000
 *               fechaInicio:
 *                 type: string
 *                 format: date-time
 *               fechaFin:
 *                 type: string
 *                 format: date-time
 *               estado:
 *                 type: string
 *                 enum: [activo, cancelado, completado, borrador]
 *               precio:
 *                 type: number
 *                 minimum: 0
 *               categoria:
 *                 type: string
 *                 maxLength: 50
 *               instructor:
 *                 type: string
 *                 maxLength: 100
 *               ubicacion:
 *                 type: string
 *                 maxLength: 200
 *               modalidad:
 *                 type: string
 *                 enum: [presencial, virtual, hibrido]
 *               requisitos:
 *                 type: array
 *                 items:
 *                   type: string
 *               materiales:
 *                 type: array
 *                 items:
 *                   type: string
 *               imagen:
 *                 type: string
 *     responses:
 *       201:
 *         description: Curso creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Se requieren permisos de administrador
 */
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('titulo')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('El título debe tener entre 3 y 100 caracteres'),
  body('descripcion')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('La descripción debe tener entre 10 y 1000 caracteres'),
  body('cupoMaximo')
    .isInt({ min: 1, max: 1000 })
    .withMessage('El cupo máximo debe estar entre 1 y 1000'),
  body('fechaInicio')
    .isISO8601()
    .withMessage('La fecha de inicio debe ser válida'),
  body('fechaFin')
    .isISO8601()
    .withMessage('La fecha de fin debe ser válida'),
  body('categoria')
    .trim()
    .isLength({ max: 50 })
    .withMessage('La categoría no puede exceder 50 caracteres'),
  body('instructor')
    .trim()
    .isLength({ max: 100 })
    .withMessage('El instructor no puede exceder 100 caracteres'),
  body('estado')
    .optional()
    .isIn(['activo', 'cancelado', 'completado', 'borrador'])
    .withMessage('Estado inválido'),
  body('precio')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
  body('ubicacion')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La ubicación no puede exceder 200 caracteres'),
  body('modalidad')
    .optional()
    .isIn(['presencial', 'virtual', 'hibrido'])
    .withMessage('Modalidad inválida'),
  body('requisitos')
    .optional()
    .isArray()
    .withMessage('Los requisitos deben ser un array'),
  body('materiales')
    .optional()
    .isArray()
    .withMessage('Los materiales deben ser un array'),
  body('imagen')
    .optional()
    .trim()
    .isURL()
    .withMessage('La imagen debe ser una URL válida')
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

  const {
    titulo,
    descripcion,
    cupoMaximo,
    fechaInicio,
    fechaFin,
    estado = 'borrador',
    precio = 0,
    categoria,
    instructor,
    ubicacion,
    modalidad = 'presencial',
    requisitos = [],
    materiales = [],
    imagen
  } = req.body;

  // Validar fechas
  const fechaInicioDate = new Date(fechaInicio);
  const fechaFinDate = new Date(fechaFin);
  const ahora = new Date();

  if (fechaInicioDate <= ahora) {
    return res.status(400).json({
      success: false,
      message: 'La fecha de inicio debe ser futura'
    });
  }

  if (fechaFinDate <= fechaInicioDate) {
    return res.status(400).json({
      success: false,
      message: 'La fecha de fin debe ser posterior a la fecha de inicio'
    });
  }

  // Crear curso
  const course = new Course({
    titulo,
    descripcion,
    cupoMaximo,
    fechaInicio: fechaInicioDate,
    fechaFin: fechaFinDate,
    estado,
    precio,
    categoria,
    instructor,
    ubicacion,
    modalidad,
    requisitos,
    materiales,
    imagen,
    creadoPor: req.user._id
  });

  await course.save();

  res.status(201).json({
    success: true,
    message: 'Curso creado exitosamente',
    data: course
  });
}));

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Actualizar curso (solo admin)
 *     tags: [Cursos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               cupoMaximo:
 *                 type: integer
 *               fechaInicio:
 *                 type: string
 *                 format: date-time
 *               fechaFin:
 *                 type: string
 *                 format: date-time
 *               estado:
 *                 type: string
 *               precio:
 *                 type: number
 *               categoria:
 *                 type: string
 *               instructor:
 *                 type: string
 *               ubicacion:
 *                 type: string
 *               modalidad:
 *                 type: string
 *               requisitos:
 *                 type: array
 *               materiales:
 *                 type: array
 *               imagen:
 *                 type: string
 *     responses:
 *       200:
 *         description: Curso actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Curso no encontrado
 *       403:
 *         description: Se requieren permisos de administrador
 */
router.put('/:id', [
  authenticateToken,
  requireAdmin,
  body('titulo')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('El título debe tener entre 3 y 100 caracteres'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('La descripción debe tener entre 10 y 1000 caracteres'),
  body('cupoMaximo')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('El cupo máximo debe estar entre 1 y 1000'),
  body('fechaInicio')
    .optional()
    .isISO8601()
    .withMessage('La fecha de inicio debe ser válida'),
  body('fechaFin')
    .optional()
    .isISO8601()
    .withMessage('La fecha de fin debe ser válida'),
  body('estado')
    .optional()
    .isIn(['activo', 'cancelado', 'completado', 'borrador'])
    .withMessage('Estado inválido'),
  body('precio')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo')
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

  const course = await Course.findById(req.params.id);
  
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Curso no encontrado'
    });
  }

  // Validar fechas si se proporcionan
  if (req.body.fechaInicio || req.body.fechaFin) {
    const fechaInicio = req.body.fechaInicio ? new Date(req.body.fechaInicio) : course.fechaInicio;
    const fechaFin = req.body.fechaFin ? new Date(req.body.fechaFin) : course.fechaFin;
    const ahora = new Date();

    if (fechaInicio <= ahora) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de inicio debe ser futura'
      });
    }

    if (fechaFin <= fechaInicio) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de fin debe ser posterior a la fecha de inicio'
      });
    }
  }

  // Actualizar curso
  Object.assign(course, req.body);
  await course.save();

  res.json({
    success: true,
    message: 'Curso actualizado exitosamente',
    data: course
  });
}));

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Eliminar curso (solo admin)
 *     tags: [Cursos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *     responses:
 *       200:
 *         description: Curso eliminado exitosamente
 *       404:
 *         description: Curso no encontrado
 *       403:
 *         description: Se requieren permisos de administrador
 */
router.delete('/:id', [
  authenticateToken,
  requireAdmin
], asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Curso no encontrado'
    });
  }

  await Course.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Curso eliminado exitosamente'
  });
}));

/**
 * @swagger
 * /api/courses/active:
 *   get:
 *     summary: Obtener cursos activos
 *     tags: [Cursos]
 *     responses:
 *       200:
 *         description: Lista de cursos activos
 */
router.get('/active', asyncHandler(async (req, res) => {
  const courses = await Course.findActive()
    .populate('creadoPor', 'nombre')
    .sort({ fechaInicio: 1 });

  res.json({
    success: true,
    data: courses
  });
}));

/**
 * @swagger
 * /api/courses/categories:
 *   get:
 *     summary: Obtener categorías disponibles
 *     tags: [Cursos]
 *     responses:
 *       200:
 *         description: Lista de categorías
 */
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await Course.distinct('categoria', { estado: 'activo' });
  
  res.json({
    success: true,
    data: categories.sort()
  });
}));

module.exports = router;
