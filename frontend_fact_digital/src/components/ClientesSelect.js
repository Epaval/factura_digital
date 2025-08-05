import React, { useState } from 'react';

const ClientesSelect = ({ clientes, onAddCliente }) => {
    const [mostrarModal, setMostrarModal] = useState(false); // Estado para mostrar/ocultar el modal
    const [rifBusqueda, setRifBusqueda] = useState(''); // Estado para almacenar el número de RIF de búsqueda
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null); // Estado para el cliente seleccionado
    const [busquedaRealizada, setBusquedaRealizada] = useState(false); // Estado para controlar si se ha realizado una búsqueda

    // Función para manejar el clic en "Agregar Cliente"
    const handleAgregarClick = () => {
        setMostrarModal(true); // Mostrar el modal
    };

    // Función para manejar la búsqueda por número de RIF
    const handleBuscarCliente = () => {
        const clienteEncontrado = clientes.find(
            (cliente) => cliente.numero_rif === rifBusqueda
        );
        setClienteSeleccionado(clienteEncontrado);
        setBusquedaRealizada(true);
        setRifBusqueda("");
    };

    // Función para agregar el cliente seleccionado
    const handleAgregarCliente = () => {
        if (clienteSeleccionado) {
            onAddCliente(clienteSeleccionado); // Llamar a la función proporcionada por el componente padre
            setMostrarModal(false); // Ocultar el modal
            setRifBusqueda(''); // Limpiar el campo de búsqueda
            setClienteSeleccionado(null); // Limpiar el cliente seleccionado
            setBusquedaRealizada(false); // Reiniciar el estado de búsqueda
        }
    };

    return (
        <div>
            <h2>Clientes</h2>
            <button className="btn btn-primary" onClick={handleAgregarClick}>
                Agregar Cliente
            </button>

            {/* Modal para buscar cliente por número de RIF */}
            {mostrarModal && (
                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">Buscar Cliente por RIF o C.I</h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setMostrarModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label htmlFor="rifBusqueda" className="form-label">Número de RIF</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="rifBusqueda"
                                        value={rifBusqueda}
                                        onChange={(e) => setRifBusqueda(e.target.value)}
                                        placeholder="Ej: 12345678"
                                    />
                                </div>
                                <button className="btn btn-primary w-100 mb-3" onClick={handleBuscarCliente}>
                                    Buscar
                                </button>
                                {clienteSeleccionado && (
                                    <div className="mt-3 p-3 bg-light rounded">
                                        <p className="h5"><strong>Cliente:</strong></p>
                                        <p>
                                            {clienteSeleccionado.nombre} - {clienteSeleccionado.tipo_rif}-{clienteSeleccionado.numero_rif}
                                            <br />
                                            <strong>Teléfono:</strong> {clienteSeleccionado.telefono}
                                        </p>
                                        <button className="btn btn-success w-100" onClick={handleAgregarCliente}>
                                            Agregar Cliente
                                        </button>
                                    </div>
                                )}
                                {!clienteSeleccionado && busquedaRealizada && (
                                    <div className="mt-3 p-3 bg-light rounded">
                                        <p className="text-danger">No se encontró ningún cliente con ese número de RIF.</p>
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
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientesSelect;