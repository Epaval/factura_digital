// src/components/FormularioD100.js
import React from "react";

function FormularioD100() {
  return (
    <div className="card mt-4">
      <div className="card-header bg-dark text-white">
        <h5>📄 Formulario D-100 (Simulación)</h5>
      </div>
      <div className="card-body">
        <p>Este módulo permite generar un reporte con los datos necesarios para llenar el <strong>Formulario D-100</strong> del SENIAT.</p>
        <ul>
          <li>📅 Período: Septiembre 2025</li>
          <li>💰 Ventas Totales: Bs. 12.500.000</li>
          <li>🧮 IVA Recaudado: Bs. 2.000.000</li>
          <li>📉 IVA Soportado: Bs. 0</li>
          <li>✅ IVA a Pagar: Bs. 2.000.000</li>
        </ul>
        <button className="btn btn-primary">📥 Descargar Reporte D-100</button>
      </div>
    </div>
  );
}

export default FormularioD100;