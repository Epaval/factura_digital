// src/components/ModalConfirmacion.js
import React from "react";

function ModalConfirmacion({ show, titulo, mensaje, onConfirmar, onCancel }) {
  if (!show) return null;

  return (
    <div className="modal show" style={{ display: "block", backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0">
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {titulo}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onCancel}></button>
          </div>
          <div className="modal-body text-center">
            <p>{mensaje}</p>
            <div className="alert alert-light text-start mt-3 p-3">
              <strong>¿Estás seguro de que deseas continuar?</strong>
              <br />
              Esta acción no se puede deshacer.
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancelar
            </button>
            <button type="button" className="btn btn-danger" onClick={onConfirmar}>
              🚫 Anular Factura
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalConfirmacion;