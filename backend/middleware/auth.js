/**
 * Middleware de Autenticación
 * Verifica tokens JWT y extrae información del usuario
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware para verificar token JWT
 * Extrae el usuario del token y lo agrega al request
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuario en base de datos
    const user = await User.findById(decoded.userId).select('-contraseña');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido - Usuario no encontrado'
      });
    }

    // Verificar si el usuario está activo
    if (!user.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo'
      });
    }

    // Verificar versión del token (para logout)
    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: 'Token expirado - Sesión cerrada'
      });
    }

    // Agregar usuario al request
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    console.error('Error en autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Middleware para verificar si el usuario es administrador
 * Debe usarse después de authenticateToken
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticación requerida'
    });
  }

  if (req.user.rol !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado - Se requieren permisos de administrador'
    });
  }

  next();
};

/**
 * Middleware para verificar si el usuario es propietario del recurso
 * Debe usarse después de authenticateToken
 */
const requireOwnership = (resourceModel) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const userId = req.user._id;

      const resource = await resourceModel.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Recurso no encontrado'
        });
      }

      // Verificar si el usuario es propietario o administrador
      if (resource.usuario && resource.usuario.toString() !== userId.toString() && req.user.rol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado - No tienes permisos para este recurso'
        });
      }

      req.resource = resource;
      next();

    } catch (error) {
      console.error('Error verificando propiedad:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
};

/**
 * Middleware opcional de autenticación
 * No falla si no hay token, pero agrega usuario si existe
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continuar sin usuario
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-contraseña');
    
    if (user && user.activo && decoded.tokenVersion === user.tokenVersion) {
      req.user = user;
    }

    next();

  } catch (error) {
    // Si hay error en el token, continuar sin usuario
    next();
  }
};

/**
 * Función para generar token JWT
 */
const generateToken = (userId, tokenVersion) => {
  return jwt.sign(
    { 
      userId, 
      tokenVersion,
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
    }
  );
};

/**
 * Función para verificar token sin middleware
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireOwnership,
  optionalAuth,
  generateToken,
  verifyToken
};
