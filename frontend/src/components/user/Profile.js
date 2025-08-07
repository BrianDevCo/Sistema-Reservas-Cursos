import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/api';
import { toast } from 'react-toastify';
import { 
  FaUser, 
  FaEnvelope, 
  FaCalendarAlt, 
  FaEdit, 
  FaSave, 
  FaTimes,
  FaShieldAlt,
  FaGraduationCap
} from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    direccion: '',
    fechaNacimiento: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        correo: user.correo || '',
        telefono: user.telefono || '',
        direccion: user.direccion || '',
        fechaNacimiento: user.fechaNacimiento ? user.fechaNacimiento.split('T')[0] : ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await userService.updateProfile(formData);
      updateUser(response.data.data);
      setEditing(false);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast.success('Contraseña actualizada correctamente');
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      toast.error(error.response?.data?.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          <h1 className="mb-4">
            <FaUser className="me-2" />
            Mi Perfil
          </h1>

          {/* Información del Usuario */}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaUser className="me-2" />
                Información Personal
              </h5>
              <Button
                variant={editing ? "outline-secondary" : "outline-primary"}
                size="sm"
                onClick={() => setEditing(!editing)}
                disabled={loading}
              >
                {editing ? <FaTimes className="me-1" /> : <FaEdit className="me-1" />}
                {editing ? 'Cancelar' : 'Editar'}
              </Button>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nombre Completo</Form.Label>
                      <Form.Control
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        disabled={!editing}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Correo Electrónico</Form.Label>
                      <Form.Control
                        type="email"
                        name="correo"
                        value={formData.correo}
                        onChange={handleInputChange}
                        disabled={!editing}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Teléfono</Form.Label>
                      <Form.Control
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        disabled={!editing}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Fecha de Nacimiento</Form.Label>
                      <Form.Control
                        type="date"
                        name="fechaNacimiento"
                        value={formData.fechaNacimiento}
                        onChange={handleInputChange}
                        disabled={!editing}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Dirección</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    disabled={!editing}
                  />
                </Form.Group>

                {editing && (
                  <div className="text-end">
                    <Button type="submit" variant="primary" disabled={loading}>
                      {loading ? <LoadingSpinner /> : <FaSave className="me-1" />}
                      Guardar Cambios
                    </Button>
                  </div>
                )}
              </Form>
            </Card.Body>
          </Card>

          {/* Información de la Cuenta */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <FaShieldAlt className="me-2" />
                Información de la Cuenta
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p><strong>Rol:</strong> 
                    <Badge bg={user.rol === 'admin' ? 'danger' : 'primary'} className="ms-2">
                      {user.rol === 'admin' ? 'Administrador' : 'Usuario'}
                    </Badge>
                  </p>
                  <p><strong>Miembro desde:</strong> {formatDate(user.fechaCreacion)}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Última actividad:</strong> {formatDate(user.ultimaActividad)}</p>
                  <p><strong>Estado:</strong> 
                    <Badge bg="success" className="ms-2">Activo</Badge>
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Cambiar Contraseña */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <FaShieldAlt className="me-2" />
                Cambiar Contraseña
              </h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handlePasswordSubmit}>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Contraseña Actual</Form.Label>
                      <Form.Control
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nueva Contraseña</Form.Label>
                      <Form.Control
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                      />
                      <Form.Text className="text-muted">
                        Mínimo 6 caracteres
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Confirmar Nueva Contraseña</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="text-end">
                  <Button type="submit" variant="warning" disabled={loading}>
                    {loading ? <LoadingSpinner /> : <FaSave className="me-1" />}
                    Cambiar Contraseña
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
