/**
 * Script para crear usuario administrador inicial
 * Ejecutar: npm run create-admin
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdminUser = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ rol: 'admin' });
    
    if (existingAdmin) {
      console.log('⚠️  Ya existe un usuario administrador en el sistema');
      console.log(`📧 Email: ${existingAdmin.correo}`);
      console.log(`👤 Nombre: ${existingAdmin.nombre}`);
      return;
    }

    // Crear usuario administrador
    const adminUser = new User({
      nombre: 'Administrador',
      correo: 'admin@reservas.com',
      contraseña: 'admin123',
      rol: 'admin',
      activo: true
    });

    await adminUser.save();

    console.log('✅ Usuario administrador creado exitosamente');
    console.log('📧 Email: admin@reservas.com');
    console.log('🔑 Contraseña: admin123');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');

  } catch (error) {
    console.error('❌ Error creando usuario administrador:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  createAdminUser();
}

module.exports = createAdminUser;
