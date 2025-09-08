// src/components/FormularioPagos.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaCoins,
  FaCreditCard,
  FaDollarSign,
  FaHashtag,
  FaBarcode,
  FaPlus,
  FaFileInvoice,
  FaWallet,
  FaCalendar,
  FaTrash,
  FaExclamationTriangle,
} from "react-icons/fa";

// ✅ Componente de Modal de Confirmación
function ConfirmModal({ show, title, message, onConfirm, onCancel }) {
  if (!show) return null;

  return (
    <div
      className="modal show d-block"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 1050,
        overflow: "auto",
      }}
      onClick={onCancel}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{ maxWidth: "500px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content shadow-lg border-0">
          <div className="modal-header bg-danger text-white border-0">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <FaExclamationTriangle /> {title}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onCancel}
              aria-label="Cerrar"
            ></button>
          </div>
          <div className="modal-body text-center py-4">
            <p className="text-muted">{message}</p>
            <p className="text-danger small">
              <strong>Esta acción no se puede deshacer.</strong>
            </p>
          </div>
          <div className="modal-footer border-0 d-flex justify-content-center gap-2">
            <button type="button" className="btn btn-secondary px-4" onClick={onCancel}>
              Cancelar
            </button>
            <button type="button" className="btn btn-danger px-4" onClick={onConfirm}>
              Sí, Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormularioPagos({
  totalFactura,
  dollarRate = 30,
  onGenerarFactura,
  cajaId,
  selectedCliente,
  selectedProducts,
  facturaGenerada,
  setFacturaGenerada,
}) {
  const [metodosPago, setMetodosPago] = useState([]);
  const [pago, setPago] = useState({
    metodo_pago_id: "",
    monto: "",
    referencia: "",
  });
  const [pagos, setPagos] = useState([]);
  const [totalPagado, setTotalPagado] = useState(0);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pagoAEliminar, setPagoAEliminar] = useState(null);

  const metodoSeleccionado = metodosPago.find(
    (m) => m.id === parseInt(pago.metodo_pago_id)
  );

  // Cargar métodos de pago
  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await axios.get("http://localhost:5000/metodos-pago");
        setMetodosPago(res.data);
      } catch (err) {
        setError("Error al cargar métodos de pago.");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const handleChange = (e) => {
    setPago({ ...pago, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const montoIngresado = parseFloat(pago.monto);
    if (isNaN(montoIngresado) || montoIngresado <= 0) {
      setError("Monto inválido.");
      return;
    }

    const metodo_pago_id = parseInt(pago.metodo_pago_id);
    if (isNaN(metodo_pago_id) || !metodosPago.some((m) => m.id === metodo_pago_id)) {
      setError("Método de pago inválido.");
      return;
    }

    const metodo = metodosPago.find((m) => m.id === metodo_pago_id);

    // ✅ Solo validar referencia si NO es efectivo (ni Bs ni $)
    const esEfectivo = metodo.nombre.includes("Efectivo");
    if (!esEfectivo) {
      if (!pago.referencia || pago.referencia.trim().length !== 6) {
        setError("La referencia debe tener exactamente 6 dígitos.");
        return;
      }
    }

    // Calcular monto en bolívares
    const montoEnBs = metodo.nombre === "Efectivo $" ? montoIngresado * dollarRate : montoIngresado;

    setTotalPagado((prev) => prev + montoEnBs);

    setPagos((prev) => [
      ...prev,
      {
        id: Date.now(),
        metodo_pago: metodo.nombre,
        monto: montoEnBs,
        referencia: esEfectivo ? null : pago.referencia, // No guardar referencia si es efectivo
        fecha: new Date().toISOString(),
      },
    ]);

    // Resetear formulario
    setPago({ metodo_pago_id: "", monto: "", referencia: "" });
  };

  const eliminarPago = (pagoId) => {
    setPagoAEliminar(pagoId);
    setShowConfirm(true);
  };

  const confirmarEliminacion = () => {
    const pago = pagos.find((p) => p.id === pagoAEliminar);
    setPagos((prev) => prev.filter((p) => p.id !== pagoAEliminar));
    setTotalPagado((prev) => prev - pago.monto);
    setPagoAEliminar(null);
    setShowConfirm(false);
  };

  const diferencia = totalPagado - totalFactura;
  const esVuelto = diferencia > 0;
  const puedeGenerarFactura = totalPagado >= totalFactura - 0.01;

  const manejarGenerarFactura = async () => {
    if (!puedeGenerarFactura) return;

    try {
      const facturaData = {
        cliente: selectedCliente,
        productos: selectedProducts,
        dollarRate,
        caja_id: cajaId,
        pagos: pagos.map((p) => ({
          metodo_pago_id: metodosPago.find((m) => m.nombre === p.metodo_pago)?.id,
          monto: p.monto,
          referencia: p.referencia || null,
        })),
      };

      await onGenerarFactura(facturaData);

      if (facturaGenerada) {
        window.imprimirTicketDirecto?.(facturaGenerada, selectedProducts);
      }
    } catch (err) {
      if (err.response?.status === 400 && err.response.data.productosSinStock) {
        const productosSinStock = err.response.data.productosSinStock;
        const mensajeJSX = (
          <div>
            <h5 className="text-danger mb-3">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>❌ Stock insuficiente
            </h5>
            <p>
              <strong>Los siguientes productos no tienen suficiente inventario:</strong>
            </p>
            <ul className="list-group mb-3">
              {productosSinStock.map((p) => (
                <li
                  key={p.id}
                  className="list-group-item d-flex justify-content-between align-items-center bg-light"
                >
                  <span>
                    <strong>{p.descripcion}</strong>
                  </span>
                  <span className="badge bg-danger rounded-pill">
                    Disponible: {p.disponible} | Solicitado: {p.solicitado}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-muted small">Ajuste las cantidades o elija otros productos.</p>
          </div>
        );
        window.mostrarMensajeGlobal?.(mensajeJSX);
      } else {
        setError("Error al generar la factura. Verifique los datos.");
      }
    }
  };

  if (cargando) return <p>Cargando métodos de pago...</p>;

  return (
    <div className="mt-4 p-4 border rounded bg-white shadow-sm">
      <h5 className="text-primary mb-4">Registro de Pagos</h5>

      {/* Resumen */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="p-3 text-center border rounded bg-light h-100">
            <small>Total Factura</small>
            <h4 className="mb-2 mt-2 text-dark fw-bold">Bs.{totalFactura.toFixed(2)}</h4>
            <p>💵 Monto en $. {(totalFactura / dollarRate).toFixed(2)}</p>
          </div>
        </div>
        <div className="col-md-4">
          <div
            className={`p-3 text-center border rounded h-100 ${
              puedeGenerarFactura ? "bg-success text-white" : "bg-danger text-white"
            }`}
          >
            <small>Total Pagado</small>
            <h4 className="mb-2 mt-2 fw-bold">Bs.{totalPagado.toFixed(2)}</h4>
          </div>
        </div>
        <div className="col-md-4">
          {esVuelto ? (
            <div className="p-3 text-center border rounded bg-info text-white h-100">
              <small>Vuelto</small>
              <h4 className="mb-2 mt-2 fw-bold">Bs.{diferencia.toFixed(2)}</h4>
              <p>💵 Monto en $. {(diferencia / dollarRate).toFixed(2)}</p>
            </div>
          ) : (
            <div className="p-3 text-center border rounded bg-warning text-dark h-100">
              <small>Restante</small>
              <h4 className="mb-2 mt-2 fw-bold">Bs.{(-diferencia).toFixed(2)}</h4>
              <p>💵 Monto en $. {(-diferencia / dollarRate).toFixed(2)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Mensaje de estado */}
      {puedeGenerarFactura ? (
        <div className="alert alert-success text-center mb-4">✅ Pago completo. Listo para generar factura.</div>
      ) : (
        <div className="alert alert-light text-center mb-4">Registre pagos hasta cubrir el total.</div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="row g-3 align-items-end">
          {/* Método de Pago */}
          <div className="col-12 col-md-4">
            <label className="form-label d-flex align-items-center">
              <FaCreditCard className="me-2 text-primary" /> Método de Pago
            </label>
            <select
              className="form-select"
              name="metodo_pago_id"
              value={pago.metodo_pago_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar método...</option>
              {metodosPago.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Monto */}
          <div className="col-12 col-md-3">
            <label className="form-label d-flex align-items-center">
              {metodoSeleccionado?.nombre === "Efectivo $" ? (
                <>
                  <FaDollarSign className="me-2 text-success" /> Monto ($)
                </>
              ) : (
                <>
                  <FaCoins className="me-2 text-success" /> Monto (Bs)
                </>
              )}
            </label>
            <div className="input-group">
              <span className="input-group-text">
                {metodoSeleccionado?.nombre === "Efectivo $" ? <FaDollarSign /> : <FaCoins />}
              </span>
              <input
                type="number"
                step="0.01"
                className="form-control"
                name="monto"
                value={pago.monto}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Referencia + Botón */}
          <div className="col-12 col-md-5 d-flex flex-column">
            <div className="d-flex flex-grow-1">
              <div className="flex-grow-1">
                <label className="form-label d-flex align-items-center">
                  <FaHashtag className="me-2 text-info" /> Referencia
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <FaBarcode />
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    minLength={6}
                    maxLength={6}
                    className="form-control"
                    name="referencia"
                    value={pago.referencia}
                    onChange={handleChange}
                    placeholder={
                      metodoSeleccionado?.nombre.includes("Efectivo")
                        ? "Opcional"
                        : "6 dígitos"
                    }
                    disabled={metodoSeleccionado?.nombre.includes("Efectivo")}
                  />
                </div>
              </div>
              <div className="d-flex align-self-end ms-2">
                <button
                  type="submit"
                  className="btn btn-success btn-lg d-flex align-items-center justify-content-center"
                  disabled={
                    !pago.monto ||
                    (metodoSeleccionado && 
                     !metodoSeleccionado.nombre.includes("Efectivo") && 
                     (!pago.referencia || pago.referencia.length !== 6))
                  }
                  aria-label="Agregar pago"
                >
                  <FaPlus />
                </button>
              </div>
            </div>
            {/* Mensaje de validación */}
            <div className="mt-2 mt-md-1 ms-1">
              {metodoSeleccionado && 
                !metodoSeleccionado.nombre.includes("Efectivo") && 
                pago.referencia && 
                pago.referencia.length > 0 && (
                <small
                  className={pago.referencia.length === 6 ? "text-success" : "text-danger"}
                >
                  {pago.referencia.length === 6
                    ? "✅ Válido"
                    : `⚠️ Faltan ${6 - pago.referencia.length} dígitos`}
                </small>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Historial de pagos */}
      {pagos.length > 0 && (
        <div className="mt-5">
          <h5 className="mb-3 d-flex align-items-center gap-2">
            <FaWallet className="text-primary" /> Historial de Pagos
          </h5>
          <div className="table-responsive shadow-sm">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>
                    <FaCreditCard className="me-1" /> Método
                  </th>
                  <th>
                    <FaDollarSign className="me-1" /> Monto (Bs)
                  </th>
                  <th>
                    <FaBarcode className="me-1" /> Referencia
                  </th>
                  <th>
                    <FaCalendar className="me-1" /> Fecha y Hora
                  </th>
                  <th className="text-end">Acción</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => (
                  <tr key={p.id} className="align-middle">
                    <td>
                      <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">
                        {p.metodo_pago}
                      </span>
                    </td>
                    <td>
                      <strong>Bs.{p.monto.toFixed(2)}</strong>
                    </td>
                    <td>
                      {p.referencia ? (
                        <code className="text-success">{p.referencia}</code>
                      ) : (
                        <small className="text-muted">— Sin referencia —</small>
                      )}
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(p.fecha).toLocaleDateString()} <br />
                        <span className="text-secondary">
                          {new Date(p.fecha).toLocaleTimeString()}
                        </span>
                      </small>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-danger px-3"
                        onClick={() => eliminarPago(p.id)}
                        aria-label="Eliminar pago"
                      >
                        <FaTrash size={14} /> Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-end">
            <small className="text-muted">
              Total de pagos registrados: <strong>{pagos.length}</strong>
            </small>
          </div>
        </div>
      )}

      {/* Botón para generar factura */}
      {puedeGenerarFactura && (
        <div className="mt-4 text-end">
          <button
            className="btn btn-success btn-lg px-4 py-2 d-flex align-items-center gap-2 mx-auto mx-md-0"
            onClick={manejarGenerarFactura}
          >
            <FaFileInvoice /> Generar Factura
          </button>
        </div>
      )}

      {/* Modal de confirmación */}
      <ConfirmModal
        show={showConfirm}
        title="¿Eliminar este pago?"
        message="Estás a punto de eliminar un pago registrado."
        onConfirm={confirmarEliminacion}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}

export default FormularioPagos;