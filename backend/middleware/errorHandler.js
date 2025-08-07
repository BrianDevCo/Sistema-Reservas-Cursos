/**
 * Middleware de Manejo de Errores
 * Captura y formatea errores de manera consistente
 */

/**
 * Middleware para manejar errores de validación de Mongoose
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(val => val.message);
  const message = `Datos inválidos: ${errors.join('. ')}`;
  
  return {
    success: false,
    message,
    errors: errors,
    statusCode: 400
  };
};

/**
 * Middleware para manejar errores de duplicación de MongoDB
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field} '${value}' ya existe`;
  
  return {
    success: false,
    message,
    statusCode: 400
  };
};

/**
 * Middleware para manejar errores de cast de MongoDB
 */
const handleCastError = (err) => {
  const message = `ID inválido: ${err.value}`;
  
  return {
    success: false,
    message,
    statusCode: 400
  };
};

/**
 * Middleware para manejar errores de JWT
 */
const handleJWTError = () => {
  return {
    success: false,
    message: 'Token inválido',
    statusCode: 401
  };
};

/**
 * Middleware para manejar tokens JWT expirados
 */
const handleJWTExpiredError = () => {
  return {
    success: false,
    message: 'Token expirado',
    statusCode: 401
  };
};

/**
 * Middleware principal de manejo de errores
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log del error para debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user ? req.user._id : 'No autenticado',
    timestamp: new Date().toISOString()
  });

  // Manejar errores específicos de Mongoose
  if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  }

  if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  }

  if (err.name === 'CastError') {
    error = handleCastError(err);
  }

  // Manejar errores de JWT
  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }

  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  // Si no es un error conocido, usar valores por defecto
  if (!error.statusCode) {
    error.statusCode = err.statusCode || 500;
    error.message = err.message || 'Error interno del servidor';
  }

  // En desarrollo, incluir stack trace
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
  }

  // Respuesta de error
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(error.errors && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    timestamp: new Date().toISOString(),
    path: req.url
  });
};

/**
 * Middleware para manejar rutas no encontradas
 */
const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Middleware para manejar errores de validación de Express Validator
 */
const handleValidationErrors = (req, res, next) => {
  const errors = req.validationErrors();
  
  if (errors) {
    const errorMessages = errors.map(error => error.msg);
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: errorMessages
    });
  }
  
  next();
};

/**
 * Función para crear errores personalizados
 */
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Función para manejar errores asíncronos
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFound,
  handleValidationErrors,
  createError,
  asyncHandler
};
