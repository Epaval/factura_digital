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
import ModalCierreCaja from "./components/ModalCierreCaja";
import BuscarFacturasPorCliente from "./components/BuscarFacturasPorCliente";
import BuscarFacturasPendientes from "./components/BuscarFacturasPendientes";
import DashboardCajas from "./components/DashboardCajas";
import SupervisorFacturas from "./components/SupervisorFacturas";
import AdminDashboard from "./components/AdminDashboard";
import ActualizarPreciosModal from "./components/ActualizarPreciosModal";
import Inventario from "./components/Inventario";
import BuscadorGlobal from "./components/BuscadorGlobal";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardCards from "./components/DashboardCards"; // ✅ Importado
import PagoImpuestos from "./components/PagoImpuestos"; // ✅ Importado
import GestionarPersonal from "./components/GestionarPersonal"; // ✅ Importado
import GestionarClientes from "./components/GestionarClientes";
import Reportes from "./components/Reportes";
import CalculadoraIVA from "./components/CalculadoraIVA";
import HistorialPagosIVA from "./components/HistorialPagosIVA";
import FormularioD100 from "./components/FormularioD100";
import GestionarProveedores from "./components/GestionarProveedores";
import NuevaCompra from "./components/NuevaCompra";
import DetalleCompras from "./components/DetalleCompras";

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
  const [dollarRate, setDollarRate] = useState(30);
  const [cargandoTasa, setCargandoTasa] = useState(true);
  const [totalPagado, setTotalPagado] = useState(0);
  const [mostrarGestionarFacturas, setMostrarGestionarFacturas] =
    useState(false);
  const [mostrarBuscarFacturas, setMostrarBuscarFacturas] = useState(false);
  const [cajaId, setCajaId] = useState(null);
  const [empleado, setEmpleado] = useState(null);
  const [ficha, setFicha] = useState("");
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);
  const [mostrarDashboard, setMostrarDashboard] = useState(false);
  const [mostrarFacturasSupervisor, setMostrarFacturasSupervisor] =
    useState(false);
  const [mostrarModalActualizarPrecios, setMostrarModalActualizarPrecios] =
    useState(false);
  const [moduloActivo, setModuloActivo] = useState(null); // null = dashboard cards
  const [reportes, setReportes] = useState(null); // Para DashboardCards

  // Verificar rol del usuario
  const esSupervisor = () => {
    const rol = empleado?.rol?.trim().toLowerCase();
    return rol === "supervisor" || rol === "admin";
  };

  const esAdmin = () => empleado?.rol === "admin";

  // Funciones para abrir modales
  const abrirModalNuevoCliente = () => setMostrarModalNuevoCliente(true);
  const cerrarModalNuevoCliente = () => setMostrarModalNuevoCliente(false);
  const abrirModalConsultarProductos = () => {
    if (esSupervisor()) {
      setMostrarModalConsultarProductos(true);
    } else {
      setMensajeModal(
        "Acceso denegado. Solo admin o supervisor pueden gestionar productos."
      );
      setMostrarModal(true);
    }
  };
  const cerrarModalConsultarProductos = () =>
    setMostrarModalConsultarProductos(false);
  const abrirModalEditarCliente = (cliente) => {
    setClienteAEditar(cliente);
    setMostrarModalEditarCliente(true);
  };

  const [facturaGenerada, setFacturaGenerada] = useState(null);

  // ✅ Función: Abrir dashboard con cards
  const onVerDashboardAdmin = () => {
    setMostrarDashboard(true);
    setModuloActivo(null);
    // Cargar reportes si es necesario
    if (!reportes) cargarReportes();
  };

  const cargarReportes = async () => {
    try {
      const res = await axios.get("http://localhost:5000/reportes/admin");
      setReportes(res.data);
    } catch (err) {
      console.error("Error al cargar reportes:", err);
    }
  };

  // ✅ Función: Abrir modal de actualización masiva de precios (solo admin)
  const abrirModalActualizarPrecios = () => {
    if (empleado?.rol === "admin") {
      setMostrarModalActualizarPrecios(true);
    } else {
      setMensajeModal(
        "Acceso denegado. Solo el administrador puede actualizar precios masivamente."
      );
      setMostrarModal(true);
    }
  };

  // ✅ Función: Manejar actualización de precios
  const handleActualizarPrecios = async ({ porcentaje, tipo }) => {
    try {
      const res = await axios.post(
        "http://localhost:5000/productos/actualizar-precios",
        {
          porcentaje,
          tipo,
          rol: empleado.rol,
        }
      );
      alert(res.data.mensaje);
      setMostrarModalActualizarPrecios(false);
    } catch (err) {
      const mensaje =
        err.response?.data?.message || "Error al actualizar precios.";
      alert(mensaje);
    }
  };

  // Iniciar sesión
  const iniciarSesion = async () => {
    if (!ficha.trim()) return;
    try {
      const res = await axios.get(
        `http://localhost:5000/empleados/ficha/${ficha}`
      );
      const empleadoData = res.data;
      setEmpleado(empleadoData);

      const rol = empleadoData.rol?.trim().toLowerCase();
      if (rol === "supervisor" || rol === "admin") {
        setMostrarDashboard(true);
        setMensajeModal("Bienvenido al dashboard.");
        setMostrarModal(true);
        cargarReportes();
      }
    } catch (err) {
      setMensajeModal("Empleado no encontrado");
      setMostrarModal(true);
    }
  };

  // Cerrar caja
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
      localStorage.removeItem("empleado_data");
      setCajaId(null);
      setEmpleado(null);
      setFicha("");

      setMensajeModal("Caja cerrada exitosamente.");
      setMostrarModal(true);
    } catch (err) {
      const mensaje = err.response?.data?.message || "Error al cerrar caja.";
      setMensajeModal(mensaje);
      setMostrarModal(true);
    }
  };

  // Cargar caja desde localStorage
  useEffect(() => {
    const savedCaja = localStorage.getItem("caja_id");
    const savedEmpleado = localStorage.getItem("empleado_id");

    if (savedCaja && savedEmpleado) {
      axios
        .get(`http://localhost:5000/cajas/disponibles`)
        .then((res) => {
          const cajasDisponibles = res.data.map((c) => c.id);
          const cajaIdNum = Number(savedCaja);

          if (cajasDisponibles.includes(cajaIdNum)) {
            localStorage.removeItem("caja_id");
            localStorage.removeItem("empleado_id");
            setCajaId(null);
            setEmpleado(null);
            setMensajeModal(
              "La caja fue cerrada en otro dispositivo o sesión."
            );
            setMostrarModal(true);
          } else {
            setCajaId(cajaIdNum);
            setEmpleado(JSON.parse(localStorage.getItem("empleado_data")));
          }
        })
        .catch((err) => {
          console.error("Error al verificar estado de caja:", err);
          localStorage.removeItem("caja_id");
          localStorage.removeItem("empleado_id");
        });
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    if (!cajaId) return;
    const cargarDatos = async () => {
      try {
        const [productosRes, clientesRes] = await Promise.all([
          axios.get("http://localhost:5000/productos"),
          axios.get("http://localhost:5000/clientes"),
        ]);
        setProductos(productosRes.data);
        setClientes(clientesRes.data);
      } catch (error) {
        setMensajeModal("Error al cargar datos iniciales.");
        setMostrarModal(true);
      }
    };
    cargarDatos();
  }, [cajaId]);

  // Cargar tasa de cambio
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

  // Manejo de productos y clientes
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

  // Mostrar mensajes
  const mostrarMensaje = (mensaje) => {
    setMensajeModal(mensaje);
    setMostrarModal(true);
  };

  const cerrarModal = () => setMostrarModal(false);

  // Total de la factura
  const totalFactura = selectedProducts.reduce(
    (sum, p) =>
      sum + (parseFloat(p.precio) || 0) * p.cantidadSeleccionada * dollarRate,
    0
  );

  // Generar factura
  const generarFactura = async (facturaData) => {
    if (!selectedCliente || selectedProducts.length === 0) {
      mostrarMensaje("Seleccione cliente y productos.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/facturas/generar-pdf",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(facturaData),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Error del servidor." }));
        if (errorData.productosSinStock) {
          const mensajeJSX = (
            <div>
              <h6 className="text-danger mb-3">
                <strong>🚫 Producto sin stock</strong>
              </h6>
              <ul className="list-group mb-3">
                {errorData.productosSinStock.map((p) => (
                  <li
                    key={p.id}
                    className="list-group-item d-flex justify-content-between"
                  >
                    <strong>{p.descripcion}</strong>
                    <span className="badge bg-danger">
                      Disponible: {p.disponible}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
          mostrarMensaje(mensajeJSX);
        } else {
          mostrarMensaje(errorData.message || "Error en los datos.");
        }
        return;
      }

      const pdfBlob = await response.blob();
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `factura_${
        response.headers.get("X-Numero-Factura") || "factura"
      }.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setFacturaGenerada({
        numero_factura: response.headers.get("X-Numero-Factura"),
        fecha: new Date().toISOString(),
        caja_id: cajaId,
        cliente_nombre: selectedCliente.nombre,
        tipo_rif: selectedCliente.tipo_rif,
        numero_rif: selectedCliente.numero_rif,
        total: totalFactura,
        metodo_pago: facturaData.pagos?.[0]?.metodo_pago || "Efectivo",
        productos: selectedProducts.map((p) => ({
          id: p.id,
          cantidad: p.cantidadSeleccionada,
          descripcion: p.descripcion,
          precio: p.precio,
        })),
      });

      setSelectedCliente(null);
      setSelectedProducts([]);
      setTotalPagado(0);
      mostrarMensaje("✅ Factura generada.");
    } catch (error) {
      mostrarMensaje("❌ Error: " + error.message);
    }
  };

  // Guardar factura pendiente
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
      setSelectedCliente(null);
      setSelectedProducts([]);
      setMostrarBuscarFacturas(false);
    } catch (error) {
      mostrarMensaje("Error al guardar factura pendiente.");
    }
  };

  // Guardar nuevo cliente
  const guardarNuevoCliente = (nuevoCliente) => {
    axios
      .post("http://localhost:5000/clientes", nuevoCliente)
      .then((res) => {
        setClientes((prev) => [...prev, res.data]);
        mostrarMensaje("Cliente registrado.");
      })
      .catch(() => mostrarMensaje("Error al registrar cliente."));
  };

  // Guardar cliente editado
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

  // Actualizar producto
  const actualizarProducto = (productoActualizado) => {
    axios
      .put(`http://localhost:5000/productos/${productoActualizado.id}`, {
        ...productoActualizado,
        rol: empleado.rol,
      })
      .then((res) => {
        setProductos((prev) =>
          prev.map((p) => (p.id === productoActualizado.id ? res.data : p))
        );
        mostrarMensaje("Producto actualizado.");
      })
      .catch(() => mostrarMensaje("Error al actualizar producto."));
  };

  // Agregar producto
  const agregarProducto = (nuevoProducto) => {
    axios
      .post("http://localhost:5000/productos", {
        ...nuevoProducto,
        rol: empleado.rol,
      })
      .then((res) => {
        setProductos((prev) => [...prev, res.data]);
        mostrarMensaje("Producto agregado.");
      })
      .catch(() => mostrarMensaje("Error al agregar producto."));
  };

  // Recuperar factura pendiente
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
      setMostrarBuscarFacturas(false);
      mostrarMensaje(`Factura N° ${factura.numero_factura} recuperada.`);
    } catch (error) {
      mostrarMensaje("Error al cargar la factura pendiente.");
    }
  };

  // Exponer mostrarMensaje globalmente
  useEffect(() => {
    window.mostrarMensajeGlobal = (mensaje) => {
      setMensajeModal(mensaje);
      setMostrarModal(true);
    };
    return () => delete window.mostrarMensajeGlobal;
  }, []);

  const puedeGenerarFactura = totalPagado >= totalFactura - 0.01;

  return (
    <div className="app-container">
      <Header
        onNuevoCliente={abrirModalNuevoCliente}
        onConsultarProductos={abrirModalConsultarProductos}
        onHistorialFacturas={() => setMostrarGestionarFacturas(true)}
        onBuscarFacturas={() => setMostrarBuscarFacturas(true)}
        onVerDashboard={() => setMostrarDashboard(true)}
        onVerTodasFacturas={() =>
          esSupervisor() && setMostrarFacturasSupervisor(true)
        }
        onVerDashboardAdmin={onVerDashboardAdmin}
        onActualizarPreciosMasivo={abrirModalActualizarPrecios}
        onVerInventario={() => esSupervisor() && setModuloActivo("inventario")}
        esSupervisor={esSupervisor}
        empleado={empleado}
        onSelectProducto={(producto) => handleAddProduct(producto)}
        onSelectCliente={(cliente) => handleAddCliente(cliente)}
      />

      <main className="main-content container mt-5">
        <ErrorBoundary>
          {!cajaId && !mostrarDashboard ? (
            // Pantalla de login
            <div className="d-flex justify-content-center align-items-center min-vh-100 px-3">
              <div
                className="card shadow-lg border-0"
                style={{
                  maxWidth: "420px",
                  width: "100%",
                  borderRadius: "16px",
                }}
              >
                <div className="bg-primary text-white text-center py-4 rounded-top">
                  <h4 className="mb-0">
                    <i className="bi bi-person-badge me-2"></i> Iniciar Sesión
                  </h4>
                  <small>Acceso al sistema de facturación</small>
                </div>
                <div className="card-body p-4">
                  {!empleado ? (
                    <>
                      <p className="text-muted text-center mb-4">
                        Ingrese su número de ficha para continuar
                      </p>
                      <div className="mb-3">
                        <label
                          htmlFor="fichaInput"
                          className="form-label fw-bold"
                        >
                          Número de Ficha
                        </label>
                        <input
                          id="fichaInput"
                          type="text"
                          className="form-control form-control-lg"
                          placeholder="Ej: 1234"
                          value={ficha}
                          onChange={(e) => setFicha(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <button
                        className="btn btn-primary w-100 py-2 mt-3 d-flex align-items-center justify-content-center"
                        onClick={iniciarSesion}
                        disabled={!ficha.trim()}
                      >
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        {ficha.trim() ? "Iniciar Sesión" : "Ingrese su ficha"}
                      </button>
                    </>
                  ) : esSupervisor() ? (
                    <div className="text-center">
                      <div
                        className="spinner-border text-primary mb-3"
                        role="status"
                      />
                      <p>Accediendo al dashboard...</p>
                    </div>
                  ) : (
                    <SeleccionarCaja
                      empleado={empleado}
                      onCajaAbierta={(emp, caja) => {
                        setEmpleado(emp);
                        setCajaId(caja);
                        localStorage.setItem("caja_id", caja);
                        localStorage.setItem("empleado_id", emp.id);
                        localStorage.setItem(
                          "empleado_data",
                          JSON.stringify(emp)
                        );
                      }}
                    />
                  )}
                </div>
                <div className="card-footer bg-light text-center p-2">
                  <img
                    src="/facdin.png"
                    alt="FADIN"
                    style={{ width: "70px", height: "auto" }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              {cajaId && !mostrarDashboard && (
                <>
                  {/* Vista normal de facturación */}
                  <div className="alert alert-info d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <strong>Caja {cajaId}</strong> - {empleado?.nombre}{" "}
                      {empleado?.apellido}
                    </div>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={cerrarCaja}
                    >
                      🚪 Cerrar Caja
                    </button>
                  </div>
                  {/* Componentes de facturación */}
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
                    onSeleccionarFactura={onSeleccionarFactura}
                    cajaId={cajaId}
                  />
                  {selectedCliente &&
                    selectedProducts.length > 0 &&
                    !cargandoTasa && (
                      <div className="mt-3 p-3 bg-light rounded">
                        <h5 className="mb-3">
                          Total a pagar:{" "}
                          <strong>Bs.{totalFactura.toFixed(2)}</strong>
                        </h5>
                        <p>Tasa BCV: Bs.{dollarRate.toFixed(8)}</p>
                       <strong>
                        💵 Monto en $. {(totalFactura / dollarRate).toFixed(2)}
                        </strong>
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
                        facturaGenerada={facturaGenerada}
                        setFacturaGenerada={setFacturaGenerada}
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
                  {mostrarGestionarFacturas && (
                    <div className="mt-4">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4>Historial de Facturas</h4>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setMostrarGestionarFacturas(false)}
                        >
                          ← Volver
                        </button>
                      </div>
                      <GestionarFacturas cajaId={cajaId} />
                    </div>
                  )}
                </>
              )}

              {mostrarDashboard && esSupervisor() && (
                <div className="mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4>Dashboard para Administradores</h4>
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        setMostrarDashboard(false);
                        setModuloActivo(null);
                        setEmpleado(null);
                        setCajaId(null);
                        setFicha("");
                        setMensajeModal("Sesión cerrada. Gracias");
                        setMostrarModal(true);
                      }}
                    >
                      🚪 Cerrar Sesión
                    </button>
                  </div>
                  {/* Vista de módulos */}
                  {moduloActivo === null ? (
                    <DashboardCards
                      empleado={empleado}
                      reportes={reportes}
                      onSeleccionarModulo={(modulo) => setModuloActivo(modulo)}
                    />
                  ) : (
                    <>
                      {/* Módulos para admin */}
                      {moduloActivo === "impuestos" &&
                        empleado?.rol === "admin" && <PagoImpuestos />}
                      {moduloActivo === "personal" &&
                        empleado?.rol === "admin" && <GestionarPersonal />}
                      {moduloActivo === "admin" &&
                        empleado?.rol === "admin" && (
                          <AdminDashboard empleado={empleado} />
                        )}
                      {moduloActivo === "actualizarPrecios" &&
                        empleado?.rol === "admin" && (
                          <ActualizarPreciosModal
                            onClose={() => setModuloActivo(null)}
                            onActualizar={handleActualizarPrecios}
                          />
                        )}
                      {moduloActivo === "compras" &&
                        empleado?.rol === "admin" && <GestionarProveedores />}

                      {moduloActivo === "nuevaCompra" && (
                        <NuevaCompra onVolver={() => setModuloActivo(null)} />
                      )}

                      {moduloActivo === "detalleCompras" && (
                        <DetalleCompras onVolver={() => setModuloActivo(null)} />
                      )}

                      {moduloActivo === "compras" &&
                        empleado?.rol === "admin" && <GestionarProveedores />}

                      {/* Módulos para supervisor o admin */}
                      {moduloActivo === "gestionarFacturas" && (
                        <div className="mt-4">
                          <GestionarFacturas cajaId={cajaId} />
                        </div>
                      )}

                      {/* Módulos para supervisor o admin */}
                      {moduloActivo === "gestionarClientes" && (
                        <div className="mt-4">
                          <GestionarClientes />
                        </div>
                      )}

                      {moduloActivo === "inventario" &&
                        (empleado?.rol === "supervisor" ||
                          empleado?.rol === "admin") && <Inventario />}
                      {moduloActivo === "reportes" &&
                        (empleado?.rol === "supervisor" ||
                          empleado?.rol === "admin") && <Reportes />}
                      {moduloActivo === "estadoCajas" &&
                        (empleado?.rol === "supervisor" ||
                          empleado?.rol === "admin") && (
                          <DashboardCajas
                            empleado={empleado}
                            onCajaCerrada={(id) =>
                              console.log("Caja cerrada:", id)
                            }
                          />
                        )}

                      {/* Mensaje de acceso denegado (opcional) */}
                      {moduloActivo &&
                        ![
                          "gestionarFacturas",
                          "gestionarClientes",
                          "impuestos",
                          "personal",
                          "admin",
                          "actualizarPrecios",
                          "inventario",
                          "reportes",
                          "estadoCajas",
                          "compras",
                          "nuevaCompra",
                          "detalleCompras",
                        ].includes(moduloActivo) && (
                          <div className="alert alert-danger">
                            Módulo no encontrado.
                          </div>
                        )}

                      {/* Mostrar botón de volver solo si hay un módulo activo */}
                      <div className="mt-3">
                        <button
                          className="btn btn-secondary"
                          onClick={() => setModuloActivo(null)}
                        >
                          ← Volver al Dashboard
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {mostrarBuscarFacturas && (
                <div className="mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4>Facturas Pendientes</h4>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setMostrarBuscarFacturas(false)}
                    >
                      ← Volver
                    </button>
                  </div>
                  <BuscarFacturasPorCliente
                    onSeleccionarFactura={onSeleccionarFactura}
                  />
                </div>
              )}

              {mostrarFacturasSupervisor && esSupervisor() && (
                <div className="mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setMostrarFacturasSupervisor(false)}
                    >
                      ← Volver
                    </button>
                  </div>
                  <SupervisorFacturas />
                </div>
              )}
            </div>
          )}
        </ErrorBoundary>
      </main>

      <Footer />

      {/* Modales */}
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
      {mostrarModalConsultarProductos && (
        <ModalConsultarProductos
          mostrar={mostrarModalConsultarProductos}
          onCerrar={cerrarModalConsultarProductos}
          productos={productos}
          onActualizarProducto={actualizarProducto}
          onAgregarProducto={agregarProducto}
        />
      )}
      {mostrarModalActualizarPrecios && (
        <ActualizarPreciosModal
          onClose={() => setMostrarModalActualizarPrecios(false)}
          onActualizar={handleActualizarPrecios}
        />
      )}
      <ModalCierreCaja
        show={mostrarModalCierre}
        onClose={() => setMostrarModalCierre(false)}
        onConfirm={confirmarCierre}
        cajaId={cajaId}
        empleado={empleado}
        totalFacturado={totalPagado}
      />
    </div>
  );
}

// Componente SeleccionarCaja
function SeleccionarCaja({ empleado, onCajaAbierta }) {
  const [cajas, setCajas] = useState([]);
  const [cajaSeleccionada, setCajaSeleccionada] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarCajas = async () => {
      try {
        const res = await axios.get("http://localhost:5000/cajas/disponibles");
        setCajas(res.data);
      } catch (err) {
        setError("Error al cargar cajas disponibles.");
      }
    };
    cargarCajas();
  }, []);

  const handleAbrirCaja = async () => {
    if (!cajaSeleccionada) {
      setError("Seleccione una caja.");
      return;
    }
    setCargando(true);
    try {
      await axios.post("http://localhost:5000/cajas/abrir", {
        empleado_id: empleado.id,
        caja_id: Number(cajaSeleccionada),
      });
      onCajaAbierta(empleado, Number(cajaSeleccionada));
    } catch (err) {
      setError(err.response?.data?.message || "Error al abrir caja.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h5>
        Bienvenido, {empleado.nombre} {empleado.apellido}
      </h5>
      <p>
        <strong>Ficha:</strong> {empleado.ficha}
      </p>
      <div className="mb-3">
        <label>Seleccione una caja disponible:</label>
        <select
          className="form-control"
          value={cajaSeleccionada}
          onChange={(e) => setCajaSeleccionada(e.target.value)}
        >
          <option value="">Seleccionar caja</option>
          {cajas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <button
        className="btn btn-success"
        onClick={handleAbrirCaja}
        disabled={cargando || !cajaSeleccionada}
      >
        {cargando ? "Abriendo..." : "🔓 Abrir Caja"}
      </button>
    </div>
  );
}

export default App;
