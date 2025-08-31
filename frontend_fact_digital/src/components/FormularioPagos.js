// src/components/FormularioPagos.js
import React, { useState, useEffect } from "react";
import axios from "axios";

function FormularioPagos({
  totalFactura,
  dollarRate = 30,
  onGenerarFactura,
  cajaId,
  selectedCliente,
  selectedProducts,
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

  const handleSubmit = async (e) => {
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
    if (!metodo.nombre.includes("Efectivo") && (!pago.referencia || pago.referencia.trim() === "")) {
      setError("Referencia obligatoria para este método.");
      return;
    }

    const montoEnBs = metodo.nombre === "Efectivo $" ? montoIngresado * dollarRate : montoIngresado;

    // Actualizar total pagado
    setTotalPagado((prev) => prev + montoEnBs);

    // Agregar pago al historial visual
    setPagos((prev) => [
      ...prev,
      {
        id: Date.now(), // temporal
        metodo_pago: metodo.nombre,
        monto: montoEnBs,
        referencia: pago.referencia,
        fecha: new Date().toISOString(),
      },
    ]);

    // Limpiar formulario
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

  // Disparar generación de factura
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

      await onGenerarFactura(facturaData); // onGenerarFactura ahora recibe datos
    } catch (err) {
      setError("Error al generar la factura.");
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
            <h4 className="mb-0 mt-2 text-dark fw-bold">Bs.{totalFactura.toFixed(2)}</h4>
          </div>
        </div>
        <div className="col-md-4">
          <div className={`p-3 text-center border rounded h-100 ${puedeGenerarFactura ? 'bg-success text-white' : 'bg-danger text-white'}`}>
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
              <h4 className="mb-0 mt-2 fw-bold">Bs.{(-diferencia).toFixed(2)}</h4>
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
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label>{metodoSeleccionado?.nombre === "Efectivo $" ? "Monto ($)" : "Monto (Bs)"}</label>
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
              className="form-control"
              name="referencia"
              value={pago.referencia}
              onChange={handleChange}
              placeholder="Opcional"
            />
          </div>
          <div className="col-md-1 d-flex align-items-end">
            <button type="submit" className="btn btn-primary btn-lg w-100">+</button>
          </div>
        </div>
        {metodoSeleccionado?.nombre === "Efectivo $" && pago.monto && (
          <div className="alert alert-info mt-3 mb-0">
            💵 <strong>${pago.monto}</strong> → <strong>Bs.{(parseFloat(pago.monto) * dollarRate).toFixed(2)}</strong>
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

      {/* Botón para generar factura */}
      {puedeGenerarFactura && (
        <div className="text-end mt-4">
          <button
            className="btn btn-success btn-lg px-5"
            onClick={manejarGenerarFactura}
          >
            ✅ Generar Factura (PDF)
          </button>
        </div>
      )}
    </div>
  );
}

export default FormularioPagos;