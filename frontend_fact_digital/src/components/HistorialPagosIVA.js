// src/components/HistorialPagosIVA.js
import React, { useState, useEffect } from "react";
import axios from "axios";

function HistorialPagosIVA() {
  const [pagos, setPagos] = useState([]);

  useEffect(() => {
    // Cargar pagos desde API
    const cargarPagos = async () => {
      const res = await axios.get("http://localhost:5000/pagos-iva");
      setPagos(res.data);
    };
    cargarPagos();
  }, []);

  return (
    <div className="card mt-4">
      <div className="card-header">
        <h5>📋 Historial de Pagos de IVA</h5>
      </div>
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Mes</th>
              <th>Monto</th>
              <th>Fecha de Pago</th>
              <th>Referencia</th>
            </tr>
          </thead>
          <tbody>
            {pagos.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center">No hay pagos registrados.</td>
              </tr>
            ) : (
              pagos.map((pago) => (
                <tr key={pago.id}>
                  <td>{pago.mes}</td>
                  <td>Bs.{pago.monto.toFixed(2)}</td>
                  <td>{pago.fecha_pago}</td>
                  <td>{pago.referencia}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HistorialPagosIVA;