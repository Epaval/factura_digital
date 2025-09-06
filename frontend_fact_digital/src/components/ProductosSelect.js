import React, { useState, useRef, useEffect } from "react";
import { FaSearch, FaBoxOpen, FaBarcode, FaTimes } from "react-icons/fa";

const ProductosSelect = ({ productos, onAddProduct }) => {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const inputRef = useRef(null);

  // Detectar si la búsqueda es un escaneo de código de barras (secuencia rápida)
  const [ultimaTecla, setUltimaTecla] = useState(0);
  const [entradaRapida, setEntradaRapida] = useState("");

  // Filtrar productos
  const productosFiltrados = productos.filter((producto) => {
    if (!producto) return false;
    const texto = busqueda.toLowerCase().trim();
    if (!texto) return false;
    return (
      producto.codigo?.toString().includes(texto) ||
      producto.descripcion?.toLowerCase().includes(texto) ||
      producto.precio?.toString().includes(texto)
    );
  });

  // Efecto: enfocar input al abrir el modal
  useEffect(() => {
    if (mostrarModal && inputRef.current) {
      const timer = setTimeout(() => inputRef.current.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [mostrarModal]);

  // Manejar entrada de teclado para detectar escaneo
  useEffect(() => {
    const handleKeyDown = (e) => {
      const ahora = Date.now();
      const tiempo = ahora - ultimaTecla;

      // Si se presionan teclas muy rápido → probablemente es escaneo
      if (tiempo < 150 && e.key !== "Enter" && e.key.length === 1) {
        setEntradaRapida(prev => prev + e.key);
      } else if (e.key === "Enter" && entradaRapida.length > 3) {
        const codigoEscaneado = entradaRapida;
        const producto = productos.find(p => p.codigo?.toString() === codigoEscaneado);
        if (producto) {
          setProductoSeleccionado(producto);
          setBusqueda(`${producto.codigo} - ${producto.descripcion}`);
          setEntradaRapida("");
          return;
        }
      } else {
        setEntradaRapida("");
      }

      setUltimaTecla(ahora);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [productos, ultimaTecla, entradaRapida]);

  // Buscar y seleccionar automáticamente si hay un solo resultado
  useEffect(() => {
    if (busqueda && productosFiltrados.length === 1) {
      setProductoSeleccionado(productosFiltrados[0]);
    } else if (productosFiltrados.length === 0) {
      setProductoSeleccionado(null);
    }
  }, [busqueda, productosFiltrados]);

  // Buscar por código directo al escribir
  const handleChange = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);
    setProductoSeleccionado(null);

    // Si es un número completo, buscar por código
    if (/^\d+$/.test(valor) && valor.length > 2) {
      const producto = productos.find(p => p.codigo?.toString() === valor);
      if (producto) {
        setProductoSeleccionado(producto);
      }
    }
  };

  const handleAgregarProducto = () => {
    if (productoSeleccionado) {
      onAddProduct(productoSeleccionado);
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setMostrarModal(false);
    setBusqueda("");
    setProductoSeleccionado(null);
    setEntradaRapida("");
  };

  return (
    <div className="card p-3 shadow-sm mt-4">
      <h2 className="card-title text-center mb-3">
        <FaBoxOpen className="me-2" /> Productos
      </h2>
      <button
        className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
        onClick={() => setMostrarModal(true)}
      >
        <FaSearch /> Buscar y Agregar Producto
      </button>

      {/* Modal de búsqueda */}
      {mostrarModal && (
        <div
          className="modal show"
          style={{ display: "block", backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-gradient text-white" style={{ background: "linear-gradient(45deg, #28a745, #20c997)" }}>
                <h5 className="modal-title d-flex align-items-center">
                  <FaSearch className="me-2" /> Buscar Producto
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="modal-body">
                {/* Campo de búsqueda */}
                <div className="mb-3">
                  <label className="form-label">
                    <strong>Buscar producto</strong>
                    <small className="text-white-50 ms-2">🔍 por código, nombre o precio</small>
                  </label>
                  <div className="input-group input-group-lg">
                    <span className="input-group-text bg-light">
                      <FaSearch />
                    </span>
                    <input
                      ref={inputRef}
                      type="text"
                      className="form-control form-control-lg"
                      value={busqueda}
                      onChange={handleChange}
                      placeholder="Ej: 1020, Lápiz, 1.50"
                      autoFocus
                    />
                    {busqueda && (
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setBusqueda("")}
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                </div>

                {/* Código de barras detectado */}
                {entradaRapida && (
                  <div className="alert alert-info d-flex align-items-center mb-3">
                    <FaBarcode className="me-2" />
                    <small>Escaneando: <strong>{entradaRapida}</strong></small>
                  </div>
                )}

                {/* Resultados */}
                {busqueda && productosFiltrados.length > 0 ? (
                  <div className="list-group mb-3 max-h-300">
                    {productosFiltrados.slice(0, 10).map((producto) => (
                      <button
                        key={producto.id}
                        type="button"
                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3 ${
                          productoSeleccionado?.id === producto.id ? "active bg-success text-white" : ""
                        }`}
                        onClick={() => {
                          setProductoSeleccionado(producto);
                          setBusqueda(`${producto.codigo} - ${producto.descripcion}`);
                        }}
                      >
                        <div className="text-start">
                          <strong>{producto.descripcion}</strong>
                          <div className="text-muted small">
                            Código: {producto.codigo}
                          </div>
                        </div>
                        <span className="badge bg-primary fs-6 px-3 py-2">
                          Bs.{producto.precio?.toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : busqueda && productosFiltrados.length === 0 ? (
                  <div className="alert alert-warning text-center">
                    <strong>🚫 No se encontraron productos.</strong>
                    <br />
                    <small>Verifique el código o descripción.</small>
                  </div>
                ) : (
                  <div className="text-muted text-center py-4">
                    <em>Escribe para buscar productos...</em>
                  </div>
                )}

                {/* Producto seleccionado */}
                {productoSeleccionado && (
                  <div className="mt-3 p-3 bg-light border rounded">
                    <h6 className="mb-1">✅ Producto seleccionado:</h6>
                    <p className="mb-0 small">
                      <strong>{productoSeleccionado.descripcion}</strong>
                      <br />
                      <span className="text-muted">
                        Código: {productoSeleccionado.codigo} |{" "}
                        Precio: Bs.{productoSeleccionado.precio?.toFixed(2)}
                      </span>
                    </p>
                  </div>
                )}
              </div>
              <div className="modal-footer d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-lg px-4"
                  disabled={!productoSeleccionado}
                  onClick={handleAgregarProducto}
                >
                  ✅ Agregar Producto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosSelect;