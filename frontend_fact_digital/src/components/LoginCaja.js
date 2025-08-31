// src/components/LoginCaja.js
import React, { useState } from "react";
import axios from "axios";

function LoginCaja({ onCajaAbierta }) {
  const [ficha, setFicha] = useState("");
  const [cajas, setCajas] = useState([]);
  const [empleado, setEmpleado] = useState(null);
  const [cajaSeleccionada, setCajaSeleccionada] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const handleBuscar = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const res = await axios.get(`http://localhost:5000/empleados/ficha/${ficha}`);
      setEmpleado(res.data);
      const resCajas = await axios.get("http://localhost:5000/cajas/disponibles");
      setCajas(resCajas.data);
    } catch (err) {
      setError(err.response?.data?.message || "Empleado no encontrado.");
    } finally {
      setCargando(false);
    }
  };

  const handleAbrirCaja = async () => {
    if (!cajaSeleccionada) {
      setError("Seleccione una caja.");
      return;
    }
    setCargando(true);
    try {
      await axios.post("http://localhost:5000/cajas/abrir", {
        empleado_id: empleado.id,
        caja_id: Number(cajaSeleccionada), // ✅ Asegura que sea número
      });
      onCajaAbierta(empleado, Number(cajaSeleccionada)); // ✅ También aquí
    } catch (err) {
      setError(err.response?.data?.message || "Error al abrir caja.");
    } finally {
      setCargando(false);
    }
  };

  if (empleado) {
    return (
      <div className="p-4 bg-white rounded shadow">
        <h5>Bienvenido, {empleado.nombre} {empleado.apellido}</h5>
        <p><strong>Ficha:</strong> {ficha}</p>
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
        <button
          className="btn btn-success"
          onClick={handleAbrirCaja}
          disabled={cargando || !cajaSeleccionada}
        >
          {cargando ? "Abriendo..." : "🔓 Abrir Caja"}
        </button>
        <button
          className="btn btn-secondary ms-2"
          onClick={() => {
            setEmpleado(null);
            setCajaSeleccionada("");
          }}
        >
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h5>Iniciar como Empleado</h5>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleBuscar}>
        <div className="mb-3">
          <label>Número de Ficha</label>
          <input
            type="text"
            className="form-control"
            value={ficha}
            onChange={(e) => setFicha(e.target.value)}
            placeholder="Ej: 12345"
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={cargando}
        >
          {cargando ? "Buscando..." : "Buscar Empleado"}
        </button>
      </form>
    </div>
  );
}

export default LoginCaja;