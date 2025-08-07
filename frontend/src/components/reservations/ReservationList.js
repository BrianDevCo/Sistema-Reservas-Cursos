import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Modal, Form, Pagination } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { reservationService } from '../../services/api';
import { toast } from 'react-toastify';
import { 
  FaCalendarAlt, 
  FaClock, 
  FaMapMarkerAlt,
  FaGraduationCap,
  FaTimesCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEye,
  FaFilter,
  FaStar,
  FaDollarSign,
  FaInfoCircle
} from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';

const ReservationList = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    estado: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadReservations();
  }, [filters]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const params = {
        page: filters.page,
        limit: filters.limit,
        estado: filters.estado || undefined
      };
      
      const response = await reservationService.getUserReservations(params);
      setReservations(response.data.data);
      setPagination({
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      });
    } catch (error) {
      console.error('Error cargando reservas:', error);
      toast.error('Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1
    }));
  };

  const handleCancelReservation = async () => {
    if (!selectedReservation) return;

    try {
      await reservationService.cancelReservation(selectedReservation._id, cancelReason);
      setShowCancelModal(false);
      setSelectedReservation(null);
      setCancelReason('');
      toast.success('Reserva cancelada exitosamente');
      loadReservations();
    } catch (error) {
      console.error('Error cancelando reserva:', error);
      toast.error('Error al cancelar la reserva');
    }
  };

  const openCancelModal = (reservation) => {
    setSelectedReservation(reservation);
    setShowCancelModal(true);
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

  const canCancel = (reservation) => {
    return ['pendiente', 'confirmada'].includes(reservation.estado) &&
           new Date(reservation.curso.fechaInicio) > new Date();
  };

  const canRate = (reservation) => {
    return reservation.estado === 'completada' && !reservation.calificacion;
  };

  const renderPagination = () => {
    const items = [];
    const { page, pages } = pagination;

    // Botón anterior
    items.push(
      <Pagination.Prev
        key="prev"
        disabled={page === 1}
        onClick={() => setFilters(prev => ({ ...prev, page: page - 1 }))}
      />
    );

    // Páginas
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === page}
          onClick={() => setFilters(prev => ({ ...prev, page: i }))}
        >
          {i}
        </Pagination.Item>
      );
    }

    // Botón siguiente
    items.push(
      <Pagination.Next
        key="next"
        disabled={page === pages}
        onClick={() => setFilters(prev => ({ ...prev, page: page + 1 }))}
      />
    );

    return <Pagination className="justify-content-center">{items}</Pagination>;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="mb-3">
            <FaCalendarAlt className="me-2" />
            Mis Reservas
          </h1>
          <p className="text-muted">
            Gestiona todas tus reservas de cursos y talleres.
          </p>
        </Col>
      </Row>

      {/* Filtros */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Filtrar por Estado</Form.Label>
                <Form.Select
                  name="estado"
                  value={filters.estado}
                  onChange={handleFilterChange}
                >
                  <option value="">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="confirmada">Confirmadas</option>
                  <option value="cancelada">Canceladas</option>
                  <option value="completada">Completadas</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={8} className="d-flex align-items-end">
              <div className="d-flex gap-2">
                <Badge bg="warning" className="px-3 py-2">
                  <FaClock className="me-1" />
                  Pendientes: {reservations.filter(r => r.estado === 'pendiente').length}
                </Badge>
                <Badge bg="success" className="px-3 py-2">
                  <FaCheckCircle className="me-1" />
                  Confirmadas: {reservations.filter(r => r.estado === 'confirmada').length}
                </Badge>
                <Badge bg="info" className="px-3 py-2">
                  <FaStar className="me-1" />
                  Completadas: {reservations.filter(r => r.estado === 'completada').length}
                </Badge>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Lista de Reservas */}
      {reservations.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <FaCalendarAlt size={50} className="text-muted mb-3" />
            <h5>No tienes reservas</h5>
            <p className="text-muted">
              {filters.estado 
                ? `No tienes reservas con estado "${filters.estado}"`
                : 'Aún no has realizado ninguna reserva'
              }
            </p>
            <Button as={Link} to="/courses" variant="outline-primary">
              Explorar Cursos
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row>
            {reservations.map((reservation) => (
              <Col lg={6} className="mb-4" key={reservation._id}>
                <Card className="h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="card-title mb-1">{reservation.curso.titulo}</h5>
                        <p className="text-muted mb-0">{reservation.curso.instructor}</p>
                      </div>
                      <div className="text-end">
                        {getStatusBadge(reservation.estado)}
                        <br />
                        {getModalidadBadge(reservation.curso.modalidad)}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="row">
                        <div className="col-6">
                          <small className="text-muted d-block">
                            <FaCalendarAlt className="me-1" />
                            Fechas
                          </small>
                          <small>
                            {formatDate(reservation.curso.fechaInicio)} - {formatDate(reservation.curso.fechaFin)}
                          </small>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">
                            <FaClock className="me-1" />
                            Duración
                          </small>
                          <small>{reservation.curso.duracion} horas</small>
                        </div>
                      </div>
                    </div>

                    {reservation.curso.ubicacion && (
                      <div className="mb-3">
                        <small className="text-muted d-block">
                          <FaMapMarkerAlt className="me-1" />
                          Ubicación
                        </small>
                        <small>{reservation.curso.ubicacion}</small>
                      </div>
                    )}

                    <div className="mb-3">
                      <div className="row">
                        <div className="col-6">
                          <small className="text-muted d-block">
                            <FaDollarSign className="me-1" />
                            Precio Pagado
                          </small>
                          <small>
                            {reservation.precioPagado > 0 
                              ? `$${reservation.precioPagado.toLocaleString()}`
                              : 'Gratuito'
                            }
                          </small>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">
                            <FaInfoCircle className="me-1" />
                            Método de Pago
                          </small>
                          <small className="text-capitalize">{reservation.metodoPago}</small>
                        </div>
                      </div>
                    </div>

                    {reservation.notas && (
                      <div className="mb-3">
                        <small className="text-muted d-block">Notas</small>
                        <small>{reservation.notas}</small>
                      </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        Reservado el: {formatDate(reservation.fechaReserva)}
                      </small>
                      
                      <div className="d-flex gap-2">
                        <Button
                          as={Link}
                          to={`/courses/${reservation.curso._id}`}
                          variant="outline-primary"
                          size="sm"
                        >
                          <FaEye className="me-1" />
                          Ver Curso
                        </Button>
                        
                        {canCancel(reservation) && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => openCancelModal(reservation)}
                          >
                            <FaTimesCircle className="me-1" />
                            Cancelar
                          </Button>
                        )}
                        
                        {canRate(reservation) && (
                          <Button
                            variant="outline-warning"
                            size="sm"
                          >
                            <FaStar className="me-1" />
                            Calificar
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          
          {/* Paginación */}
          {pagination.pages > 1 && (
            <Row className="mt-4">
              <Col className="text-center">
                {renderPagination()}
              </Col>
            </Row>
          )}
        </>
      )}

      {/* Modal de Cancelación */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Cancelar Reserva</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <FaExclamationTriangle className="me-2" />
            ¿Estás seguro de que quieres cancelar tu reserva para "{selectedReservation?.curso.titulo}"?
          </Alert>
          
          <Form.Group>
            <Form.Label>Motivo de Cancelación (Opcional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Explica el motivo de la cancelación..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            No Cancelar
          </Button>
          <Button variant="danger" onClick={handleCancelReservation}>
            <FaTimesCircle className="me-1" />
            Confirmar Cancelación
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ReservationList;
