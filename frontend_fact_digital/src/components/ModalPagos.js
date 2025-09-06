import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaCashRegister, FaDollarSign, FaBarcode, FaHistory, FaTimes, FaPlusCircle, FaCheckCircle } from "react-icons/fa";
import { MdArrowBack } from "react-icons/md";

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
    <>
      {/* Overlay oscuro */}
      <div
        className="fixed-top bg-dark"
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 1040,
          animation: 'fadeIn 0.3s ease-out',
        }}
        onClick={onClose}
      ></div>

      {/* Modal lateral derecho */}
      <div
        className="position-fixed top-0 end-0 h-100"
        style={{
          width: '420px',
          backgroundColor: '#fff',
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.3)',
          zIndex: 1050,
          transform: 'translateX(0)',
          transition: 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
          animation: 'slideInRight 0.4s ease-out',
        }}
      >
        <div className="d-flex flex-column h-100">
          {/* Header */}
          <div className="p-4 bg-gradient text-white d-flex align-items-center" style={{ background: 'linear-gradient(45deg, #007bff, #0056b3)' }}>
            <FaCashRegister size={28} className="me-3" />
            <h5 className="mb-0 flex-grow-1">Registrar Pagos</h5>
            <button
              type="button"
              className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '36px', height: '36px' }}
              onClick={onClose}
            >
              <FaTimes />
            </button>
          </div>

          <div className="flex-grow-1 overflow-auto p-4" style={{ backgroundColor: '#f8f9fa' }}>
            {/* Resumen visual */}
            <div className="row g-3 mb-4">
              <div className="col-12">
                <div className="p-3 rounded shadow-sm bg-white border">
                  <small className="text-muted">Total Factura</small>
                  <div className="d-flex align-items-center mt-1">
                    <FaDollarSign className="text-primary me-2" />
                    <h5 className="mb-0 text-dark fw-bold">Bs.{totalFactura.toFixed(2)}</h5>
                  </div>
                </div>
              </div>

              <div className="col-12">
                <div className={`p-3 rounded shadow-sm ${totalPagado >= totalFactura ? 'bg-success text-white' : 'bg-light text-dark'}`}>
                  <small>Total Pagado</small>
                  <div className="d-flex align-items-center mt-1">
                    <FaDollarSign className="me-2" />
                    <h5 className="mb-0 fw-bold">Bs.{totalPagado.toFixed(2)}</h5>
                  </div>
                </div>
              </div>

              {mostrarDiferencia && (
                <div className="col-12">
                  {esVuelto ? (
                    <div className="p-3 rounded shadow-sm bg-info text-white">
                      <small>Vuelto al cliente</small>
                      <div className="d-flex align-items-center mt-1">
                        <FaCashRegister className="me-2" />
                        <h5 className="mb-0 fw-bold">Bs.{diferencia.toFixed(2)}</h5>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded shadow-sm bg-warning text-dark">
                      <small>Falta por pagar</small>
                      <div className="d-flex align-items-center mt-1">
                        <FaCashRegister className="me-2" />
                        <h5 className="mb-0 fw-bold">Bs.{(-diferencia).toFixed(2)}</h5>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Estado */}
            {puedeGenerarFactura ? (
              <div className="alert alert-success text-center mb-4 d-flex align-items-center">
                <FaCheckCircle className="me-2" /> <strong>✅ Pago completo. Listo para generar factura.</strong>
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
                <div className="col-12">
                  <label className="form-label"><strong>Método de Pago</strong></label>
                  <select
                    className="form-control form-select"
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

                <div className="col-12">
                  <label className="form-label"><strong>Monto</strong></label>
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

                {/* Referencia */}
                {metodoSeleccionado && !metodoSeleccionado.nombre.includes("Efectivo") && (
                  <div className="col-12">
                    <label className="form-label"><strong>Referencia</strong></label>
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
                  <div className="col-12">
                    <div className="alert alert-info mb-0 small">
                      💵 <strong>${pago.monto}</strong> → <strong>Bs.{(parseFloat(pago.monto) * dollarRate).toFixed(2)}</strong>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2 py-3"
              >
                <FaPlusCircle /> Agregar Pago
              </button>
            </form>

            {/* Historial */}
            {pagos.length > 0 && (
              <div className="mt-4">
                <h6 className="text-primary d-flex align-items-center mb-3">
                  <FaHistory className="me-2" /> Historial de Pagos
                </h6>
                <div className="table-responsive">
                  <table className="table table-hover table-sm">
                    <thead className="table-light">
                      <tr>
                        <th>Método</th>
                        <th>Monto</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagos.map((p, i) => (
                        <tr key={i}>
                          <td>{p.metodo_pago}</td>
                          <td>Bs.{parseFloat(p.monto).toFixed(2)}</td>
                          <td>{new Date(p.fecha).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-top bg-white">
            <div className="d-grid gap-2">
              {puedeGenerarFactura && (
                <button
                  className="btn btn-success btn-lg d-flex align-items-center justify-content-center gap-2 py-3"
                  onClick={onClose}
                >
                  <FaCheckCircle /> Cerrar y Generar Factura
                </button>
              )}
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
              >
                <MdArrowBack /> Volver
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos adicionales */}
      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}

export default ModalPagos;