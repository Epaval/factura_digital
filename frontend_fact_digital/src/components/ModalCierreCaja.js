// src/components/ModalCierreCaja.js
import React from "react";

function ModalCierreCaja({ show, onClose, onConfirm, cajaId, empleado, totalFacturado = 0 }) {
  if (!show) return null;

  return (
    <div className="modal show" style={{ display: "block", backgroundColor: "rgba(0, 0, 0, 0.5)" }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-danger text-white rounded-top">
            <h5 className="modal-title">
              <i className="bi bi-x-circle me-2"></i>
              Cerrar Caja
            </h5>
          </div>

          <div className="modal-body">
            <div className="text-center mb-4">
              <div className="avatar bg-danger bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                <i className="bi bi-cash-register text-danger" style={{ fontSize: "2rem" }}></i>
              </div>
              <h4>Caja {cajaId}</h4>
              <p className="text-muted">
                <strong>{empleado?.nombre} {empleado?.apellido}</strong>
              </p>
            </div>

            {totalFacturado > 0 && (
              <div className="alert alert-success text-center mb-4">
                <strong>Total facturado:</strong> <br />
                <span className="h5">Bs.{totalFacturado.toFixed(2)}</span>
              </div>
            )}

            <div className="alert alert-warning">
              <small>
                <i className="bi bi-exclamation-triangle me-2"></i>
                Esta acción cerrará la caja y liberará el acceso para otro empleado.
              </small>
            </div>
          </div>

          <div className="modal-footer justify-content-between">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-danger px-4"
              onClick={onConfirm}
            >
              ✅ Sí, Cerrar Caja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalCierreCaja;