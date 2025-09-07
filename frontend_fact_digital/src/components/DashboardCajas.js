// src/components/DashboardCajas.js
import React, { useState, useEffect } from "react";
import axios from "axios";

function DashboardCajas({ empleado, onCajaCerrada }) {
  const [estadoCajas, setEstadoCajas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Verificar rol
  const esSupervisor = () => {
    if (!empleado || !empleado.rol) return false;
    const rol = empleado.rol.trim().toLowerCase();
    return rol === "supervisor" || rol === "admin";
  };

  useEffect(() => {
    // Si no hay empleado, espera
    if (!empleado) {
      console.log("📌 DashboardCajas: Empleado no disponible aún...");
      return;
    }

    // Si no es supervisor/admin, deniega acceso
    if (!esSupervisor()) {
      setError("Acceso denegado. Solo supervisores o admins pueden ver este dashboard.");
      setCargando(false);
      return;
    }

    const cargarEstadoCajas = async () => {
      try {
        console.log("🔍 Cargando estado de cajas...");
        const res = await axios.get("http://localhost:5000/cajas/estado");
        console.log("✅ Datos recibidos:", res.data);
        setEstadoCajas(res.data);
      } catch (err) {
        console.error("❌ Error al cargar estado de cajas:", err);
        setError(
          err.response?.data?.message ||
          err.message ||
          "Error al cargar el estado de las cajas."
        );
      } finally {
        setCargando(false);
      }
    };

    cargarEstadoCajas();

    // Actualizar cada 15 segundos
    const interval = setInterval(cargarEstadoCajas, 15000);
    return () => clearInterval(interval);
  }, [empleado]); // Solo reacciona al cambio de empleado

  // --- Renderizado condicional ---
  if (cargando) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-3">Cargando estado de cajas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!esSupervisor()) {
    return (
      <div className="alert alert-danger text-center">
        Acceso denegado. Solo los supervisores pueden ver este dashboard.
      </div>
    );
  }

  // Cerrar caja manualmente
  const cerrarCajaManual = async (cajaId) => {
    if (!window.confirm(`¿Cerrar manualmente la caja #${cajaId}?`)) return;

    try {
      await axios.post("http://localhost:5000/cajas/cerrar", {
        caja_id: cajaId,
      });

      setEstadoCajas((prev) =>
        prev.map((c) =>
          c.id === cajaId
            ? { ...c, estado: "disponible", empleado: null, total_facturado: 0 }
            : c
        )
      );

      if (onCajaCerrada) {
        onCajaCerrada(cajaId);
      }

      alert("✅ Caja cerrada exitosamente.");
    } catch (err) {
      alert(err.response?.data?.message || "Error al cerrar caja.");
    }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-info text-white">
        <h5>📊 Estado de Cajas</h5>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
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
                  <td colSpan="6" className="text-center text-muted py-3">
                    No hay cajas registradas.
                  </td>
                </tr>
              ) : (
                estadoCajas.map((caja) => (
                  <tr key={caja.id}>
                    <td><strong>{caja.nombre}</strong></td>
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
                    <td>Bs.{caja.total_facturado.toLocaleString()}</td>
                    <td>{caja.ultima_actualizacion}</td>
                    <td>
                      {caja.estado === "ocupada" ? (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => cerrarCajaManual(caja.id)}
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
        </div>

        <div className="mt-3 text-muted small">
          <strong>Nota:</strong> Este dashboard se actualiza automáticamente cada 15 segundos.
        </div>
      </div>
    </div>
  );
}

export default DashboardCajas;