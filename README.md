# Sistema de Reservas Web para Cursos

Un sistema web completo desarrollado para la gestión de reservas de cursos, con una arquitectura moderna que combina un backend robusto con una interfaz de usuario intuitiva y responsive.

## 🚀 Sobre el Proyecto

Este proyecto nació de la necesidad de crear una solución integral para instituciones educativas que necesitan gestionar sus cursos y reservas de manera eficiente. Desarrollé este sistema desde cero, enfocándome en crear una experiencia de usuario excepcional mientras mantengo un código limpio y escalable.

### Lo que aprendí y desarrollé:

- **Arquitectura Full-Stack**: Implementé una separación clara entre frontend y backend, permitiendo escalabilidad y mantenimiento eficiente
- **Autenticación Segura**: Desarrollé un sistema de autenticación con JWT que maneja diferentes roles de usuario
- **Panel de Administración**: Creé una interfaz completa para que los administradores puedan gestionar cursos y reservas
- **API RESTful**: Diseñé una API robusta que sigue las mejores prácticas de desarrollo web
- **Interfaz Responsive**: Desarrollé una UI moderna que funciona perfectamente en dispositivos móviles y desktop

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript del lado del servidor
- **Express.js** - Framework web para crear APIs RESTful
- **MongoDB** - Base de datos NoSQL para flexibilidad en el esquema
- **JWT** - Autenticación segura con tokens
- **Mongoose** - ODM para MongoDB

### Frontend
- **React** - Biblioteca para construir interfaces de usuario
- **JavaScript ES6+** - Características modernas de JavaScript
- **CSS3** - Estilos modernos y responsive
- **Context API** - Gestión de estado global

### DevOps
- **Docker** - Containerización para desarrollo y despliegue
- **Docker Compose** - Orquestación de servicios

## 📋 Funcionalidades Principales

### Para Usuarios
- Registro e inicio de sesión con validaciones
- Exploración de cursos disponibles
- Sistema de reservas con confirmaciones
- Perfil personal con historial de reservas
- Interfaz intuitiva y responsive

### Para Administradores
- Panel de administración completo
- Gestión de cursos (crear, editar, eliminar)
- Visualización de todas las reservas
- Gestión de usuarios del sistema
- Dashboard con estadísticas

## 🏗️ Estructura del Proyecto

```
├── backend/                 # API REST con Node.js/Express
│   ├── models/             # Modelos de MongoDB
│   ├── routes/             # Rutas de la API
│   ├── middleware/         # Middleware personalizado
│   └── scripts/           # Scripts de utilidad
├── frontend/              # Aplicación React
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── contexts/      # Context API para estado
│   │   └── services/      # Servicios de API
└── docker-compose.yml     # Configuración de Docker
```

## 🚀 Instalación y Uso

### Prerrequisitos
- Node.js (v14 o superior)
- MongoDB
- Docker (opcional)

### Instalación Local

1. **Clonar el repositorio**
```bash
git clone https://github.com/BrianDevCo/Sistema-Reservas-Cursos.git
cd Sistema-Reservas-Cursos
```

2. **Configurar el backend**
```bash
cd backend
npm install
cp env.example .env
# Editar .env con tus configuraciones
npm start
```

3. **Configurar el frontend**
```bash
cd ../frontend
npm install
cp env.example .env
# Editar .env con la URL del backend
npm start
```

### Con Docker (Recomendado)

```bash
docker-compose up --build
```

## 🔧 Configuración

### Variables de Entorno

**Backend (.env)**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/reservas-cursos
JWT_SECRET=tu_jwt_secret_aqui
```

**Frontend (.env)**
```
REACT_APP_API_URL=http://localhost:5000/api
```

## 📸 Capturas de Pantalla

### Página de Inicio
![Página de Inicio](https://via.placeholder.com/800x400/4A90E2/FFFFFF?text=Página+de+Inicio)

### Panel de Administración
![Panel Admin](https://via.placeholder.com/800x400/50C878/FFFFFF?text=Panel+de+Administración)

### Gestión de Cursos
![Gestión Cursos](https://via.placeholder.com/800x400/FF6B35/FFFFFF?text=Gestión+de+Cursos)

### Sistema de Reservas
![Reservas](https://via.placeholder.com/800x400/9B59B6/FFFFFF?text=Sistema+de+Reservas)

## 🎯 Características Destacadas

### Seguridad Implementada
- Autenticación JWT con refresh tokens
- Validación de datos en frontend y backend
- Sanitización de inputs para prevenir XSS
- Middleware de autorización por roles
- Variables de entorno para configuraciones sensibles

### Experiencia de Usuario
- Diseño responsive que funciona en móviles, tablets y desktop
- Navegación intuitiva con breadcrumbs
- Feedback visual inmediato en todas las acciones
- Loading states y manejo de errores elegante
- Formularios con validación en tiempo real

### Arquitectura del Código
- Separación clara de responsabilidades
- Componentes reutilizables en React
- Patrón MVC en el backend
- API RESTful bien documentada
- Código limpio y mantenible

## 🚀 Despliegue

### Opción 1: Docker (Recomendado)
```bash
# Clonar y ejecutar
git clone https://github.com/BrianDevCo/Sistema-Reservas-Cursos.git
cd Sistema-Reservas-Cursos
docker-compose up -d
```

### Opción 2: Despliegue Manual
```bash
# Backend
cd backend
npm install
npm run build
npm start

# Frontend (en otra terminal)
cd frontend
npm install
npm run build
npm start
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📊 Métricas del Proyecto

- **Líneas de código**: ~5,000 líneas
- **Componentes React**: 15 componentes
- **Rutas API**: 20+ endpoints
- **Tiempo de desarrollo**: 3 semanas
- **Tecnologías utilizadas**: 8 tecnologías principales

## 🤝 Contribuciones

Este proyecto fue desarrollado como parte de mi portafolio personal. Si tienes sugerencias o encuentras algún bug, no dudes en contactarme.

## 📞 Contacto

- **GitHub**: [@BrianDevCo](https://github.com/BrianDevCo)
- **Portfolio**: [brian-dev.com](https://brian-dev.com)
- **LinkedIn**: [Brian Developer](https://linkedin.com/in/brian-developer)
- **Email**: brian@dev.com

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- A la comunidad de desarrolladores que comparten conocimiento
- A los creadores de las librerías utilizadas en este proyecto
- A todos los que han contribuido con feedback y sugerencias

---

**Desarrollado con ❤️ por Brian Dev Co**

*"El código es poesía, y cada línea cuenta una historia"*
