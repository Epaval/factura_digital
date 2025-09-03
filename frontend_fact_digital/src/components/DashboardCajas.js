// src/components/DashboardCajas.js
import React, { useState, useEffect } from "react";
import axios from "axios";

function DashboardCajas({ empleado, onCajaCerrada }) {
  const [estadoCajas, setEstadoCajas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Verificar si el usuario es supervisor o admin
  const esSupervisor = () => {
    const rol = empleado?.rol?.trim().toLowerCase();
    return rol === "supervisor" || rol === "admin";
  };

  // Cargar el estado de las cajas solo si es supervisor
  useEffect(() => {
    if (!esSupervisor()) {
      setCargando(false);
      return;
    }

    const cargarEstadoCajas = async () => {
      try {
        const res = await axios.get("http://localhost:5000/cajas/estado");
        setEstadoCajas(res.data);
      } catch (err) {
        setError("Error al cargar el estado de las cajas.");
        console.error(err);
      } finally {
        setCargando(false);
      }
    };

    cargarEstadoCajas();

    // Actualizar cada 15 segundos
    const interval = setInterval(cargarEstadoCajas, 15000);
    return () => clearInterval(interval);
  }, [empleado]); // ✅ Solo depende de 'empleado'

  if (!esSupervisor()) {
    return (
      <div className="alert alert-danger text-center">
        Acceso denegado. Solo los supervisores pueden ver este dashboard.
      </div>
    );
  }

  if (cargando) {
    return <p className="text-center">Cargando estado de cajas...</p>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }


// Cerrar caja manualmente
const cerrarCajaManual = async (cajaId) => {
  if (!window.confirm(`¿Cerrar manualmente la caja #${cajaId}?`)) return;

  try {
    await axios.post("http://localhost:5000/cajas/cerrar", {
      caja_id: cajaId,
    });

    // Actualizar estado local
    setEstadoCajas((prev) =>
      prev.map((c) =>
        c.id === cajaId
          ? { ...c, estado: "disponible", empleado: null, total_facturado: 0 }
          : c
      )
    );

    // ✅ Notificar a App.js que la caja fue cerrada
    if (onCajaCerrada) {
      onCajaCerrada(cajaId);
    }

    alert("✅ Caja cerrada exitosamente.");
  } catch (err) {
    alert(err.response?.data?.message || "Error al cerrar caja.");
  }
};


  return (
    <div className="card">
      <div className="card-header bg-info text-white">
        <h5>Estado de Cajas - Supervisor</h5>
      </div>
      <div className="card-body">
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>Caja</th>
              <th>Estado</th>
              <th>Empleado</th>
              <th>Total Facturado</th>
              <th>Última Factura</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {estadoCajas.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">
                  No hay cajas registradas.
                </td>
              </tr>
            ) : (
              estadoCajas.map((caja) => (
                <tr key={caja.id}>
                  <td>
                    <strong>{caja.nombre}</strong>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        caja.estado === "disponible"
                          ? "bg-success"
                          : "bg-warning text-dark"
                      }`}
                    >
                      {caja.estado === "disponible" ? "Disponible" : "Ocupada"}
                    </span>
                  </td>
                  <td>{caja.empleado || "—"}</td>
                  <td>Bs.{caja.total_facturado?.toFixed(2) || "0.00"}</td>
                  <td>{caja.ultima_actualizacion}</td>
                  <td>
                    {caja.estado === "ocupada" ? (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => cerrarCajaManual(caja.id)}
                        disabled={cargando}
                      >
                        🚪 Cerrar
                      </button>
                    ) : (
                      <small className="text-muted">Cerrada</small>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="mt-3 text-muted">
          <small>
            <strong>Nota:</strong> Este dashboard se actualiza automáticamente
            cada 15 segundos.
          </small>
        </div>
      </div>
    </div>
  );
}

export default DashboardCajas;
