import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { courseService, reservationService, userService } from '../../services/api';
import { toast } from 'react-toastify';
import { 
  FaGraduationCap, 
  FaUsers, 
  FaCalendarAlt, 
  FaChartLine,
  FaCog,
  FaUserCog,
  FaClipboardList,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaDollarSign,
  FaEye
} from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    totalUsers: 0,
    totalReservations: 0,
    pendingReservations: 0,
    confirmedReservations: 0,
    completedReservations: 0,
    totalRevenue: 0
  });
  const [recentReservations, setRecentReservations] = useState([]);
  const [recentCourses, setRecentCourses] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar estadísticas generales
      const [coursesResponse, usersResponse, reservationsResponse] = await Promise.all([
        courseService.getCourses({ limit: 1000 }),
        userService.getUsers({ limit: 1000 }),
        reservationService.getAllReservations({ limit: 1000 })
      ]);

      const courses = coursesResponse.data.data;
      const users = usersResponse.data.data;
      const reservations = reservationsResponse.data.data;

      // Calcular estadísticas
      const totalCourses = courses.length;
      const activeCourses = courses.filter(c => c.estado === 'activo').length;
      const totalUsers = users.length;
      const totalReservations = reservations.length;
      const pendingReservations = reservations.filter(r => r.estado === 'pendiente').length;
      const confirmedReservations = reservations.filter(r => r.estado === 'confirmada').length;
      const completedReservations = reservations.filter(r => r.estado === 'completada').length;
      const totalRevenue = reservations
        .filter(r => r.precioPagado > 0)
        .reduce((sum, r) => sum + r.precioPagado, 0);

      setStats({
        totalCourses,
        activeCourses,
        totalUsers,
        totalReservations,
        pendingReservations,
        confirmedReservations,
        completedReservations,
        totalRevenue
      });

      // Cargar reservas recientes
      const recentReservationsResponse = await reservationService.getAllReservations({ 
        limit: 5,
        sort: '-fechaReserva'
      });
      setRecentReservations(recentReservationsResponse.data.data);

      // Cargar cursos recientes
      const recentCoursesResponse = await courseService.getCourses({ 
        limit: 5,
        sort: '-fechaCreacion'
      });
      setRecentCourses(recentCoursesResponse.data.data);

    } catch (error) {
      console.error('Error cargando dashboard:', error);
      toast.error('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="mb-3">
            <FaCog className="me-2" />
            Panel de Administración
          </h1>
          <p className="text-muted">
            Bienvenido, {user?.nombre}. Aquí puedes gestionar todos los aspectos del sistema.
          </p>
        </Col>
      </Row>

      {/* Estadísticas Principales */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FaGraduationCap size={30} className="text-primary mb-2" />
              <h4>{stats.totalCourses}</h4>
              <p className="text-muted mb-0">Total Cursos</p>
              <small className="text-success">
                {stats.activeCourses} activos
              </small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FaUsers size={30} className="text-info mb-2" />
              <h4>{stats.totalUsers}</h4>
              <p className="text-muted mb-0">Usuarios Registrados</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FaCalendarAlt size={30} className="text-success mb-2" />
              <h4>{stats.totalReservations}</h4>
              <p className="text-muted mb-0">Total Reservas</p>
              <small className="text-warning">
                {stats.pendingReservations} pendientes
              </small>
            </Card.Body>
          </Card>
        
        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FaDollarSign size={30} className="text-success mb-2" />
              <h4>{formatCurrency(stats.totalRevenue)}</h4>
              <p className="text-muted mb-0">Ingresos Totales</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Acciones Rápidas */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <FaCog className="me-2" />
                Acciones Rápidas
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="mb-3">
                  <Button 
                    as={Link} 
                    to="/admin/courses" 
                    variant="outline-primary" 
                    className="w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                    style={{ minHeight: '100px' }}
                  >
                    <FaGraduationCap size={24} className="mb-2" />
                    Gestionar Cursos
                  </Button>
                </Col>
                
                <Col md={3} className="mb-3">
                  <Button 
                    as={Link} 
                    to="/admin/users" 
                    variant="outline-info" 
                    className="w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                    style={{ minHeight: '100px' }}
                  >
                    <FaUserCog size={24} className="mb-2" />
                    Gestionar Usuarios
                  </Button>
                </Col>
                
                <Col md={3} className="mb-3">
                  <Button 
                    as={Link} 
                    to="/admin/reservations" 
                    variant="outline-success" 
                    className="w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                    style={{ minHeight: '100px' }}
                  >
                    <FaClipboardList size={24} className="mb-2" />
                    Gestionar Reservas
                  </Button>
                </Col>
                
                <Col md={3} className="mb-3">
                  <Button 
                    as={Link} 
                    to="/courses" 
                    variant="outline-secondary" 
                    className="w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                    style={{ minHeight: '100px' }}
                  >
                    <FaEye size={24} className="mb-2" />
                    Ver Cursos
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Reservas Recientes */}
        <Col lg={8} className="mb-4">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaCalendarAlt className="me-2" />
                Reservas Recientes
              </h5>
              <Button as={Link} to="/admin/reservations" variant="outline-primary" size="sm">
                Ver Todas
              </Button>
            </Card.Header>
            <Card.Body>
              {recentReservations.length === 0 ? (
                <Alert variant="info">
                  <FaExclamationTriangle className="me-2" />
                  No hay reservas recientes.
                </Alert>
              ) : (
                <div>
                  {recentReservations.map((reservation) => (
                    <div key={reservation._id} className="border-bottom py-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">{reservation.curso.titulo}</h6>
                          <p className="text-muted mb-1">
                            {reservation.usuario.nombre} - {reservation.usuario.correo}
                          </p>
                          <small className="text-muted">
                            Reservado el: {formatDate(reservation.fechaReserva)}
                          </small>
                        </div>
                        <div className="text-end">
                          {getStatusBadge(reservation.estado)}
                          <br />
                          <small className="text-muted">
                            {reservation.precioPagado > 0 
                              ? formatCurrency(reservation.precioPagado)
                              : 'Gratuito'
                            }
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Cursos Recientes */}
        <Col lg={4} className="mb-4">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaGraduationCap className="me-2" />
                Cursos Recientes
              </h5>
              <Button as={Link} to="/admin/courses" variant="outline-primary" size="sm">
                Ver Todos
              </Button>
            </Card.Header>
            <Card.Body>
              {recentCourses.length === 0 ? (
                <Alert variant="info">
                  <FaExclamationTriangle className="me-2" />
                  No hay cursos recientes.
                </Alert>
              ) : (
                <div>
                  {recentCourses.map((course) => (
                    <div key={course._id} className="border-bottom py-2">
                      <h6 className="mb-1">{course.titulo}</h6>
                      <p className="text-muted mb-1 small">
                        {formatDate(course.fechaInicio)} - {formatDate(course.fechaFin)}
                      </p>
                      <div className="d-flex justify-content-between align-items-center">
                        <Badge bg="success">
                          {course.cupoDisponible}/{course.cupoMaximo} cupos
                        </Badge>
                        <Button 
                          as={Link} 
                          to={`/admin/courses/${course._id}`} 
                          size="sm" 
                          variant="outline-primary"
                        >
                          <FaEye className="me-1" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Alertas y Notificaciones */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <FaExclamationTriangle className="me-2" />
                Alertas del Sistema
              </h5>
            </Card.Header>
            <Card.Body>
              {stats.pendingReservations > 0 && (
                <Alert variant="warning" className="mb-3">
                  <FaClock className="me-2" />
                  Tienes <strong>{stats.pendingReservations}</strong> reservas pendientes de confirmación.
                  <Button 
                    as={Link} 
                    to="/admin/reservations?estado=pendiente" 
                    variant="outline-warning" 
                    size="sm" 
                    className="ms-3"
                  >
                    Revisar
                  </Button>
                </Alert>
              )}
              
              {stats.activeCourses === 0 && (
                <Alert variant="info" className="mb-3">
                  <FaGraduationCap className="me-2" />
                  No hay cursos activos en este momento.
                  <Button 
                    as={Link} 
                    to="/admin/courses" 
                    variant="outline-info" 
                    size="sm" 
                    className="ms-3"
                  >
                    Crear Curso
                  </Button>
                </Alert>
              )}
              
              {stats.totalUsers === 0 && (
                <Alert variant="info">
                  <FaUsers className="me-2" />
                  No hay usuarios registrados en el sistema.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;
