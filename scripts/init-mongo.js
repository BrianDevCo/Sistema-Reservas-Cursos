/**
 * Script de inicialización de MongoDB
 * Se ejecuta automáticamente al crear el contenedor de MongoDB
 */

// Crear base de datos y usuario
db = db.getSiblingDB('reservas_db');

// Crear colecciones con validaciones
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nombre", "correo", "contraseña"],
      properties: {
        nombre: {
          bsonType: "string",
          minLength: 2,
          maxLength: 50
        },
        correo: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
        },
        contraseña: {
          bsonType: "string",
          minLength: 6
        },
        rol: {
          enum: ["usuario", "admin"]
        }
      }
    }
  }
});

db.createCollection('courses', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["titulo", "descripcion", "cupoMaximo", "fechaInicio", "fechaFin", "categoria", "instructor"],
      properties: {
        titulo: {
          bsonType: "string",
          minLength: 3,
          maxLength: 100
        },
        descripcion: {
          bsonType: "string",
          minLength: 10,
          maxLength: 1000
        },
        cupoMaximo: {
          bsonType: "int",
          minimum: 1,
          maximum: 1000
        },
        estado: {
          enum: ["activo", "cancelado", "completado", "borrador"]
        },
        modalidad: {
          enum: ["presencial", "virtual", "hibrido"]
        }
      }
    }
  }
});

db.createCollection('reservations', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["usuario", "curso"],
      properties: {
        estado: {
          enum: ["confirmada", "cancelada", "pendiente", "completada"]
        },
        metodoPago: {
          enum: ["efectivo", "tarjeta", "transferencia", "gratuito"]
        },
        calificacion: {
          bsonType: "int",
          minimum: 1,
          maximum: 5
        }
      }
    }
  }
});

// Crear índices para optimizar consultas
db.users.createIndex({ "correo": 1 }, { unique: true });
db.users.createIndex({ "rol": 1 });
db.users.createIndex({ "activo": 1 });

db.courses.createIndex({ "estado": 1, "fechaInicio": 1 });
db.courses.createIndex({ "categoria": 1 });
db.courses.createIndex({ "instructor": 1 });
db.courses.createIndex({ "modalidad": 1 });
db.courses.createIndex({ "creadoPor": 1 });

db.reservations.createIndex({ "usuario": 1, "estado": 1 });
db.reservations.createIndex({ "curso": 1, "estado": 1 });
db.reservations.createIndex({ "fechaReserva": -1 });
db.reservations.createIndex({ "usuario": 1, "curso": 1 }, { unique: true });

print('✅ Base de datos reservas_db inicializada correctamente');
print('✅ Colecciones creadas: users, courses, reservations');
print('✅ Índices creados para optimizar consultas');
