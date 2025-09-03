// src/components/SeleccionarCaja.js
import React, { useState, useEffect } from "react";
import axios from "axios";

function SeleccionarCaja({ empleado, onCajaAbierta }) {
  const [cajas, setCajas] = useState([]);
  const [cajaSeleccionada, setCajaSeleccionada] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // Cargar cajas disponibles al montar
  useEffect(() => {
    const cargarCajas = async () => {
      try {
        const res = await axios.get("http://localhost:5000/cajas/disponibles");
        setCajas(res.data);
      } catch (err) {
        setError("Error al cargar cajas disponibles.");
      }
    };
    cargarCajas();
  }, []);

  const handleAbrirCaja = async () => {
    if (!cajaSeleccionada) {
      setError("Seleccione una caja.");
      return;
    }
    setCargando(true);
    try {
      await axios.post("http://localhost:5000/cajas/abrir", {
        empleado_id: empleado.id,
        caja_id: Number(cajaSeleccionada),
      });
      onCajaAbierta(empleado, Number(cajaSeleccionada));
    } catch (err) {
      setError(err.response?.data?.message || "Error al abrir caja.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h5>Bienvenido, {empleado.nombre} {empleado.apellido}</h5>
      <p><strong>Ficha:</strong> {empleado.ficha}</p>
      <div className="mb-3">
        <label>Seleccione una caja disponible:</label>
        <select
          className="form-control"
          value={cajaSeleccionada}
          onChange={(e) => setCajaSeleccionada(e.target.value)}
        >
          <option value="">Seleccionar caja</option>
          {cajas.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <button
        className="btn btn-success"
        onClick={handleAbrirCaja}
        disabled={cargando || !cajaSeleccionada}
      >
        {cargando ? "Abriendo..." : "🔓 Abrir Caja"}
      </button>
    </div>
  );
}

export default SeleccionarCaja;