// src/components/ProductosSelect.js
import React, { useState } from "react";

const ProductosSelect = ({ productos, onAddProduct }) => {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  // Filtrar productos dinámicamente
  const productosFiltrados = productos.filter((producto) => {
    const texto = busqueda.toLowerCase();
    return (
      producto.codigo?.toString().toLowerCase().includes(texto) ||
      producto.descripcion?.toLowerCase().includes(texto) ||
      producto.precio?.toString().includes(texto)
    );
  });

  // Manejar selección con clic
  const handleSeleccionarProducto = (producto) => {
    setProductoSeleccionado(producto);
    setBusqueda(`${producto.codigo} - ${producto.descripcion}`);
  };

  // Agregar producto al formulario principal
  const handleAgregarProducto = () => {
    if (productoSeleccionado) {
      onAddProduct(productoSeleccionado);
      setMostrarModal(false);
      setBusqueda("");
      setProductoSeleccionado(null);
    }
  };

  return (
    <div className="card p-3 shadow-sm mt-4">
      <h2 className="card-title text-center mb-3">Productos</h2>
      <button
        className="btn btn-primary w-100"
        onClick={() => setMostrarModal(true)}
      >
        Buscar y Agregar Producto
      </button>

      {/* Modal de búsqueda dinámica */}
      {mostrarModal && (
        <div
          className="modal show"
          style={{ display: "block", backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">Buscar Producto</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setMostrarModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Campo de búsqueda */}
                <div className="mb-3">
                  <label htmlFor="busquedaProducto" className="form-label">
                    Buscar por código, descripción o precio
                  </label>
                  <input
                    type="text"
                    id="busquedaProducto"
                    className="form-control form-control-lg"
                    value={busqueda}
                    onChange={(e) => {
                      setBusqueda(e.target.value);
                      setProductoSeleccionado(null);
                    }}
                    placeholder="Ej: Lápiz, 1020, 1.50"
                    autoFocus
                  />
                </div>

                {/* Resultados de búsqueda */}
                {busqueda && productosFiltrados.length > 0 ? (
                  <div className="list-group mb-3 max-h-300">
                    {productosFiltrados.slice(0, 10).map((producto) => (
                      <button
                        key={producto.id}
                        type="button"
                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3 ${
                          productoSeleccionado?.id === producto.id
                            ? "active"
                            : ""
                        }`}
                        onClick={() => handleSeleccionarProducto(producto)}
                      >
                        <div>
                          <strong>{producto.descripcion}</strong>
                          <br />
                          <small className="text-muted">
                            Código: {producto.codigo}
                          </small>
                        </div>
                        <span className="badge bg-primary fs-6">
                          Bs.{producto.precio.toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : busqueda && productosFiltrados.length === 0 ? (
                  <div className="alert alert-warning">
                    No se encontraron productos que coincidan.
                  </div>
                ) : (
                  <div className="text-muted text-center py-3">
                    <em>Escribe para buscar productos...</em>
                  </div>
                )}

                {/* Producto seleccionado */}
                {productoSeleccionado && (
                  <div className="mt-3 p-3 bg-success text-white rounded">
                    <h6>✅ Producto seleccionado:</h6>
                    <p className="mb-0">
                      <strong>{productoSeleccionado.descripcion}</strong>
                      <br />
                      Código: {productoSeleccionado.codigo} |{" "}
                      Precio: Bs.{productoSeleccionado.precio.toFixed(2)}
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
                  disabled={!productoSeleccionado}
                  onClick={handleAgregarProducto}
                >
                  Agregar Producto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosSelect;