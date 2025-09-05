// src/components/FormularioPagos.js
import React, { useState, useEffect } from "react";
import axios from "axios";


function FormularioPagos({
  totalFactura,
  dollarRate = 30,
  onGenerarFactura, // Esta función ahora será un wrapper
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
    if (
      isNaN(metodo_pago_id) ||
      !metodosPago.some((m) => m.id === metodo_pago_id)
    ) {
      setError("Método de pago inválido.");
      return;
    }

    const metodo = metodosPago.find((m) => m.id === metodo_pago_id);
    if (
      !metodo.nombre.includes("Efectivo") &&
      (!pago.referencia || pago.referencia.trim() === "")
    ) {
      setError("Referencia obligatoria para este método.");
      return;
    }

    const montoEnBs =
      metodo.nombre === "Efectivo $"
        ? montoIngresado * dollarRate
        : montoIngresado;

    setTotalPagado((prev) => prev + montoEnBs);

    setPagos((prev) => [
      ...prev,
      {
        id: Date.now(),
        metodo_pago: metodo.nombre,
        monto: montoEnBs,
        referencia: pago.referencia,
        fecha: new Date().toISOString(),
      },
    ]);

    setPago({ metodo_pago_id: "", monto: "", referencia: "" });
  };

  const eliminarPago = (pagoId) => {
    const pago = pagos.find((p) => p.id === pagoId);
    setPagos((prev) => prev.filter((p) => p.id !== pagoId));
    setTotalPagado((prev) => prev - pago.monto);
  };

  const diferencia = totalPagado - totalFactura;
  const esVuelto = diferencia > 0;
  const puedeGenerarFactura = totalPagado >= totalFactura - 0.01;

  // ✅ manejarGenerarFactura con manejo de errores visuales
  const manejarGenerarFactura = async () => {
    if (!puedeGenerarFactura) return;

    try {
      const facturaData = {
        cliente: selectedCliente,
        productos: selectedProducts,
        dollarRate,
        caja_id: cajaId,
        pagos: pagos.map((p) => ({
          metodo_pago_id: metodosPago.find((m) => m.nombre === p.metodo_pago)
            ?.id,
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

        // ✅ Mensaje visual con lista de productos
        const mensajeJSX = (
          <div>
            <h5 className="text-danger mb-3">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>❌ Stock
              insuficiente
            </h5>
            <p>
              <strong>
                No se puede generar la factura. Los siguientes productos no
                tienen suficiente inventario:
              </strong>
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
            <p className="text-muted small">
              Por favor, ajuste las cantidades o elija otros productos.
            </p>
          </div>
        );

        // ✅ Asumimos que `onGenerarFactura` es en realidad `mostrarMensaje`
        // Si no, asegúrate de pasar `mostrarMensaje` a este componente
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
            <h4 className="mb-0 mt-2 text-dark fw-bold">
              Bs.{totalFactura.toFixed(2)}
            </h4>
          </div>
        </div>
        <div className="col-md-4">
          <div
            className={`p-3 text-center border rounded h-100 ${
              puedeGenerarFactura
                ? "bg-success text-white"
                : "bg-danger text-white"
            }`}
          >
            <small>Total Pagado</small>
            <h4 className="mb-0 mt-2 fw-bold">Bs.{totalPagado.toFixed(2)}</h4>
          </div>
        </div>
        <div className="col-md-4">
          {esVuelto ? (
            <div className="p-3 text-center border rounded bg-info text-white h-100">
              <small>Vuelto</small>
              <h4 className="mb-0 mt-2 fw-bold">Bs.{diferencia.toFixed(2)}</h4>
            </div>
          ) : (
            <div className="p-3 text-center border rounded bg-warning text-dark h-100">
              <small>Restante</small>
              <h4 className="mb-0 mt-2 fw-bold">
                Bs.{(-diferencia).toFixed(2)}
              </h4>
            </div>
          )}
        </div>
      </div>

      {/* Mensaje de estado */}
      {puedeGenerarFactura ? (
        <div className="alert alert-success text-center mb-4">
          ✅ Pago completo. Listo para generar factura.
        </div>
      ) : (
        <div className="alert alert-light text-center mb-4">
          Registre pagos hasta cubrir el total.
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="row g-3">
          <div className="col-md-4">
            <label>Método de Pago</label>
            <select
              className="form-control"
              name="metodo_pago_id"
              value={pago.metodo_pago_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar método</option>
              {metodosPago.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label>
              {metodoSeleccionado?.nombre === "Efectivo $"
                ? "Monto ($)"
                : "Monto (Bs)"}
            </label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              name="monto"
              value={pago.monto}
              onChange={handleChange}
              placeholder="Ingrese monto"
              required
            />
          </div>
          <div className="col-md-4">
            <label>Referencia</label>
            <input
              type="text"
              inputMode="numeric"
              minLength={6}
              maxLength={6}
              className={`form-control ${
                pago.metodo !== "efectivo" &&
                pago.referencia &&
                pago.referencia.length !== 6
                  ? "is-invalid"
                  : ""
              }`}
              name="referencia"
              value={pago.referencia}
              onChange={handleChange}
              placeholder={
                pago.metodo === "efectivo"
                  ? "Opcional"
                  : "Últimos 6 dígitos de la transacción"
              }
              disabled={pago.metodo === "efectivo"}
            />
            {pago.metodo !== "efectivo" && (
              <div className="form-text">
                {pago.referencia.length === 0
                  ? "Ingrese los últimos 6 dígitos del comprobante."
                  : pago.referencia.length < 6
                  ? `Faltan ${6 - pago.referencia.length} dígitos.`
                  : pago.referencia.length === 6
                  ? "✅ Referencia válida"
                  : "Sobran dígitos. Use solo los últimos 6."}
              </div>
            )}
            {pago.metodo !== "efectivo" &&
              pago.referencia &&
              pago.referencia.length !== 6 && (
                <div className="invalid-feedback d-block">
                  La referencia debe tener exactamente 6 dígitos.
                </div>
              )}
          </div>
          <div className="col-md-1 d-flex align-items-end">
            <button type="submit" className="btn btn-primary btn-lg w-100">
              +
            </button>
          </div>
        </div>
        {metodoSeleccionado?.nombre === "Efectivo $" && pago.monto && (
          <div className="alert alert-info mt-3 mb-0">
            💵 <strong>${pago.monto}</strong> →{" "}
            <strong>
              Bs.{(parseFloat(pago.monto) * dollarRate).toFixed(2)}
            </strong>
          </div>
        )}
      </form>

      {/* Historial de pagos */}
      {pagos.length > 0 && (
        <div className="mt-4">
          <h6>Historial de Pagos</h6>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Método</th>
                  <th>Monto (Bs)</th>
                  <th>Referencia</th>
                  <th>Fecha</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => (
                  <tr key={p.id}>
                    <td>{p.metodo_pago}</td>
                    <td>Bs.{p.monto.toFixed(2)}</td>
                    <td>{p.referencia || "—"}</td>
                    <td>{new Date(p.fecha).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => eliminarPago(p.id)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {puedeGenerarFactura && (
  <div className="mt-4">
    <button
      className="btn btn-success btn-lg"
      onClick={manejarGenerarFactura}
    >
      ✅ Generar Factura
    </button>
  </div>
)}
      
    </div>
  );
}

export default FormularioPagos;
