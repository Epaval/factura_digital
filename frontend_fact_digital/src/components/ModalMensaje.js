import React from 'react';

const ModalMensaje = ({ mensaje, onCerrar }) => {
    return (
        <div className="modal" tabIndex="-1" role="dialog" style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">Mensaje</h5>
                        <button
                            type="button"
                            className="btn-close btn-close-white"
                            onClick={onCerrar}
                        ></button>
                    </div>
                    <div className="modal-body text-center text-uppercase">
                        <p className="h5">{mensaje}</p>
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onCerrar}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalMensaje;