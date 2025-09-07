// src/components/Header.js
import React, { useState } from "react";
import BcvDollar from "./BcvDollar";
import BuscadorGlobal from "./BuscadorGlobal"; // 🔥 Nuevo: buscador con debounce
import {
  FiHome,
  FiUsers,
  FiPackage,
  FiFileText,
  FiBarChart2,
  FiDatabase,
  FiTag,
  FiMenu,
  FiX,
  FiBox,
} from "react-icons/fi";

const Header = ({
  onNuevoCliente,
  onConsultarProductos,
  onHistorialFacturas,
  onVerDashboard,
  onVerTodasFacturas,
  onVerDashboardAdmin,
  onActualizarPreciosMasivo,
  esSupervisor,
  onVerInventario,
  empleado,
}) => {
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Alternar menú en móvil
  const toggleMenu = () => setMenuAbierto(!menuAbierto);

  // Animación del logo
  const [scale, setScale] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLogoClick = () => {
    if (isAnimating) return;
    setScale(1.5);
    setIsAnimating(true);
    setTimeout(() => {
      setScale(1);
      setIsAnimating(false);
    }, 1000);
  };

  return (
    <header className="bg-primary text-white shadow-sm">
      <div className="container-fluid">
        {/* Barra superior */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center py-3 px-3 gap-3">
          {/* Logo y título */}
          <div className="d-flex align-items-center">
            <h1
              className="h5 mb-0 d-flex align-items-center position-relative"
              style={{ zIndex: 1 }}
            >
              <span className="d-none d-md-inline">
                FacDin. Facturación Digital Inteligente
              </span>
              <span className="d-inline d-md-none">FacDin</span>
              <img
                src="/facdin.png"
                alt="FADIN - Facturación Digital Inteligente"
                style={{
                  width: `${50 * scale}px`,
                  height: "auto",
                  maxWidth: "50%",
                  marginLeft: "10px",
                  cursor: "pointer",
                  transform: `scale(${scale})`,
                  transformOrigin: "center",
                  transition: "transform 0.8s ease-out",                  
                  position: "relative",
                  zIndex: 2,
                  pointerEvents: "auto", // Asegura que el clic funcione
                }}
                onClick={handleLogoClick}
              />
            </h1>
          </div>

          {/* Buscador global (visible en todos los dispositivos) */}
          <div className="flex-fill mx-md-4" style={{ maxWidth: "400px" }}>
            <BuscadorGlobal
              onResultados={(resultados) => console.log(resultados)}
            />
          </div>

          {/* Botón menú móvil y tasa BCV */}
          <div className="d-flex align-items-center gap-2">
            {/* Botón menú móvil */}
            <button
              className="btn btn-light btn-sm d-md-none d-flex align-items-center gap-1"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {menuAbierto ? <FiX size={18} /> : <FiMenu size={18} />}
            </button>

            {/* Tasa BCV - solo escritorio */}
            <div className="d-none d-md-block">
              <BcvDollar />
            </div>
          </div>
        </div>

        {/* Menú de navegación */}
        <nav
          className={`${
            menuAbierto ? "d-flex" : "d-none"
          } d-md-flex flex-column flex-md-row justify-content-center align-items-center gap-2 px-3 py-2 rounded-3 mb-3 bg-white bg-opacity-10 backdrop-blur-lg`}
          style={{ backdropFilter: "blur(10px)" }}
        >
          {/* Acciones generales (cajero) */}
          <div className="d-flex flex-wrap justify-content-center gap-2">
            <button
              className="btn btn-outline-light btn-sm d-flex align-items-center gap-1 px-3 py-2"
              onClick={onNuevoCliente}
              title="Nuevo Cliente"
            >
              <FiUsers size={16} />
              <span className="d-none d-sm-inline"> Nuevo Cliente</span>
            </button>          
         
          </div>

          {/* Separador visual en móvil */}
          {esSupervisor() && (
            <div className="w-100 my-1 d-md-none border-top border-light border-opacity-25"></div>
          )}

          {/* Acciones de supervisor/admin */}
          {esSupervisor() && (
            <div className="d-flex flex-wrap justify-content-center gap-2">                                  
            </div>
          )}
        </nav>

        {/* Tasa BCV en móvil */}
        <div className="d-flex justify-content-center d-md-none mb-3 px-3">
          <BcvDollar />
        </div>
      </div>
    </header>
  );
};

export default Header;
