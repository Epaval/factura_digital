// src/components/SupervisorFacturas.js
import React, { useState, useEffect } from "react";
import axios from "axios";

function SupervisorFacturas() {
  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [filtroCaja, setFiltroCaja] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const facturasPorPagina = 15;

  useEffect(() => {
    const cargarFacturas = async () => {
      try {
        const res = await axios.get("http://localhost:5000/facturas/todas");
        setFacturas(res.data);
      } catch (err) {
        setError("Error al cargar las facturas.");
        console.error(err);
      } finally {
        setCargando(false);
      }
    };

    cargarFacturas();
  }, []);

  // Filtrar facturas
  const facturasFiltradas = facturas.filter((f) => {
    const porEstado =
      filtroEstado === "todas" || f.estado.toLowerCase() === filtroEstado;
    const porCaja = !filtroCaja || f.caja_id == filtroCaja;
    return porEstado && porCaja;
  });

  const totalPaginas = Math.ceil(facturasFiltradas.length / facturasPorPagina);
  const indiceUltima = paginaActual * facturasPorPagina;
  const indicePrimera = indiceUltima - facturasPorPagina;
  const facturasPaginadas = facturasFiltradas.slice(indicePrimera, indiceUltima);

  if (cargando) return <p className="text-center">Cargando facturas...</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="card mt-4 shadow-sm">
      <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="bi bi-receipt me-2"></i>
          Historial de Facturas
        </h5>
      </div>

      <div className="card-body bg-light p-3">
        <div className="row g-3 mb-3">
          {/* Filtro por estado */}
          <div className="col-md-6">
            <label className="form-label fw-bold">Estado</label>
            <select
              className="form-control"
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setPaginaActual(1);
              }}
            >
              <option value="todas">Todas</option>
              <option value="pendiente">Pendientes</option>
              <option value="pagado">Pagadas</option>
              <option value="SIN PAGO">Sin Pago</option>
            </select>
          </div>

          {/* Filtro por caja */}
          <div className="col-md-6">
            <label className="form-label fw-bold">Caja</label>
            <select
              className="form-control"
              value={filtroCaja}
              onChange={(e) => {
                setFiltroCaja(e.target.value);
                setPaginaActual(1);
              }}
            >
              <option value="">Todas las cajas</option>
              {[...new Set(facturas.map(f => f.caja_id))].sort().map(cajaId => (
                <option key={cajaId} value={cajaId}>Caja {cajaId}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover table-striped mb-0">
          <thead className="table-dark">
            <tr>
              <th>N° Factura</th>
              <th>Cliente</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Caja</th>
              <th>Cajero</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {facturasPaginadas.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center text-muted py-4">
                  No hay facturas que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              facturasPaginadas.map((f) => (
                <tr key={f.id}>
                  <td><strong>{String(f.numero_factura).padStart(7, "0")}</strong></td>
                  <td>{f.cliente_nombre}</td>
                  <td>Bs.{parseFloat(f.total).toFixed(2)}</td>
                  <td>
                    <span
                      className={`badge ${
                        f.estado === "pagado"
                          ? "bg-success"
                          : f.estado === "SIN PAGO"
                          ? "bg-secondary"
                          : "bg-warning text-dark"
                      }`}
                    >
                      {f.estado === "SIN PAGO" ? "SIN PAGO" : f.estado}
                    </span>
                  </td>
                  <td>Caja {f.caja_id}</td>
                  <td>{f.empleado_nombre} {f.empleado_apellido}</td>
                  <td>{new Date(f.fecha).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="card-footer d-flex justify-content-between align-items-center">
          <small>
            Página {paginaActual} de {totalPaginas}
          </small>
          <div className="btn-group">
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setPaginaActual(Math.max(paginaActual - 1, 1))}
              disabled={paginaActual === 1}
            >
              « Anterior
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setPaginaActual(Math.min(paginaActual + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
            >
              Siguiente »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupervisorFacturas;