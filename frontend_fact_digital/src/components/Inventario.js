// src/components/Inventario.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Inventario.css";

function Inventario() {
  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [filtroCodigo, setFiltroCodigo] = useState("");
  const [filtroDescripcion, setFiltroDescripcion] = useState("");
  const [filtroCantidad, setFiltroCantidad] = useState(""); // "todos", "0", "1-10", "11-15", "16+", "personalizado"
  const [minCantidad, setMinCantidad] = useState("");
  const [maxCantidad, setMaxCantidad] = useState("");

  // Paginación
  const [paginaProductos, setPaginaProductos] = useState(1);
  const [paginaVentas, setPaginaVentas] = useState(1);
  const elementosPorPagina = 6;

  // Cargar datos
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [productosRes, ventasRes] = await Promise.all([
          axios.get("http://localhost:5000/productos"),
          axios.get("http://localhost:5000/reportes/ventas-producto"),
        ]);
        setProductos(productosRes.data);
        setVentas(ventasRes.data);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  // Filtrar productos por código, descripción y cantidad
  const productosFiltrados = productos.filter((p) => {
    // Filtro por código y descripción
    const coincideTexto =
      p.codigo.toLowerCase().includes(filtroCodigo.toLowerCase()) &&
      p.descripcion.toLowerCase().includes(filtroDescripcion.toLowerCase());

    // Filtro por cantidad
    let coincideCantidad = true;
    const cantidad = p.cantidad;

    switch (filtroCantidad) {
      case "0":
        coincideCantidad = cantidad === 0;
        break;
      case "1-10":
        coincideCantidad = cantidad >= 1 && cantidad <= 10;
        break;
      case "11-15":
        coincideCantidad = cantidad >= 11 && cantidad <= 15;
        break;
      case "16+":
        coincideCantidad = cantidad >= 16;
        break;
      case "personalizado":
        const min = minCantidad === "" ? 0 : parseInt(minCantidad);
        const max = maxCantidad === "" ? Infinity : parseInt(maxCantidad);
        coincideCantidad = cantidad >= min && cantidad <= max;
        break;
      default:
        coincideCantidad = true; // "todos"
    }

    return coincideTexto && coincideCantidad;
  });

  // Paginación productos
  const totalPaginasProductos = Math.ceil(productosFiltrados.length / elementosPorPagina);
  const indiceInicioProductos = (paginaProductos - 1) * elementosPorPagina;
  const productosPaginados = productosFiltrados.slice(
    indiceInicioProductos,
    indiceInicioProductos + elementosPorPagina
  );

  // Paginación ventas
  const totalPaginasVentas = Math.ceil(ventas.length / elementosPorPagina);
  const indiceInicioVentas = (paginaVentas - 1) * elementosPorPagina;
  const ventasPaginadas = ventas.slice(
    indiceInicioVentas,
    indiceInicioVentas + elementosPorPagina
  );

  // Calcular color según cantidad
  const getColorPorCantidad = (cantidad) => {
    if (cantidad === 0) return "red";
    if (cantidad >= 1 && cantidad <= 10) return "orange";
    if (cantidad >= 11 && cantidad <= 15) return "yellow";
    if (cantidad >= 16) return "green";
    return "gray";
  };

  // Formato de números
  const formatNumber = (num) => {
    return new Intl.NumberFormat("es-VE").format(num);
  };

  // Calcular total del inventario
  const totalInventario = productosFiltrados.reduce(
    (sum, p) => sum + p.precio * p.cantidad,
    0
  );

  if (cargando) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status" />
        <p>Cargando inventario...</p>
      </div>
    );
  }

  return (
    <div className="inventario-container p-4">
      <h2 className="mb-4 text-center">📊 Inventario de Productos</h2>

      {/* Filtros */}
      <div className="row mb-4 g-3">
        <div className="col-md-3">
          <label className="form-label">
            <strong>Código</strong>
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="Filtrar por código"
            value={filtroCodigo}
            onChange={(e) => {
              setFiltroCodigo(e.target.value);
              setPaginaProductos(1);
            }}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">
            <strong>Descripción</strong>
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="Filtrar por descripción"
            value={filtroDescripcion}
            onChange={(e) => {
              setFiltroDescripcion(e.target.value);
              setPaginaProductos(1);
            }}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">
            <strong>Stock</strong>
          </label>
          <select
            className="form-control"
            value={filtroCantidad}
            onChange={(e) => {
              setFiltroCantidad(e.target.value);
              setPaginaProductos(1);
              if (e.target.value !== "personalizado") {
                setMinCantidad("");
                setMaxCantidad("");
              }
            }}
          >
            <option value="todos">Todos los productos</option>
            <option value="0">Cantidad = 0</option>
            <option value="1-10">Cantidad 1 - 10</option>
            <option value="11-15">Cantidad 11 - 15</option>
            <option value="16+">Cantidad ≥ 16</option>
            <option value="personalizado">Rango personalizado</option>
          </select>
        </div>

        {filtroCantidad === "personalizado" && (
          <div className="col-md-3 d-flex align-items-end gap-2">
            <div className="flex-fill">
              <label className="form-label">Mín</label>
              <input
                type="number"
                className="form-control"
                placeholder="Mín"
                value={minCantidad}
                onChange={(e) => {
                  setMinCantidad(e.target.value);
                  setPaginaProductos(1);
                }}
              />
            </div>
            <div className="flex-fill">
              <label className="form-label">Máx</label>
              <input
                type="number"
                className="form-control"
                placeholder="Máx"
                value={maxCantidad}
                onChange={(e) => {
                  setMaxCantidad(e.target.value);
                  setPaginaProductos(1);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabla de productos */}
      <div className="table-responsive mb-5">
        <table className="table table-hover table-bordered align-middle">
          <thead className="table-dark">
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>Precio (Bs)</th>
              <th>Cantidad</th>
              <th>Total (Bs)</th>
            </tr>
          </thead>
          <tbody>
            {productosPaginados.length > 0 ? (
              productosPaginados.map((p) => (
                <tr key={p.id}>
                  <td className="fw-bold">{p.codigo}</td>
                  <td>{p.descripcion}</td>
                  <td className="text-end">{formatNumber(p.precio)}</td>
                  <td
                    className="text-center fw-bold"
                    style={{
                      backgroundColor: getColorPorCantidad(p.cantidad),
                      color: p.cantidad > 10 ? "black" : "white",
                      fontWeight: "bold",
                    }}
                  >
                    {p.cantidad}
                  </td>
                  <td className="text-end fw-bold">
                    {formatNumber(p.precio * p.cantidad)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-muted">
                  No hay productos que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="table-secondary">
            <tr>
              <td colSpan="4" className="text-end fw-bold">
                Total General:
              </td>
              <td className="text-end fw-bold">
                Bs.{formatNumber(totalInventario)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Paginación productos */}
        {totalPaginasProductos > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <button
              className="btn btn-outline-secondary"
              onClick={() => setPaginaProductos((prev) => Math.max(prev - 1, 1))}
              disabled={paginaProductos === 1}
            >
              ← Anterior
            </button>
            <span>
              Página {paginaProductos} de {totalPaginasProductos} ({productosFiltrados.length} productos)
            </span>
            <button
              className="btn btn-outline-secondary"
              onClick={() =>
                setPaginaProductos((prev) => Math.min(prev + 1, totalPaginasProductos))
              }
              disabled={paginaProductos === totalPaginasProductos}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {/* Leyenda del mapa de calor */}
      <div className="heatmap-legend d-flex justify-content-center gap-4 mb-4 flex-wrap">
        <div className="d-flex align-items-center gap-2">
          <span className="legend-box" style={{ backgroundColor: "red" }}></span>
          <small>0 unidades</small>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="legend-box" style={{ backgroundColor: "orange" }}></span>
          <small>1 - 10 unidades</small>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="legend-box" style={{ backgroundColor: "yellow" }}></span>
          <small>11 - 15 unidades</small>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="legend-box" style={{ backgroundColor: "green", color: "black" }}></span>
          <small>16+ unidades</small>
        </div>
      </div>

      {/* Tabla resumen de ventas */}
      {ventas.length > 0 && (
        <div className="ventas-resumen mt-5">
          <h3 className="mb-3">📈 Ventas por Producto</h3>
          <div className="table-responsive">
            <table className="table table-striped table-bordered">
              <thead className="table-success">
                <tr>
                  <th>Producto</th>
                  <th>Código</th>
                  <th>Cantidad Vendida</th>
                  <th>Ingreso Total (Bs)</th>
                </tr>
              </thead>
              <tbody>
                {ventasPaginadas.map((v) => (
                  <tr key={v.producto_id}>
                    <td>{v.descripcion}</td>
                    <td>{v.codigo}</td>
                    <td className="text-center">{v.cantidad_vendida}</td>
                    <td className="text-end fw-bold">
                      {formatNumber(v.ingreso_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación ventas */}
            {totalPaginasVentas > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setPaginaVentas((prev) => Math.max(prev - 1, 1))}
                  disabled={paginaVentas === 1}
                >
                  ← Anterior
                </button>
                <span>
                  Página {paginaVentas} de {totalPaginasVentas}
                </span>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() =>
                    setPaginaVentas((prev) => Math.min(prev + 1, totalPaginasVentas))
                  }
                  disabled={paginaVentas === totalPaginasVentas}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventario;