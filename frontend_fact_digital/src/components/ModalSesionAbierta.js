// src/components/ModalConfirmacion.js
import React from "react";
import "./ModalConfirmacion.css"; // Opcional: estilos personalizados

function ModalConfirmacion({ mensaje, onConfirmar, onCancelar }) {
  return (
    <div className="modal-overlay">
      <div className="modal-confirmacion">
        <div className="modal-header">
          <h5>🔒 Sesión Activa Detectada</h5>
        </div>
        <div className="modal-body">
          <p>{mensaje}</p>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancelar}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirmar}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalConfirmacion;