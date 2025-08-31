// src/components/ClientesSelect.js
import React, { useState } from 'react';

const ClientesSelect = ({ clientes, onAddCliente }) => {
    const [mostrarModal, setMostrarModal] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

    // Filtrar clientes dinámicamente por RIF, CI, nombre, teléfono, etc.
    const clientesFiltrados = clientes.filter(cliente => {
        const textoBusqueda = busqueda.toLowerCase();
        return (
            cliente.numero_rif?.toLowerCase().includes(textoBusqueda) ||
            cliente.nombre?.toLowerCase().includes(textoBusqueda) ||
            cliente.telefono?.toLowerCase().includes(textoBusqueda) ||
            (cliente.tipo_rif + cliente.numero_rif)?.toLowerCase().includes(textoBusqueda)
        );
    });

    // Manejar selección de cliente con clic
    const handleSeleccionarCliente = (cliente) => {
        setClienteSeleccionado(cliente);
        setBusqueda(`${cliente.tipo_rif}-${cliente.numero_rif}`);
    };

    // Agregar cliente al formulario principal
    const handleAgregarCliente = () => {
        if (clienteSeleccionado) {
            onAddCliente(clienteSeleccionado);
            setMostrarModal(false);
            setBusqueda('');
            setClienteSeleccionado(null);
        }
    };

    return (
        <div>
            <h2>Clientes</h2>
            <button className="btn btn-primary" onClick={() => setMostrarModal(true)}>
                Agregar Cliente
            </button>

            {/* Modal de búsqueda dinámica */}
            {mostrarModal && (
                <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0.5)' }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content shadow-lg">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">Buscar Cliente por RIF, C.I, Nombre o Teléfono</h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setMostrarModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {/* Campo de búsqueda dinámica */}
                                <div className="mb-3">
                                    <label htmlFor="busquedaCliente" className="form-label">Buscar Cliente</label>
                                    <input
                                        type="text"
                                        id="busquedaCliente"
                                        className="form-control form-control-lg"
                                        value={busqueda}
                                        onChange={(e) => {
                                            setBusqueda(e.target.value);
                                            setClienteSeleccionado(null); // Reiniciar selección
                                        }}
                                        placeholder="Escribe para buscar por RIF, CI, nombre o teléfono..."
                                        autoFocus
                                    />
                                </div>

                                {/* Resultados de búsqueda */}
                                {busqueda && clientesFiltrados.length > 0 ? (
                                    <div className="list-group mb-3 max-h-300">
                                        {clientesFiltrados.slice(0, 10).map((cliente) => (
                                            <button
                                                key={cliente.id}
                                                type="button"
                                                className={`list-group-item list-group-item-action p-3 ${
                                                    clienteSeleccionado?.id === cliente.id ? 'active' : ''
                                                }`}
                                                onClick={() => handleSeleccionarCliente(cliente)}
                                            >
                                                <div className="d-flex justify-content-between">
                                                    <div>
                                                        <strong>{cliente.nombre}</strong>
                                                        <br />
                                                        <small>
                                                            {cliente.tipo_rif}-{cliente.numero_rif} | {cliente.telefono}
                                                        </small>
                                                    </div>
                                                    <div className="text-end">
                                                        <small>{cliente.correo}</small>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : busqueda && clientesFiltrados.length === 0 ? (
                                    <div className="alert alert-warning">
                                        No se encontraron clientes que coincidan con la búsqueda.
                                    </div>
                                ) : (
                                    <div className="text-muted">
                                        <em>Escribe para comenzar a buscar...</em>
                                    </div>
                                )}

                                {/* Cliente seleccionado */}
                                {clienteSeleccionado && (
                                    <div className="mt-3 p-3 bg-success text-white rounded">
                                        <h6>✅ Cliente seleccionado:</h6>
                                        <p className="mb-0">
                                            <strong>{clienteSeleccionado.nombre}</strong><br />
                                            {clienteSeleccionado.tipo_rif}-{clienteSeleccionado.numero_rif} | {clienteSeleccionado.telefono}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setMostrarModal(false)}
                                >
                                    Cerrar
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    disabled={!clienteSeleccionado}
                                    onClick={handleAgregarCliente}
                                >
                                    Agregar Cliente
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