import React, { useState, useEffect } from "react";
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
import jsPDF from "jspdf";
import "./App.css";
import QRCode from "qrcode";
import BcvDollar from "./components/BcvDollar";

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
  const [facturaUrl, setFacturaUrl] = useState("");

  // Cargar productos y clientes al iniciar la aplicación
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productosResponse, clientesResponse, facturasResponse] =
          await Promise.all([
            axios.get("http://localhost:5000/productos"),
            axios.get("http://localhost:5000/clientes"),
            axios.get("http://localhost:5000/facturas/ultimo-numero"),
          ]);

        setProductos(productosResponse.data);
        setClientes(clientesResponse.data);

        const ultimoNumeroFactura =
          facturasResponse.data.ultimoNumeroFactura || 0;
        const ultimoNumeroControl =
          facturasResponse.data.ultimoNumeroControl || "00-000000";
        setSiguienteNumeroFactura(ultimoNumeroFactura + 1);
        setSiguienteNumeroControl(
          generarSiguienteNumeroControl(ultimoNumeroControl)
        );
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };

    fetchData();
  }, []);
  // Función para generar el siguiente número de control
  const generarSiguienteNumeroControl = (ultimoNumeroControl) => {
    const numero = parseInt(ultimoNumeroControl.split("-")[1], 10) + 1;
    return `00-${String(numero).padStart(6, "0")}`;
  };

  // Abrir el modal de consultar productos
  const abrirModalConsultarProductos = () => {
    setMostrarModalConsultarProductos(true);
  };

  // Cerrar el modal de consultar productos
  const cerrarModalConsultarProductos = () => {
    setMostrarModalConsultarProductos(false);
  };
  // Abrir el modal de nuevo cliente
  const abrirModalNuevoCliente = () => {
    setMostrarModalNuevoCliente(true);
  };
  // Abrir el modal de editar cliente
  const abrirModalEditarCliente = (cliente) => {
    setClienteAEditar(cliente);
    setMostrarModalEditarCliente(true);
  };

  // Cerrar el modal de nuevo cliente
  const cerrarModalNuevoCliente = () => {
    setMostrarModalNuevoCliente(false);
  };

  // Guardar el nuevo cliente
  const guardarNuevoCliente = (nuevoCliente) => {
    axios
      .post("http://localhost:5000/clientes", nuevoCliente)
      .then((response) => {
        setClientes([...clientes, response.data]);
        setMensajeModal("Cliente registrado exitosamente.");
        setMostrarModal(true);
      })
      .catch((error) => {
        setMensajeModal("Error al registrar el cliente.");
        setMostrarModal(true);
        console.error("Error al registrar el cliente:", error);
      });
  };

  // Guardar el cliente editado
  const guardarClienteEditado = (clienteActualizado) => {
    axios
      .put(
        `http://localhost:5000/clientes/${clienteActualizado.id}`,
        clienteActualizado
      )
      .then((response) => {
        setClientes((prevClientes) =>
          prevClientes.map((cliente) =>
            cliente.id === clienteActualizado.id ? response.data : cliente
          )
        );
        setMensajeModal("Cliente actualizado exitosamente.");
        setMostrarModal(true);
        setMostrarModalEditarCliente(false);
      })
      .catch((error) => {
        setMensajeModal("Error al actualizar el cliente.");
        setMostrarModal(true);
        console.error("Error al actualizar el cliente:", error);
      });
  };

  // Agregar un producto seleccionado a la tabla
  const handleAddProduct = (producto) => {
    setSelectedProducts((prev) => {
      const productoExistente = prev.find((p) => p.id === producto.id);
      if (productoExistente) {
        return prev.map((p) =>
          p.id === producto.id
            ? { ...p, cantidadSeleccionada: p.cantidadSeleccionada + 1 }
            : p
        );
      } else {
        return [...prev, { ...producto, cantidadSeleccionada: 1 }];
      }
    });
  };

  // Agregar un cliente seleccionado a la tabla
  const handleAddCliente = (cliente) => {
    setSelectedCliente(cliente);
  };

  // Actualizar la cantidad de un producto seleccionado
  const handleCantidadChange = (index, cantidad) => {
    setSelectedProducts((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, cantidadSeleccionada: cantidad } : p
      )
    );
  };

  // Eliminar un producto de la tabla
  const handleEliminarProducto = (index) => {
    setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
  };

  // Mostrar el modal con un mensaje
  const mostrarMensaje = (mensaje) => {
    setMensajeModal(mensaje);
    setMostrarModal(true);
  };
  // Cerrar el modal
  const cerrarModal = () => {
    setMostrarModal(false);
  };
  //generar número de factura
  const generarNumeroFactura = (ultimoNumeroFactura) => {
    const numeroActual = parseInt(ultimoNumeroFactura, 10) || 0;
    const siguienteNumero = numeroActual + 1;
    return String(siguienteNumero).padStart(7, "0");
  };
  //generar número de control
  const generarNumeroControl = (ultimoNumeroControl) => {
    const numeroActual = parseInt(ultimoNumeroControl.split("-")[1], 10) || 0;
    const siguienteNumero = numeroActual + 1;
    const numeroFormateado = String(siguienteNumero).padStart(6, "0");
    return `00-${numeroFormateado}`; // Retornar el número en el formato deseado
  };
  const generarFactura = async () => {
    if (!selectedCliente || selectedProducts.length === 0) {
      mostrarMensaje("Seleccione un cliente y al menos un producto.");
      return;
    }
    try {
      // Obtener el último número de factura y control
      const facturaResponse = await axios.get(
        "http://localhost:5000/facturas/ultimo-numero"
      );
      const ultimoNumeroFactura = facturaResponse.data.ultimoNumeroFactura || 0;
      const ultimoNumeroControl =
        facturaResponse.data.ultimoNumeroControl || "00-000000";

      // Obtener el valor del dólar y la fecha de actualización
      const dollarResponse = await axios.get(
        "https://ve.dolarapi.com/v1/dolares/oficial"
      );
      const dollarRate = dollarResponse.data.promedio; // Obtener el valor del dólar
      const fechaActualizacion = new Date(
        dollarResponse.data.fechaActualizacion
      ); // Obtener la fecha de actualización

      // Generar números de factura y control
      const numeroFactura = generarNumeroFactura(ultimoNumeroFactura);
      const numeroControl = generarNumeroControl(ultimoNumeroControl);
      const empresa = "J&P TECH, C.A.";
      const rifEmpresa = "J-171352250";
      const dirEmpresa = "Los Samanes Norte, Valencia Edo. Carabobo";
      const dirEmpresa2 = "Av.86 Local:86-108. Telf-0241-888888";
      // Crear el PDF
      const doc = new jsPDF();

      //Lineas del marco
      doc.setLineWidth(0.5);
      doc.rect(5, 5, 200, 287);

      // Agregar una marca de agua con una imagen
      const watermarkUrl = "/jptech1.png"; // Ruta relativa a la imagen en la carpeta public
      const imgWidth = 190;
      const imgHeight = 40;
      const centerX = (210 - imgWidth) / 2;
      const centerY = 5;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = watermarkUrl;
      await new Promise((resolve) => (img.onload = resolve));
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.globalAlpha = 0.2;
      ctx.drawImage(img, 0, 0);
      const transparentImage = canvas.toDataURL("image/png");
      // Cargar la imagen como marca de agua
      doc.addImage(
        transparentImage,
        "PNG",
        centerX,
        centerY,
        imgWidth,
        imgHeight
      );

      // Encabezado de la factura
      doc.setFontSize(12);
      doc.text(`Factura #${numeroFactura}`, 140, 10, { align: "left" });
      doc.text(`Número de Control: ${numeroControl}`, 140, 20, {
        align: "left",
      });
      // Obtener la fecha y hora actuales
      const fechaActual = new Date();
      const opcionesFecha = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      };
      const opcionesHora = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      };
      const fechaFormateada = fechaActual.toLocaleDateString(
        "es-ES",
        opcionesFecha
      );
      const horaFormateada = fechaActual.toLocaleTimeString(
        "es-ES",
        opcionesHora
      );

      // Insertar la fecha y hora en el documento
      doc.text(`Nombre Empresa: ${empresa}`, 10, 10, { align: "left" });
      doc.text(`N° de Rif Empresa: ${rifEmpresa}`, 10, 20, { align: "left" });
      doc.text(`Dirección: ${dirEmpresa}`, 10, 30, { align: "left" });
      doc.text(`${dirEmpresa2}`, 10, 40, { align: "left" });
      doc.text(`Fecha: ${fechaFormateada}`, 140, 30, { align: "left" });
      doc.text(`Hora: ${horaFormateada}`, 140, 40, { align: "left" });

      doc.setFontSize(12);
      const lineY1 = 45;
      doc.line(10, lineY1, 200, lineY1);
      doc.text(`Cliente: ${selectedCliente.nombre}`, 10, 50);
      doc.text(
        `RIF: ${selectedCliente.tipo_rif}-${selectedCliente.numero_rif}`,
        10,
        60
      );
      doc.text(`Correo: ${selectedCliente.correo}`, 10, 70);
      doc.text(`Operador: ${selectedCliente.operador}`, 10, 80);
      doc.text(`Teléfono: ${selectedCliente.telefono}`, 10, 90);
      doc.text(`Dirección: ${selectedCliente.direccion}`, 10, 100);
      // Detalles de la factura
      doc.setFontSize(14);
      const lineY = 105;
      doc.line(10, lineY, 200, lineY);
      doc.text("Detalles de la Factura", 10, 110);
      // Tabla de productos
      let y = 120;
      doc.setFontSize(12);
      doc.text("Código", 10, y);
      doc.text("Descripción", 30, y);
      doc.text("Cantidad", 100, y, { align: "center" });
      doc.text("Precio Unitario", 130, y, { align: "center" });
      doc.text("Subtotal", 170, y, { align: "center" });
      selectedProducts.forEach((producto) => {
        y += 10;
        doc.text(producto.codigo, 10, y);
        doc.text(producto.descripcion, 30, y);
        doc.text(producto.cantidadSeleccionada.toString(), 100, y);
        doc.text(`Bs.${producto.precio * dollarRate}`, 130, y);
        const subtotalEnBolivares = (
          producto.precio *
          producto.cantidadSeleccionada *
          dollarRate
        ).toFixed(2);
        doc.text(`Bs.${subtotalEnBolivares}`, 170, y);
      });
      // Calcular el total de la factura
      const totalSinIVA = selectedProducts.reduce(
        (total, producto) =>
          total + producto.precio * producto.cantidadSeleccionada * dollarRate,
        0
      );
      const IVA = totalSinIVA * 0.16; // 16% de IVA
      const totalConIVA = totalSinIVA + IVA;
      // Total de la factura
      y += 20;
      doc.text(`Subtotal: Bs.${totalSinIVA.toFixed(2)}`, 140, y);
      y += 10;
      doc.text(`IVA (16%): Bs.${IVA.toFixed(2)}`, 140, y);
      y += 10;
      doc.text(`Total con IVA: Bs.${totalConIVA.toFixed(2)}`, 140, y);

      // Agregar el código QR
      const qrData = `${numeroFactura}-${numeroControl}-${fechaFormateada}-${selectedCliente.nombre}`;
      const qrImage = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: "H",
      });

      // Posicionar el código QR en el lado izquierdo del PDF
      const qrX = 140; // Posición X (lado izquierdo)
      const qrY = 60; // Posición Y (debajo del total)
      doc.addImage(qrImage, "PNG", qrX, qrY, 30, 30);

      // Mostrar el valor del dólar en la parte inferior del PDF
      doc.setFontSize(10);
      doc.text(
        `Tasa de cambio(BCV): Bs.${dollarRate.toFixed(
          8
        )} (Actualizado: ${fechaFormateada})`,
        10,
        280,
        { align: "left" }
      );

      const pagoDollas = totalConIVA / dollarRate;
      doc.setFontSize(10);
      doc.text(`Pago en Dolares: $${pagoDollas.toFixed(2)}`, 140, 280);

      // Guardar el PDF localmente
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setFacturaUrl(pdfUrl);
      doc.save(`factura_${numeroFactura}.pdf`);

      // Guardar la factura en la base de datos
      const factura = {
        numero_factura: numeroFactura,
        numero_control: numeroControl,
        cliente_id: selectedCliente.id,
        fecha: new Date().toISOString().split("T")[0],
        total: selectedProducts.reduce(
          (total, producto) =>
            total + producto.precio * producto.cantidadSeleccionada,
          0
        ),
        detalles: selectedProducts.map((producto) => ({
          producto_id: producto.id,
          cantidad: producto.cantidadSeleccionada,
          precio: producto.precio,
        })),
      };

      await axios.post("http://localhost:5000/facturas", factura);
      mostrarMensaje("Factura guardada exitosamente.");
      setSiguienteNumeroFactura(parseInt(numeroFactura) + 1);
      setSelectedCliente(null);
      setSelectedProducts([]);
    } catch (error) {
      console.error("Error al generar la factura:", error);
      mostrarMensaje("Error al generar la factura.");
    }
  };

  // Función para actualizar un producto
  const actualizarProducto = (productoActualizado) => {
    axios
      .put(
        `http://localhost:5000/productos/${productoActualizado.id}`,
        productoActualizado
      )
      .then((response) => {
        setProductos((prevProductos) =>
          prevProductos.map((producto) =>
            producto.id === productoActualizado.id ? response.data : producto
          )
        );
        setMensajeModal("Producto actualizado exitosamente.");
        setMostrarModal(true);
      })
      .catch((error) => {
        setMensajeModal("Error al actualizar el producto.");
        setMostrarModal(true);
        console.error("Error al actualizar el producto:", error);
      });
  };

  const agregarProducto = (nuevoProducto) => {
    axios
      .post("http://localhost:5000/productos", nuevoProducto)
      .then((response) => {
        setProductos([...productos, response.data]); // Agregar el nuevo producto al estado
        setMensajeModal("Producto agregado exitosamente.");
        setMostrarModal(true);
      })
      .catch((error) => {
        setMensajeModal("Error al agregar el producto.");
        setMostrarModal(true);
        console.error("Error al agregar el producto:", error);
      });
  };

  return (
    <div className="app-container">
      {/* Header */}
      <Header
        onNuevoCliente={abrirModalNuevoCliente}
        onConsultarProductos={abrirModalConsultarProductos}
      />

      {/* Contenido Principal */}
      <main className="main-content container mt-5">
        <div className="mb-4">
          <div className="d-flex flex-column align-items-end h4">
            <div className="mb-3">
              <span className="badge bg-secondary p-4">
                N° Factura: {String(siguienteNumeroFactura).padStart(7, "0")}
              </span>
            </div>
            <div>
              <span className="badge bg-dark p-4">
                N° Control: {siguienteNumeroControl}
              </span>
            </div>
          </div>
        </div>

        {/* Componente de Clientes */}
        <ClientesSelect clientes={clientes} onAddCliente={handleAddCliente} />

        {/* Tabla del Cliente Seleccionado */}
        <ClientesTable
          selectedCliente={selectedCliente}
          onEditarCliente={abrirModalEditarCliente} // Pasa la función para editar
        />

        {/* Componente de Productos */}
        <ProductosSelect
          productos={productos}
          onAddProduct={handleAddProduct}
        />

        {/* Tabla de Productos Seleccionados */}
        <ProductosTable
          selectedProducts={selectedProducts}
          handleCantidadChange={handleCantidadChange}
          handleEliminarProducto={handleEliminarProducto}
        />

        {/* Botón para generar la factura */}
        <div>
          <button className="btn btn-success mt-4" onClick={generarFactura}>
            Generar Factura (PDF)
          </button>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Modal de Mensaje */}
      {mostrarModal && (
        <ModalMensaje mensaje={mensajeModal} onCerrar={cerrarModal} />
      )}

      {/* Modal de Editar Cliente */}
      {mostrarModalEditarCliente && (
        <ModalEditarCliente
          mostrar={mostrarModalEditarCliente}
          onCerrar={() => setMostrarModalEditarCliente(false)}
          onGuardar={guardarClienteEditado}
          clienteExistente={clienteAEditar}
        />
      )}

      {/* Modal de Nuevo Cliente */}
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
        onAgregarProducto={agregarProducto} // Pasar la función de agregar
      />
    </div>
  );
}

export default App;
