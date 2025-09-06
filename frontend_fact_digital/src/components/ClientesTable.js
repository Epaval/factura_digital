import React from "react";
import { FaUser, FaIdCard, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaBuilding } from "react-icons/fa";

const ClientesTable = ({ selectedCliente, onEditarCliente }) => {
  if (!selectedCliente) return null;

  return (
    <div className="mt-4">
      <div className="card shadow-sm border-0">
        <div className="card-header bg-gradient text-white d-flex align-items-center" style={{ background: "linear-gradient(45deg, #17a2b8, #138496)" }}>
          <FaUser className="me-2" /> Información del Cliente
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th><FaUser /> Nombre</th>
                <th><FaBuilding /> Tipo RIF</th>
                <th><FaIdCard /> N° RIF</th>
                <th><FaEnvelope /> Correo</th>
                <th><FaPhone /> Teléfono</th>
                <th><FaMapMarkerAlt /> Dirección</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="fw-bold">{selectedCliente.nombre}</td>
                <td>
                  <span className="badge bg-info text-white px-3 py-2 rounded-pill">
                    {selectedCliente.tipo_rif}
                  </span>
                </td>
                <td><code className="text-primary">{selectedCliente.numero_rif}</code></td>
                <td>
                  <small className="text-muted">{selectedCliente.correo || 'No registrado'}</small>
                </td>
                <td>{selectedCliente.telefono || 'No disponible'}</td>
                <td>
                  <small className="text-truncate d-block" style={{ maxWidth: '180px' }}>
                    {selectedCliente.direccion || 'No especificada'}
                  </small>
                </td>
                <td className="text-center">
                  <button
                    className="btn btn-outline-primary btn-sm px-3 py-2 d-flex align-items-center gap-1"
                    onClick={() => onEditarCliente(selectedCliente)}
                    title="Editar cliente"
                  >
                    <FaEdit size={14} /> Editar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientesTable;