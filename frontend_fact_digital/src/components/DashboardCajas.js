// src/components/DashboardCajas.js
import React, { useState, useEffect } from "react";
import axios from "axios";

function DashboardCajas() {
  const [cajas, setCajas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarEstado = async () => {
    try {
      const res = await axios.get("http://localhost:5000/cajas/estado");
      setCajas(res.data);
    } catch (err) {
      setError("No se pudo cargar el estado de las cajas.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEstado();
    // Opcional: refrescar cada 30 segundos
    const interval = setInterval(cargarEstado, 30000);
    return () => clearInterval(interval);
  }, []);

  const getColorPorEstado = (estado) => {
    switch (estado) {
      case "ocupada": return "success";
      case "disponible": return "warning";
      case "cerrada": return "secondary";
      default: return "light";
    }
  };

  if (cargando) return <p>Cargando estado de cajas...</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="mt-5">
      <h4>📊 Supervisión de Cajas</h4>
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-dark">
            <tr>
              <th>Caja</th>
              <th>Estado</th>
              <th>Empleado</th>
              <th>Total Facturado</th>
              <th>Última Factura</th>
            </tr>
          </thead>
          <tbody>
            {cajas.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">No hay cajas registradas</td>
              </tr>
            ) : (
              cajas.map((caja) => (
                <tr key={caja.id}>
                  <td><strong>{caja.nombre}</strong></td>
                  <td>
                    <span className={`badge bg-${getColorPorEstado(caja.estado)}`}>
                      {caja.estado === "ocupada" && "✅ Ocupada"}
                      {caja.estado === "disponible" && "🔁 Disponible"}
                      {caja.estado === "cerrada" && "❌ Cerrada"}
                    </span>
                  </td>
                  <td>{caja.empleado || "—"}</td>
                  <td>Bs. {caja.total_facturado.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                  <td>{caja.ultima_actualizacion}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-end mt-3">
        <button className="btn btn-outline-primary btn-sm" onClick={cargarEstado}>
          🔁 Actualizar
        </button>
      </div>
    </div>
  );
}

export default DashboardCajas;