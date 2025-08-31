// src/App.js
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductosSelect from "./components/ProductosSelect";
import ClientesSelect from "./components/ClientesSelect";
import ProductosTable from "./components/ProductosTable";
import ClientesTable from "./components/ClientesTable";
import ModalMensaje from "./components/ModalMensaje";
import ModalEditarCliente from "./components/ModalEditarCliente";
import ModalNuevoCliente from "./components/ModalNuevoCliente";
import ModalConsultarProductos from "./components/ModalConsultarProductos";
import FormularioPagos from "./components/FormularioPagos";
import GestionarFacturas from "./components/GestionarFacturas";
import BuscarFacturasPorCliente from "./components/BuscarFacturasPorCliente";
import LoginCaja from "./components/LoginCaja";
import ModalCierreCaja from "./components/ModalCierreCaja";
import BuscarFacturasPendientes from "./components/BuscarFacturasPendientes";
import DashboardCajas from "./components/DashboardCajas";
import "./App.css";

function App() {
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalEditarCliente, setMostrarModalEditarCliente] =
    useState(false);
  const [clienteAEditar, setClienteAEditar] = useState(null);
  const [mensajeModal, setMensajeModal] = useState("");
  const [mostrarModalNuevoCliente, setMostrarModalNuevoCliente] =
    useState(false);
  const [mostrarModalConsultarProductos, setMostrarModalConsultarProductos] =
    useState(false);
  const [siguienteNumeroFactura, setSiguienteNumeroFactura] = useState(0);
  const [siguienteNumeroControl, setSiguienteNumeroControl] =
    useState("00-000000");
  const [dollarRate, setDollarRate] = useState(0);
  const [cargandoTasa, setCargandoTasa] = useState(true);
  const [totalPagado, setTotalPagado] = useState(0);
  const [mostrarGestionarFacturas, setMostrarGestionarFacturas] =
    useState(false);
  const [mostrarBuscarFacturas, setMostrarBuscarFacturas] = useState(false);
  const [cajaId, setCajaId] = useState(null);
  const [empleado, setEmpleado] = useState(null);
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);
  const [mostrarDashboard, setMostrarDashboard] = useState(false);
  const [facturaId, setFacturaId] = useState(null);

  const handleCajaAbierta = (empleado, caja_id) => {
    setEmpleado(empleado);
    setCajaId(caja_id);
  };

  const cerrarCaja = () => {
    setMostrarModalCierre(true);
  };

  const confirmarCierre = async () => {
    setMostrarModalCierre(false);
    try {
      await axios.post("http://localhost:5000/cajas/cerrar", {
        caja_id: Number(cajaId),
      });
      localStorage.removeItem("caja_id");
      localStorage.removeItem("empleado_id");
      setCajaId(null);
      setEmpleado(null);
      setMensajeModal("Caja cerrada exitosamente.");
      setMostrarModal(true);
    } catch (err) {
      const mensaje = err.response?.data?.message || "Error al cerrar caja.";
      setMensajeModal(mensaje);
      setMostrarModal(true);
    }
  };

  useEffect(() => {
    const savedCaja = localStorage.getItem("caja_id");
    if (savedCaja) {
      setCajaId(Number(savedCaja));
    }
  }, []);

  const generarSiguienteNumeroControl = useCallback((ultimo) => {
    const num = parseInt(ultimo.split("-")[1], 10) + 1;
    return `00-${String(num).padStart(6, "0")}`;
  }, []);

  useEffect(() => {
    if (!cajaId) return;
    const cargarDatos = async () => {
      try {
        const [productosRes, clientesRes, facturasRes] = await Promise.all([
          axios.get("http://localhost:5000/productos"),
          axios.get("http://localhost:5000/clientes"),
          axios.get("http://localhost:5000/facturas/ultimo-numero"),
        ]);
        setProductos(productosRes.data);
        setClientes(clientesRes.data);
        const { ultimoNumeroFactura = 0, ultimoNumeroControl = "00-000000" } =
          facturasRes.data;
        setSiguienteNumeroFactura(ultimoNumeroFactura + 1);
        setSiguienteNumeroControl(
          generarSiguienteNumeroControl(ultimoNumeroControl)
        );
      } catch (error) {
        setMensajeModal("Error al cargar datos iniciales.");
        setMostrarModal(true);
      }
    };
    cargarDatos();
  }, [cajaId, generarSiguienteNumeroControl]);

  useEffect(() => {
    if (!cajaId) return;
    const cargarTasa = async () => {
      try {
        const res = await axios.get(
          "https://ve.dolarapi.com/v1/dolares/oficial"
        );
        setDollarRate(res.data.promedio);
      } catch (error) {
        setMensajeModal("Tasa no disponible. Usando 30.");
        setDollarRate(30);
      } finally {
        setCargandoTasa(false);
      }
    };
    cargarTasa();
  }, [cajaId]);

  const cargarUltimosNumeros = useCallback(async () => {
    if (!cajaId) return;
    try {
      const res = await axios.get(
        "http://localhost:5000/facturas/ultimo-numero"
      );
      const { ultimoNumeroFactura = 0, ultimoNumeroControl = "00-000000" } =
        res.data;
      setSiguienteNumeroFactura(ultimoNumeroFactura + 1);
      setSiguienteNumeroControl(
        generarSiguienteNumeroControl(ultimoNumeroControl)
      );
    } catch (error) {
      console.error("Error al cargar números:", error);
    }
  }, [generarSiguienteNumeroControl, cajaId]);

  const abrirModalConsultarProductos = () =>
    setMostrarModalConsultarProductos(true);
  const cerrarModalConsultarProductos = () =>
    setMostrarModalConsultarProductos(false);
  const abrirModalNuevoCliente = () => setMostrarModalNuevoCliente(true);
  const cerrarModalNuevoCliente = () => setMostrarModalNuevoCliente(false);
  const abrirModalEditarCliente = (cliente) => {
    setClienteAEditar(cliente);
    setMostrarModalEditarCliente(true);
  };

  const handleAddProduct = useCallback((producto) => {
    setSelectedProducts((prev) => {
      const existe = prev.find((p) => p.id === producto.id);
      if (existe) {
        return prev.map((p) =>
          p.id === producto.id
            ? { ...p, cantidadSeleccionada: p.cantidadSeleccionada + 1 }
            : p
        );
      }
      return [...prev, { ...producto, cantidadSeleccionada: 1 }];
    });
  }, []);

  const handleAddCliente = useCallback((cliente) => {
    setSelectedCliente(cliente);
  }, []);

  const handleCantidadChange = useCallback((index, cantidad) => {
    setSelectedProducts((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, cantidadSeleccionada: cantidad } : p
      )
    );
  }, []);

  const handleEliminarProducto = useCallback((index) => {
    setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const mostrarMensaje = (mensaje) => {
    setMensajeModal(mensaje);
    setMostrarModal(true);
  };

  const cerrarModal = () => setMostrarModal(false);

  const totalFactura = selectedProducts.reduce(
    (sum, p) =>
      sum + (parseFloat(p.precio) || 0) * p.cantidadSeleccionada * dollarRate,
    0
  );

  // Generar factura (PDF)
  const generarFactura = async (facturaData) => {
    if (!selectedCliente || selectedProducts.length === 0) {
      mostrarMensaje("Seleccione cliente y productos.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/facturas/generar-pdf",
        facturaData,
        { responseType: "blob" }
      );

      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      const numeroFactura = response.headers["x-numero-factura"] || "factura";
      link.download = `factura_${numeroFactura}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Limpiar estado
      setSelectedCliente(null);
      setSelectedProducts([]);
      setTotalPagado(0);
      cargarUltimosNumeros();
      mostrarMensaje("Factura generada y descargada exitosamente.");
    } catch (error) {
      if (error.response) {
        mostrarMensaje(
          `Error: ${error.response.data.message || "No se pudo generar."}`
        );
      } else {
        mostrarMensaje("Error de conexión.");
      }
    }
  };

  // Guardar factura como pendiente
  const guardarFacturaPendiente = async () => {
    if (!selectedCliente || selectedProducts.length === 0) {
      mostrarMensaje("Seleccione cliente y productos.");
      return;
    }

    const total = selectedProducts.reduce(
      (sum, p) =>
        sum + (parseFloat(p.precio) || 0) * p.cantidadSeleccionada * dollarRate,
      0
    );

    try {
      const res = await axios.post("http://localhost:5000/facturas/guardar", {
        cliente_id: selectedCliente.id,
        productos: selectedProducts,
        total,
      });

      mostrarMensaje(
        `Factura pendiente guardada N°: ${res.data.numero_factura}`
      );
      // No limpiamos el estado para permitir seguir trabajando
      setSelectedCliente(null);
      setSelectedProducts([]);
      setMostrarBuscarFacturas(false);
    } catch (error) {
      mostrarMensaje("Error al guardar factura pendiente.");
    }
  };

  const guardarNuevoCliente = (nuevoCliente) => {
    axios
      .post("http://localhost:5000/clientes", nuevoCliente)
      .then((res) => {
        setClientes((prev) => [...prev, res.data]);
        mostrarMensaje("Cliente registrado.");
      })
      .catch(() => mostrarMensaje("Error al registrar cliente."));
  };

  const guardarClienteEditado = (clienteActualizado) => {
    axios
      .put(
        `http://localhost:5000/clientes/${clienteActualizado.id}`,
        clienteActualizado
      )
      .then((res) => {
        setClientes((prev) =>
          prev.map((c) => (c.id === clienteActualizado.id ? res.data : c))
        );
        mostrarMensaje("Cliente actualizado.");
        setMostrarModalEditarCliente(false);
      })
      .catch(() => mostrarMensaje("Error al actualizar cliente."));
  };

  const actualizarProducto = (productoActualizado) => {
    axios
      .put(
        `http://localhost:5000/productos/${productoActualizado.id}`,
        productoActualizado
      )
      .then((res) => {
        setProductos((prev) =>
          prev.map((p) => (p.id === productoActualizado.id ? res.data : p))
        );
        mostrarMensaje("Producto actualizado.");
      })
      .catch(() => mostrarMensaje("Error al actualizar producto."));
  };

  const agregarProducto = (nuevoProducto) => {
    axios
      .post("http://localhost:5000/productos", nuevoProducto)
      .then((res) => {
        setProductos((prev) => [...prev, res.data]);
        mostrarMensaje("Producto agregado.");
      })
      .catch(() => mostrarMensaje("Error al agregar producto."));
  };

  // Función para recuperar una factura pendiente
  const onSeleccionarFactura = async (factura) => {
    try {
      const [detallesRes, clienteRes] = await Promise.all([
        axios.get(`http://localhost:5000/factura-detalle/${factura.id}`),
        axios.get(`http://localhost:5000/clientes/${factura.cliente_id}`),
      ]);

      setSelectedCliente(clienteRes.data);
      setSelectedProducts(
        detallesRes.data.map((d) => ({
          ...d,
          cantidadSeleccionada: d.cantidad,
          precio: parseFloat(d.precio),
        }))
      );
      setFacturaId(factura.id);
      setMostrarBuscarFacturas(false);
      mostrarMensaje(`Factura N° ${factura.numero_factura} recuperada.`);
    } catch (error) {
      mostrarMensaje("Error al cargar la factura pendiente.");
    }
  };

  const puedeGenerarFactura = totalPagado >= totalFactura - 0.01;

  return (
    <div className="app-container">
      <Header
        onNuevoCliente={abrirModalNuevoCliente}
        onConsultarProductos={abrirModalConsultarProductos}
        onHistorialFacturas={() => setMostrarGestionarFacturas(true)}
        onBuscarFacturas={() => setMostrarBuscarFacturas(true)}
        onVerDashboard={() => setMostrarDashboard(true)}
      />

      <main className="main-content container mt-5">
        {!cajaId ? (
          <div className="text-center">
            <h3>Apertura de Caja</h3>
            <LoginCaja onCajaAbierta={handleCajaAbierta} />
          </div>
        ) : (
          <div>
            <div className="alert alert-info d-flex justify-content-between align-items-center mb-4">
              <div>
                <strong>Caja {cajaId}</strong> - {empleado?.nombre}{" "}
                {empleado?.apellido}
              </div>
              <button className="btn btn-danger btn-sm" onClick={cerrarCaja}>
                🚪 Cerrar Caja
              </button>
            </div>

            {mostrarGestionarFacturas ? (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3>Historial de Facturas</h3>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setMostrarGestionarFacturas(false)}
                  >
                    ← Volver
                  </button>
                </div>
                <GestionarFacturas cajaId={cajaId} />
              </div>
            ) : (
              <>
                {/* Visor de factura */}
                <div className="mb-4">
                  <div className="d-flex flex-column align-items-end">
                    <div
                      className="p-3 border rounded bg-white shadow-sm text-center"
                      style={{ minWidth: "260px" }}
                    >
                      <small className="text-secondary d-block mb-1 fw-bold">
                        Próxima Factura
                      </small>
                      <div className="h5 mb-1 text-dark">
                        <span className="text-primary">
                          {String(siguienteNumeroFactura).padStart(7, "0")}
                        </span>
                      </div>
                      <div className="small text-muted">
                        Control: {siguienteNumeroControl}
                      </div>
                    </div>
                  </div>
                </div>

                <ClientesSelect
                  clientes={clientes}
                  onAddCliente={handleAddCliente}
                />
                <ClientesTable
                  selectedCliente={selectedCliente}
                  onEditarCliente={abrirModalEditarCliente}
                />

                <ProductosSelect
                  productos={productos}
                  onAddProduct={handleAddProduct}
                />
                <ProductosTable
                  selectedProducts={selectedProducts}
                  handleCantidadChange={handleCantidadChange}
                  handleEliminarProducto={handleEliminarProducto}
                />

                <BuscarFacturasPendientes
                  onSeleccionarFactura={(factura) => {
                    setSelectedCliente({
                      id: factura.cliente_id,
                      nombre: factura.cliente_nombre,
                      tipo_rif: factura.tipo_rif,
                      numero_rif: factura.numero_rif,
                    });
                  }}
                  cajaId={cajaId}
                />

                {selectedCliente &&
                  selectedProducts.length > 0 &&
                  !cargandoTasa && (
                    <div className="mt-3 p-3 bg-light rounded">
                      <h5>
                        Total a pagar:{" "}
                        <strong>Bs.{totalFactura.toFixed(2)}</strong>
                      </h5>
                      <p>Tasa BCV: Bs.{dollarRate.toFixed(8)}</p>
                    </div>
                  )}

                {selectedCliente &&
                  selectedProducts.length > 0 &&
                  !cargandoTasa && (
                    <FormularioPagos
                      totalFactura={totalFactura}
                      dollarRate={dollarRate}
                      onGenerarFactura={generarFactura}
                      cajaId={cajaId}
                      selectedCliente={selectedCliente}
                      selectedProducts={selectedProducts}
                    />
                  )}
                {selectedCliente &&
                  selectedProducts.length > 0 &&
                  !cargandoTasa && (
                    <div className="mt-3 text-end">
                      <button
                        className="btn btn-warning btn-lg"
                        onClick={guardarFacturaPendiente}
                      >
                        ⏳ Guardar como Pendiente
                      </button>
                    </div>
                  )}
                {mostrarDashboard && (
                  <div className="mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <button
                        className="btn btn-secondary"
                        onClick={() => setMostrarDashboard(false)}
                      >
                        ← Volver
                      </button>
                    </div>
                    <DashboardCajas />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      <Footer />

      {mostrarModal && (
        <ModalMensaje mensaje={mensajeModal} onCerrar={cerrarModal} />
      )}
      {mostrarModalEditarCliente && (
        <ModalEditarCliente
          mostrar={mostrarModalEditarCliente}
          onCerrar={() => setMostrarModalEditarCliente(false)}
          onGuardar={guardarClienteEditado}
          clienteExistente={clienteAEditar}
        />
      )}
      {mostrarModalNuevoCliente && (
        <ModalNuevoCliente
          mostrar={mostrarModalNuevoCliente}
          onCerrar={cerrarModalNuevoCliente}
          onGuardar={guardarNuevoCliente}
        />
      )}
      <ModalConsultarProductos
        mostrar={mostrarModalConsultarProductos}
        onCerrar={cerrarModalConsultarProductos}
        productos={productos}
        onActualizarProducto={actualizarProducto}
        onAgregarProducto={agregarProducto}
      />
      <BuscarFacturasPorCliente
        show={mostrarBuscarFacturas}
        onClose={() => setMostrarBuscarFacturas(false)}
      />
      <ModalCierreCaja
        show={mostrarModalCierre}
        onClose={() => setMostrarModalCierre(false)}
        onConfirm={confirmarCierre}
        cajaId={cajaId}
        empleado={empleado}
        totalFacturado={totalPagado}
      />

      {/* Modal de búsqueda */}
      <BuscarFacturasPorCliente
        show={mostrarBuscarFacturas}
        onClose={() => setMostrarBuscarFacturas(false)}
        onSeleccionarFactura={onSeleccionarFactura}
      />
    </div>
  );
}

export default App;
