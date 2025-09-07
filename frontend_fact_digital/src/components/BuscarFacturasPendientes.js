// src/components/BuscarFacturasPendientes.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import FormularioPagos from "./FormularioPagos";
import {
  FaSearch,
  FaFileInvoice,
  FaDollarSign,
  FaUser,
  FaBoxOpen,
  FaArrowLeft,
  FaSpinner,
  FaTimes,
  FaCheckCircle,
} from "react-icons/fa";

function BuscarFacturasPendientes({ cajaId, setSelectedCliente, setSelectedProducts }) {
  const [numero, setNumero] = useState("");
  const [facturas, setFacturas] = useState([]);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [productos, setProductos] = useState([]);
  const [totalPagado, setTotalPagado] = useState(0);
  const [dollarRate, setDollarRate] = useState(30);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

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

  // Buscar facturas pendientes
  const buscar = async () => {
    if (!numero.trim()) {
      setError("Ingrese un número de RIF o factura.");
      return;
    }
    setError("");
    setCargando(true);
    try {
      const res = await axios.get(`http://localhost:5000/facturas/pendientes`);
      const encontradas = res.data.filter(
        (f) =>
          f.numero_rif?.includes(numero) ||
          String(f.numero_factura).includes(numero)
      );
      setFacturas(encontradas);
    } catch (err) {
      setError("Error al buscar facturas. Verifique la conexión.");
      setFacturas([]);
    } finally {
      setCargando(false);
    }
  };

  // Recuperar detalles de la factura
  const recuperarFactura = async (factura) => {
    if (!factura.cliente_id) {
      setError("Factura no tiene cliente asociado.");
      return;
    }

    try {
      const [detallesRes, clienteRes, totalRes] = await Promise.all([
        axios.get(`http://localhost:5000/factura-detalle/${factura.id}`),
        axios.get(`http://localhost:5000/clientes/${factura.cliente_id}`),
        axios.get(`http://localhost:5000/pagos/total/${factura.id}`),
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
      setTotalPagado(parseFloat(totalRes.data.total_pagado) || 0);
    } catch (error) {
      console.error("Error al cargar factura:", error);
      setError("No se pudo cargar la factura. Verifique los datos.");
    }
  };

  // Cerrar modal
  const cerrarModal = () => {
    setFacturaSeleccionada(null);
    setCliente(null);
    setProductos([]);
    setTotalPagado(0);
    setError("");
  };

  // Calcular total de la factura
  const totalFactura = productos.reduce(
    (sum, p) => sum + p.precio * p.cantidadSeleccionada * dollarRate,
    0
  );

  // Verificar si se puede generar la factura
  const puedeGenerarFactura = totalPagado >= totalFactura - 0.01;

  // Generar PDF de la factura existente
  const generarFacturaPDF = async () => {
    if (!facturaSeleccionada || !cliente || productos.length === 0) return;

    try {
      await axios.put(
        `http://localhost:5000/facturas/${facturaSeleccionada.id}/estado`,
        { estado: "pagado" }
      );

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

      // Notificar al componente principal
      if (setSelectedCliente && setSelectedProducts) {
        setSelectedCliente(cliente);
        setSelectedProducts(productos);
      }

      cerrarModal();
    } catch (error) {
      console.error("Error al generar PDF:", error);
      setError("Error al generar la factura.");
    }
  };

  return (
    <div className="mt-4">
      {/* Sección de búsqueda */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-gradient text-white d-flex align-items-center gap-2">
          <FaFileInvoice /> Recuperar Facturas Pendientes
        </div>
        <div className="card-body">
          <div className="row g-3 mb-3 align-items-center">
            <div className="col-12 col-md-8">
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Buscar por RIF o número de factura..."
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && buscar()}
                  autoFocus
                />
              </div>
            </div>
            <div className="col-12 col-md-4">
              <button
                className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={buscar}
                disabled={cargando}
              >
                {cargando ? (
                  <>
                    <FaSpinner className="spinner" /> Buscando...
                  </>
                ) : (
                  <>
                    <FaSearch /> Buscar
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2">
              <FaTimes /> {error}
            </div>
          )}

          {/* Tabla de resultados */}
          {facturas.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>N° Factura</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Caja Origen</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <code>{f.numero_factura}</code>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <FaUser size={16} className="text-muted" />
                          {f.cliente_nombre}
                        </div>
                      </td>
                      <td>Bs.{parseFloat(f.total).toFixed(2)}</td>
                      <td>
                        <span className="badge bg-info">Caja {f.caja_origen}</span>
                      </td>
                      <td>
                        <span className="badge bg-warning text-dark d-flex align-items-center gap-1">
                          <FaBoxOpen size={12} />
                          Pendiente
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-success btn-sm d-flex align-items-center gap-1"
                          onClick={() => recuperarFactura(f)}
                        >
                          <FaDollarSign size={14} /> Pagar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !cargando &&
            numero && (
              <div className="text-center py-4 text-muted">
                <FaFileInvoice size={32} className="mb-2" />
                <p>No se encontraron facturas pendientes.</p>
              </div>
            )
          )}
        </div>
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
                  <FaDollarSign /> Pagar Factura Pendiente
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white ms-auto"
                  onClick={cerrarModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-3 mb-4">
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

                {error && (
                  <div className="alert alert-danger">
                    <FaTimes /> {error}
                  </div>
                )}

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

export default BuscarFacturasPendientes;