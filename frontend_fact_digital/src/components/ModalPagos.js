// src/components/ModalPagos.js
import React, { useState, useEffect } from "react";
import axios from "axios";

function ModalPagos({ show, onClose, facturaId, totalFactura, onPagoRegistrado }) {
  const [metodosPago, setMetodosPago] = useState([]);
  const [pago, setPago] = useState({
    metodo_pago_id: "",
    monto: "",
    referencia: "",
  });
  const [pagos, setPagos] = useState([]);
  const [totalPagado, setTotalPagado] = useState(0);
  const [error, setError] = useState("");
  const [dollarRate] = useState(30); // Usa tasa desde App.js

  const metodoSeleccionado = metodosPago.find(m => m.id === parseInt(pago.metodo_pago_id));

  useEffect(() => {
    if (!show) return;

    const cargar = async () => {
      try {
        const res = await axios.get("http://localhost:5000/metodos-pago");
        setMetodosPago(res.data);
      } catch (err) {
        setError("Error al cargar métodos de pago.");
      }
    };

    const cargarPagos = async () => {
      if (!facturaId) return;
      try {
        const res = await axios.get(`http://localhost:5000/pagos/factura/${facturaId}`);
        setPagos(res.data);
        const total = res.data.reduce((sum, p) => sum + parseFloat(p.monto), 0);
        setTotalPagado(total);
      } catch (err) {
        console.error("Error al cargar pagos:", err);
      }
    };

    cargar();
    cargarPagos();
  }, [show, facturaId]);

  const handleChange = (e) => {
    setPago({ ...pago, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!facturaId) {
      setError("Factura no válida.");
      return;
    }

    const montoIngresado = parseFloat(pago.monto);
    if (isNaN(montoIngresado) || montoIngresado <= 0) {
      setError("Monto inválido.");
      return;
    }

    const metodo_pago_id = parseInt(pago.metodo_pago_id);
    if (isNaN(metodo_pago_id) || !metodosPago.some(m => m.id === metodo_pago_id)) {
      setError("Método de pago inválido.");
      return;
    }

    const metodo = metodosPago.find(m => m.id === metodo_pago_id);

    if (!metodo.nombre.includes("Efectivo") && (!pago.referencia || pago.referencia.trim() === "")) {
      setError("Referencia obligatoria para este método.");
      return;
    }

    const montoEnBs = metodo.nombre === "Efectivo $" ? montoIngresado * dollarRate : montoIngresado;

    try {
      const res = await axios.post("http://localhost:5000/pagos", {
        factura_id: facturaId,
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
      onPagoRegistrado?.(nuevoPago);
    } catch (err) {
      setError(err.response?.data?.message || "Error al registrar pago.");
    }
  };

  // Calcular diferencia
  const diferencia = totalPagado - totalFactura;
  const esVuelto = diferencia > 0;
  const mostrarDiferencia = Math.abs(diferencia) > 0;

  const puedeGenerarFactura = totalPagado >= totalFactura;

  if (!show) return null;

  return (
    <div className="modal show" style={{ display: "block", backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow-lg border-0">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="bi bi-cash-stack me-2"></i>
              Registrar Pagos
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            {/* === RESUMEN VISUAL === */}
            <div className="row g-3 mb-4 text-center">
              <div className="col-md-4">
                <div className="p-3 border rounded bg-light">
                  <small className="text-muted">Total Factura</small>
                  <h5 className="mb-0 mt-2 text-dark fw-bold">
                    Bs.{totalFactura.toFixed(2)}
                  </h5>
                </div>
              </div>

              <div className="col-md-4">
                <div className={`p-3 border rounded ${totalPagado >= totalFactura ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                  <small>Total Pagado</small>
                  <h5 className="mb-0 mt-2 fw-bold">
                    Bs.{totalPagado.toFixed(2)}
                  </h5>
                </div>
              </div>

              <div className="col-md-4">
                {esVuelto ? (
                  <div className="p-3 border rounded bg-info text-white">
                    <small>Vuelto al cliente</small>
                    <h5 className="mb-0 mt-2 fw-bold">
                      Bs.{diferencia.toFixed(2)}
                    </h5>
                  </div>
                ) : (
                  <div className="p-3 border rounded bg-warning text-dark">
                    <small>Falta por pagar</small>
                    <h5 className="mb-0 mt-2 fw-bold">
                      Bs.{(-diferencia).toFixed(2)}
                    </h5>
                  </div>
                )}
              </div>
            </div>

            {/* Mensaje de estado */}
            {puedeGenerarFactura ? (
              <div className="alert alert-success text-center mb-4">
                <strong>✅ Pago completo. Listo para generar factura.</strong>
              </div>
            ) : (
              <div className="alert alert-light text-center mb-4">
                <small>Registre pagos hasta cubrir el total.</small>
              </div>
            )}

            {error && <div className="alert alert-danger">{error}</div>}

            {/* Formulario */}
            <form onSubmit={handleSubmit}>
              <div className="row g-3 mb-3">
                <div className="col-md-5">
                  <label><strong>Método de Pago</strong></label>
                  <select
                    className="form-control"
                    name="metodo_pago_id"
                    value={pago.metodo_pago_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar método</option>
                    {metodosPago.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label><strong>Monto</strong></label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    name="monto"
                    value={pago.monto}
                    onChange={handleChange}
                    placeholder={metodoSeleccionado?.nombre === "Efectivo $" ? "En dólares ($)" : "En bolívares (Bs)"}
                    required
                  />
                </div>

                <div className="col-md-3 d-flex align-items-end">
                  <button type="submit" className="btn btn-primary btn-lg w-100">
                    +
                  </button>
                </div>
              </div>

              {/* Referencia (si aplica) */}
              {metodoSeleccionado && !metodoSeleccionado.nombre.includes("Efectivo") && (
                <div className="mb-3">
                  <label><strong>Referencia</strong></label>
                  <input
                    type="text"
                    className="form-control"
                    name="referencia"
                    value={pago.referencia}
                    onChange={handleChange}
                    placeholder="Número de transferencia, tarjeta, etc."
                  />
                </div>
              )}

              {/* Conversión Efectivo $ */}
              {metodoSeleccionado?.nombre === "Efectivo $" && pago.monto && (
                <div className="alert alert-info">
                  <small>
                    💵 <strong>${pago.monto}</strong> → 
                    <strong> Bs.{(parseFloat(pago.monto) * dollarRate).toFixed(2)}</strong>
                  </small>
                </div>
              )}
            </form>

            {/* Historial */}
            {pagos.length > 0 && (
              <div className="mt-4">
                <h6 className="text-primary">
                  <i className="bi bi-clock-history me-1"></i>
                  Historial de Pagos
                </h6>
                <table className="table table-striped table-sm">
                  <thead className="table-dark">
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
          </div>

          <div className="modal-footer">
            {puedeGenerarFactura && (
              <button className="btn btn-success px-4" onClick={onClose}>
                ✅ Cerrar y Generar Factura
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalPagos;