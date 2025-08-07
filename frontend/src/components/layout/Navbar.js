import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button, Dropdown } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { FaUser, FaSignOutAlt, FaCog, FaGraduationCap } from 'react-icons/fa';

const NavigationBar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setExpanded(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <Navbar 
      bg="primary" 
      variant="dark" 
      expand="lg" 
      fixed="top"
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    >
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <FaGraduationCap className="me-2" />
          Sistema de Reservas
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/" 
              className={isActive('/') ? 'active' : ''}
              onClick={() => setExpanded(false)}
            >
              Inicio
            </Nav.Link>
            
            <Nav.Link 
              as={Link} 
              to="/courses" 
              className={isActive('/courses') ? 'active' : ''}
              onClick={() => setExpanded(false)}
            >
              Cursos
            </Nav.Link>
            
            <Nav.Link 
              as={Link} 
              to="/about" 
              className={isActive('/about') ? 'active' : ''}
              onClick={() => setExpanded(false)}
            >
              Acerca de
            </Nav.Link>
            
            <Nav.Link 
              as={Link} 
              to="/contact" 
              className={isActive('/contact') ? 'active' : ''}
              onClick={() => setExpanded(false)}
            >
              Contacto
            </Nav.Link>
          </Nav>

          <Nav className="ms-auto">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Nav.Link 
                    as={Link} 
                    to="/admin" 
                    className={isActive('/admin') ? 'active' : ''}
                    onClick={() => setExpanded(false)}
                  >
                    Panel Admin
                  </Nav.Link>
                )}
                
                <Nav.Link 
                  as={Link} 
                  to="/dashboard" 
                  className={isActive('/dashboard') ? 'active' : ''}
                  onClick={() => setExpanded(false)}
                >
                  Dashboard
                </Nav.Link>
                
                <Nav.Link 
                  as={Link} 
                  to="/reservations" 
                  className={isActive('/reservations') ? 'active' : ''}
                  onClick={() => setExpanded(false)}
                >
                  Mis Reservas
                </Nav.Link>

                <Dropdown align="end">
                  <Dropdown.Toggle variant="outline-light" id="user-dropdown">
                    <FaUser className="me-1" />
                    {user?.nombre}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Item as={Link} to="/profile">
                      <FaUser className="me-2" />
                      Mi Perfil
                    </Dropdown.Item>
                    
                    {isAdmin && (
                      <>
                        <Dropdown.Divider />
                        <Dropdown.Item as={Link} to="/admin/courses">
                          <FaCog className="me-2" />
                          Gestionar Cursos
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/admin/users">
                          <FaUser className="me-2" />
                          Gestionar Usuarios
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/admin/reservations">
                          <FaGraduationCap className="me-2" />
                          Gestionar Reservas
                        </Dropdown.Item>
                      </>
                    )}
                    
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>
                      <FaSignOutAlt className="me-2" />
                      Cerrar Sesión
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <>
                <Nav.Link 
                  as={Link} 
                  to="/login"
                  className={isActive('/login') ? 'active' : ''}
                  onClick={() => setExpanded(false)}
                >
                  Iniciar Sesión
                </Nav.Link>
                
                <Button 
                  as={Link} 
                  to="/register" 
                  variant="outline-light"
                  className="ms-2"
                  onClick={() => setExpanded(false)}
                >
                  Registrarse
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
