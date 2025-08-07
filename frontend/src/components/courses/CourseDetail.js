import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Alert, Modal, Form } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { courseService, reservationService } from '../../services/api';
import { toast } from 'react-toastify';
import { 
  FaCalendarAlt, 
  FaUsers, 
  FaClock, 
  FaMapMarkerAlt,
  FaGraduationCap,
  FaStar,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaArrowLeft,
  FaBookmark,
  FaShare,
  FaDollarSign,
  FaInfoCircle
} from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userReservation, setUserReservation] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservationData, setReservationData] = useState({
    notas: '',
    metodoPago: 'gratuito'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCourseDetails();
  }, [id]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      
      // Cargar detalles del curso
      const courseResponse = await courseService.getCourseById(id);
      setCourse(courseResponse.data.data);
      
      // Si el usuario está autenticado, verificar si ya tiene una reserva
      if (isAuthenticated) {
        try {
          const reservationResponse = await reservationService.getUserReservations({
            cursoId: id,
            estado: ['pendiente', 'confirmada']
          });
          
          if (reservationResponse.data.data.length > 0) {
            setUserReservation(reservationResponse.data.data[0]);
          }
        } catch (error) {
          console.log('Usuario no tiene reserva para este curso');
        }
      }
    } catch (error) {
      console.error('Error cargando curso:', error);
      toast.error('Error al cargar los detalles del curso');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await reservationService.createReservation({
        cursoId: course._id,
        ...reservationData
      });
      
      setUserReservation(response.data.data);
      setShowReservationModal(false);
      toast.success('Reserva creada exitosamente');
      
      // Recargar detalles del curso para actualizar cupos
      await loadCourseDetails();
    } catch (error) {
      console.error('Error creando reserva:', error);
      toast.error(error.response?.data?.message || 'Error al crear la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!userReservation) return;

    try {
      await reservationService.cancelReservation(userReservation._id, 'Cancelada por el usuario');
      setUserReservation(null);
      toast.success('Reserva cancelada exitosamente');
      
      // Recargar detalles del curso para actualizar cupos
      await loadCourseDetails();
    } catch (error) {
      console.error('Error cancelando reserva:', error);
      toast.error('Error al cancelar la reserva');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (estado) => {
    const variants = {
      'activo': 'success',
      'inactivo': 'secondary',
      'completado': 'info',
      'cancelado': 'danger'
    };
    
    const labels = {
      'activo': 'Activo',
      'inactivo': 'Inactivo',
      'completado': 'Completado',
      'cancelado': 'Cancelado'
    };

    return <Badge bg={variants[estado]}>{labels[estado]}</Badge>;
  };

  const getModalidadBadge = (modalidad) => {
    const variants = {
      'presencial': 'primary',
      'virtual': 'info',
      'hibrido': 'warning'
    };
    
    const labels = {
      'presencial': 'Presencial',
      'virtual': 'Virtual',
      'hibrido': 'Híbrido'
    };

    return <Badge bg={variants[modalidad]}>{labels[modalidad]}</Badge>;
  };

  const canReserve = () => {
    if (!course) return false;
    return course.estado === 'activo' && 
           course.cupoDisponible > 0 && 
           new Date(course.fechaInicio) > new Date();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!course) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <FaExclamationTriangle className="me-2" />
          Curso no encontrado
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/courses')}
            className="mb-3"
          >
            <FaArrowLeft className="me-1" />
            Volver a Cursos
          </Button>
          
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h1 className="mb-2">{course.titulo}</h1>
              <div className="d-flex gap-2 mb-3">
                {getStatusBadge(course.estado)}
                {getModalidadBadge(course.modalidad)}
                {course.categoria && (
                  <Badge bg="secondary">{course.categoria}</Badge>
                )}
              </div>
            </div>
            
            <div className="d-flex gap-2">
              <Button variant="outline-primary" size="sm">
                <FaBookmark className="me-1" />
                Guardar
              </Button>
              <Button variant="outline-secondary" size="sm">
                <FaShare className="me-1" />
                Compartir
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        {/* Información Principal */}
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Descripción</h5>
              <p className="text-muted">{course.descripcion}</p>
              
              {course.contenido && (
                <>
                  <h5 className="mb-3 mt-4">Contenido del Curso</h5>
                  <div className="text-muted">
                    {course.contenido.split('\n').map((item, index) => (
                      <div key={index} className="mb-2">
                        <FaCheckCircle className="me-2 text-success" />
                        {item}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card.Body>
          </Card>

          {/* Información del Instructor */}
          {course.instructor && (
            <Card className="mb-4">
              <Card.Body>
                <h5 className="mb-3">
                  <FaGraduationCap className="me-2" />
                  Instructor
                </h5>
                <div className="d-flex align-items-center">
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                       style={{ width: '60px', height: '60px' }}>
                    <FaGraduationCap size={24} />
                  </div>
                  <div>
                    <h6 className="mb-1">{course.instructor}</h6>
                    <p className="text-muted mb-0">
                      Instructor especializado en {course.categoria}
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Sidebar con Información de Reserva */}
        <Col lg={4}>
          <Card className="sticky-top" style={{ top: '20px' }}>
            <Card.Body>
              <h5 className="mb-3">Información del Curso</h5>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">
                    <FaCalendarAlt className="me-2" />
                    Fechas
                  </span>
                </div>
                <p className="mb-1">
                  <strong>Inicio:</strong> {formatDate(course.fechaInicio)}
                </p>
                <p className="mb-0">
                  <strong>Fin:</strong> {formatDate(course.fechaFin)}
                </p>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">
                    <FaClock className="me-2" />
                    Duración
                  </span>
                </div>
                <p className="mb-0">{course.duracion} horas</p>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">
                    <FaUsers className="me-2" />
                    Cupos
                  </span>
                </div>
                <p className="mb-0">
                  {course.cupoDisponible} de {course.cupoMaximo} disponibles
                </p>
              </div>

              {course.ubicacion && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted">
                      <FaMapMarkerAlt className="me-2" />
                      Ubicación
                    </span>
                  </div>
                  <p className="mb-0">{course.ubicacion}</p>
                </div>
              )}

              <hr />

              {/* Precio */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="h5 mb-0">Precio</span>
                  {course.precio > 0 ? (
                    <span className="h4 text-primary mb-0">
                      <FaDollarSign className="me-1" />
                      {course.precio.toLocaleString()}
                    </span>
                  ) : (
                    <Badge bg="success" className="h5">Gratuito</Badge>
                  )}
                </div>
              </div>

              {/* Botones de Acción */}
              {isAuthenticated ? (
                userReservation ? (
                  <div>
                    <Alert variant="info" className="mb-3">
                      <FaInfoCircle className="me-2" />
                      Ya tienes una reserva para este curso
                    </Alert>
                    <Button 
                      variant="outline-danger" 
                      onClick={handleCancelReservation}
                      className="w-100"
                    >
                      <FaTimesCircle className="me-1" />
                      Cancelar Reserva
                    </Button>
                  </div>
                ) : canReserve() ? (
                  <Button 
                    variant="primary" 
                    onClick={() => setShowReservationModal(true)}
                    className="w-100"
                  >
                    <FaCheckCircle className="me-1" />
                    Reservar Curso
                  </Button>
                ) : (
                  <Alert variant="warning">
                    <FaExclamationTriangle className="me-2" />
                    {course.cupoDisponible === 0 
                      ? 'Cupo completo' 
                      : 'Las reservas no están disponibles'
                    }
                  </Alert>
                )
              ) : (
                <div>
                  <Alert variant="info" className="mb-3">
                    <FaInfoCircle className="me-2" />
                    Inicia sesión para reservar este curso
                  </Alert>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => navigate('/login')}
                    className="w-100"
                  >
                    Iniciar Sesión
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal de Reserva */}
      <Modal show={showReservationModal} onHide={() => setShowReservationModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reservar Curso</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleReservationSubmit}>
          <Modal.Body>
            <h6 className="mb-3">{course.titulo}</h6>
            
            <Form.Group className="mb-3">
              <Form.Label>Método de Pago</Form.Label>
              <Form.Select
                name="metodoPago"
                value={reservationData.metodoPago}
                onChange={(e) => setReservationData(prev => ({
                  ...prev,
                  metodoPago: e.target.value
                }))}
              >
                <option value="gratuito">Gratuito</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notas Adicionales (Opcional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notas"
                value={reservationData.notas}
                onChange={(e) => setReservationData(prev => ({
                  ...prev,
                  notas: e.target.value
                }))}
                placeholder="Comentarios o requerimientos especiales..."
              />
            </Form.Group>

            <Alert variant="info">
              <FaInfoCircle className="me-2" />
              Al confirmar la reserva, se te enviará un correo con los detalles del curso.
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowReservationModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? <LoadingSpinner /> : 'Confirmar Reserva'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default CourseDetail;
