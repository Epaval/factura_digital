// src/components/ActualizarPreciosModal.js
import React, { useState } from "react";

function ActualizarPreciosModal({ onClose, onActualizar }) {
  const [porcentaje, setPorcentaje] = useState("");
  const [tipo, setTipo] = useState("aumentar");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!porcentaje || isNaN(porcentaje) || porcentaje <= 0) {
      alert("Por favor ingresa un porcentaje válido.");
      return;
    }

    if (!window.confirm(`¿Estás seguro de ${tipo === "aumentar" ? "aumentar" : "disminuir"} todos los precios en ${porcentaje}%?`)) {
      return;
    }

    onActualizar({
      porcentaje: parseFloat(porcentaje),
      tipo,
    });
  };

  return (
    <div
      className="modal"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
      tabIndex="-1"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-warning text-white">
            <h5 className="modal-title">Actualizar Precios en Lote</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p>
              <strong>Advertencia:</strong> Esta acción afectará a <strong>todos</strong> los productos del sistema.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label>Acción</label>
                <div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      id="aumentar"
                      name="tipo"
                      value="aumentar"
                      checked={tipo === "aumentar"}
                      onChange={() => setTipo("aumentar")}
                    />
                    <label className="form-check-label" htmlFor="aumentar">
                      Aumentar precios
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      id="disminuir"
                      name="tipo"
                      value="disminuir"
                      checked={tipo === "disminuir"}
                      onChange={() => setTipo("disminuir")}
                    />
                    <label className="form-check-label" htmlFor="disminuir">
                      Disminuir precios
                    </label>
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="porcentaje" className="form-label">
                  Porcentaje (%)
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="porcentaje"
                  value={porcentaje}
                  onChange={(e) => setPorcentaje(e.target.value)}
                  step="0.01"
                  min="0"
                  max="100"
                  required
                />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-warning">
                  Aplicar Cambios
                </button>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActualizarPreciosModal;