import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer mt-auto">
      <Container>
        <Row className="py-4">
          <Col md={4} className="mb-4">
            <h5 className="text-primary mb-3">
              <FaGraduationCap className="me-2" />
              Sistema de Reservas
            </h5>
            <p className="text-muted">
              Plataforma completa para la gestión de reservas en cursos y talleres. 
              Conectamos estudiantes con las mejores oportunidades de aprendizaje.
            </p>
            <div className="social-links">
              <a href="#" className="text-light me-3" title="Facebook">
                <FaFacebook size={20} />
              </a>
              <a href="#" className="text-light me-3" title="Twitter">
                <FaTwitter size={20} />
              </a>
              <a href="#" className="text-light me-3" title="Instagram">
                <FaInstagram size={20} />
              </a>
              <a href="#" className="text-light" title="LinkedIn">
                <FaLinkedin size={20} />
              </a>
            </div>
          </Col>

          <Col md={4} className="mb-4">
            <h5 className="text-primary mb-3">Enlaces Rápidos</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/" className="text-light text-decoration-none">
                  Inicio
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/courses" className="text-light text-decoration-none">
                  Cursos Disponibles
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/about" className="text-light text-decoration-none">
                  Acerca de Nosotros
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/contact" className="text-light text-decoration-none">
                  Contacto
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/register" className="text-light text-decoration-none">
                  Registrarse
                </Link>
              </li>
            </ul>
          </Col>

          <Col md={4} className="mb-4">
            <h5 className="text-primary mb-3">Información de Contacto</h5>
            <div className="contact-info">
              <div className="d-flex align-items-center mb-2">
                <FaMapMarkerAlt className="text-primary me-2" />
                <span className="text-light">
                  Av. Principal 123, Ciudad, País
                </span>
              </div>
              <div className="d-flex align-items-center mb-2">
                <FaPhone className="text-primary me-2" />
                <span className="text-light">
                  +1 (555) 123-4567
                </span>
              </div>
              <div className="d-flex align-items-center mb-2">
                <FaEnvelope className="text-primary me-2" />
                <span className="text-light">
                  info@sistemareservas.com
                </span>
              </div>
            </div>
          </Col>
        </Row>

        <Row>
          <Col>
            <hr className="border-light" />
            <div className="d-flex justify-content-between align-items-center py-3">
              <div className="text-light">
                © {currentYear} Sistema de Reservas. Todos los derechos reservados.
              </div>
              <div>
                <Link to="/privacy" className="text-light text-decoration-none me-3">
                  Política de Privacidad
                </Link>
                <Link to="/terms" className="text-light text-decoration-none">
                  Términos de Servicio
                </Link>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
