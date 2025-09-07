import React, { useState, useEffect } from "react";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import "./AdminDashboard.css";
import ActualizarPreciosModal from "./ActualizarPreciosModal";
import PagoImpuestos from "./PagoImpuestos";
import GestionarPersonal from "./GestionarPersonal";

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

function AdminDashboard({ empleado }) {
  const [reportes, setReportes] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [filtroCliente, setFiltroCliente] = useState("");

  // ✅ Estado para el modal de actualización de precios
  const [mostrarModalActualizarPrecios, setMostrarModalActualizarPrecios] = useState(false);

  // Paginación para cada tabla
  const [paginaCompras, setPaginaCompras] = useState(1);
  const [paginaProductos, setPaginaProductos] = useState(1);
  const [paginaFacturas, setPaginaFacturas] = useState(1);
  const [paginaEmpleados, setPaginaEmpleados] = useState(1);

  // Función segura para formatear números
  const formatNumber = (value) => {
    const num = parseFloat(value) || 0;
    return num.toFixed(2);
  };

  // ✅ Función para manejar la actualización de precios
  const handleActualizarPrecios = async ({ porcentaje, tipo }) => {
    try {
      const res = await axios.post("http://localhost:5000/productos/actualizar-precios", {
        porcentaje,
        tipo,
        rol: empleado.rol,
      });

      alert(res.data.mensaje);
      setMostrarModalActualizarPrecios(false);
    } catch (err) {
      const mensaje = err.response?.data?.message || "Error al actualizar precios.";
      alert(mensaje);
    }
  };

  useEffect(() => {
    const cargarReportes = async () => {
      try {
        const res = await axios.get("http://localhost:5000/reportes/admin");
        const data = res.data;

        setReportes({
          totalDiario: parseFloat(data.totalDiario) || 0,
          totalSemanal: parseFloat(data.totalSemanal) || 0,
          totalMensual: parseFloat(data.totalMensual) || 0,
          totalGeneral: parseFloat(data.totalGeneral) || 0,
          impuestos: parseFloat(data.impuestos) || 0,
          pagosPorTipo: Array.isArray(data.pagosPorTipo) ? data.pagosPorTipo : [],
          facturacionPorCaja: Array.isArray(data.facturacionPorCaja) ? data.facturacionPorCaja : [],
          facturacionPorEmpleado: Array.isArray(data.facturacionPorEmpleado) ? data.facturacionPorEmpleado : [],
          productosVendidos: Array.isArray(data.productosVendidos) ? data.productosVendidos : [],
          ultimasFacturas: Array.isArray(data.ultimasFacturas) ? data.ultimasFacturas : [],
          comprasPorCliente: Array.isArray(data.comprasPorCliente) ? data.comprasPorCliente : [],
        });
      } catch (err) {
        console.error("Error al cargar reportes:", err);
        setReportes({
          totalDiario: 0,
          totalSemanal: 0,
          totalMensual: 0,
          totalGeneral: 0,
          impuestos: 0,
          pagosPorTipo: [],
          facturacionPorCaja: [],
          facturacionPorEmpleado: [],
          productosVendidos: [],
          ultimasFacturas: [],
          comprasPorCliente: [],
        });
      } finally {
        setCargando(false);
      }
    };

    cargarReportes();
  }, []);

  if (cargando) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando reportes...</span>
        </div>
        <p className="mt-3">Cargando dashboard del administrador...</p>
      </div>
    );
  }

  // ✅ Datos para el gráfico de torta
  const dataChart = {
    labels: reportes.pagosPorTipo.map((p) => p.nombre),
    datasets: [
      {
        data: reportes.pagosPorTipo.map((p) => parseFloat(p.total)),
        backgroundColor: ["#4CAF50", "#2196F3", "#FF9800", "#f44336", "#9C27B0", "#00BCD4"],
        hoverOffset: 4,
      },
    ],
  };

  const opcionesChart = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.raw || 0;
            return `${label}: Bs.${formatNumber(value)}`;
          },
        },
      },
    },
  };

  // Filtrado y paginación para Compras por Cliente
  const comprasFiltradas = reportes.comprasPorCliente.filter(
    (cliente) =>
      cliente.nombre.toLowerCase().includes(filtroCliente.toLowerCase()) ||
      cliente.numero_rif.includes(filtroCliente) ||
      `${cliente.tipo_rif}-${cliente.numero_rif}`.includes(filtroCliente)
  );

  const comprasPaginadas = comprasFiltradas.slice((paginaCompras - 1) * 6, paginaCompras * 6);
  const totalPaginasCompras = Math.ceil(comprasFiltradas.length / 6);

  // Paginación Productos Más Vendidos
  const productosPaginados = reportes.productosVendidos
    .slice((paginaProductos - 1) * 6, paginaProductos * 6);
  const totalPaginasProductos = Math.ceil(reportes.productosVendidos.length / 6);

  // Paginación Últimas Facturas
  const facturasPaginadas = reportes.ultimasFacturas
    .slice((paginaFacturas - 1) * 6, paginaFacturas * 6);
  const totalPaginasFacturas = Math.ceil(reportes.ultimasFacturas.length / 6);

  // Paginación Top Empleados
  const empleadosPaginados = reportes.facturacionPorEmpleado
    .slice((paginaEmpleados - 1) * 6, paginaEmpleados * 6);
  const totalPaginasEmpleados = Math.ceil(reportes.facturacionPorEmpleado.length / 6);

  return (
    <div className="admin-dashboard p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📊 Dashboard de Administración</h2>
        <div className="text-end">
          <div>
            <strong>
              {empleado?.nombre} {empleado?.apellido}
            </strong>
          </div>
          <small>Rol: {empleado?.rol}</small>
        </div>
      </div>

      {/* Botón: Actualizar Precios (solo admin) */}
      {empleado?.rol === "admin" && (
        <div className="mb-4 text-center">
          <button
            className="btn btn-danger btn-lg px-4"
            onClick={() => setMostrarModalActualizarPrecios(true)}
          >
            💸 Actualizar Todos los Precios
          </button>
        </div>
      )}

      {/* Resumen de facturación */}
      <div className="row mb-4 g-3">
        <div className="col-md-3">
          <div className="card bg-primary text-white h-100 shadow-sm">
            <div className="card-body">
              <h6 className="text-white-50">Diario</h6>
              <h4 className="mb-0">Bs.{formatNumber(reportes.totalDiario)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white h-100 shadow-sm">
            <div className="card-body">
              <h6 className="text-white-50">Semanal</h6>
              <h4 className="mb-0">Bs.{formatNumber(reportes.totalSemanal)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white h-100 shadow-sm">
            <div className="card-body">
              <h6 className="text-white-50">Mensual</h6>
              <h4 className="mb-0">Bs.{formatNumber(reportes.totalMensual)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-dark text-white h-100 shadow-sm">
            <div className="card-body">
              <h6 className="text-white-50">Total</h6>
              <h4 className="mb-0">Bs.{formatNumber(reportes.totalGeneral)}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Impuestos */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card bg-warning bg-opacity-10 border-warning h-100 shadow-sm">
            <div className="card-body">
              <h5>📈 Impuestos Recaudados (IVA 16%)</h5>
              <h3 className="text-warning mb-0">
                Bs.{formatNumber(reportes.impuestos)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos y listados */}
      <div className="row mb-4">
        {/* Gráfico de pagos */}
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header bg-warning text-dark">
              <h5>📈 Métodos de Pago</h5>
            </div>
            <div className="card-body d-flex justify-content-center p-4">
              {reportes.pagosPorTipo.length > 0 ? (
                <Pie data={dataChart} options={opcionesChart} />
              ) : (
                <p className="text-muted text-center mb-0">
                  No hay pagos registrados.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Compras por cliente */}
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
              <h5>👥 Compras por Cliente</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Filtrar por CI, RIF o nombre..."
                  value={filtroCliente}
                  onChange={(e) => {
                    setFiltroCliente(e.target.value);
                    setPaginaCompras(1);
                  }}
                />
              </div>
              <div className="table-responsive">
                <table className="table table-sm table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Cliente</th>
                      <th>RIF</th>
                      <th>Total Comprado</th>
                      <th>Facturas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comprasPaginadas.length > 0 ? (
                      comprasPaginadas.map((c) => (
                        <tr key={c.id}>
                          <td>{c.nombre}</td>
                          <td>
                            {c.tipo_rif}-{c.numero_rif}
                          </td>
                          <td>Bs.{formatNumber(c.total_comprado)}</td>
                          <td>{c.total_facturas}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-muted text-center">
                          No hay clientes que coincidan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginador */}
              {totalPaginasCompras > 1 && (
                <nav className="d-flex justify-content-center mt-3">
                  <ul className="pagination pagination-sm">
                    <li
                      className={`page-item ${
                        paginaCompras === 1 ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setPaginaCompras(paginaCompras - 1)}
                        disabled={paginaCompras === 1}
                      >
                        Anterior
                      </button>
                    </li>
                    {[...Array(totalPaginasCompras)].map((_, i) => (
                      <li
                        key={i + 1}
                        className={`page-item ${
                          paginaCompras === i + 1 ? "active" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setPaginaCompras(i + 1)}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li
                      className={`page-item ${
                        paginaCompras === totalPaginasCompras ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setPaginaCompras(paginaCompras + 1)}
                        disabled={paginaCompras === totalPaginasCompras}
                      >
                        Siguiente
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Productos más vendidos */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
              <h5>📦 Productos Más Vendidos</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Código</th>
                      <th>Cantidad Vendida</th>
                      <th>Ingreso Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosPaginados.length > 0 ? (
                      productosPaginados.map((p, i) => (
                        <tr key={i}>
                          <td>{p.descripcion}</td>
                          <td>{p.codigo}</td>
                          <td>{p.cantidad_vendida}</td>
                          <td>
                            <strong>Bs.{formatNumber(p.ingreso_total)}</strong>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-muted text-center">
                          No hay productos vendidos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginador */}
              {totalPaginasProductos > 1 && (
                <nav className="d-flex justify-content-center mt-3">
                  <ul className="pagination pagination-sm">
                    <li
                      className={`page-item ${
                        paginaProductos === 1 ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setPaginaProductos(paginaProductos - 1)}
                        disabled={paginaProductos === 1}
                      >
                        Anterior
                      </button>
                    </li>
                    {[...Array(totalPaginasProductos)].map((_, i) => (
                      <li
                        key={i + 1}
                        className={`page-item ${
                          paginaProductos === i + 1 ? "active" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setPaginaProductos(i + 1)}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li
                      className={`page-item ${
                        paginaProductos === totalPaginasProductos
                          ? "disabled"
                          : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setPaginaProductos(paginaProductos + 1)}
                        disabled={paginaProductos === totalPaginasProductos}
                      >
                        Siguiente
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Últimas facturas */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5>📄 Últimas Facturas</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>N° Factura</th>
                      <th>Control</th>
                      <th>Cliente</th>
                      <th>RIF</th>
                      <th>Fecha</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturasPaginadas.length > 0 ? (
                      facturasPaginadas.map((f) => (
                        <tr key={f.numero_factura}>
                          <td>{f.numero_factura}</td>
                          <td>{f.numero_control}</td>
                          <td>{f.cliente_nombre}</td>
                          <td>
                            {f.tipo_rif}-{f.numero_rif}
                          </td>
                          <td>{new Date(f.fecha).toLocaleDateString()}</td>
                          <td>
                            <strong>Bs.{formatNumber(f.total)}</strong>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-muted text-center">
                          No hay facturas registradas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginador */}
              {totalPaginasFacturas > 1 && (
                <nav className="d-flex justify-content-center mt-3">
                  <ul className="pagination pagination-sm">
                    <li
                      className={`page-item ${
                        paginaFacturas === 1 ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setPaginaFacturas(paginaFacturas - 1)}
                        disabled={paginaFacturas === 1}
                      >
                        Anterior
                      </button>
                    </li>
                    {[...Array(totalPaginasFacturas)].map((_, i) => (
                      <li
                        key={i + 1}
                        className={`page-item ${
                          paginaFacturas === i + 1 ? "active" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setPaginaFacturas(i + 1)}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li
                      className={`page-item ${
                        paginaFacturas === totalPaginasFacturas
                          ? "disabled"
                          : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setPaginaFacturas(paginaFacturas + 1)}
                        disabled={paginaFacturas === totalPaginasFacturas}
                      >
                        Siguiente
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top empleados */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
              <h5>👤 Top 10 Empleados por Facturación</h5>
            </div>
            <div className="card-body">
              {empleadosPaginados.length > 0 ? (
                <table className="table table-hover table-striped">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Empleado</th>
                      <th>Total Facturado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empleadosPaginados.map((emp, index) => (
                      <tr key={emp.nombre}>
                        <td>{(paginaEmpleados - 1) * 6 + index + 1}</td>
                        <td>
                          {emp.nombre} {emp.apellido}
                        </td>
                        <td>
                          <strong>Bs.{formatNumber(emp.total)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted text-center mb-0">
                  No hay empleados con facturación registrada.
                </p>
              )}

              {/* Paginador */}
              {totalPaginasEmpleados > 1 && (
                <nav className="d-flex justify-content-center mt-3">
                  <ul className="pagination pagination-sm">
                    <li
                      className={`page-item ${
                        paginaEmpleados === 1 ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setPaginaEmpleados(paginaEmpleados - 1)}
                        disabled={paginaEmpleados === 1}
                      >
                        Anterior
                      </button>
                    </li>
                    {[...Array(totalPaginasEmpleados)].map((_, i) => (
                      <li
                        key={i + 1}
                        className={`page-item ${
                          paginaEmpleados === i + 1 ? "active" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setPaginaEmpleados(i + 1)}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li
                      className={`page-item ${
                        paginaEmpleados === totalPaginasEmpleados
                          ? "disabled"
                          : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setPaginaEmpleados(paginaEmpleados + 1)}
                        disabled={paginaEmpleados === totalPaginasEmpleados}
                      >
                        Siguiente
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Actualización de Precios */}
      {mostrarModalActualizarPrecios && (
        <ActualizarPreciosModal
          onClose={() => setMostrarModalActualizarPrecios(false)}
          onActualizar={handleActualizarPrecios}
        />
      )}

      {/* Pago de Impuestos (solo admin) */}
      {empleado?.rol === "admin" && (
        <div className="row mt-5">
          <div className="col-12">
            <PagoImpuestos />
          </div>
        </div>
      )}
      {empleado?.rol === "admin" && (
        <div className="row mt-5">
          <div className="col-12">            
            <GestionarPersonal />
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;