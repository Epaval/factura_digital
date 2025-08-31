// src/components/ModalMensaje.js
import React, { useEffect, useState } from "react";

function ModalMensaje({ mensaje, onCerrar }) {
  const [progreso, setProgreso] = useState(0); // 0% a 100%

  useEffect(() => {
    const duracion = 2000; // 2 segundos
    const incremento = 10;   // Actualizar cada 10ms
    const totalSteps = duracion / incremento;
    let paso = 0;

    // Temporizador para actualizar la barra
    const intervalo = setInterval(() => {
      paso += 1;
      const porcentaje = Math.min((paso / totalSteps) * 100, 100);
      setProgreso(porcentaje);

      if (paso >= totalSteps) {
        onCerrar();
        clearInterval(intervalo);
      }
    }, incremento);

    // Limpiar si se cierra antes
    return () => clearInterval(intervalo);
  }, [onCerrar]);

  return (
    <div className="modal show" style={{ display: "block", backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg text-center border-0">
          <div className="modal-body p-4">
            <h5>{mensaje}</h5>
            <p className="text-muted small mt-2">Cerrando en 2 segundos...</p>

            {/* Barra de progreso animada */}
            <div className="progress mt-3" style={{ height: "6px", borderRadius: "3px" }}>
              <div
                className="progress-bar bg-success"
                style={{
                  width: `${progreso}%`,
                  transition: "width 0.01s linear", // Suaviza el movimiento
                  borderRadius: "3px",
                }}
                role="progressbar"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalMensaje;