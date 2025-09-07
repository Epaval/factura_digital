// src/components/GestionarFacturas.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import FormularioPagos from "./FormularioPagos";
import {
  FaClipboardList,
  FaFileInvoice,
  FaFilter,
  FaDollarSign,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaArrowLeft,
} from "react-icons/fa";

function GestionarFacturas({ cajaId }) {
  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [paginaActual, setPaginaActual] = useState(1);
  const facturasPorPagina = 10;

  // Estado para el modal de pago
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [productos, setProductos] = useState([]);
  const [dollarRate, setDollarRate] = useState(30);

  // Cargar tasa del dólar
  useEffect(() => {
    const cargarTasa = async () => {
      try {
        const res = await axios.get("https://ve.dolarapi.com/v1/dolares/oficial");
        setDollarRate(res.data.promedio);
      } catch (error) {
        console.warn("Tasa no disponible, usando 30");
        setDollarRate(30);
      }
    };
    cargarTasa();
  }, []);

  // ✅ Cargar TODAS las facturas del sistema
  useEffect(() => {
    const cargarFacturas = async () => {
      setCargando(true);
      setError("");
      try {
        const res = await axios.get("http://localhost:5000/facturas");
        setFacturas(res.data);
      } catch (err) {
        console.error("Error al cargar facturas:", err);
        setError("Error al cargar las facturas. Verifique la conexión.");
      } finally {
        setCargando(false);
      }
    };

    cargarFacturas();
  }, []); // No depende de cajaId

  // Filtrar y calcular totales
  const facturasPendientes = facturas.filter((f) => f.estado === "pendiente");
  const facturasPagadas = facturas.filter((f) => f.estado === "pagado");
  const facturasSinPago = facturas.filter((f) => f.estado === "SIN PAGO");

  const totalPendientes = facturasPendientes.reduce((sum, f) => sum + parseFloat(f.total), 0);
  const totalPagados = facturasPagadas.reduce((sum, f) => sum + parseFloat(f.total), 0);
  const totalSinPago = facturasSinPago.reduce((sum, f) => sum + parseFloat(f.total), 0);

  const countPendientes = facturasPendientes.length;
  const countPagadas = facturasPagadas.length;
  const countSinPago = facturasSinPago.length;

  const facturasFiltradas =
    filtroEstado === "todas"
      ? facturas
      : facturas.filter((f) => f.estado === filtroEstado);

  const indiceUltima = paginaActual * facturasPorPagina;
  const indicePrimera = indiceUltima - facturasPorPagina;
  const facturasPaginadas = facturasFiltradas.slice(indicePrimera, indiceUltima);
  const totalPaginas = Math.ceil(facturasFiltradas.length / facturasPorPagina);

  // Recuperar detalles de la factura
  const recuperarFacturaParaPago = async (factura) => {
    try {
      const [detallesRes, clienteRes] = await Promise.all([
        axios.get(`http://localhost:5000/factura-detalle/${factura.id}`),
        axios.get(`http://localhost:5000/clientes/${factura.cliente_id}`),
      ]);

      setFacturaSeleccionada(factura);
      setCliente(clienteRes.data);
      setProductos(
        detallesRes.data.map((d) => ({
          ...d,
          cantidadSeleccionada: d.cantidad,
          precio: parseFloat(d.precio),
        }))
      );
    } catch (error) {
      console.error("Error al cargar factura:", error);
      alert("No se pudo cargar la factura. Verifique los datos.");
    }
  };

  // Cerrar modal
  const cerrarModal = () => {
    setFacturaSeleccionada(null);
    setCliente(null);
    setProductos([]);
  };

  // Calcular total
  const totalFactura = productos.reduce(
    (sum, p) => sum + (p.precio || 0) * (p.cantidadSeleccionada || 0) * dollarRate,
    0
  );

  // Generar PDF y actualizar estado
  const generarFacturaPDF = async () => {
    if (!facturaSeleccionada || !cliente || productos.length === 0) {
      alert("No se puede generar la factura. Datos incompletos.");
      return;
    }

    try {
      await axios.put(`http://localhost:5000/facturas/${facturaSeleccionada.id}/estado`, {
        estado: "pagado",
      });

      const response = await axios.get(
        `http://localhost:5000/facturas/${facturaSeleccionada.id}/pdf`,
        { responseType: "blob" }
      );

      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `factura_${facturaSeleccionada.numero_factura}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Actualizar estado local
      setFacturas((prev) =>
        prev.map((f) =>
          f.id === facturaSeleccionada.id ? { ...f, estado: "pagado" } : f
        )
      );
      cerrarModal();
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Error al generar la factura.");
    }
  };

  if (cargando) return <div className="text-center mt-4"><div className="spinner-border text-primary" /> Cargando facturas...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="card shadow-sm border-0 mt-4">
      <div className="card-header bg-gradient text-white d-flex align-items-center gap-2">
        <FaClipboardList /> Gestionar Todas las Facturas
      </div>

      {/* Resumen de totales */}
      <div className="card-body bg-light border-bottom">
        <div className="row g-3 text-center">
          <div className="col-md-4">
            <div className="p-3 bg-warning bg-opacity-10 border border-warning rounded-3 h-100">
              <FaExclamationTriangle size={24} className="text-warning mb-2" />
              <h6 className="text-warning mb-1">Pendientes</h6>
              <p className="h5 mb-0 fw-bold text-warning">Bs.{totalPendientes.toFixed(2)}</p>
              <small>({countPendientes} factura{countPendientes !== 1 ? "s" : ""})</small>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-3 bg-success bg-opacity-10 border border-success rounded-3 h-100">
              <FaCheckCircle size={24} className="text-success mb-2" />
              <h6 className="text-success mb-1">Pagadas</h6>
              <p className="h5 mb-0 fw-bold text-success">Bs.{totalPagados.toFixed(2)}</p>
              <small>({countPagadas} factura{countPagadas !== 1 ? "s" : ""})</small>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-3 bg-secondary bg-opacity-10 border border-secondary rounded-3 h-100">
              <FaTimesCircle size={24} className="text-secondary mb-2" />
              <h6 className="text-secondary mb-1">SIN PAGO</h6>
              <p className="h5 mb-0 fw-bold text-secondary">Bs.{totalSinPago.toFixed(2)}</p>
              <small>({countSinPago} factura{countSinPago !== 1 ? "s" : ""})</small>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
          {[
            { key: "todas", label: "Todas", icon: FaFileInvoice },
            { key: "pendiente", label: "Pendientes", icon: FaExclamationTriangle },
            { key: "pagado", label: "Pagadas", icon: FaCheckCircle },
            { key: "SIN PAGO", label: "Sin Pago", icon: FaTimesCircle },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`btn btn-sm px-3 d-flex align-items-center gap-2 ${
                filtroEstado === key ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => {
                setFiltroEstado(key);
                setPaginaActual(1);
              }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de facturas */}
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>N° Factura</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {facturasPaginadas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    <FaFileInvoice size={24} className="mb-2" />
                    <br />
                    <small><strong>Estado actual:</strong> no hay facturas registradas.</small>
                  </td>
                </tr>
              ) : (
                facturasPaginadas.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <code>{String(f.numero_factura).padStart(7, "0")}</code>
                    </td>
                    <td>{f.cliente_nombre}</td>
                    <td>{new Date(f.fecha).toLocaleDateString()}</td>
                    <td>Bs.{parseFloat(f.total).toFixed(2)}</td>
                    <td>
                      <span
                        className={`badge d-flex align-items-center justify-content-center gap-1 ${
                          f.estado === "pagado"
                            ? "bg-success"
                            : f.estado === "SIN PAGO"
                            ? "bg-secondary"
                            : "bg-warning text-dark"
                        } px-3 py-2 rounded-pill`}
                      >
                        {f.estado === "pagado" && <FaCheckCircle size={12} />}
                        {f.estado === "pendiente" && <FaExclamationTriangle size={12} />}
                        {f.estado === "SIN PAGO" && <FaTimesCircle size={12} />}
                        {f.estado === "SIN PAGO" ? "SIN PAGO" : f.estado.charAt(0).toUpperCase() + f.estado.slice(1)}
                      </span>
                    </td>
                    <td>
                      {f.estado === "pendiente" ? (
                        <button
                          className="btn btn-success btn-sm d-flex align-items-center gap-1"
                          onClick={() => recuperarFacturaParaPago(f)}
                        >
                          <FaDollarSign size={14} /> Pagar
                        </button>
                      ) : (
                        <small className="text-muted d-flex align-items-center gap-1">
                          <FaEye size={14} /> Finalizada
                        </small>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador */}
        {totalPaginas > 1 && (
          <nav className="d-flex justify-content-between align-items-center mt-4">
            <small className="text-muted">
              Página {paginaActual} de {totalPaginas}
            </small>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${paginaActual === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setPaginaActual(paginaActual - 1)}
                  disabled={paginaActual === 1}
                >
                  ‹ Anterior
                </button>
              </li>
              {[...Array(totalPaginas)].map((_, i) => (
                <li key={i + 1} className={`page-item ${paginaActual === i + 1 ? "active" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setPaginaActual(i + 1)}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
              <li className={`page-item ${paginaActual === totalPaginas ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setPaginaActual(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                >
                  Siguiente ›
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>

      {/* Modal de Pago */}
      {facturaSeleccionada && cliente && (
        <div
          className="modal show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header bg-primary text-white d-flex align-items-center">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <FaDollarSign /> Pagar Factura
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white ms-auto"
                  onClick={cerrarModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <strong>Cliente:</strong> {cliente.nombre}
                  </div>
                  <div className="col-md-6">
                    <strong>RIF:</strong> {cliente.tipo_rif}-{cliente.numero_rif}
                  </div>
                  <div className="col-md-12">
                    <strong>Total a pagar:</strong>{" "}
                    <span className="text-primary fs-5 fw-bold">
                      Bs.{totalFactura.toFixed(2)}
                    </span>
                  </div>
                </div>
                <FormularioPagos
                  facturaId={facturaSeleccionada.id}
                  totalFactura={totalFactura}
                  dollarRate={dollarRate}
                  onGenerarFactura={generarFacturaPDF}
                  cajaId={cajaId}
                  selectedCliente={cliente}
                  selectedProducts={productos}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionarFacturas;