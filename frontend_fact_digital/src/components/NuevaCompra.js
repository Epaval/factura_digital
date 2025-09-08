// src/components/NuevaCompra.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaShoppingCart,
  FaPlus,
  FaTrash,
  FaCalendar,
  FaBox,
  FaDollarSign,
  FaUserTie,
} from "react-icons/fa";

function NuevaCompra({ onVolver }) {
  const [proveedor, setProveedor] = useState("");
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [precioCompra, setPrecioCompra] = useState("");
  const [detalles, setDetalles] = useState([]);
  const [fechaCompra, setFechaCompra] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [error, setError] = useState("");

  // Cargar proveedores y productos
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [provRes, prodRes] = await Promise.all([
          axios.get("http://localhost:5000/proveedores"),
          axios.get("http://localhost:5000/productos"),
        ]);
        setProveedores(provRes.data);
        setProductos(prodRes.data);
      } catch (err) {
        setError("Error al cargar datos.");
        console.error(err);
      }
    };
    cargarDatos();
  }, []);

  // Buscar producto por ID
  const productoActual = productos.find((p) => p.id == productoSeleccionado);

  // Agregar producto al detalle
  const agregarProducto = () => {
    if (!productoSeleccionado || !cantidad || !precioCompra || !proveedor) {
      setError("Complete todos los campos.");
      return;
    }

    const prod = productos.find((p) => p.id == productoSeleccionado);
    const precioCompraNum = parseFloat(precioCompra);
    const subtotal = cantidad * precioCompraNum;

    setDetalles((prev) => [
      ...prev,
      {
        productoId: prod.id,
        descripcion: prod.descripcion,
        cantidad: parseInt(cantidad),
        precioCompra: precioCompraNum,
        subtotal,
      },
    ]);

    // Resetear campos
    setProductoSeleccionado("");
    setCantidad(1);
    setPrecioCompra("");
    setError("");
  };

  // Eliminar producto del detalle
  const eliminarProducto = (index) => {
    setDetalles((prev) => prev.filter((_, i) => i !== index));
  };

  // Calcular totales
  const total = detalles.reduce((sum, d) => sum + d.subtotal, 0);

  // Guardar compra
  const guardarCompra = async () => {
    if (detalles.length === 0 || !proveedor || !fechaCompra) {
      setError("Complete todos los campos y agregue al menos un producto.");
      return;
    }

    try {
      // 1. Crear la compra
      const compraRes = await axios.post("http://localhost:5000/compras", {
        proveedor_id: proveedor,
        fecha_compra: fechaCompra,
        total,
      });

      const compraId = compraRes.data.id;

      // 2. Crear los detalles de la compra
      await Promise.all(
        detalles.map((detalle) =>
          axios.post("http://localhost:5000/detalle-compras", {
            compra_id: compraId,
            producto_id: detalle.productoId,
            cantidad: detalle.cantidad,
            precio_compra: detalle.precioCompra,
            subtotal: detalle.subtotal,
          })
        )
      );

      // 3. Actualizar el precio de venta en productos: precio = precio_compra * 1.54
      detalles.forEach((detalle) => {
        const nuevoPrecio = detalle.precioCompra * 1.54;
        axios
          .put(
            `http://localhost:5000/productos/${detalle.productoId}/actualizar-precio`,
            {
              precio: parseFloat(nuevoPrecio.toFixed(2)),
            }
          )
          .catch((err) => {
            console.warn("Error al actualizar precio de venta:", err);
          });
      });

      alert("✅ Compra registrada exitosamente.");
      onVolver();
    } catch (err) {
      setError("Error al guardar la compra.");
      console.error(err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="mb-4 d-flex align-items-center gap-2">
        <FaShoppingCart /> Nueva Compra
      </h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4 mb-4">
        {/* Proveedor */}
        <div className="col-md-6">
          <label className="form-label d-flex align-items-center">
            <FaUserTie className="me-2" /> Proveedor
          </label>
          <select
            className="form-select"
            value={proveedor}
            onChange={(e) => setProveedor(e.target.value)}
          >
            <option value="">Seleccionar proveedor...</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.tipo_rif}-{p.numero_rif})
              </option>
            ))}
          </select>
        </div>

        {/* Fecha */}
        <div className="col-md-6">
          <label className="form-label d-flex align-items-center">
            <FaCalendar className="me-2" /> Fecha de Compra
          </label>
          <input
            type="date"
            className="form-control"
            value={fechaCompra}
            onChange={(e) => setFechaCompra(e.target.value)}
          />
        </div>
      </div>

      {/* Añadir producto */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h5 className="mb-3">➕ Agregar Producto</h5>
          <div className="row g-3">
            <div className="col-md-5">
              <label>Producto</label>
              <select
                className="form-select"
                value={productoSeleccionado}
                onChange={(e) => setProductoSeleccionado(e.target.value)}
              >
                <option value="">Seleccionar producto...</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.descripcion}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label>Cantidad</label>
              <input
                type="number"
                className="form-control"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                min="1"
              />
            </div>
            <div className="col-md-3">
              <label>Precio de Compra (Bs.)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={precioCompra}
                onChange={(e) => setPrecioCompra(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button
                className="btn btn-success w-100"
                onClick={agregarProducto}
              >
                <FaPlus /> Añadir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detalle de la compra */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Compra</th>
                <th>Subtotal</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {detalles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">
                    <FaBox size={24} className="mb-2" />
                    <br />
                    <small>No se han agregado productos.</small>
                  </td>
                </tr>
              ) : (
                detalles.map((d, i) => (
                  <tr key={i}>
                    <td>{d.descripcion}</td>
                    <td>{d.cantidad}</td>
                    <td>Bs.{d.precioCompra.toFixed(2)}</td>
                    <td>Bs.{d.subtotal.toFixed(2)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => eliminarProducto(i)}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total */}
      <div className="card shadow-sm border-0 bg-light mb-4">
        <div className="card-body d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Total de la Compra</h5>
          <h3 className="text-success fw-bold">Bs.{total.toFixed(2)}</h3>
        </div>
      </div>

      {/* Botones */}
      <div className="d-flex justify-content-center">
       
        <button
          className="btn btn-primary btn-lg px-5"
          onClick={guardarCompra}
          disabled={detalles.length === 0}
        >
          <FaDollarSign className="me-2" /> Registrar Compra
        </button>
      </div>
    </div>
  );
}

export default NuevaCompra;
