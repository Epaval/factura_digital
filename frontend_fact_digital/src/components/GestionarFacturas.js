// src/components/GestionarFacturas.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import ModalConfirmacion from "./ModalConfirmacion"; // Importa el nuevo modal

function GestionarFacturas() {
  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [totalPagado, setTotalPagado] = useState(0);
  const [dollarRate] = useState(30);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [paginaActual, setPaginaActual] = useState(1);
  const facturasPorPagina = 10;

  // Estado para el modal de confirmación
  const [mostrarModalConfirm, setMostrarModalConfirm] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState(null); // { facturaId, nuevoEstado }

  useEffect(() => {
    cargarFacturas();
  }, []);

  const cargarFacturas = async () => {
    try {
      const res = await axios.get("http://localhost:5000/facturas");
      setFacturas(res.data);
    } catch (err) {
      setError("Error al cargar facturas.");
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  // Facturas por estado
  const facturasPendientes = facturas.filter((f) => f.estado === "pendiente");
  const facturasPagadas = facturas.filter((f) => f.estado === "pagado");
  const facturasAnuladas = facturas.filter((f) => f.estado === "anulado");

  // Calcular totales y conteos
  const totalPendientes = facturasPendientes.reduce(
    (sum, f) => sum + parseFloat(f.total),
    0
  );
  const totalPagados = facturasPagadas.reduce(
    (sum, f) => sum + parseFloat(f.total),
    0
  );
  const totalAnulados = facturasAnuladas.reduce(
    (sum, f) => sum + parseFloat(f.total),
    0
  );

  const countPendientes = facturasPendientes.length;
  const countPagadas = facturasPagadas.length;
  const countAnuladas = facturasAnuladas.length;

  // Facturas filtradas
  const facturasFiltradas =
    filtroEstado === "todas"
      ? facturas
      : facturas.filter((f) => f.estado === filtroEstado);

  // Paginación
  const indiceUltima = paginaActual * facturasPorPagina;
  const indicePrimera = indiceUltima - facturasPorPagina;
  const facturasPaginadas = facturasFiltradas.slice(
    indicePrimera,
    indiceUltima
  );
  const totalPaginas = Math.ceil(facturasFiltradas.length / facturasPorPagina);
  // Función para cerrar pago (marcar como pagada)
  const prepararCerrarPago = (facturaId) => {
    setAccionPendiente({ facturaId, nuevoEstado: "pagado" });
    setMostrarModalConfirm(true);
  };

  const cargarDetallesFactura = async (factura) => {
    setFacturaSeleccionada(factura);
    try {
      const res = await axios.get(
        `http://localhost:5000/pagos/factura/${factura.id}`
      );
      setPagos(res.data);
      const total = res.data.reduce((sum, p) => sum + parseFloat(p.monto), 0);
      setTotalPagado(total);
    } catch (err) {
      console.error("Error al cargar pagos:", err);
    }
  };

  const cerrarDetalles = () => {
    setFacturaSeleccionada(null);
    setPagos([]);
    setTotalPagado(0);
    setPaginaActual(1);
  };

  // Preparar la acción de anulación
  const prepararAnulacion = (facturaId) => {
    const factura = facturas.find((f) => f.id === facturaId);
    setAccionPendiente({ facturaId, nuevoEstado: "anulado" });
    setMostrarModalConfirm(true);
  };

  // Confirmar la acción
  const confirmarAccion = async () => {
    const { facturaId, nuevoEstado } = accionPendiente;

    try {
      await axios.put(`http://localhost:5000/facturas/${facturaId}/estado`, {
        estado: nuevoEstado,
      });
      setFacturas((prev) =>
        prev.map((f) =>
          f.id === facturaId ? { ...f, estado: nuevoEstado } : f
        )
      );
      if (facturaSeleccionada?.id === facturaId) {
        setFacturaSeleccionada((prev) => ({ ...prev, estado: nuevoEstado }));
      }
    } catch (err) {
      alert(
        `Error al actualizar estado: ${
          err.response?.data?.message || "Verifique conexión."
        }`
      );
    } finally {
      setMostrarModalConfirm(false);
      setAccionPendiente(null);
    }
  };

  const cancelarAccion = () => {
    setMostrarModalConfirm(false);
    setAccionPendiente(null);
  };

  // Registrar pago
  const [pago, setPago] = useState({
    metodo_pago_id: "",
    monto: "",
    referencia: "",
  });
  const [metodosPago, setMetodosPago] = useState([]);
  const [errorPago, setErrorPago] = useState("");

  useEffect(() => {
    if (facturaSeleccionada) {
      axios
        .get("http://localhost:5000/metodos-pago")
        .then((res) => setMetodosPago(res.data))
        .catch(() => setErrorPago("No se cargaron métodos de pago"));
    }
  }, [facturaSeleccionada]);

  const handleRegistrarPago = async (e) => {
    e.preventDefault();
    setErrorPago("");

    const montoIngresado = parseFloat(pago.monto);
    if (isNaN(montoIngresado) || montoIngresado <= 0) {
      return setErrorPago("Monto inválido.");
    }

    const metodo_pago_id = parseInt(pago.metodo_pago_id);
    if (isNaN(metodo_pago_id)) {
      return setErrorPago("Método de pago inválido.");
    }

    const metodo = metodosPago.find((m) => m.id === metodo_pago_id);
    if (
      !metodo.nombre.includes("Efectivo") &&
      (!pago.referencia || !pago.referencia.trim())
    ) {
      return setErrorPago("La referencia es obligatoria para este método.");
    }

    const montoEnBs =
      metodo.nombre === "Efectivo $"
        ? montoIngresado * dollarRate
        : montoIngresado;

    try {
      const res = await axios.post("http://localhost:5000/pagos", {
        factura_id: facturaSeleccionada.id,
        metodo_pago_id,
        monto: montoEnBs,
        referencia: pago.referencia || null,
      });

      const nuevoPago = {
        ...res.data,
        metodo_pago: metodo.nombre,
        fecha: new Date().toISOString(),
      };

      setPagos((prev) => [...prev, nuevoPago]);
      setTotalPagado((prev) => prev + montoEnBs);
      setPago({ metodo_pago_id: "", monto: "", referencia: "" });
    } catch (err) {
      setErrorPago(err.response?.data?.message || "Error al registrar pago.");
    }
  };

  const puedeCerrarPago = totalPagado >= facturaSeleccionada?.total;

  if (cargando) return <p>Cargando facturas...</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="card mt-4">
      <div className="card-header bg-info text-white">
        <h5>Gestión de Facturas</h5>
      </div>

      {/* Resumen de totales */}
      <div className="card-body bg-light border-bottom">
        <div className="row text-center">
          <div className="col-md-4 mb-3">
            <div className="p-3 bg-warning text-dark rounded">
              <h6>Pendientes</h6>
              <p className="h5 mb-1">
                <strong>Bs.{totalPendientes.toFixed(2)}</strong>
              </p>
              <small>
                ({countPendientes} factura{countPendientes !== 1 ? "s" : ""})
              </small>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="p-3 bg-success text-white rounded">
              <h6>Pagadas</h6>
              <p className="h5 mb-1">
                <strong>Bs.{totalPagados.toFixed(2)}</strong>
              </p>
              <small>
                ({countPagadas} factura{countPagadas !== 1 ? "s" : ""})
              </small>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="p-3 bg-danger text-white rounded">
              <h6>Anuladas</h6>
              <p className="h5 mb-1">
                <strong>Bs.{totalAnulados.toFixed(2)}</strong>
              </p>
              <small>
                ({countAnuladas} factura{countAnuladas !== 1 ? "s" : ""})
              </small>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="d-flex justify-content-center mb-3">
          <div className="btn-group">
            <button
              className={`btn ${
                filtroEstado === "todas" ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => {
                setFiltroEstado("todas");
                setPaginaActual(1);
              }}
            >
              Todas
            </button>
            <button
              className={`btn ${
                filtroEstado === "pendiente"
                  ? "btn-primary"
                  : "btn-outline-primary"
              }`}
              onClick={() => {
                setFiltroEstado("pendiente");
                setPaginaActual(1);
              }}
            >
              Pendientes
            </button>
            <button
              className={`btn ${
                filtroEstado === "pagado"
                  ? "btn-primary"
                  : "btn-outline-primary"
              }`}
              onClick={() => {
                setFiltroEstado("pagado");
                setPaginaActual(1);
              }}
            >
              Pagadas
            </button>
            <button
              className={`btn ${
                filtroEstado === "anulado"
                  ? "btn-primary"
                  : "btn-outline-primary"
              }`}
              onClick={() => {
                setFiltroEstado("anulado");
                setPaginaActual(1);
              }}
            >
              Anuladas
            </button>
          </div>
        </div>
      </div>

      {/* Lista de facturas */}
      {!facturaSeleccionada ? (
        <div className="card-body">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>N° Factura</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {facturasPaginadas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center">
                    No hay facturas en esta categoría.
                  </td>
                </tr>
              ) : (
                facturasPaginadas.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <strong>
                        {String(f.numero_factura).padStart(7, "0")}
                      </strong>
                    </td>
                    <td>{f.cliente_nombre}</td>
                    <td>{new Date(f.fecha).toLocaleDateString()}</td>
                    <td>Bs.{parseFloat(f.total).toFixed(2)}</td>
                    <td>
                      <span
                        className={`badge ${
                          f.estado === "pagado"
                            ? "bg-success"
                            : f.estado === "anulado"
                            ? "bg-danger"
                            : "bg-warning text-dark"
                        }`}
                      >
                        {f.estado.charAt(0).toUpperCase() + f.estado.slice(1)}
                      </span>
                    </td>
                    <td>
                      {f.estado === "pendiente" && (
                        <>
                          <button
                            className="btn btn-success btn-sm me-2"
                            onClick={() => cargarDetallesFactura(f)}
                          >
                            💳 Cerrar Pago
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => prepararAnulacion(f.id)}
                          >
                            🚫 Anular
                          </button>
                        </>
                      )}
                      {f.estado === "pagado" && (
                        <button className="btn btn-sm btn-secondary disabled">
                          Pagada
                        </button>
                      )}
                      {f.estado === "anulado" && (
                        <small className="text-muted">Anulada</small>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Paginador */}
          {totalPaginas > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                <small>
                  Página {paginaActual} de {totalPaginas}
                </small>
              </div>
              <div className="btn-group">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() =>
                    setPaginaActual((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={paginaActual === 1}
                >
                  « Anterior
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() =>
                    setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))
                  }
                  disabled={paginaActual === totalPaginas}
                >
                  Siguiente »
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Vista detallada para cerrar pago */
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4>
              Factura #
              {String(facturaSeleccionada.numero_factura).padStart(7, "0")}
            </h4>
            <button className="btn btn-secondary" onClick={cerrarDetalles}>
              ← Volver
            </button>
          </div>

          <div className="row mb-4">
            <div className="col-md-6">
              <h6>Cliente:</h6>
              <p>
                <strong>{facturaSeleccionada.cliente_nombre}</strong>
                <br />
                {facturaSeleccionada.tipo_rif}-{facturaSeleccionada.numero_rif}
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <h6>Total:</h6>
              <p className="h4 text-success">
                Bs.{parseFloat(facturaSeleccionada.total).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Formulario de pagos */}
          <div className="border rounded p-3 mb-4">
            <h5>Registrar Pago</h5>
            {errorPago && <div className="alert alert-danger">{errorPago}</div>}
            <form onSubmit={handleRegistrarPago}>
              <div className="row g-2 mb-3">
                <div className="col-4">
                  <select
                    className="form-control"
                    value={pago.metodo_pago_id}
                    onChange={(e) =>
                      setPago({ ...pago, metodo_pago_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Método</option>
                    {metodosPago.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-3">
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    placeholder="Monto"
                    value={pago.monto}
                    onChange={(e) =>
                      setPago({ ...pago, monto: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="col-4">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Referencia (opcional)"
                    value={pago.referencia}
                    onChange={(e) =>
                      setPago({ ...pago, referencia: e.target.value })
                    }
                  />
                </div>
                <div className="col-1 d-flex align-items-end">
                  <button type="submit" className="btn btn-primary w-100">
                    +
                  </button>
                </div>
              </div>
            </form>

            <p>
              <strong>Total pagado:</strong> Bs.{totalPagado.toFixed(2)}
            </p>
            {totalPagado < facturaSeleccionada.total && (
              <p className="text-warning">
                <strong>
                  Falta: Bs.
                  {(facturaSeleccionada.total - totalPagado).toFixed(2)}
                </strong>
              </p>
            )}
            {puedeCerrarPago && (
              <div className="alert alert-success">
                ✅ El pago está completo. Puede cerrar la factura.
              </div>
            )}
          </div>

          {/* Historial de pagos */}
          {pagos.length > 0 && (
            <div className="mb-4">
              <h6>Historial de Pagos</h6>
              <table className="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th>Método</th>
                    <th>Monto (Bs)</th>
                    <th>Referencia</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((p, i) => (
                    <tr key={i}>
                      <td>{p.metodo_pago}</td>
                      <td>Bs.{parseFloat(p.monto).toFixed(2)}</td>
                      <td>{p.referencia || "-"}</td>
                      <td>{new Date(p.fecha).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Botón para cerrar pago */}
          {puedeCerrarPago && (
            <div className="text-end">
              <button
                className="btn btn-success btn-lg"
                onClick={() => prepararCerrarPago(facturaSeleccionada.id)}
              >
                ✅ Marcar como Pagada
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmación */}
      <ModalConfirmacion
        show={mostrarModalConfirm}
        titulo={
          accionPendiente?.nuevoEstado === "anulado"
            ? "¿Anular esta factura?"
            : "¿Marcar como pagada?"
        }
        mensaje={
          accionPendiente?.nuevoEstado === "anulado"
            ? "Estás a punto de anular una factura. Esta acción no se puede deshacer."
            : "¿Deseas marcar esta factura como pagada?"
        }
        onConfirmar={confirmarAccion}
        onCancel={cancelarAccion}
      />
    </div>
  );
}

export default GestionarFacturas;
