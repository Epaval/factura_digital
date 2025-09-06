import React from 'react';
import { FaTrashAlt, FaPlus, FaMinus, FaBox } from 'react-icons/fa';

const ProductosTable = ({ selectedProducts, handleCantidadChange, handleEliminarProducto }) => {
  // Cálculos de totales
  const subtotal = selectedProducts.reduce(
    (sum, p) => sum + p.precio * p.cantidadSeleccionada,
    0
  );
  const iva = subtotal * 0.16;
  const totalConIva = subtotal + iva;

  if (selectedProducts.length === 0) {
    return (
      <div className="mt-4 text-center p-5 bg-light rounded">
        <FaBox size={50} className="text-muted mb-3" />
        <h5 className="text-muted">No hay productos en la factura</h5>
        <p className="text-secondary">Agrega productos desde el buscador.</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="table-responsive shadow-sm rounded">
        <table className="table table-hover align-middle mb-0">
          <thead className="bg-primary text-white">
            <tr>
              <th className="text-center" style={{ width: '10%' }}>Código</th>
              <th style={{ width: '30%' }}>Descripción</th>
              <th className="text-center" style={{ width: '15%' }}>Cantidad</th>
              <th className="text-end" style={{ width: '15%' }}>Precio</th>
              <th className="text-end" style={{ width: '15%' }}>Subtotal</th>
              <th className="text-center" style={{ width: '15%' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {selectedProducts.map((producto, index) => (
              <tr key={index} className="align-middle">
                <td className="text-center fw-bold text-primary">{producto.codigo}</td>
                <td>
                  <strong>{producto.descripcion}</strong>
                </td>
                <td className="text-center">
                  <div className="d-flex align-items-center justify-content-center">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary me-1"
                      onClick={() =>
                        handleCantidadChange(index, Math.max(1, producto.cantidadSeleccionada - 1))
                      }
                      disabled={producto.cantidadSeleccionada <= 1}
                    >
                      <FaMinus size={12} />
                    </button>
                    <input
                      type="number"
                      value={producto.cantidadSeleccionada}
                      onChange={(e) =>
                        handleCantidadChange(index, parseInt(e.target.value) || 1)
                      }
                      min="1"
                      className="form-control form-control-sm text-center px-2 py-1"
                      style={{ width: '60px' }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary ms-1"
                      onClick={() =>
                        handleCantidadChange(index, producto.cantidadSeleccionada + 1)
                      }
                    >
                      <FaPlus size={12} />
                    </button>
                  </div>
                </td>
                <td className="text-end">Bs.{producto.precio?.toFixed(2)}</td>
                <td className="text-end fw-bold">
                  Bs.{(producto.precio * producto.cantidadSeleccionada).toFixed(2)}
                </td>
                <td className="text-center">
                  <button
                    className="btn btn-danger btn-sm px-2 py-1"
                    onClick={() => handleEliminarProducto(index)}
                    title="Eliminar producto"
                  >
                    <FaTrashAlt size={16} />
                  </button>
                </td>
              </tr>
            ))}

            {/* Totales */}
            <tr className="table-secondary fw-bold">
              <td colSpan="4" className="text-end py-3">Subtotal sin IVA:</td>
              <td className="text-end">Bs.{subtotal.toFixed(2)}</td>
              <td></td>
            </tr>
            <tr className="table-warning">
              <td colSpan="4" className="text-end py-2">IVA (16%):</td>
              <td className="text-end">Bs.{iva.toFixed(2)}</td>
              <td></td>
            </tr>
            <tr className="table-success text-white">
              <td colSpan="4" className="text-end py-3 fs-5">Total con IVA:</td>
              <td className="text-end fs-5">Bs.{totalConIva.toFixed(2)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductosTable;