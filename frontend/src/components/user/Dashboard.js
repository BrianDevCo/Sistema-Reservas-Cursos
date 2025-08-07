import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { courseService, reservationService } from '../../services/api';
import { toast } from 'react-toastify';
import { 
  FaGraduationCap, 
  FaCalendarAlt, 
  FaClock, 
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaUser,
  FaChartLine
} from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReservations: 0,
    activeReservations: 0,
    completedCourses: 0,
    upcomingCourses: 0
  });
  const [recentReservations, setRecentReservations] = useState([]);
  const [upcomingCourses, setUpcomingCourses] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar reservas del usuario
      const reservationsResponse = await reservationService.getUserReservations({ limit: 5 });
      const reservations = reservationsResponse.data.data;
      setRecentReservations(reservations);

      // Calcular estadísticas
      const totalReservations = reservations.length;
      const activeReservations = reservations.filter(r => 
        ['pendiente', 'confirmada'].includes(r.estado)
      ).length;
      const completedCourses = reservations.filter(r => r.estado === 'completada').length;
      const upcomingCourses = reservations.filter(r => 
        ['pendiente', 'confirmada'].includes(r.estado) && 
        new Date(r.curso.fechaInicio) > new Date()
      ).length;

      setStats({
        totalReservations,
        activeReservations,
        completedCourses,
        upcomingCourses
      });

      // Cargar cursos próximos
      const coursesResponse = await courseService.getActiveCourses();
      const allCourses = coursesResponse.data.data;
      const userReservationIds = reservations
        .filter(r => ['pendiente', 'confirmada'].includes(r.estado))
        .map(r => r.curso._id);
      
      const availableCourses = allCourses
        .filter(course => !userReservationIds.includes(course._id))
        .slice(0, 3);
      
      setUpcomingCourses(availableCourses);

    } catch (error) {
      console.error('Error cargando dashboard:', error);
      toast.error('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (estado) => {
    const variants = {
      'pendiente': 'warning',
      'confirmada': 'success',
      'cancelada': 'danger',
      'completada': 'info'
    };
    
    const labels = {
      'pendiente': 'Pendiente',
      'confirmada': 'Confirmada',
      'cancelada': 'Cancelada',
      'completada': 'Completada'
    };

    return <Badge bg={variants[estado]}>{labels[estado]}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="mb-3">
            <FaUser className="me-2" />
            Bienvenido, {user?.nombre}
          </h1>
          <p className="text-muted">
            Aquí puedes ver un resumen de tus actividades y cursos disponibles.
          </p>
        </Col>
      </Row>

      {/* Estadísticas */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FaGraduationCap size={30} className="text-primary mb-2" />
              <h4>{stats.totalReservations}</h4>
              <p className="text-muted mb-0">Total Reservas</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FaClock size={30} className="text-warning mb-2" />
              <h4>{stats.activeReservations}</h4>
              <p className="text-muted mb-0">Reservas Activas</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FaCheckCircle size={30} className="text-success mb-2" />
              <h4>{stats.completedCourses}</h4>
              <p className="text-muted mb-0">Cursos Completados</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FaCalendarAlt size={30} className="text-info mb-2" />
              <h4>{stats.upcomingCourses}</h4>
              <p className="text-muted mb-0">Próximos Cursos</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Reservas Recientes */}
        <Col lg={8} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <FaGraduationCap className="me-2" />
                Mis Reservas Recientes
              </h5>
            </Card.Header>
            <Card.Body>
              {recentReservations.length === 0 ? (
                <Alert variant="info">
                  <FaExclamationTriangle className="me-2" />
                  No tienes reservas aún. 
                  <Link to="/courses" className="ms-2">Explora nuestros cursos</Link>
                </Alert>
              ) : (
                <div>
                  {recentReservations.map((reservation) => (
                    <div key={reservation._id} className="border-bottom py-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">{reservation.curso.titulo}</h6>
                          <p className="text-muted mb-1">
                            <FaCalendarAlt className="me-1" />
                            {formatDate(reservation.curso.fechaInicio)} - {formatDate(reservation.curso.fechaFin)}
                          </p>
                          <small className="text-muted">
                            Reservado el: {formatDate(reservation.fechaReserva)}
                          </small>
                        </div>
                        <div className="text-end">
                          {getStatusBadge(reservation.estado)}
                          <br />
                          <small className="text-muted">
                            {reservation.curso.modalidad}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-center mt-3">
                    <Button as={Link} to="/reservations" variant="outline-primary">
                      Ver Todas las Reservas
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Cursos Disponibles */}
        <Col lg={4} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <FaChartLine className="me-2" />
                Cursos Recomendados
              </h5>
            </Card.Header>
            <Card.Body>
              {upcomingCourses.length === 0 ? (
                <Alert variant="info">
                  <FaExclamationTriangle className="me-2" />
                  No hay cursos disponibles en este momento.
                </Alert>
              ) : (
                <div>
                  {upcomingCourses.map((course) => (
                    <div key={course._id} className="border-bottom py-2">
                      <h6 className="mb-1">{course.titulo}</h6>
                      <p className="text-muted mb-1 small">
                        {formatDate(course.fechaInicio)} - {formatDate(course.fechaFin)}
                      </p>
                      <div className="d-flex justify-content-between align-items-center">
                        <Badge bg="success">
                          {course.cupoDisponible} cupos disponibles
                        </Badge>
                        <Button 
                          as={Link} 
                          to={`/courses/${course._id}`} 
                          size="sm" 
                          variant="outline-primary"
                        >
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="text-center mt-3">
                    <Button as={Link} to="/courses" variant="outline-primary">
                      Ver Todos los Cursos
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
