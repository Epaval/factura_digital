// src/components/AdminDashboard.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import "./AdminDashboard.css";

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

function AdminDashboard({ empleado }) {
  const [reportes, setReportes] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [filtroCliente, setFiltroCliente] = useState("");

  // Función segura para formatear números
  const formatNumber = (value) => {
    const num = parseFloat(value) || 0;
    return num.toFixed(2);
  };

  useEffect(() => {
    const cargarReportes = async () => {
      try {
        const res = await axios.get("http://localhost:5000/reportes/admin");

        // Aseguramos que todos los valores sean números
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
        // Fallback seguro en caso de error
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

  // Datos para el gráfico de torta
  const dataChart = {
    labels: reportes.pagosPorTipo.map(p => p.nombre),
    datasets: [
      {
        data: reportes.pagosPorTipo.map(p => parseFloat(p.total)),
        backgroundColor: [
          "#4CAF50", // Efectivo
          "#2196F3", // Transferencia
          "#FF9800", // Punto de venta
          "#f44336", // Zelle
          "#9C27B0", // Otros
          "#00BCD4",
        ],
        hoverOffset: 4,
      },
    ],
  };

  const opcionesChart = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: Bs.${formatNumber(value)}`;
          }
        }
      }
    }
  };

  return (
    <div className="admin-dashboard p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📊 Dashboard de Administración</h2>
        <div className="text-end">
          <div><strong>{empleado?.nombre} {empleado?.apellido}</strong></div>
          <small>Rol: {empleado?.rol}</small>
        </div>
      </div>

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
              <h3 className="text-warning mb-0">Bs.{formatNumber(reportes.impuestos)}</h3>
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
                <p className="text-muted text-center mb-0">No hay pagos registrados.</p>
              )}
            </div>
          </div>
        </div>

        {/* Compras por cliente */}
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header bg-info text-white">
              <h5>👥 Compras por Cliente</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Filtrar por CI, RIF o nombre..."
                  value={filtroCliente}
                  onChange={(e) => setFiltroCliente(e.target.value)}
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
                    {reportes.comprasPorCliente
                      .filter(cliente =>
                        cliente.nombre.toLowerCase().includes(filtroCliente.toLowerCase()) ||
                        cliente.numero_rif.includes(filtroCliente) ||
                        `${cliente.tipo_rif}-${cliente.numero_rif}`.includes(filtroCliente)
                      )
                      .slice(0, 8) // Mostrar solo los primeros 8
                      .map((c) => (
                        <tr key={c.id}>
                          <td>{c.nombre}</td>
                          <td>{c.tipo_rif}-{c.numero_rif}</td>
                          <td>Bs.{formatNumber(c.total_comprado)}</td>
                          <td>{c.total_facturas}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Productos más vendidos */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-success text-white">
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
                    {reportes.productosVendidos.length > 0 ? (
                      reportes.productosVendidos.map((p, i) => (
                        <tr key={i}>
                          <td>{p.descripcion}</td>
                          <td>{p.codigo}</td>
                          <td>{p.cantidad_vendida}</td>
                          <td><strong>Bs.{formatNumber(p.ingreso_total)}</strong></td>
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
            </div>
          </div>
        </div>
      </div>

      {/* Últimas facturas */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
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
                    {reportes.ultimasFacturas.length > 0 ? (
                      reportes.ultimasFacturas.map((f) => (
                        <tr key={f.numero_factura}>
                          <td>{f.numero_factura}</td>
                          <td>{f.numero_control}</td>
                          <td>{f.cliente_nombre}</td>
                          <td>{f.tipo_rif}-{f.numero_rif}</td>
                          <td>{new Date(f.fecha).toLocaleDateString()}</td>
                          <td><strong>Bs.{formatNumber(f.total)}</strong></td>
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
            </div>
          </div>
        </div>
      </div>

      {/* Top empleados */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-secondary text-white">
              <h5>👤 Top 10 Empleados por Facturación</h5>
            </div>
            <div className="card-body">
              {reportes.facturacionPorEmpleado.length > 0 ? (
                <table className="table table-hover table-striped">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Empleado</th>
                      <th>Total Facturado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportes.facturacionPorEmpleado.map((emp, index) => (
                      <tr key={emp.nombre}>
                        <td>{index + 1}</td>
                        <td>{emp.nombre} {emp.apellido}</td>
                        <td><strong>Bs.{formatNumber(emp.total)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted text-center mb-0">No hay empleados con facturación registrada.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;