// src/components/ModalMensaje.js
import React from "react";

function ModalMensaje({ mensaje, onCerrar }) {
  return (
    <div
      className="modal"
      style={{
        display: "block",
        backgroundColor: "rgba(0,0,0,0.5)",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1050,
      }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title">⚠️ Advertencia</h5>
            <button type="button" className="btn-close" onClick={onCerrar}></button>
          </div>
          <div className="modal-body">
            {typeof mensaje === "string" ? <p>{mensaje}</p> : mensaje}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onCerrar}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalMensaje;