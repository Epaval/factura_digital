// src/components/Header.js
import React from "react";
import BcvDollar from "./BcvDollar";

const Header = ({
  onNuevoCliente,
  onConsultarProductos,
  onHistorialFacturas,
  onVerDashboard, 
}) => {
  return (
    <header className="bg-dark text-white py-4">
      <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center">
        <h1>Sistema de Facturación</h1>

        <div className="d-flex flex-column flex-md-row">
          <button className="btn btn-primary mb-2 mb-md-0 mx-md-2" onClick={onNuevoCliente}>
            Nuevo Cliente
          </button>
          <button className="btn btn-info mb-2 mb-md-0 mx-md-2" onClick={onConsultarProductos}>
            Consultar Producto
          </button>
          <button className="btn btn-success mb-2 mb-md-0 mx-md-2" onClick={onHistorialFacturas}>
            Historial Facturas
          </button>
          <button className="btn btn-secondary mb-2 mb-md-0 mx-md-2" onClick={onVerDashboard}>
            📊 Dashboard de Supervisión
          </button>
        </div>

        <div>
          <BcvDollar />
        </div>
      </div>
    </header>
  );
};

export default Header;