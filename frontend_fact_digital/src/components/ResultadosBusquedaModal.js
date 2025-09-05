// src/components/ResultadosBusquedaModal.js
import React, { useEffect, useRef } from "react";
import { FaBox, FaUsers, FaTimes } from "react-icons/fa";

function ResultadosBusquedaModal({ resultados, onClose, onSelectProducto, onSelectCliente }) {
  const modalRef = useRef();

  // Cerrar con clic fuera o Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const productos = resultados.filter((r) => r.tipo === "producto");
  const clientes = resultados.filter((r) => r.tipo === "cliente");

  if (resultados.length === 0) return null;

  return (
    <div className="resultados-busqueda-modal-overlay" style={{
      position: "fixed",
      top: "80px",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.1)",
      zIndex: 1050,
      display: "flex",
      justifyContent: "center",
    }}>
      <div
        ref={modalRef}
        className="bg-white rounded shadow-lg"
        style={{ width: "90%", maxWidth: "600px", maxHeight: "70vh", overflowY: "auto" }}
      >
        {/* Encabezado */}
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light">
          <h6 className="mb-0 text-primary">
            <strong>Resultados de búsqueda</strong>
          </h6>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Productos */}
        {productos.length > 0 && (
          <div className="px-3 pb-2">
            <h6 className="text-success d-flex align-items-center gap-1">
              <FaBox /> Productos
            </h6>
            <ul className="list-group list-group-flush mb-3">
              {productos.map((p) => (
                <li
                  key={`producto-${p.id}`}
                  className="list-group-item d-flex justify-content-between align-items-center py-2"
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelectProducto?.(p)}
                >
                  <div>
                    <strong>{p.descripcion}</strong>
                    <br />
                    <small className="text-muted">
                      Código: {p.codigo} | Precio: Bs.{p.precio?.toFixed(2)}
                    </small>
                  </div>
                  <span className="badge bg-primary rounded-pill">{p.cantidad}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Clientes */}
        {clientes.length > 0 && (
          <div className="px-3 pb-2">
            <h6 className="text-info d-flex align-items-center gap-1">
              <FaUsers /> Clientes
            </h6>
            <ul className="list-group list-group-flush">
              {clientes.map((c) => (
                <li
                  key={`cliente-${c.id}`}
                  className="list-group-item d-flex justify-content-between align-items-center py-2"
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelectCliente?.(c)}
                >
                  <div>
                    <strong>{c.nombre}</strong>
                    <br />
                    <small className="text-muted">RIF: {c.unidad}</small>
                  </div>
                  <span className="badge bg-info rounded-pill">Cliente</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sin resultados */}
        {resultados.length === 0 && (
          <div className="p-4 text-center text-muted">
            <p>No se encontraron coincidencias.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultadosBusquedaModal;