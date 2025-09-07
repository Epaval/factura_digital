// src/components/ModalNuevoCliente.js
import React, { useState } from "react";
import {
  FaUser,
  FaIdCard,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaSave,
  FaTimes,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

const ModalNuevoCliente = ({ mostrar, onCerrar, onGuardar }) => {
  const [nombre, setNombre] = useState("");
  const [tipoRif, setTipoRif] = useState("V");
  const [numeroRif, setNumeroRif] = useState("");
  const [correo, setCorreo] = useState("");
  const [operador, setOperador] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");

  const [errores, setErrores] = useState({});

  // Validación en tiempo real
  const validar = () => {
    const nuevosErrores = {};

    if (!nombre.trim()) nuevosErrores.nombre = "El nombre es obligatorio.";
    else if (nombre.trim().split(" ").length < 2)
      nuevosErrores.nombre = "Debe incluir nombre y apellido.";

    if (!numeroRif.trim()) nuevosErrores.numeroRif = "El número RIF es obligatorio.";
    else if (!/^\d{9,10}$/.test(numeroRif))
      nuevosErrores.numeroRif = "Debe tener entre 9 y 10 dígitos.";

    if (!correo.trim()) nuevosErrores.correo = "El correo es obligatorio.";
    else if (!/\S+@\S+\.\S+/.test(correo))
      nuevosErrores.correo = "Correo no válido.";

    if (!operador) nuevosErrores.operador = "Seleccione un código.";
    if (!telefono) nuevosErrores.telefono = "El teléfono es obligatorio.";
    else if (telefono.toString().length < 7)
      nuevosErrores.telefono = "Teléfono debe tener al menos 7 dígitos.";

    if (!direccion.trim()) nuevosErrores.direccion = "La dirección es obligatoria.";

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Formatear nombre (primera letra de cada palabra en mayúscula)
  const handleNombreChange = (e) => {
    const value = e.target.value;
    const formattedValue = value
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
    setNombre(formattedValue);
  };

  // Formatear dirección
  const handleDireccionChange = (e) => {
    const value = e.target.value;
    const formattedValue = value
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
    setDireccion(formattedValue);
  };

  // Guardar cliente
  const handleGuardar = () => {
    if (validar()) {
      const nuevoCliente = {
        nombre,
        tipo_rif: tipoRif,
        numero_rif: numeroRif,
        correo,
        operador: parseInt(operador),
        telefono: parseInt(telefono),
        direccion,
      };
      onGuardar(nuevoCliente);
      onCerrar();
    }
  };

  if (!mostrar) return null;

  return (
    <div
      className="modal show"
      tabIndex="-1"
      role="dialog"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onCerrar}
    >
      <div
        className="modal-dialog modal-lg"
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content shadow-lg border-0 rounded-3">
          <div className="modal-header bg-primary text-white d-flex align-items-center">
            <FaUser className="me-2" /> <h5 className="modal-title">Registrar Nuevo Cliente</h5>
            <button
              type="button"
              className="btn-close btn-close-white ms-auto"
              onClick={onCerrar}
            ></button>
          </div>

          <div className="modal-body">
            <form>
              {/* Nombre */}
              <div className="mb-3">
                <label className="form-label d-flex align-items-center">
                  <FaUser className="me-2 text-primary" /> Nombre y Apellido
                </label>
                <input
                  type="text"
                  className={`form-control ${errores.nombre ? "is-invalid" : ""}`}
                  value={nombre}
                  onChange={handleNombreChange}
                  onBlur={validar}
                  placeholder="Ej: Juan Pérez"
                />
                {errores.nombre && (
                  <div className="invalid-feedback d-flex align-items-center">
                    <FaExclamationCircle className="me-1" /> {errores.nombre}
                  </div>
                )}
              </div>

              {/* RIF */}
              <div className="row g-3 mb-3">
                <div className="col-md-3">
                  <label className="form-label">Tipo RIF</label>
                  <select
                    className="form-select"
                    value={tipoRif}
                    onChange={(e) => setTipoRif(e.target.value)}
                  >
                    <option value="V">V</option>
                    <option value="E">E</option>
                    <option value="J">J</option>
                  </select>
                </div>
                <div className="col-md-9">
                  <label className="form-label d-flex align-items-center">
                    <FaIdCard className="me-2 text-primary" /> Número RIF
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errores.numeroRif ? "is-invalid" : ""}`}
                    value={numeroRif}
                    onChange={(e) => setNumeroRif(e.target.value.replace(/\D/g, ""))}
                    onBlur={validar}
                    placeholder="Ej: 12345678"
                  />
                  {errores.numeroRif && (
                    <div className="invalid-feedback d-flex align-items-center">
                      <FaExclamationCircle className="me-1" /> {errores.numeroRif}
                    </div>
                  )}
                </div>
              </div>

              {/* Correo */}
              <div className="mb-3">
                <label className="form-label d-flex align-items-center">
                  <FaEnvelope className="me-2 text-primary" /> Correo Electrónico
                </label>
                <input
                  type="email"
                  className={`form-control ${errores.correo ? "is-invalid" : ""}`}
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  onBlur={validar}
                  placeholder="ejemplo@correo.com"
                />
                {errores.correo && (
                  <div className="invalid-feedback d-flex align-items-center">
                    <FaExclamationCircle className="me-1" /> {errores.correo}
                  </div>
                )}
              </div>

              {/* Teléfono */}
              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label className="form-label d-flex align-items-center">
                    <FaPhone className="me-2 text-primary" /> Código
                  </label>
                  <select
                    className={`form-select ${errores.operador ? "is-invalid" : ""}`}
                    value={operador}
                    onChange={(e) => setOperador(e.target.value)}
                    onBlur={validar}
                  >
                    <option value="" disabled>
                      Seleccione
                    </option>
                    <option value="0412">0412</option>
                    <option value="0416">0416</option>
                    <option value="0414">0414</option>
                    <option value="0424">0424</option>
                    <option value="0426">0426</option>
                  </select>
                  {errores.operador && (
                    <div className="invalid-feedback d-flex align-items-center">
                      <FaExclamationCircle className="me-1" /> {errores.operador}
                    </div>
                  )}
                </div>
                <div className="col-md-8">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="number"
                    className={`form-control ${errores.telefono ? "is-invalid" : ""}`}
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    onBlur={validar}
                    placeholder="Ej: 1234567"
                  />
                  {errores.telefono && (
                    <div className="invalid-feedback d-flex align-items-center">
                      <FaExclamationCircle className="me-1" /> {errores.telefono}
                    </div>
                  )}
                </div>
              </div>

              {/* Dirección */}
              <div className="mb-3">
                <label className="form-label d-flex align-items-center">
                  <FaMapMarkerAlt className="me-2 text-primary" /> Dirección
                </label>
                <input
                  type="text"
                  className={`form-control ${errores.direccion ? "is-invalid" : ""}`}
                  value={direccion}
                  onChange={handleDireccionChange}
                  onBlur={validar}
                  placeholder="Ej: Calle 123, Barrio XYZ"
                />
                {errores.direccion && (
                  <div className="invalid-feedback d-flex align-items-center">
                    <FaExclamationCircle className="me-1" /> {errores.direccion}
                  </div>
                )}
              </div>
            </form>
          </div>

          <div className="modal-footer border-0 pt-0">
            <button type="button" className="btn btn-secondary" onClick={onCerrar}>
              <FaTimes className="me-1" /> Cerrar
            </button>
            <button type="button" className="btn btn-primary" onClick={handleGuardar}>
              <FaSave className="me-1" /> Guardar Cliente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalNuevoCliente;