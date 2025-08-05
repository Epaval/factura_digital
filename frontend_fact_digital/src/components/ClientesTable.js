import React from "react";

const ClientesTable = ({ selectedCliente, onEditarCliente }) => {
  if (!selectedCliente) return null;

  return (
    <div className="mt-4">
      <table className="table table-bordered table-striped w-100">
        <thead>
          <tr>
            <th className="text-center">Nombre</th>
            <th className="text-center">Tipo RIF</th>
            <th className="text-center">Número RIF</th>
            <th className="text-center">Correo</th>
            <th className="text-center">Operador</th>
            <th className="text-center">Teléfono</th>
            <th className="text-center">Dirección</th>
            <th className="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr className="text-center">
            <td>{selectedCliente.nombre}</td>
            <td>{selectedCliente.tipo_rif}</td>
            <td>{selectedCliente.numero_rif}</td>
            <td>{selectedCliente.correo}</td>
            <td>{selectedCliente.operador}</td>
            <td>{selectedCliente.telefono}</td>
            <td>{selectedCliente.direccion}</td>
            <td>
              <button
                className="btn btn-warning btn-sm"
                onClick={() => onEditarCliente(selectedCliente)}
              >
                Editar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ClientesTable;