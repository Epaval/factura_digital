import React from "react";
import BcvDollar from "./BcvDollar";

const Header = ({ onNuevoCliente, onConsultarProductos }) => {
  return (
    <header className="bg-dark text-white py-4">
      <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center">
        <h1>Sistema de Facturación</h1>

        <div className="d-flex flex-column flex-md-row">
          <button
            className="btn btn-primary mb-2 mb-md-0 mx-md-2"
            onClick={onNuevoCliente}
          >
            Nuevo Cliente
          </button>
          <button
            className="btn btn-info mb-2 mb-md-0 mx-md-2"
            onClick={onConsultarProductos}
          >
            Consultar Producto
          </button>
          <button className="btn btn-danger mb-2 mb-md-0 mx-md-2">
            Cerrar Sesión
          </button>
        </div>
        <div>
          {/* Agrega el componente BcvDollar aquí */}
          <BcvDollar />
        </div>
      </div>
    </header>
  );
};

export default Header;
