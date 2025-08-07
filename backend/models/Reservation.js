/**
 * Modelo de Reserva
 * Define la estructura de datos para las reservas del sistema
 * Incluye validaciones de estado, fechas y relaciones
 */

const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es obligatorio']
  },
  curso: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'El curso es obligatorio']
  },
  fechaReserva: {
    type: Date,
    default: Date.now,
    required: [true, 'La fecha de reserva es obligatoria']
  },
  estado: {
    type: String,
    enum: {
      values: ['confirmada', 'cancelada', 'pendiente', 'completada'],
      message: 'El estado debe ser confirmada, cancelada, pendiente o completada'
    },
    default: 'pendiente'
  },
  fechaCancelacion: {
    type: Date,
    default: null
  },
  motivoCancelacion: {
    type: String,
    trim: true,
    maxlength: [500, 'El motivo de cancelación no puede exceder 500 caracteres']
  },
  notas: {
    type: String,
    trim: true,
    maxlength: [1000, 'Las notas no pueden exceder 1000 caracteres']
  },
  precioPagado: {
    type: Number,
    min: [0, 'El precio pagado no puede ser negativo'],
    default: 0
  },
  metodoPago: {
    type: String,
    enum: {
      values: ['efectivo', 'tarjeta', 'transferencia', 'gratuito'],
      message: 'El método de pago debe ser efectivo, tarjeta, transferencia o gratuito'
    },
    default: 'gratuito'
  },
  comprobantePago: {
    type: String,
    trim: true
  },
  asistio: {
    type: Boolean,
    default: false
  },
  calificacion: {
    type: Number,
    min: [1, 'La calificación mínima es 1'],
    max: [5, 'La calificación máxima es 5']
  },
  comentario: {
    type: String,
    trim: true,
    maxlength: [500, 'El comentario no puede exceder 500 caracteres']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimizar consultas
reservationSchema.index({ usuario: 1, estado: 1 });
reservationSchema.index({ curso: 1, estado: 1 });
reservationSchema.index({ fechaReserva: -1 });
reservationSchema.index({ estado: 1, fechaReserva: -1 });
reservationSchema.index({ usuario: 1, curso: 1 }, { unique: true });

// Virtual para calcular días hasta el curso
reservationSchema.virtual('diasHastaCurso').get(function() {
  if (!this.populated('curso') || !this.curso.fechaInicio) return null;
  const ahora = new Date();
  const fechaInicio = new Date(this.curso.fechaInicio);
  const diferenciaMs = fechaInicio.getTime() - ahora.getTime();
  return Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
});

// Virtual para verificar si la reserva está activa
reservationSchema.virtual('estaActiva').get(function() {
  return this.estado === 'confirmada' || this.estado === 'pendiente';
});

// Virtual para verificar si se puede cancelar
reservationSchema.virtual('sePuedeCancelar').get(function() {
  if (!this.populated('curso') || !this.curso.fechaInicio) return false;
  const ahora = new Date();
  const fechaInicio = new Date(this.curso.fechaInicio);
  const diasAntes = 2; // Se puede cancelar hasta 2 días antes
  const fechaLimite = new Date(fechaInicio.getTime() - (diasAntes * 24 * 60 * 60 * 1000));
  
  return this.estado === 'confirmada' && ahora < fechaLimite;
});

// Método para cancelar reserva
reservationSchema.methods.cancelar = function(motivo = '') {
  if (!this.sePuedeCancelar) {
    throw new Error('No se puede cancelar esta reserva');
  }
  
  this.estado = 'cancelada';
  this.fechaCancelacion = new Date();
  this.motivoCancelacion = motivo;
  
  return this.save();
};

// Método para confirmar reserva
reservationSchema.methods.confirmar = function() {
  if (this.estado !== 'pendiente') {
    throw new Error('Solo se pueden confirmar reservas pendientes');
  }
  
  this.estado = 'confirmada';
  return this.save();
};

// Método para marcar como completada
reservationSchema.methods.completar = function() {
  if (this.estado !== 'confirmada') {
    throw new Error('Solo se pueden completar reservas confirmadas');
  }
  
  this.estado = 'completada';
  return this.save();
};

// Método para calificar el curso
reservationSchema.methods.calificar = function(calificacion, comentario = '') {
  if (this.estado !== 'completada') {
    throw new Error('Solo se pueden calificar cursos completados');
  }
  
  if (calificacion < 1 || calificacion > 5) {
    throw new Error('La calificación debe estar entre 1 y 5');
  }
  
  this.calificacion = calificacion;
  this.comentario = comentario;
  
  return this.save();
};

// Método estático para obtener reservas de un usuario
reservationSchema.statics.findByUser = function(userId, estado = null) {
  const query = { usuario: userId };
  if (estado) query.estado = estado;
  
  return this.find(query)
    .populate('curso', 'titulo fechaInicio fechaFin instructor modalidad')
    .sort({ fechaReserva: -1 });
};

// Método estático para obtener reservas de un curso
reservationSchema.statics.findByCourse = function(courseId, estado = null) {
  const query = { curso: courseId };
  if (estado) query.estado = estado;
  
  return this.find(query)
    .populate('usuario', 'nombre correo')
    .sort({ fechaReserva: -1 });
};

// Método estático para verificar si usuario ya tiene reserva en curso
reservationSchema.statics.userHasReservation = function(userId, courseId) {
  return this.exists({
    usuario: userId,
    curso: courseId,
    estado: { $in: ['pendiente', 'confirmada'] }
  });
};

// Middleware para validar antes de guardar
reservationSchema.pre('save', async function(next) {
  // Verificar que no exista otra reserva activa del mismo usuario para el mismo curso
  if (this.isNew || this.isModified('usuario') || this.isModified('curso')) {
    const existingReservation = await this.constructor.findOne({
      usuario: this.usuario,
      curso: this.curso,
      estado: { $in: ['pendiente', 'confirmada'] },
      _id: { $ne: this._id }
    });
    
    if (existingReservation) {
      return next(new Error('Ya tienes una reserva activa para este curso'));
    }
  }
  
  next();
});

// Configuración de Swagger para documentación
/**
 * @swagger
 * components:
 *   schemas:
 *     Reservation:
 *       type: object
 *       required:
 *         - usuario
 *         - curso
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único de la reserva
 *         usuario:
 *           type: string
 *           description: ID del usuario que hizo la reserva
 *         curso:
 *           type: string
 *           description: ID del curso reservado
 *         fechaReserva:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de la reserva
 *         estado:
 *           type: string
 *           enum: [confirmada, cancelada, pendiente, completada]
 *           description: Estado actual de la reserva
 *           default: pendiente
 *         fechaCancelacion:
 *           type: string
 *           format: date-time
 *           description: Fecha de cancelación (si aplica)
 *         motivoCancelacion:
 *           type: string
 *           description: Motivo de la cancelación
 *           maxLength: 500
 *         notas:
 *           type: string
 *           description: Notas adicionales
 *           maxLength: 1000
 *         precioPagado:
 *           type: number
 *           minimum: 0
 *           description: Precio pagado por la reserva
 *           default: 0
 *         metodoPago:
 *           type: string
 *           enum: [efectivo, tarjeta, transferencia, gratuito]
 *           description: Método de pago utilizado
 *           default: gratuito
 *         comprobantePago:
 *           type: string
 *           description: Referencia del comprobante de pago
 *         asistio:
 *           type: boolean
 *           description: Si el usuario asistió al curso
 *           default: false
 *         calificacion:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Calificación del curso (1-5)
 *         comentario:
 *           type: string
 *           description: Comentario sobre el curso
 *           maxLength: 500
 *       example:
 *         usuario: "507f1f77bcf86cd799439011"
 *         curso: "507f1f77bcf86cd799439012"
 *         estado: "confirmada"
 *         precioPagado: 150
 *         metodoPago: "tarjeta"
 */

module.exports = mongoose.model('Reservation', reservationSchema);
