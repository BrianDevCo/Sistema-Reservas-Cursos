import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, InputGroup, Pagination } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { courseService } from '../../services/api';
import { toast } from 'react-toastify';
import { 
  FaSearch, 
  FaFilter, 
  FaCalendarAlt, 
  FaUsers, 
  FaMapMarkerAlt,
  FaClock,
  FaGraduationCap,
  FaStar,
  FaEye
} from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    categoria: '',
    modalidad: '',
    estado: 'activo',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadCourses();
  }, [filters, pagination.page]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      const response = await courseService.getCourses(params);
      setCourses(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (error) {
      console.error('Error cargando cursos:', error);
      toast.error('Error al cargar los cursos');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      categoria: '',
      modalidad: '',
      estado: 'activo',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  const renderPagination = () => {
    const items = [];
    const { page, pages } = pagination;

    // Botón anterior
    items.push(
      <Pagination.Prev
        key="prev"
        disabled={page === 1}
        onClick={() => setPagination(prev => ({ ...prev, page: page - 1 }))}
      />
    );

    // Páginas
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === page}
          onClick={() => setPagination(prev => ({ ...prev, page: i }))}
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
        onClick={() => setPagination(prev => ({ ...prev, page: page + 1 }))}
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
            <FaGraduationCap className="me-2" />
            Cursos Disponibles
          </h1>
          <p className="text-muted">
            Explora nuestra amplia variedad de cursos y encuentra el que mejor se adapte a tus necesidades.
          </p>
        </Col>
      </Row>

      {/* Filtros */}
      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Buscar</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      name="search"
                      value={filters.search}
                      onChange={handleFilterChange}
                      placeholder="Buscar por título o descripción..."
                    />
                    <Button type="submit" variant="outline-secondary">
                      <FaSearch />
                    </Button>
                  </InputGroup>
                </Form.Group>
              </Col>
              
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>Categoría</Form.Label>
                  <Form.Select
                    name="categoria"
                    value={filters.categoria}
                    onChange={handleFilterChange}
                  >
                    <option value="">Todas</option>
                    <option value="tecnologia">Tecnología</option>
                    <option value="negocios">Negocios</option>
                    <option value="arte">Arte</option>
                    <option value="salud">Salud</option>
                    <option value="educacion">Educación</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>Modalidad</Form.Label>
                  <Form.Select
                    name="modalidad"
                    value={filters.modalidad}
                    onChange={handleFilterChange}
                  >
                    <option value="">Todas</option>
                    <option value="presencial">Presencial</option>
                    <option value="virtual">Virtual</option>
                    <option value="hibrido">Híbrido</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>Estado</Form.Label>
                  <Form.Select
                    name="estado"
                    value={filters.estado}
                    onChange={handleFilterChange}
                  >
                    <option value="activo">Activos</option>
                    <option value="inactivo">Inactivos</option>
                    <option value="completado">Completados</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={2} className="d-flex align-items-end">
                <Button 
                  variant="outline-secondary" 
                  onClick={clearFilters}
                  className="w-100"
                >
                  <FaFilter className="me-1" />
                  Limpiar
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Lista de Cursos */}
      {courses.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <FaGraduationCap size={50} className="text-muted mb-3" />
            <h5>No se encontraron cursos</h5>
            <p className="text-muted">
              No hay cursos disponibles con los filtros seleccionados.
            </p>
            <Button variant="outline-primary" onClick={clearFilters}>
              Ver Todos los Cursos
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row>
            {courses.map((course) => (
              <Col lg={4} md={6} className="mb-4" key={course._id}>
                <Card className="h-100 course-card">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title mb-0">{course.titulo}</h5>
                      {getStatusBadge(course.estado)}
                    </div>
                    
                    <p className="text-muted small mb-3">
                      {course.descripcion.length > 100 
                        ? `${course.descripcion.substring(0, 100)}...` 
                        : course.descripcion
                      }
                    </p>
                    
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted">
                          <FaCalendarAlt className="me-1" />
                          {formatDate(course.fechaInicio)} - {formatDate(course.fechaFin)}
                        </small>
                        {getModalidadBadge(course.modalidad)}
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted">
                          <FaUsers className="me-1" />
                          {course.cupoDisponible}/{course.cupoMaximo} cupos
                        </small>
                        <small className="text-muted">
                          <FaClock className="me-1" />
                          {course.duracion} horas
                        </small>
                      </div>
                      
                      {course.instructor && (
                        <small className="text-muted d-block">
                          <FaGraduationCap className="me-1" />
                          {course.instructor}
                        </small>
                      )}
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        {course.precio > 0 ? (
                          <span className="h5 text-primary mb-0">
                            ${course.precio.toLocaleString()}
                          </span>
                        ) : (
                          <Badge bg="success">Gratuito</Badge>
                        )}
                      </div>
                      
                      <Button
                        as={Link}
                        to={`/courses/${course._id}`}
                        variant="outline-primary"
                        size="sm"
                      >
                        <FaEye className="me-1" />
                        Ver Detalles
                      </Button>
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
    </Container>
  );
};

export default CourseList;
