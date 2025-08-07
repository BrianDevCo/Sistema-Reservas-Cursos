/**
 * Modelo de Curso
 * Define la estructura de datos para los cursos del sistema
 * Incluye validaciones de fechas, cupos y estados
 */

const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    minlength: [3, 'El título debe tener al menos 3 caracteres'],
    maxlength: [100, 'El título no puede exceder 100 caracteres']
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true,
    minlength: [10, 'La descripción debe tener al menos 10 caracteres'],
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
  },
  cupoMaximo: {
    type: Number,
    required: [true, 'El cupo máximo es obligatorio'],
    min: [1, 'El cupo mínimo es 1'],
    max: [1000, 'El cupo máximo es 1000']
  },
  cupoDisponible: {
    type: Number,
    required: [true, 'El cupo disponible es obligatorio'],
    min: [0, 'El cupo disponible no puede ser negativo'],
    validate: {
      validator: function(val) {
        return val <= this.cupoMaximo;
      },
      message: 'El cupo disponible no puede ser mayor al cupo máximo'
    }
  },
  fechaInicio: {
    type: Date,
    required: [true, 'La fecha de inicio es obligatoria'],
    validate: {
      validator: function(val) {
        return val > new Date();
      },
      message: 'La fecha de inicio debe ser futura'
    }
  },
  fechaFin: {
    type: Date,
    required: [true, 'La fecha de fin es obligatoria'],
    validate: {
      validator: function(val) {
        return val > this.fechaInicio;
      },
      message: 'La fecha de fin debe ser posterior a la fecha de inicio'
    }
  },
  estado: {
    type: String,
    enum: {
      values: ['activo', 'cancelado', 'completado', 'borrador'],
      message: 'El estado debe ser activo, cancelado, completado o borrador'
    },
    default: 'borrador'
  },
  precio: {
    type: Number,
    min: [0, 'El precio no puede ser negativo'],
    default: 0
  },
  categoria: {
    type: String,
    required: [true, 'La categoría es obligatoria'],
    trim: true,
    maxlength: [50, 'La categoría no puede exceder 50 caracteres']
  },
  instructor: {
    type: String,
    required: [true, 'El instructor es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre del instructor no puede exceder 100 caracteres']
  },
  ubicacion: {
    type: String,
    trim: true,
    maxlength: [200, 'La ubicación no puede exceder 200 caracteres']
  },
  modalidad: {
    type: String,
    enum: {
      values: ['presencial', 'virtual', 'hibrido'],
      message: 'La modalidad debe ser presencial, virtual o híbrido'
    },
    default: 'presencial'
  },
  requisitos: {
    type: [String],
    default: []
  },
  materiales: {
    type: [String],
    default: []
  },
  imagen: {
    type: String,
    trim: true
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimizar consultas
courseSchema.index({ estado: 1, fechaInicio: 1 });
courseSchema.index({ categoria: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ modalidad: 1 });
courseSchema.index({ creadoPor: 1 });

// Virtual para calcular la duración del curso
courseSchema.virtual('duracion').get(function() {
  if (!this.fechaInicio || !this.fechaFin) return null;
  const duracionMs = this.fechaFin.getTime() - this.fechaInicio.getTime();
  const duracionDias = Math.ceil(duracionMs / (1000 * 60 * 60 * 24));
  return duracionDias;
});

// Virtual para verificar si el curso está lleno
courseSchema.virtual('estaLleno').get(function() {
  return this.cupoDisponible === 0;
});

// Virtual para verificar si el curso está activo
courseSchema.virtual('estaActivo').get(function() {
  const ahora = new Date();
  return this.estado === 'activo' && 
         this.fechaInicio > ahora && 
         this.cupoDisponible > 0;
});

// Virtual para obtener el porcentaje de ocupación
courseSchema.virtual('porcentajeOcupacion').get(function() {
  if (this.cupoMaximo === 0) return 0;
  return Math.round(((this.cupoMaximo - this.cupoDisponible) / this.cupoMaximo) * 100);
});

// Método para reservar un cupo
courseSchema.methods.reservarCupo = function() {
  if (this.cupoDisponible > 0) {
    this.cupoDisponible -= 1;
    return this.save();
  }
  throw new Error('No hay cupos disponibles para este curso');
};

// Método para liberar un cupo
courseSchema.methods.liberarCupo = function() {
  if (this.cupoDisponible < this.cupoMaximo) {
    this.cupoDisponible += 1;
    return this.save();
  }
  throw new Error('No se puede liberar más cupos');
};

// Método para verificar si se puede reservar
courseSchema.methods.sePuedeReservar = function() {
  const ahora = new Date();
  return this.estado === 'activo' && 
         this.fechaInicio > ahora && 
         this.cupoDisponible > 0;
};

// Método estático para obtener cursos activos
courseSchema.statics.findActive = function() {
  const ahora = new Date();
  return this.find({
    estado: 'activo',
    fechaInicio: { $gt: ahora },
    cupoDisponible: { $gt: 0 }
  }).sort({ fechaInicio: 1 });
};

// Método estático para obtener cursos por categoría
courseSchema.statics.findByCategory = function(categoria) {
  return this.find({ 
    categoria: categoria,
    estado: 'activo'
  }).sort({ fechaInicio: 1 });
};

// Middleware para actualizar cupo disponible automáticamente
courseSchema.pre('save', function(next) {
  // Si es un nuevo curso, inicializar cupo disponible
  if (this.isNew && !this.cupoDisponible) {
    this.cupoDisponible = this.cupoMaximo;
  }
  next();
});

// Configuración de Swagger para documentación
/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       required:
 *         - titulo
 *         - descripcion
 *         - cupoMaximo
 *         - fechaInicio
 *         - fechaFin
 *         - categoria
 *         - instructor
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único del curso
 *         titulo:
 *           type: string
 *           description: Título del curso
 *           minLength: 3
 *           maxLength: 100
 *         descripcion:
 *           type: string
 *           description: Descripción detallada del curso
 *           minLength: 10
 *           maxLength: 1000
 *         cupoMaximo:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           description: Número máximo de participantes
 *         cupoDisponible:
 *           type: integer
 *           minimum: 0
 *           description: Número de cupos disponibles
 *         fechaInicio:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de inicio del curso
 *         fechaFin:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de fin del curso
 *         estado:
 *           type: string
 *           enum: [activo, cancelado, completado, borrador]
 *           description: Estado actual del curso
 *           default: borrador
 *         precio:
 *           type: number
 *           minimum: 0
 *           description: Precio del curso
 *           default: 0
 *         categoria:
 *           type: string
 *           description: Categoría del curso
 *           maxLength: 50
 *         instructor:
 *           type: string
 *           description: Nombre del instructor
 *           maxLength: 100
 *         ubicacion:
 *           type: string
 *           description: Ubicación del curso
 *           maxLength: 200
 *         modalidad:
 *           type: string
 *           enum: [presencial, virtual, hibrido]
 *           description: Modalidad del curso
 *           default: presencial
 *         requisitos:
 *           type: array
 *           items:
 *             type: string
 *           description: Lista de requisitos previos
 *         materiales:
 *           type: array
 *           items:
 *             type: string
 *           description: Lista de materiales necesarios
 *         imagen:
 *           type: string
 *           description: URL de la imagen del curso
 *         creadoPor:
 *           type: string
 *           description: ID del usuario que creó el curso
 *       example:
 *         titulo: "JavaScript Avanzado"
 *         descripcion: "Curso completo de JavaScript moderno"
 *         cupoMaximo: 20
 *         cupoDisponible: 15
 *         fechaInicio: "2024-02-01T09:00:00.000Z"
 *         fechaFin: "2024-02-15T17:00:00.000Z"
 *         estado: "activo"
 *         precio: 150
 *         categoria: "Programación"
 *         instructor: "María García"
 *         modalidad: "virtual"
 */

module.exports = mongoose.model('Course', courseSchema);
