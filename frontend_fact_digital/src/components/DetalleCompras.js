// src/components/DetalleCompras.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaSearch, FaBox, FaUserTie, FaCalendar, FaDollarSign } from "react-icons/fa";

function DetalleCompras() {
  const [compras, setCompras] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const comprasPorPagina = 6;
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDetalles = async () => {
      try {
        // Ruta que debe devolver: compra + proveedor + detalles + productos
        const res = await axios.get("http://localhost:5000/compras/con-detalles");
        setCompras(res.data);
      } catch (err) {
        console.error("Error al cargar detalles de compras:", err);
      } finally {
        setCargando(false);
      }
    };

    cargarDetalles();
  }, []);

  // Filtrar compras por producto (nombre o código) o proveedor
  const comprasFiltradas = compras.filter(compra =>
    compra.detalles.some(detalle =>
      detalle.producto_nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      detalle.producto_codigo.toLowerCase().includes(filtro.toLowerCase())
    ) ||
    compra.proveedor_nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  // Paginación
  const indiceUltimo = paginaActual * comprasPorPagina;
  const indicePrimero = indiceUltimo - comprasPorPagina;
  const comprasPaginadas = comprasFiltradas.slice(indicePrimero, indiceUltimo);
  const totalPaginas = Math.ceil(comprasFiltradas.length / comprasPorPagina);

  if (cargando) {
    return (
      <div className="text-center mt-4">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2">Cargando detalles de compras...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="mb-4">📦 Detalle de Compras Realizadas</h2>

      {/* Barra de búsqueda */}
      <div className="mb-4">
        <div className="input-group">
          <span className="input-group-text bg-light">
            <FaSearch />
          </span>
          <input
            type="text"
            className="form-control form-control-lg"
            placeholder="Buscar por nombre del producto, código o proveedor..."
            value={filtro}
            onChange={(e) => {
              setFiltro(e.target.value);
              setPaginaActual(1);
            }}
          />
        </div>
      </div>

      {/* Lista de compras */}
      {comprasPaginadas.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <FaBox size={48} className="mb-3" />
          <p><strong>No se encontraron compras</strong></p>
          <small>Intenta con otro término de búsqueda.</small>
        </div>
      ) : (
        comprasPaginadas.map((compra) => (
          <div key={compra.id} className="card shadow-sm mb-4 border-0">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaCalendar className="me-2 text-info" />
                {new Date(compra.fecha_compra).toLocaleDateString()}
              </h5>
              <span className="badge bg-primary">Total: Bs.{compra.total.toFixed(2)}</span>
            </div>
            <div className="card-body">
              {/* Proveedor */}
              <div className="d-flex align-items-center mb-3">
                <FaUserTie className="text-muted me-2" />
                <strong>Proveedor:</strong>
                <span className="ms-2">{compra.proveedor_nombre}</span>
              </div>

              {/* Tabla de productos */}
              <div className="table-responsive">
                <table className="table table-bordered align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Código</th>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio Compra (Bs.)</th>
                      <th>Subtotal (Bs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compra.detalles.map((detalle, index) => (
                      <tr key={index}>
                        <td><code>{detalle.producto_codigo}</code></td>
                        <td>{detalle.producto_nombre}</td>
                        <td>{detalle.cantidad}</td>
                        <td>Bs.{detalle.precio_compra.toFixed(2)}</td>
                        <td>Bs.{detalle.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Resumen */}
              <div className="text-end mt-3">
                <strong>Total de esta compra:</strong>{" "}
                <span className="text-success fs-5 fw-bold">
                  Bs.{compra.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Paginador */}
      {totalPaginas > 1 && (
        <nav className="d-flex justify-content-center mt-4">
          <ul className="pagination">
            <li className={`page-item ${paginaActual === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setPaginaActual(paginaActual - 1)}
                disabled={paginaActual === 1}
              >
                ‹ Anterior
              </button>
            </li>
            {[...Array(totalPaginas)].map((_, i) => (
              <li key={i + 1} className={`page-item ${paginaActual === i + 1 ? "active" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setPaginaActual(i + 1)}
                >
                  {i + 1}
                </button>
              </li>
            ))}
            <li className={`page-item ${paginaActual === totalPaginas ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setPaginaActual(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
              >
                Siguiente ›
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

export default DetalleCompras;