// src/components/DashboardCards.js
import React from "react";
import {
  FaChartLine,
  FaDollarSign,
  FaUsers,
  FaBox,
  FaFileInvoice,
  FaTags,
  FaDesktop,
  FaShoppingCart,
  FaTruck,
  FaUsersCog,
  FaUserShield,
} from "react-icons/fa";

function DashboardCards({ empleado, reportes, onSeleccionarModulo }) {
  const esAdmin = empleado?.rol === "admin";

  const esSupervisor = () => {
    const rol = empleado?.rol;
    if (!rol) return false;
    const rolLimpio = rol.trim().toLowerCase();
    return rolLimpio === "supervisor" || esAdmin;
  };

  // Función para manejar clic en un módulo
  const handleCardClick = (modulo) => {
    if (onSeleccionarModulo) {
      onSeleccionarModulo(modulo);
    }
  };

  return (
    <div className="p-4">
      <h3 className="mb-4 text-center text-primary">
        <FaChartLine /> Panel de Administración
      </h3>

      <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
        {/* Facturación */}
        <div className="col">
          <div className="card shadow-sm h-100 border-0">
            <div className="card-body d-flex flex-column">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <FaFileInvoice size={32} className="text-success" />
                <span className="badge bg-success">Hoy</span>
              </div>
              <h5 className="card-title">Facturación</h5>
              <p className="card-text flex-grow-1">
                <strong>Total Diario:</strong>{" "}
                <span className="text-success">
                  Bs. {reportes?.totalDiario?.toFixed(2) || "0.00"}
                </span>
              </p>
              <button
                className="btn btn-outline-success mt-auto"
                onClick={() => handleCardClick("facturacion")}
              >
                Iniciar Facturación
              </button>
            </div>
          </div>
        </div>

        {/* Impuestos */}
        {esAdmin && (
          <div className="col">
            <div className="card shadow-sm h-100 border-0">
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <FaDollarSign size={32} className="text-danger" />
                  <span className="badge bg-danger">IVA</span>
                </div>
                <h5 className="card-title">Impuestos</h5>
                <p className="card-text flex-grow-1">
                  <strong>Pendientes:</strong>{" "}
                  <span className="text-danger">
                    Bs. {reportes?.impuestos?.toFixed(2) || "0.00"}
                  </span>
                </p>
                <button
                  className="btn btn-outline-danger mt-auto"
                  onClick={() => handleCardClick("impuestos")}
                >
                  Pagar Impuestos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gestión de Personal */}
        {esAdmin && (
          <div className="col">
            <div className="card shadow-sm h-100 border-0">
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <FaUsersCog size={32} className="text-primary" />
                  <span className="badge bg-primary">RRHH</span>
                </div>
                <h5 className="card-title">Personal</h5>
                <p className="card-text flex-grow-1">
                  Gestiona personas, potencia talentos, define roles y cuida la
                  equidad salarial.
                </p>
                <button
                  className="btn btn-outline-primary mt-auto"
                  onClick={() => handleCardClick("personal")}
                >
                  Gestionar Personal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Compras */}
        {esAdmin && (
          <div className="col">
            <div className="card shadow-sm h-100 border-0">
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <FaTruck size={32} className="text-dark" />
                  <span className="badge bg-dark">Compras</span>
                </div>
                <h5 className="card-title">Departamento de Compras</h5>
                <p className="card-text flex-grow-1">Gestiona proveedores.</p>
                <button
                  className="btn btn-outline-info mt-auto"
                  onClick={() => handleCardClick("compras")}
                >
                  Gestionar Proveedores
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detalle de Compras - Solo Admin */}
        {esAdmin && (
          <div className="col">
            <div className="card shadow-sm h-100 border-0">
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <FaTruck size={32} className="text-info" />
                  <span className="badge bg-info">Compras</span>
                </div>
                <h5 className="card-title">Historial de Compras</h5>
                <p className="card-text flex-grow-1">
                  Revisa el detalle de todas las compras realizadas: productos,
                  precios, proveedores y fechas.
                </p>
                <button
                  className="btn btn-outline-info mt-auto"
                  onClick={() => handleCardClick("detalleCompras")}
                >
                  Ver Detalles de Compras
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nueva Compra - Solo Admin */}
        {esAdmin && (
          <div className="col">
            <div className="card shadow-sm h-100 border-0">
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <FaShoppingCart size={32} className="text-info" />
                  <span className="badge bg-info">Compras</span>
                </div>
                <h5 className="card-title">Registrar Nueva Compra</h5>
                <p className="card-text flex-grow-1">
                  Agrega productos comprados, selecciona proveedor y registra el
                  costo.
                </p>
                <button
                  className="btn btn-outline-info mt-auto"
                  onClick={() => handleCardClick("nuevaCompra")}
                >
                  + Nueva Compra
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Inventario */}
        {esSupervisor() && (
          <div className="col">
            <div className="card shadow-sm h-100 border-0">
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <FaBox size={32} className="text-warning" />
                  <span className="badge bg-warning text-dark">Stock</span>
                </div>
                <h5 className="card-title">Inventario</h5>
                <p className="card-text flex-grow-1">
                  Controla productos, precios y niveles de stock.
                </p>
                <button
                  className="btn btn-outline-warning mt-auto"
                  onClick={() => handleCardClick("inventario")}
                >
                  Ver Inventario
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Estado de Cajas */}
        {esSupervisor() && (
          <div className="col">
            <div className="card shadow-sm h-100 border-0">
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <FaDesktop size={32} className="text-info" />
                  <span className="badge bg-info">Cajas</span>
                </div>
                <h5 className="card-title">Estado de Cajas</h5>
                <p className="card-text flex-grow-1">
                  Supervisa el estado en tiempo real de todas las cajas.
                </p>
                <button
                  className="btn btn-outline-info mt-auto"
                  onClick={() => handleCardClick("estadoCajas")}
                >
                  Ver Estado de Cajas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gestionar Facturas */}
        {esSupervisor() && (
          <div className="col">
            <div className="card shadow-sm h-100 border-0">
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <FaFileInvoice size={32} className="text-primary" />
                  <span className="badge bg-primary">Todas</span>
                </div>
                <h5 className="card-title">Gestionar Facturas</h5>
                <p className="card-text flex-grow-1">
                  Consulta, filtra y gestiona todas las facturas generadas.
                </p>
                <button
                  className="btn btn-outline-primary mt-auto"
                  onClick={() => handleCardClick("gestionarFacturas")}
                >
                  Ver Facturas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gestionar Clientes */}
        {esSupervisor() && (
          <div className="col">
            <div className="card shadow-sm h-100 border-0">
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <FaUsers size={32} className="text-primary" />
                  <span className="badge bg-primary">Todos</span>
                </div>
                <h5 className="card-title">Gestionar Clientes</h5>
                <p className="card-text flex-grow-1">
                  Consulta, busca y gestiona todos los clientes registrados.
                </p>
                <button
                  className="btn btn-outline-primary mt-auto"
                  onClick={() => handleCardClick("gestionarClientes")}
                >
                  Ver Clientes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reportes */}
        {esSupervisor() && (
          <div className="col">
            <div className="card shadow-sm h-100 border-0">
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <FaChartLine size={32} className="text-info" />
                  <span className="badge bg-info">Analíticos</span>
                </div>
                <h5 className="card-title">Reportes</h5>
                <p className="card-text flex-grow-1">
                  Visualiza ventas, facturación y tendencias.
                </p>
                <button
                  className="btn btn-outline-info mt-auto"
                  onClick={() => handleCardClick("reportes")}
                >
                  Ver Reportes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actualizar Precios */}
        {esAdmin && (
          <div className="col">
            <div className="card shadow-sm h-100 border-0">
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <FaTags size={32} className="text-danger" />
                  <span className="badge bg-danger">Admin</span>
                </div>
                <h5 className="card-title">Actualizar Precios</h5>
                <p className="card-text flex-grow-1">
                  Ajusta todos los precios por porcentaje o tipo.
                </p>
                <button
                  className="btn btn-outline-dark mt-auto"
                  onClick={() => handleCardClick("actualizarPrecios")}
                >
                  Ajustar Precios
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardCards;
