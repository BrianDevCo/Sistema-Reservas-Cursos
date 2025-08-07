/**
 * Script para poblar la base de datos con datos de ejemplo
 * Ejecutar: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');

const seedData = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Conectado a MongoDB');

    // Crear usuarios de ejemplo
    const users = [
      {
        nombre: 'María García',
        correo: 'maria.garcia@ejemplo.com',
        contraseña: 'password123',
        rol: 'usuario'
      },
      {
        nombre: 'Carlos López',
        correo: 'carlos.lopez@ejemplo.com',
        contraseña: 'password123',
        rol: 'usuario'
      },
      {
        nombre: 'Ana Martínez',
        correo: 'ana.martinez@ejemplo.com',
        contraseña: 'password123',
        rol: 'usuario'
      }
    ];

    console.log('👥 Creando usuarios de ejemplo...');
    const createdUsers = [];
    
    for (const userData of users) {
      const existingUser = await User.findByEmail(userData.correo);
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        createdUsers.push(user);
        console.log(`✅ Usuario creado: ${user.nombre}`);
      } else {
        console.log(`⚠️  Usuario ya existe: ${userData.nombre}`);
      }
    }

    // Obtener admin para crear cursos
    const admin = await User.findOne({ rol: 'admin' });
    if (!admin) {
      console.log('❌ No se encontró usuario administrador. Ejecuta primero: npm run create-admin');
      return;
    }

    // Crear cursos de ejemplo
    const courses = [
      {
        titulo: 'JavaScript Avanzado',
        descripcion: 'Curso completo de JavaScript moderno, incluyendo ES6+, async/await, promesas, y patrones de diseño. Aprende a construir aplicaciones web robustas y escalables.',
        cupoMaximo: 20,
        fechaInicio: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días desde ahora
        fechaFin: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 días desde ahora
        estado: 'activo',
        precio: 150,
        categoria: 'Programación',
        instructor: 'Dr. Roberto Silva',
        ubicacion: 'Aula Virtual',
        modalidad: 'virtual',
        requisitos: ['Conocimientos básicos de HTML', 'Lógica de programación'],
        materiales: ['Laptop', 'Editor de código', 'Conexión a internet'],
        imagen: 'https://via.placeholder.com/300x200/4A90E2/FFFFFF?text=JavaScript'
      },
      {
        titulo: 'React para Principiantes',
        descripcion: 'Introducción completa a React.js. Aprende los fundamentos, hooks, componentes funcionales y cómo construir aplicaciones modernas.',
        cupoMaximo: 15,
        fechaInicio: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 días desde ahora
        fechaFin: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 días desde ahora
        estado: 'activo',
        precio: 200,
        categoria: 'Desarrollo Web',
        instructor: 'Ing. Laura Fernández',
        ubicacion: 'Centro de Capacitación',
        modalidad: 'presencial',
        requisitos: ['JavaScript básico', 'HTML y CSS'],
        materiales: ['Laptop', 'Node.js instalado'],
        imagen: 'https://via.placeholder.com/300x200/61DAFB/FFFFFF?text=React'
      },
      {
        titulo: 'Python para Data Science',
        descripcion: 'Curso intensivo de Python aplicado a la ciencia de datos. Incluye pandas, numpy, matplotlib y machine learning básico.',
        cupoMaximo: 25,
        fechaInicio: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 días desde ahora
        fechaFin: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000), // 19 días desde ahora
        estado: 'activo',
        precio: 180,
        categoria: 'Ciencia de Datos',
        instructor: 'Dra. Patricia Morales',
        ubicacion: 'Laboratorio de Computación',
        modalidad: 'hibrido',
        requisitos: ['Matemáticas básicas', 'Lógica de programación'],
        materiales: ['Laptop', 'Python 3.8+', 'Jupyter Notebook'],
        imagen: 'https://via.placeholder.com/300x200/3776AB/FFFFFF?text=Python'
      },
      {
        titulo: 'Diseño UX/UI',
        descripcion: 'Aprende los principios del diseño de experiencia de usuario y interfaces. Incluye herramientas como Figma, Adobe XD y metodologías de investigación.',
        cupoMaximo: 12,
        fechaInicio: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 días desde ahora
        fechaFin: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000), // 24 días desde ahora
        estado: 'activo',
        precio: 250,
        categoria: 'Diseño',
        instructor: 'Lic. Sofía Ramírez',
        ubicacion: 'Estudio de Diseño',
        modalidad: 'presencial',
        requisitos: ['Creatividad', 'Interés en tecnología'],
        materiales: ['Tablet o laptop', 'Software de diseño'],
        imagen: 'https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=UX/UI'
      },
      {
        titulo: 'Marketing Digital',
        descripcion: 'Estrategias modernas de marketing digital. SEO, SEM, redes sociales, email marketing y análisis de datos para optimizar campañas.',
        cupoMaximo: 30,
        fechaInicio: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 días desde ahora
        fechaFin: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000), // 17 días desde ahora
        estado: 'activo',
        precio: 120,
        categoria: 'Marketing',
        instructor: 'Lic. Diego Herrera',
        ubicacion: 'Aula Virtual',
        modalidad: 'virtual',
        requisitos: ['Conocimientos básicos de internet', 'Interés en negocios'],
        materiales: ['Laptop', 'Conexión a internet', 'Cuentas de redes sociales'],
        imagen: 'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Marketing'
      }
    ];

    console.log('📚 Creando cursos de ejemplo...');
    
    for (const courseData of courses) {
      const existingCourse = await Course.findOne({ titulo: courseData.titulo });
      if (!existingCourse) {
        const course = new Course({
          ...courseData,
          creadoPor: admin._id
        });
        await course.save();
        console.log(`✅ Curso creado: ${course.titulo}`);
      } else {
        console.log(`⚠️  Curso ya existe: ${courseData.titulo}`);
      }
    }

    console.log('\n🎉 Datos de ejemplo creados exitosamente!');
    console.log('\n📋 Resumen:');
    console.log(`👥 Usuarios creados: ${createdUsers.length}`);
    console.log(`📚 Cursos disponibles: ${courses.length}`);
    console.log('\n🔗 Puedes acceder al sistema con:');
    console.log('📧 Email: admin@reservas.com');
    console.log('🔑 Contraseña: admin123');

  } catch (error) {
    console.error('❌ Error poblando datos:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  seedData();
}

module.exports = seedData;
