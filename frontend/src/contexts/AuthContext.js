import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Verificar token al cargar la aplicación
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (token) {
          // Verificar si el token es válido
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp < currentTime) {
            // Token expirado
            logout();
            return;
          }

          // Obtener información del usuario
          const response = await api.get('/auth/me');
          setUser(response.data.data);
        }
      } catch (error) {
        console.error('Error inicializando autenticación:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [token]);

  // Función de login
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', {
        correo: email,
        contraseña: password
      });

      const { token: newToken, data: userData } = response.data;
      
      // Guardar token en localStorage
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);

      // Configurar token en axios
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      toast.success('¡Inicio de sesión exitoso!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Función de registro
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/register', userData);

      const { token: newToken, data: userInfo } = response.data;
      
      // Guardar token en localStorage
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userInfo);

      // Configurar token en axios
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      toast.success('¡Registro exitoso! Bienvenido a la plataforma.');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al registrar usuario';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Función de logout
  const logout = () => {
    // Llamar al endpoint de logout si hay token
    if (token) {
      api.post('/auth/logout').catch(console.error);
    }

    // Limpiar estado local
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];

    toast.info('Sesión cerrada');
  };

  // Función para actualizar perfil
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      const response = await api.put('/users/profile', profileData);
      setUser(response.data.data);
      toast.success('Perfil actualizado exitosamente');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al actualizar perfil';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Función para cambiar contraseña
  const changePassword = async (passwordData) => {
    try {
      setLoading(true);
      await api.put('/auth/change-password', passwordData);
      toast.success('Contraseña cambiada exitosamente');
      logout(); // Forzar logout para que el usuario inicie sesión nuevamente
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al cambiar contraseña';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Función para renovar token
  const refreshToken = async () => {
    try {
      const response = await api.post('/auth/refresh');
      const { token: newToken } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      console.error('Error renovando token:', error);
      logout();
      return { success: false };
    }
  };

  // Verificar si el usuario es admin
  const isAdmin = () => {
    return user && user.rol === 'admin';
  };

  // Verificar si el usuario está autenticado
  const isAuthenticated = () => {
    return !!user && !!token;
  };

  const value = {
    user,
    loading,
    isAuthenticated: isAuthenticated(),
    isAdmin: isAdmin(),
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
