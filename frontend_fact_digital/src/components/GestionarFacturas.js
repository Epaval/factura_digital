// src/components/GestionarFacturas.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import FormularioPagos from "./FormularioPagos";

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

  // Cargar tasa del dólar (corregido: sin espacios)
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

  // ✅ Cargar facturas filtradas por cajaId
  useEffect(() => {
    if (!cajaId) return;

    const cargarFacturas = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/facturas/caja/${cajaId}`);
        setFacturas(res.data);
      } catch (err) {
        setError("Error al cargar facturas.");
        console.error(err);
      } finally {
        setCargando(false);
      }
    };

    cargarFacturas();
  }, [cajaId]);

  // Filtrar facturas por estado
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

  // Recuperar detalles de la factura para el modal
  const recuperarFacturaParaPago = async (factura) => {
    try {
      const [detallesRes, clienteRes] = await Promise.all([
        axios.get(`http://localhost:5000/factura-detalle/${factura.id}`),
        axios.get(`http://localhost:5000/clientes/${factura.cliente_id}`)
      ]);

      setFacturaSeleccionada(factura);
      setCliente(clienteRes.data);
      setProductos(detallesRes.data.map(d => ({
        ...d,
        cantidadSeleccionada: d.cantidad,
        precio: parseFloat(d.precio)
      })));
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
    setPaginaActual(1); // Resetear paginación si es necesario
  };

  // Calcular total de la factura
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
      // 1. Actualizar estado a "pagado"
      await axios.put(`http://localhost:5000/facturas/${facturaSeleccionada.id}/estado`, {
        estado: 'pagado'
      });

      // 2. Generar PDF
      const response = await axios.get(
        `http://localhost:5000/facturas/${facturaSeleccionada.id}/pdf`,
        { responseType: "blob" }
      );

      // 3. Descargar PDF
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `factura_${facturaSeleccionada.numero_factura}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // 4. ✅ Cerrar modal y actualizar lista
      cerrarModal();
      setFacturas(prev => prev.map(f => 
        f.id === facturaSeleccionada.id ? { ...f, estado: 'pagado' } : f
      ));

    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Error al generar la factura.");
    }
  };

  if (cargando) return <p>Cargando facturas...</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!cajaId) return <p className="text-muted">No hay caja abierta.</p>;

  return (
    <div className="card mt-4">
      <div className="card-header bg-info text-white">
        <h5>Gestión de Facturas</h5>
      </div>

      {/* Resumen de totales */}
      <div className="card-body bg-light border-bottom">
        <div className="row text-center">
          <div className="col-md-4 mb-3">
            <div className="p-3 bg-warning text-dark rounded">
              <h6>Pendientes</h6>
              <p className="h5 mb-1"><strong>Bs.{totalPendientes.toFixed(2)}</strong></p>
              <small>({countPendientes} factura{countPendientes !== 1 ? "s" : ""})</small>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="p-3 bg-success text-white rounded">
              <h6>Pagadas</h6>
              <p className="h5 mb-1"><strong>Bs.{totalPagados.toFixed(2)}</strong></p>
              <small>({countPagadas} factura{countPagadas !== 1 ? "s" : ""})</small>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="p-3 bg-secondary text-white rounded">
              <h6>SIN PAGO</h6>
              <p className="h5 mb-1"><strong>Bs.{totalSinPago.toFixed(2)}</strong></p>
              <small>({countSinPago} factura{countSinPago !== 1 ? "s" : ""})</small>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="d-flex justify-content-center mb-3">
          <div className="btn-group">
            <button
              className={`btn ${filtroEstado === "todas" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => { setFiltroEstado("todas"); setPaginaActual(1); }}
            >
              Todas
            </button>
            <button
              className={`btn ${filtroEstado === "pendiente" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => { setFiltroEstado("pendiente"); setPaginaActual(1); }}
            >
              Pendientes
            </button>
            <button
              className={`btn ${filtroEstado === "pagado" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => { setFiltroEstado("pagado"); setPaginaActual(1); }}
            >
              Pagadas
            </button>
            <button
              className={`btn ${filtroEstado === "SIN PAGO" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => { setFiltroEstado("SIN PAGO"); setPaginaActual(1); }}
            >
              SIN PAGO
            </button>
          </div>
        </div>
      </div>

      {/* Lista de facturas */}
      <div className="card-body">
        <table className="table table-striped table-hover">
          <thead className="table-dark">
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
                <td colSpan="6" className="text-center">
                  No hay facturas en esta categoría.
                </td>
              </tr>
            ) : (
              facturasPaginadas.map((f) => (
                <tr key={f.id}>
                  <td><strong>{String(f.numero_factura).padStart(7, "0")}</strong></td>
                  <td>{f.cliente_nombre}</td>
                  <td>{new Date(f.fecha).toLocaleDateString()}</td>
                  <td>Bs.{parseFloat(f.total).toFixed(2)}</td>
                  <td>
                    <span
                      className={`badge ${
                        f.estado === "pagado"
                          ? "bg-success"
                          : f.estado === "SIN PAGO"
                          ? "bg-secondary"
                          : "bg-warning text-dark"
                      }`}
                    >
                      {f.estado === "SIN PAGO" ? "SIN PAGO" : f.estado.charAt(0).toUpperCase() + f.estado.slice(1)}
                    </span>
                  </td>
                  <td>
                    {f.estado === "pendiente" && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => recuperarFacturaParaPago(f)}
                      >
                        💳 Pagar
                      </button>
                    )}
                    {(f.estado === "pagado" || f.estado === "SIN PAGO") && (
                      <small className="text-muted">Finalizada</small>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Paginador */}
        {totalPaginas > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <small>Página {paginaActual} de {totalPaginas}</small>
            <div className="btn-group">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setPaginaActual(Math.max(paginaActual - 1, 1))}
                disabled={paginaActual === 1}
              >
                « Anterior
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setPaginaActual(Math.min(paginaActual + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
              >
                Siguiente »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Pago */}
      {facturaSeleccionada && cliente && (
        <div className="modal show" style={{ display: 'block', zIndex: 1050 }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Pagar Factura Pendiente</h5>
                <button type="button" className="btn-close" onClick={cerrarModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <strong>Cliente:</strong> {cliente.nombre} ({cliente.tipo_rif}-{cliente.numero_rif})
                </div>
                <div className="mb-3">
                  <strong>Total a pagar:</strong> Bs.{totalFactura.toFixed(2)}
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