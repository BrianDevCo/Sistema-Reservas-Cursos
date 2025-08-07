# Sistema de Reservas Web para Cursos

Una plataforma web completa para la gestión de reservas en cursos y talleres, desarrollada con Node.js, React, MongoDB y Docker.

## 🚀 Características Principales

- **Backend**: API RESTful con Node.js + Express + MongoDB
- **Frontend**: SPA React con diseño responsivo
- **Autenticación**: JWT para usuarios y administradores
- **Contenedores**: Docker para desarrollo y despliegue
- **Base de Datos**: MongoDB con modelos optimizados
- **Seguridad**: Validaciones, sanitización y middleware de protección

## 📋 Requisitos Previos

- Docker y Docker Compose
- Node.js 18+ (para desarrollo local)
- Git

## 🛠️ Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone <url-del-repositorio>
cd sistema-reservas-cursos
```

### 2. Configurar Variables de Entorno
```bash
# Copiar archivos de ejemplo
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Levantar con Docker Compose
```bash
docker-compose up -d
```

### 4. Crear Usuario Administrador Inicial
```bash
docker-compose exec backend npm run create-admin
```

## 🏗️ Estructura del Proyecto

```
sistema-reservas-cursos/
├── backend/                 # API RESTful con Node.js
├── frontend/               # Aplicación React
├── docker-compose.yml      # Configuración de contenedores
├── .github/               # Workflows de CI/CD
└── docs/                  # Documentación adicional
```

## 🔧 Desarrollo Local

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## 📚 API Documentation

La documentación de la API está disponible en:
- **Swagger UI**: http://localhost:3001/api-docs
- **OpenAPI JSON**: http://localhost:3001/api-docs.json

## 🧪 Testing

```bash
# Backend tests
docker-compose exec backend npm test

# Frontend tests
docker-compose exec frontend npm test
```

## 🚀 Despliegue

### Producción
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Desarrollo
```bash
docker-compose up -d
```

## 📖 Guía de Uso

### Flujo Típico de Usuario

1. **Registro**: Crear cuenta en la plataforma
2. **Login**: Iniciar sesión con credenciales
3. **Explorar Cursos**: Ver cursos disponibles
4. **Reservar**: Inscribirse en cursos de interés
5. **Gestionar**: Ver y cancelar reservas propias

### Flujo de Administrador

1. **Login Admin**: Acceder con credenciales de administrador
2. **Gestionar Cursos**: Crear, editar y eliminar cursos
3. **Ver Reservas**: Monitorear todas las reservas del sistema
4. **Gestión de Usuarios**: Administrar usuarios del sistema

## 🔒 Seguridad

- Autenticación JWT
- Validación de datos de entrada
- Sanitización de inputs
- Middleware de autorización por roles
- Variables de entorno para configuraciones sensibles

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 FAQ

### Preguntas Frecuentes

**Q: ¿Cómo resetear la base de datos?**
A: `docker-compose down -v && docker-compose up -d`

**Q: ¿Cómo ver los logs?**
A: `docker-compose logs -f [service-name]`

**Q: ¿Cómo acceder a MongoDB directamente?**
A: `docker-compose exec mongodb mongosh`

**Q: ¿Cómo hacer backup de la base de datos?**
A: `docker-compose exec mongodb mongodump --out /backup`

## 📞 Soporte

Para reportar bugs o solicitar nuevas características, por favor crear un issue en el repositorio.
