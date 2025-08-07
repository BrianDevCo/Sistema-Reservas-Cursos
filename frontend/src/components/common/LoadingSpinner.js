import React from 'react';
import { Spinner } from 'react-bootstrap';

const LoadingSpinner = ({ size = 'md', text = 'Cargando...' }) => {
  return (
    <div className="loading-spinner">
      <div className="text-center">
        <Spinner 
          animation="border" 
          variant="primary" 
          size={size}
          className="mb-3"
        />
        <p className="text-muted">{text}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
