/**
 * Modelo de Usuario
 * Define la estructura de datos para los usuarios del sistema
 * Incluye autenticación, roles y validaciones
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxlength: [50, 'El nombre no puede exceder 50 caracteres']
  },
  correo: {
    type: String,
    required: [true, 'El correo es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor ingresa un correo válido'
    ]
  },
  contraseña: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false // No incluir en consultas por defecto
  },
  rol: {
    type: String,
    enum: {
      values: ['usuario', 'admin'],
      message: 'El rol debe ser usuario o admin'
    },
    default: 'usuario'
  },
  activo: {
    type: Boolean,
    default: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  ultimoAcceso: {
    type: Date,
    default: Date.now
  },
  tokenVersion: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimizar consultas
userSchema.index({ correo: 1 });
userSchema.index({ rol: 1 });
userSchema.index({ activo: 1 });

// Virtual para obtener el nombre completo
userSchema.virtual('nombreCompleto').get(function() {
  return this.nombre;
});

// Middleware pre-save para hashear contraseña
userSchema.pre('save', async function(next) {
  // Solo hashear si la contraseña ha sido modificada
  if (!this.isModified('contraseña')) return next();
  
  try {
    // Hashear contraseña con salt rounds
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.contraseña = await bcrypt.hash(this.contraseña, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.compararContraseña = async function(contraseñaCandidata) {
  try {
    return await bcrypt.compare(contraseñaCandidata, this.contraseña);
  } catch (error) {
    throw new Error('Error comparando contraseñas');
  }
};

// Método para actualizar último acceso
userSchema.methods.actualizarUltimoAcceso = function() {
  this.ultimoAcceso = new Date();
  return this.save();
};

// Método para invalidar tokens (logout)
userSchema.methods.invalidarTokens = function() {
  this.tokenVersion += 1;
  return this.save();
};

// Método para obtener datos públicos del usuario
userSchema.methods.toPublicJSON = function() {
  const userObject = this.toObject();
  delete userObject.contraseña;
  delete userObject.tokenVersion;
  return userObject;
};

// Método estático para buscar por correo
userSchema.statics.findByEmail = function(correo) {
  return this.findOne({ correo: correo.toLowerCase() });
};

// Método estático para verificar si existe usuario
userSchema.statics.existsByEmail = function(correo) {
  return this.exists({ correo: correo.toLowerCase() });
};

// Middleware para validar antes de guardar
userSchema.pre('save', function(next) {
  // Validar que el correo no esté duplicado
  if (this.isNew || this.isModified('correo')) {
    this.constructor.existsByEmail(this.correo)
      .then(exists => {
        if (exists) {
          next(new Error('El correo ya está registrado'));
        } else {
          next();
        }
      })
      .catch(next);
  } else {
    next();
  }
});

// Configuración de Swagger para documentación
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - nombre
 *         - correo
 *         - contraseña
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único del usuario
 *         nombre:
 *           type: string
 *           description: Nombre completo del usuario
 *           minLength: 2
 *           maxLength: 50
 *         correo:
 *           type: string
 *           format: email
 *           description: Correo electrónico único
 *         contraseña:
 *           type: string
 *           description: Contraseña hasheada
 *           minLength: 6
 *         rol:
 *           type: string
 *           enum: [usuario, admin]
 *           description: Rol del usuario en el sistema
 *           default: usuario
 *         activo:
 *           type: boolean
 *           description: Estado activo del usuario
 *           default: true
 *         fechaCreacion:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del usuario
 *         ultimoAcceso:
 *           type: string
 *           format: date-time
 *           description: Último acceso del usuario
 *       example:
 *         nombre: "Juan Pérez"
 *         correo: "juan.perez@ejemplo.com"
 *         rol: "usuario"
 *         activo: true
 */

module.exports = mongoose.model('User', userSchema);
