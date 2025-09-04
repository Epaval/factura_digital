// src/components/Header.js
import React, { useState } from "react";
import BcvDollar from "./BcvDollar";
import {
  FaHome,
  FaUsers,
  FaBox,
  FaFileInvoice,
  FaChartBar,
  FaDatabase,
  FaUserTie,
  FaBars,
  FaTimes,
} from "react-icons/fa";

const Header = ({
  onNuevoCliente,
  onConsultarProductos,
  onHistorialFacturas,
  onVerDashboard,
  onVerTodasFacturas,
  onVerDashboardAdmin,
  esSupervisor,
}) => {
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Alternar menú en móvil
  const toggleMenu = () => setMenuAbierto(!menuAbierto);

  return (
    <header className="bg-primary text-white shadow-sm">
      <div className="container-fluid">
        {/* Barra superior */}
        <div className="d-flex justify-content-between align-items-center py-3 px-3">
          <div className="d-flex align-items-center">
            <h1 className="h4 mb-0 d-flex align-items-center">
              <FaHome className="me-2" />
              <span>Sistema de Facturación</span>
            </h1>
          </div>

          {/* Botón menú para móvil */}
          <button
            className="btn btn-outline-light d-md-none"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {menuAbierto ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>

          {/* Tasa BCV - visible en todos los dispositivos */}
          <div className="d-none d-md-block">
            <BcvDollar />
          </div>
        </div>

        {/* Menú de navegación */}
        <nav
          className={`${
            menuAbierto ? "d-flex" : "d-none"
          } d-md-flex flex-column flex-md-row justify-content-center align-items-center gap-2 py-2 bg-primary bg-opacity-90 rounded-3 mb-3`}
        >
          {/* Acciones generales (cajero) */}
          <div className="d-flex flex-wrap justify-content-center gap-2">
            <button
              className="btn btn-outline-light btn-sm d-flex align-items-center gap-1"
              onClick={onNuevoCliente}
              title="Nuevo Cliente"
            >
              <FaUsers />{" "}
              <span className="d-none d-lg-inline">Nuevo Cliente</span>
            </button>
            {esSupervisor && (
              <button
                className="btn btn-outline-light btn-sm d-flex align-items-center gap-1"
                onClick={onConsultarProductos}
                title="Consultar Productos"
              >
                <FaBox /> <span className="d-none d-lg-inline">Productos</span>
              </button>
            )}
            <button
              className="btn btn-outline-light btn-sm d-flex align-items-center gap-1"
              onClick={onHistorialFacturas}
              title="Historial de Facturas"
            >
              <FaFileInvoice />{" "}
              <span className="d-none d-lg-inline">Historial</span>
            </button>
          </div>

          {/* Separador visible en móvil */}
          {esSupervisor && <div className="w-100 d-md-none"></div>}

          {/* Acciones de supervisor/admin */}
          {esSupervisor && (
            <div className="d-flex flex-wrap justify-content-center gap-2">
              <button
                className="btn btn-light btn-sm d-flex align-items-center gap-1"
                onClick={onVerDashboard}
                title="Dashboard de Cajas"
              >
                <FaChartBar />{" "}
                <span className="d-none d-lg-inline">Dashboard Cajas</span>
              </button>
              <button
                className="btn btn-dark btn-sm d-flex align-items-center gap-1"
                onClick={onVerDashboardAdmin}
                title="Dashboard Administrativo"
              >
                <FaDatabase />{" "}
                <span className="d-none d-lg-inline">Dashboard Admin</span>
              </button>
              <button
                className="btn btn-warning btn-sm d-flex align-items-center gap-1 text-dark"
                onClick={onVerTodasFacturas}
                title="Ver Todas las Facturas"
              >
                <FaFileInvoice />{" "}
                <span className="d-none d-lg-inline">Todas las Facturas</span>
              </button>
            </div>
          )}
        </nav>

        {/* Tasa BCV en móvil */}
        <div className="d-flex justify-content-center d-md-none mb-3">
          <BcvDollar />
        </div>
      </div>
    </header>
  );
};

export default Header;
