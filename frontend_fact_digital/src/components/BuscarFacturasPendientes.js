// src/components/BuscarFacturasPendientes.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import FormularioPagos from "./FormularioPagos";

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
      const encontradas = res.data.filter(f =>
        f.numero_rif.includes(numero) ||
        String(f.numero_factura).includes(numero)
      );
      setFacturas(encontradas.length > 0 ? encontradas : []);
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
        axios.get(`http://localhost:5000/pagos/total/${factura.id}`)
      ]);

      setFacturaSeleccionada(factura);
      setCliente(clienteRes.data);
      setProductos(detallesRes.data.map(d => ({
        ...d,
        cantidadSeleccionada: d.cantidad,
        precio: parseFloat(d.precio)
      })));
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

  // Generar PDF de la factura existente (sin crear nueva)
  const generarFacturaPDF = async () => {
    if (!facturaSeleccionada || !cliente || productos.length === 0) return;

    try {
      // 1. Actualizar estado a "pagado"
      await axios.put(`http://localhost:5000/facturas/${facturaSeleccionada.id}/estado`, {
        estado: 'pagado'
      });

      // 2. Generar PDF desde la factura existente
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

      // 4. Limpiar estado del cliente y productos
      cerrarModal();
      
    } catch (error) {
      console.error("Error al generar PDF:", error);
      setError("Error al generar la factura.");
    }
  };

  return (
    <>
      <div className="mt-4 p-3 bg-white border rounded">
        <h6>Recuperar Facturas Pendientes</h6>
        <div className="d-flex gap-2 mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por RIF o número"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && buscar()}
          />
          <button className="btn btn-primary" onClick={buscar} disabled={cargando}>
            {cargando ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {facturas.length > 0 ? (
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Factura</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Caja Origen</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map(f => (
                <tr key={f.id}>
                  <td>{f.numero_factura}</td>
                  <td>{f.cliente_nombre}</td>
                  <td>Bs.{parseFloat(f.total).toFixed(2)}</td>
                  <td>Caja {f.caja_origen}</td>
                  <td>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => recuperarFactura(f)}
                    >
                      Pagar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !cargando && numero && <p>No se encontraron facturas pendientes.</p>
        )}
      </div>

      {/* Modal de Pago */}
      {facturaSeleccionada && cliente && (
        <div className="modal show" style={{ display: 'block', zIndex: 1050 }}>
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
    </>
  );
}

export default BuscarFacturasPendientes;