// src/components/BuscarFacturasPorCliente.js
import React, { useState } from "react";
import axios from "axios";

function BuscarFacturasPorCliente({ show, onClose, onSeleccionarFactura }) {
  const [rif, setRif] = useState("");
  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const buscarFacturas = async () => {
    if (!rif.trim()) {
      setError("Ingrese el RIF o CI del cliente.");
      return;
    }

    setCargando(true);
    setError("");
    setFacturas([]);

    try {
      const res = await axios.get(`http://localhost:5000/facturas/cliente/${rif}`);
      if (res.data.length === 0) {
        setError("No hay facturas pendientes para este cliente.");
      } else {
        setFacturas(res.data);
      }
    } catch (err) {
      setError("Error al buscar facturas. Verifique la conexión.");
    } finally {
      setCargando(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show" style={{ display: 'block', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Facturas Pendientes por Cliente</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label>Ingrese RIF o CI del cliente:</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: V12345678"
                  value={rif}
                  onChange={(e) => setRif(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && buscarFacturas()}
                />
                <button
                  className="btn btn-primary"
                  onClick={buscarFacturas}
                  disabled={cargando}
                >
                  {cargando ? "Buscando..." : "Buscar"}
                </button>
              </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {facturas.length > 0 && (
              <div>
                <h6>Facturas encontradas ({facturas.length}):</h6>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-dark">
                      <tr>
                        <th>N° Factura</th>
                        <th>Control</th>
                        <th>Total</th>
                        <th>Fecha</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facturas.map(f => (
                        <tr key={f.id}>
                          <td>{f.numero_factura}</td>
                          <td>{f.numero_control}</td>
                          <td>Bs.{parseFloat(f.total).toFixed(2)}</td>
                          <td>{new Date(f.fecha).toLocaleDateString()}</td>
                          <td>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => onSeleccionarFactura(f)}
                            >
                              Recuperar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BuscarFacturasPorCliente;