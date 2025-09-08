import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaDollarSign,
  FaReceipt,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaFilter,
  FaFileInvoice,
  FaCheck,
  FaRegSquare,
  FaRegCheckSquare,
} from "react-icons/fa";

function PagoImpuestos() {
  const [impuestos, setImpuestos] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [seleccionados, setSeleccionados] = useState(new Set()); // IDs seleccionados
  const impuestosPorPagina = 8;
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarImpuestos = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/impuestos/pendientes-mes"
        );

        // ✅ Corregido: usa `total_factura` y `fecha_generacion`
        const datos = res.data
          .map((imp) => {
            const base = parseFloat(imp.base_imponible) || 0;
            const iva = parseFloat(imp.iva_calculado) || 0;
            const total = parseFloat(imp.total_factura) || 0;

            return {
              ...imp,
              base_imponible: base,
              iva_calculado: iva,
              monto_total: total,
              fecha_registro: new Date(imp.fecha_generacion),
            };
          })
          .filter((imp) => !isNaN(imp.fecha_registro.getTime()));

        setImpuestos(datos);
      } catch (err) {
        console.error("Error al cargar impuestos:", err);
        setError("No se pudieron cargar los impuestos.");
      } finally {
        setCargando(false);
      }
    };

    cargarImpuestos();
  }, []);

  // Filtrar impuestos
  const impuestosFiltrados = impuestos.filter((imp) => {
    const factId = String(imp.factura_id);
    const fecha = imp.fecha_registro.toLocaleDateString();
    const montoTotal = String(parseFloat(imp.monto_total).toFixed(2));
    const iva = String(parseFloat(imp.iva_calculado).toFixed(2));
    const filtroLower = filtro.toLowerCase();

    return (
      factId.includes(filtroLower) ||
      fecha.includes(filtroLower) ||
      montoTotal.includes(filtroLower) ||
      iva.includes(filtroLower)
    );
  });

  // Paginación
  const indiceUltimo = paginaActual * impuestosPorPagina;
  const indicePrimero = indiceUltimo - impuestosPorPagina;
  const impuestosPaginados = impuestosFiltrados.slice(
    indicePrimero,
    indiceUltimo
  );
  const totalPaginas = Math.ceil(
    impuestosFiltrados.length / impuestosPorPagina
  );

  // ✅ Total a pagar: solo de seleccionados (o todos si ninguno seleccionado)
  const totalAPagar =
    Array.from(seleccionados).length > 0
      ? impuestos
          .filter((imp) => seleccionados.has(imp.id))
          .reduce((sum, imp) => sum + imp.iva_calculado, 0)
      : impuestosFiltrados.reduce((sum, imp) => sum + imp.iva_calculado, 0);

  // Manejar selección individual
  const toggleSeleccion = (id) => {
    const nuevosSeleccionados = new Set(seleccionados);
    if (nuevosSeleccionados.has(id)) {
      nuevosSeleccionados.delete(id);
    } else {
      nuevosSeleccionados.add(id);
    }
    setSeleccionados(nuevosSeleccionados);
  };

  // Seleccionar/deseleccionar todos en la página
  const toggleTodos = () => {
    const todosEnPagina = impuestosPaginados.map((imp) => imp.id);
    const todosSeleccionados = todosEnPagina.every((id) =>
      seleccionados.has(id)
    );

    const nuevosSeleccionados = new Set(seleccionados);
    if (todosSeleccionados) {
      todosEnPagina.forEach((id) => nuevosSeleccionados.delete(id));
    } else {
      todosEnPagina.forEach((id) => nuevosSeleccionados.add(id));
    }
    setSeleccionados(nuevosSeleccionados);
  };

  // Manejar pago de IVA (solo seleccionados)
  const manejarPago = async () => {
    const idsAPagar =
      Array.from(seleccionados).length > 0
        ? Array.from(seleccionados)
        : impuestosFiltrados.map((imp) => imp.id);

    if (idsAPagar.length === 0) return;

    const confirmacion = window.confirm(
      `¿Confirmas el pago del IVA por ${idsAPagar.length} factura(s)?\n` +
        `Monto total: Bs.${totalAPagar.toLocaleString("es-VE", {
          minimumFractionDigits: 2,
        })}`
    );

    if (!confirmacion) return;

    try {
      await axios.post("http://localhost:5000/impuestos/pagar-seleccionados", {
        impuestoIds: idsAPagar,
      });

      // Actualizar estado local
      setImpuestos((prev) =>
        prev.map((imp) =>
          idsAPagar.includes(imp.id)
            ? { ...imp, estado: "pagado", fecha_pago: new Date().toISOString() }
            : imp
        )
      );
      setSeleccionados(new Set()); // Limpiar selección
      alert("✅ Pago de IVA registrado exitosamente.");
    } catch (err) {
      setError("Error al registrar el pago.");
      console.error(err);
    }
  };

  if (cargando) {
    return (
      <div className="text-center mt-4">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2">Cargando impuestos...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="p-4">   
     {/* Card destacado: Facturas seleccionadas */}
      <div className="mb-4">            
        {Array.from(seleccionados).length > 0 && (
          <div className="card shadow border-0 bg-light border-success-subtle">
            <div className="card-body d-flex align-items-center justify-content-between p-3">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-success text-white rounded-circle p-2">
                  <FaCheckCircle size={20} />
                </div>
                <div>
                  <h6 className="mb-0">
                    <strong>{seleccionados.size}</strong> factura(s)
                    seleccionada(s)
                  </h6>
                  <small className="text-muted">
                    IVA a pagar:{" "}
                    <strong>
                      Bs.
                      {Array.from(seleccionados)
                        .map(
                          (id) =>
                            impuestos.find((i) => i.id === id)?.iva_calculado ||
                            0
                        )
                        .reduce((sum, val) => sum + val, 0)
                        .toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                    </strong>
                  </small>
                </div>
              </div>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => setSeleccionados(new Set())}
              >
                Limpiar selección
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-4">
        <div className="input-group">
          <span className="input-group-text bg-light">
            <FaSearch />
          </span>
          <input
            type="text"
            className="form-control form-control-lg"
            placeholder="Buscar por factura, fecha, monto total o IVA..."
            value={filtro}
            onChange={(e) => {
              setFiltro(e.target.value);
              setPaginaActual(1);
              setSeleccionados(new Set()); // Limpiar selección al buscar
            }}
          />
          <span className="input-group-text bg-light">
            <FaFilter />
          </span>
        </div>
      </div>

      {/* Tabla de impuestos */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>
                  <label className="d-flex align-items-center gap-2">
                    <input
                      type="checkbox"
                      checked={impuestosPaginados.every((imp) =>
                        seleccionados.has(imp.id)
                      )}
                      onChange={toggleTodos}
                      className="me-1"
                    />
                    <small>Seleccionar</small>
                  </label>
                </th>
                <th>N° Factura</th>
                <th>Monto Total</th>
                <th>Base Imponible</th>
                <th>IVA (16%)</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {impuestosPaginados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <FaReceipt size={32} className="mb-2" />
                    <br />
                    <small>No hay impuestos pendientes.</small>
                  </td>
                </tr>
              ) : (
                impuestosPaginados.map((imp) => (
                  <tr
                    key={imp.id}
                    className={seleccionados.has(imp.id) ? "table-primary" : ""}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={seleccionados.has(imp.id)}
                        onChange={() => toggleSeleccion(imp.id)}
                        className="form-check-input"
                      />
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <FaReceipt className="text-muted me-2" />
                        <strong>{imp.factura_id}</strong>
                      </div>
                    </td>
                    <td>
                      Bs.
                      {imp.monto_total.toLocaleString("es-VE", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      Bs.
                      {imp.base_imponible.toLocaleString("es-VE", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      Bs.
                      {imp.iva_calculado.toLocaleString("es-VE", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td>{imp.fecha_registro.toLocaleDateString()}</td>
                    <td>
                      <span
                        className={`badge d-flex align-items-center justify-content-center gap-1 ${
                          imp.estado === "pagado"
                            ? "bg-success"
                            : "bg-warning text-dark"
                        } px-3 py-2 rounded-pill`}
                      >
                        {imp.estado === "pagado" ? (
                          <FaCheckCircle size={12} />
                        ) : (
                          <FaTimesCircle size={12} />
                        )}
                        {imp.estado === "pagado" ? "Pagado" : "pendiente"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador */}
        {totalPaginas > 1 && (
          <div className="card-footer d-flex flex-wrap justify-content-between align-items-center bg-light">
            <small className="text-muted">
              Mostrando <strong>{indicePrimero + 1}</strong> a{" "}
              <strong>
                {Math.min(indiceUltimo, impuestosFiltrados.length)}
              </strong>{" "}
              de <strong>{impuestosFiltrados.length}</strong> impuestos
            </small>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li
                  className={`page-item ${
                    paginaActual === 1 ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => setPaginaActual(paginaActual - 1)}
                    disabled={paginaActual === 1}
                  >
                    ‹ Anterior
                  </button>
                </li>
                {[...Array(totalPaginas)].map((_, i) => (
                  <li
                    key={i + 1}
                    className={`page-item ${
                      paginaActual === i + 1 ? "active" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setPaginaActual(i + 1)}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li
                  className={`page-item ${
                    paginaActual === totalPaginas ? "disabled" : ""
                  }`}
                >
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
          </div>
        )}
      </div>

      {/* Botón de pago */}
      {(impuestosFiltrados.length > 0 || seleccionados.size > 0) && (
        <div className="text-end mt-4">
          <button
            className="btn btn-success btn-lg px-5 py-2"
            onClick={manejarPago}
          >
            <FaDollarSign className="me-2" />
            {Array.from(seleccionados).length > 0
              ? `Pagar ${seleccionados.size} Factura(s)`
              : "Registrar Pago de IVA"}
          </button>
        </div>
      )}
    </div>
  );
}

export default PagoImpuestos;
