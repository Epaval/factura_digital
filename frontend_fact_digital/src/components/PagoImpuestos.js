// src/components/PagoImpuestos.js
import React, { useState, useEffect } from "react";

function PagoImpuestos() {
  const [impuestos, setImpuestos] = useState([]); // Todos los impuestos
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [filtroFactura, setFiltroFactura] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const impuestosPorPagina = 6;

  useEffect(() => {
    const cargarImpuestos = async () => {
      try {
        const res = await fetch("http://localhost:5000/impuestos/pendientes");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();

        if (Array.isArray(data)) {
          setImpuestos(data);
        } else {
          console.error("La respuesta no es un array:", data);
          setImpuestos([]);
        }
      } catch (err) {
        console.error("Error al cargar impuestos:", err);
        setImpuestos([]);
      } finally {
        setCargando(false);
      }
    };
    cargarImpuestos();
  }, []);

  // Aplicar filtros
  const impuestosFiltrados = Array.isArray(impuestos)
    ? impuestos.filter((i) => {
        return (
          (filtroFactura === "" || i.numero_factura?.toLowerCase().includes(filtroFactura.toLowerCase())) &&
          (filtroCliente === "" || i.cliente_nombre?.toLowerCase().includes(filtroCliente.toLowerCase())) &&
          (filtroFecha === "" || i.fecha_registro?.startsWith(filtroFecha))
        );
      })
    : [];

  // Paginación
  const indiceFinal = paginaActual * impuestosPorPagina;
  const indiceInicial = indiceFinal - impuestosPorPagina;
  const impuestosPaginados = impuestosFiltrados.slice(indiceInicial, indiceFinal);
  const totalPaginas = Math.ceil(impuestosFiltrados.length / impuestosPorPagina);

  // Funciones de selección
  const toggleSeleccion = (id) => {
    const newSeleccionados = new Set(seleccionados);
    if (newSeleccionados.has(id)) {
      newSeleccionados.delete(id);
    } else {
      newSeleccionados.add(id);
    }
    setSeleccionados(newSeleccionados);
  };

  const seleccionarTodos = () => {
    if (seleccionados.size === impuestosPaginados.length && impuestosPaginados.length > 0) {
      setSeleccionados(new Set());
    } else {
      const nuevos = new Set(impuestosPaginados.map(i => i.id));
      setSeleccionados(nuevos);
    }
  };

  

const pagarImpuestos = async () => {
  if (seleccionados.size === 0) return;

  // Mostrar modal de confirmación
  setMostrarConfirmacion(true);
};

const confirmarPago = async () => {
  setMostrarConfirmacion(false);

  try {
    const res = await fetch("http://localhost:5000/impuestos/pagar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ impuestoIds: Array.from(seleccionados) }),
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      // Actualizar estado local
      setImpuestos(prev =>
        prev.map(i =>
          seleccionados.has(i.id)
            ? { ...i, estado: 'pagado', fecha_pago: new Date().toISOString() }
            : i
        )
      );
      setSeleccionados(new Set());
      setPaginaActual(1);
    } else {
      alert("Error: " + data.message);
    }
  } catch (err) {
    alert("Error de conexión con el servidor.");
  }
};

  // ✅ Cálculo seguro del total a pagar
  const getTotalPagar = () => {
    if (!Array.isArray(impuestos) || seleccionados.size === 0) return 0;

    const total = Array.from(seleccionados)
      .reduce((sum, id) => {
        const impuesto = impuestos.find(i => i.id === id);
        const monto = impuesto?.monto_iva || 0;
        return sum + (typeof monto === 'number' ? monto : parseFloat(monto) || 0);
      }, 0);

    return parseFloat(total.toFixed(2));
  };

  if (cargando) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status" />
        <p>Cargando impuestos pendientes...</p>
      </div>
    );
  }

  if (!Array.isArray(impuestos) || impuestos.length === 0) {
    return (
      <div className="alert alert-info text-center">
        No hay impuestos pendientes de pago.
      </div>
    );
  }

  return (
    <div className="pago-impuestos-container p-4">
      <h3 className="mb-4">💰 Pago de Impuestos</h3>

      {/* Filtros */}
      <div className="row mb-4 g-3">
        <div className="col-md-4">
          <label className="form-label"><strong>N° Factura</strong></label>
          <input
            type="text"
            className="form-control"
            placeholder="F-001"
            value={filtroFactura}
            onChange={(e) => {
              setFiltroFactura(e.target.value);
              setPaginaActual(1);
            }}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label"><strong>Cliente</strong></label>
          <input
            type="text"
            className="form-control"
            placeholder="Nombre del cliente"
            value={filtroCliente}
            onChange={(e) => {
              setFiltroCliente(e.target.value);
              setPaginaActual(1);
            }}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label"><strong>Fecha</strong></label>
          <input
            type="date"
            className="form-control"
            value={filtroFecha}
            onChange={(e) => {
              setFiltroFecha(e.target.value);
              setPaginaActual(1);
            }}
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="table-responsive mb-4">
        <table className="table table-hover table-bordered align-middle">
          <thead className="table-dark">
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={
                    impuestosPaginados.length > 0 &&
                    seleccionados.size > 0 &&
                    impuestosPaginados.every(i => seleccionados.has(i.id))
                  }
                  onChange={seleccionarTodos}
                />
              </th>
              <th>N° Factura</th>
              <th>Cliente</th>
              <th>Fecha Registro</th>
              <th>Impuesto (IVA 16%)</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {impuestosPaginados.length > 0 ? (
              impuestosPaginados.map((i) => (
                <tr key={i.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={seleccionados.has(i.id)}
                      onChange={() => toggleSeleccion(i.id)}
                    />
                  </td>
                  <td>{i.numero_factura}</td>
                  <td>{i.cliente_nombre}</td>
                  <td>{new Date(i.fecha_registro).toLocaleString()}</td>
                  <td className="text-end fw-bold">Bs.{parseFloat(i.monto_iva || 0).toFixed(2)}</td>
                  <td>
                    <span className="badge bg-warning">Pendiente</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-muted">
                  No hay impuestos que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginador */}
      {totalPaginas > 1 && (
        <nav className="d-flex justify-content-center mb-4">
          <ul className="pagination">
            <li className={`page-item ${paginaActual === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setPaginaActual(paginaActual - 1)}
                disabled={paginaActual === 1}
              >
                Anterior
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
                Siguiente
              </button>
            </li>
          </ul>
        </nav>
      )}

      {/* Resumen */}
      {seleccionados.size > 0 && (
        <div className="alert alert-success mb-4">
          <h5>✅ Resumen del Pago</h5>
          <p>
            <strong>Facturas seleccionadas:</strong> {seleccionados.size}
          </p>
          <p className="h4">
            <strong>Total a pagar:</strong> Bs.{getTotalPagar()}
          </p>
        </div>
      )}

      {/* Botón de pago */}
      <div className="d-flex justify-content-end">
        <button
          className="btn btn-success btn-lg px-4"
          onClick={pagarImpuestos}
          disabled={seleccionados.size === 0}
        >
          💵 Pagar Seleccionados
        </button>
      </div>
            {/* Modal de confirmación */}
      {mostrarConfirmacion && (
        <div
          className="modal"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title d-flex align-items-center">
                  💰 Confirmar Pago de Impuestos
                </h5>
              </div>
              <div className="modal-body text-center">
                <p className="fs-5">
                  ¿Está seguro de que desea marcar como <strong>pagados</strong> los siguientes impuestos?
                </p>
                <div className="bg-light p-3 rounded mb-3 text-start">
                  <p className="mb-1"><strong>Facturas seleccionadas:</strong> {seleccionados.size}</p>
                  <p className="mb-1"><strong>Total a pagar:</strong> <strong className="text-success">Bs.{getTotalPagar().toLocaleString('es-VE')}</strong></p>
                </div>
                <p className="text-muted small">
                  Esta acción no se puede deshacer. El estado de los impuestos cambiará a <strong>"pagado"</strong>.
                </p>
              </div>
              <div className="modal-footer d-flex justify-content-center gap-3">
                <button
                  type="button"
                  className="btn btn-success btn-lg px-4"
                  onClick={confirmarPago}
                >
                  ✅ Sí, Confirmar Pago
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-lg px-4"
                  onClick={() => setMostrarConfirmacion(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PagoImpuestos;