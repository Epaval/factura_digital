import React, { useState, useRef, useEffect } from 'react';
import { FaUser, FaSearch, FaBuilding, FaPhone, FaEnvelope, FaCheck, FaTimes, FaUserPlus } from 'react-icons/fa';

const ClientesSelect = ({ clientes, onAddCliente }) => {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const inputRef = useRef(null);

  // Enfocar el input al abrir el modal
  useEffect(() => {
    if (mostrarModal && inputRef.current) {
      const timer = setTimeout(() => inputRef.current.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [mostrarModal]);

  // Filtrar clientes dinámicamente
  const clientesFiltrados = clientes.filter(cliente => {
    if (!cliente) return false;
    const texto = busqueda.toLowerCase().trim();
    if (!texto) return false;
    return (
      cliente.numero_rif?.toLowerCase().includes(texto) ||
      cliente.nombre?.toLowerCase().includes(texto) ||
      cliente.telefono?.toLowerCase().includes(texto) ||
      `${cliente.tipo_rif}${cliente.numero_rif}`.toLowerCase().includes(texto)
    );
  });

  // Seleccionar automáticamente si hay un solo resultado
  useEffect(() => {
    if (busqueda && clientesFiltrados.length === 1) {
      setClienteSeleccionado(clientesFiltrados[0]);
    } else if (clientesFiltrados.length === 0) {
      setClienteSeleccionado(null);
    }
  }, [busqueda, clientesFiltrados]);

  // Manejar selección
  const handleSeleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setBusqueda(`${cliente.tipo_rif}-${cliente.numero_rif}`);
  };

  // Agregar cliente al formulario principal
  const handleAgregarCliente = () => {
    if (clienteSeleccionado) {
      onAddCliente(clienteSeleccionado);
      handleCloseModal();
    }
  };

  // Cerrar modal y limpiar estado
  const handleCloseModal = () => {
    setMostrarModal(false);
    setBusqueda('');
    setClienteSeleccionado(null);
  };

  return (
    <div className="clientes-select mt-4">
      <h2 className="text-center mb-3 d-flex align-items-center justify-content-center gap-2">
        <FaUser /> Clientes
      </h2>
      <div className="text-center">
        <button
          className="btn btn-primary btn-lg d-flex align-items-center justify-content-center gap-2 mx-auto"
          style={{ minWidth: '280px' }}
          onClick={() => setMostrarModal(true)}
        >
          <FaUserPlus /> Agregar Cliente
        </button>
      </div>

      {/* Modal de búsqueda */}
      {mostrarModal && (
        <div
          className="modal show"
          style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
              <div className="modal-header bg-gradient text-white d-flex align-items-center" style={{ background: 'linear-gradient(45deg, #007bff, #0056b3)' }}>
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <FaSearch /> Buscar Cliente
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white ms-auto"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="modal-body p-4">
                {/* Campo de búsqueda */}
                <div className="mb-4">
                  <label className="form-label">
                    <strong><FaSearch className="me-1" /> Búsqueda rápida</strong>
                    <small className="text-white-50 ms-2">por RIF, CI, nombre o teléfono</small>
                  </label>
                  <div className="input-group input-group-lg">
                    <span className="input-group-text bg-light text-primary">
                      <FaSearch />
                    </span>
                    <input
                      ref={inputRef}
                      type="text"
                      className="form-control form-control-lg shadow-sm"
                      value={busqueda}
                      onChange={(e) => {
                        setBusqueda(e.target.value);
                        setClienteSeleccionado(null);
                      }}
                      placeholder="Ej: J12345678, Ana Pérez, 04141234567"
                      autoFocus
                    />
                    {busqueda && (
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setBusqueda('')}
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                </div>

                {/* Resultados de búsqueda */}
                {busqueda && clientesFiltrados.length > 0 ? (
                  <div className="list-group mb-3 max-h-300">
                    {clientesFiltrados.slice(0, 10).map((cliente) => (
                      <button
                        key={cliente.id}
                        type="button"
                        className={`list-group-item list-group-item-action d-flex align-items-start p-3 ${
                          clienteSeleccionado?.id === cliente.id ? 'active bg-primary text-white' : ''
                        }`}
                        onClick={() => handleSeleccionarCliente(cliente)}
                      >
                        <div className="me-3 mt-1">
                          <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                            <FaUser className="text-primary" size={18} />
                          </div>
                        </div>
                        <div className="flex-grow-1 text-start">
                          <strong>{cliente.nombre}</strong>
                          <div className="text-muted small mt-1">
                            <FaBuilding className="me-1" /> {cliente.tipo_rif}-{cliente.numero_rif} | <FaPhone className="me-1" /> {cliente.telefono}
                          </div>
                          <div className="text-muted small">
                            <FaEnvelope className="me-1" /> {cliente.correo}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : busqueda && clientesFiltrados.length === 0 ? (
                  <div className="alert alert-warning text-center mb-0">
                    <strong>🔍 No se encontraron clientes.</strong>
                    <br />
                    <small>Verifique el RIF, CI o nombre.</small>
                  </div>
                ) : (
                  <div className="text-muted text-center py-4">
                    <em>Escribe para buscar clientes...</em>
                  </div>
                )}

                {/* Cliente seleccionado */}
                {clienteSeleccionado && (
                  <div className="mt-3 p-3 bg-light border rounded-3">
                    <h6 className="mb-1 d-flex align-items-center">
                      <FaCheck className="text-success me-2" /> Cliente seleccionado:
                    </h6>
                    <p className="mb-0 small">
                      <strong>{clienteSeleccionado.nombre}</strong>
                      <br />
                      <span className="text-muted">
                        <strong>RIF:</strong> {clienteSeleccionado.tipo_rif}-{clienteSeleccionado.numero_rif} | 
                        <strong> Teléfono:</strong> {clienteSeleccionado.telefono}
                      </span>
                      <br />
                      <span className="text-muted">
                        <strong>Email:</strong> {clienteSeleccionado.correo}
                      </span>
                    </p>
                  </div>
                )}
              </div>
              <div className="modal-footer bg-light d-flex justify-content-between py-3">
                <button
                  type="button"
                  className="btn btn-secondary px-4"
                  onClick={handleCloseModal}
                >
                  <FaTimes className="me-1" /> Cerrar
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-lg px-4 d-flex align-items-center gap-2"
                  disabled={!clienteSeleccionado}
                  onClick={handleAgregarCliente}
                >
                  <FaCheck /> Agregar Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientesSelect;