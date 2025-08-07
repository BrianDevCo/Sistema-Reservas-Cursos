import axios from 'axios';
import { toast } from 'react-toastify';

// Configuración base de axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no hemos intentado renovar el token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Intentar renovar el token
        const response = await api.post('/auth/refresh');
        const { token: newToken } = response.data;
        
        // Guardar nuevo token
        localStorage.setItem('token', newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        // Reintentar la petición original
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Si falla la renovación, limpiar token y redirigir a login
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        
        // Mostrar mensaje de sesión expirada
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        
        // Redirigir a login si estamos en una página protegida
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    // Manejar otros errores
    const message = error.response?.data?.message || 'Error en la petición';
    
    // No mostrar toast para errores 401 (ya manejados arriba)
    if (error.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// Servicios específicos para cada entidad

// Servicios de autenticación
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
};

// Servicios de usuarios
export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  // Admin endpoints
  getAllUsers: (params) => api.get('/users/admin', { params }),
  getUserById: (id) => api.get(`/users/admin/${id}`),
  updateUser: (id, userData) => api.put(`/users/admin/${id}`, userData),
  toggleUserStatus: (id) => api.put(`/users/admin/${id}/toggle-status`),
  deleteUser: (id) => api.delete(`/users/admin/${id}`),
  getUserStats: () => api.get('/users/stats'),
};

// Servicios de cursos
export const courseService = {
  getAllCourses: (params) => api.get('/courses', { params }),
  getCourseById: (id) => api.get(`/courses/${id}`),
  getActiveCourses: () => api.get('/courses/active'),
  getCategories: () => api.get('/courses/categories'),
  // Admin endpoints
  createCourse: (courseData) => api.post('/courses', courseData),
  updateCourse: (id, courseData) => api.put(`/courses/${id}`, courseData),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
};

// Servicios de reservas
export const reservationService = {
  getUserReservations: (params) => api.get('/reservations', { params }),
  getReservationById: (id) => api.get(`/reservations/${id}`),
  createReservation: (reservationData) => api.post('/reservations', reservationData),
  cancelReservation: (id, motivo) => api.put(`/reservations/${id}/cancel`, { motivo }),
  rateCourse: (id, ratingData) => api.put(`/reservations/${id}/rate`, ratingData),
  // Admin endpoints
  getAllReservations: (params) => api.get('/reservations/admin/all', { params }),
  confirmReservation: (id) => api.put(`/reservations/admin/${id}/confirm`),
  completeReservation: (id) => api.put(`/reservations/admin/${id}/complete`),
};

// Función para manejar errores de red
export const handleNetworkError = (error) => {
  if (error.code === 'ECONNABORTED') {
    toast.error('Tiempo de espera agotado. Verifica tu conexión a internet.');
  } else if (!error.response) {
    toast.error('Error de conexión. Verifica tu conexión a internet.');
  }
};

// Función para formatear fechas
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Función para formatear precios
export const formatPrice = (price) => {
  if (price === 0) return 'Gratuito';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
};

// Función para obtener el estado de un curso
export const getCourseStatus = (course) => {
  if (!course) return '';
  
  const now = new Date();
  const startDate = new Date(course.fechaInicio);
  const endDate = new Date(course.fechaFin);
  
  if (course.estado === 'cancelado') return 'cancelado';
  if (course.estado === 'completado') return 'completado';
  if (course.estado === 'borrador') return 'borrador';
  
  if (now < startDate) return 'próximo';
  if (now >= startDate && now <= endDate) return 'en_curso';
  if (now > endDate) return 'finalizado';
  
  return 'activo';
};

// Función para obtener el estado de una reserva
export const getReservationStatus = (reservation) => {
  if (!reservation) return '';
  
  switch (reservation.estado) {
    case 'confirmada':
      return 'confirmada';
    case 'cancelada':
      return 'cancelada';
    case 'pendiente':
      return 'pendiente';
    case 'completada':
      return 'completada';
    default:
      return 'pendiente';
  }
};

export default api;
