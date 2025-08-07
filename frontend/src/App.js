import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Componentes de layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Componentes de autenticación
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Componentes de usuario
import Dashboard from './components/user/Dashboard';
import CourseList from './components/courses/CourseList';
import CourseDetail from './components/courses/CourseDetail';
import ReservationList from './components/reservations/ReservationList';
import Profile from './components/user/Profile';

// Componentes de administrador
import AdminDashboard from './components/admin/AdminDashboard';
import CourseManagement from './components/admin/CourseManagement';
import UserManagement from './components/admin/UserManagement';
import ReservationManagement from './components/admin/ReservationManagement';

// Componentes públicos
import Home from './components/public/Home';
import About from './components/public/About';
import Contact from './components/public/Contact';

// Componentes de utilidad
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Estilos
import './App.css';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Navbar />
        
        <main className="main-content">
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Rutas de autenticación */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Rutas protegidas de usuario */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/courses" 
              element={<CourseList />} 
            />
            
            <Route 
              path="/courses/:id" 
              element={<CourseDetail />} 
            />
            
            <Route 
              path="/reservations" 
              element={
                <ProtectedRoute>
                  <ReservationList />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            {/* Rutas de administrador */}
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />
            
            <Route 
              path="/admin/courses" 
              element={
                <AdminRoute>
                  <CourseManagement />
                </AdminRoute>
              } 
            />
            
            <Route 
              path="/admin/users" 
              element={
                <AdminRoute>
                  <UserManagement />
                </AdminRoute>
              } 
            />
            
            <Route 
              path="/admin/reservations" 
              element={
                <AdminRoute>
                  <ReservationManagement />
                </AdminRoute>
              } 
            />
            
            {/* Ruta por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        <Footer />
        
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </AuthProvider>
  );
}

export default App;
