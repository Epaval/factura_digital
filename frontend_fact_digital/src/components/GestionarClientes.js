// src/components/GestionarClientes.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaUser,
  FaIdCard,
  FaEnvelope,
  FaPhone,
  FaSearch,
  FaFilter,
  FaChevronUp,
  FaChevronDown,
} from "react-icons/fa";

function GestionarClientes() {
  const [clientes, setClientes] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [cargando, setCargando] = useState(true);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const clientesPorPagina = 6;

  // Ordenamiento
  const [ordenarPor, setOrdenarPor] = useState("nombre");
  const [direccion, setDireccion] = useState("asc"); // 'asc' o 'desc'

  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const res = await axios.get("http://localhost:5000/clientes");
        // Ordenar alfabéticamente por nombre al cargar
        const clientesOrdenados = res.data.sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        );
        setClientes(clientesOrdenados);
      } catch (err) {
        console.error("Error al cargar clientes:", err);
      } finally {
        setCargando(false);
      }
    };
    cargarClientes();
  }, []);

  // Filtrar y ordenar
  const clientesFiltrados = clientes
    .filter((cliente) =>
      `${cliente.nombre} ${cliente.tipo_rif}-${cliente.numero_rif}`
        .toLowerCase()
        .includes(filtro.toLowerCase())
    )
    .sort((a, b) => {
      if (ordenarPor === "nombre") {
        return direccion === "asc"
          ? a.nombre.localeCompare(b.nombre)
          : b.nombre.localeCompare(a.nombre);
      } else if (ordenarPor === "rif") {
        const rifA = `${a.tipo_rif}${a.numero_rif}`;
        const rifB = `${b.tipo_rif}${b.numero_rif}`;
        return direccion === "asc"
          ? rifA.localeCompare(rifB)
          : rifB.localeCompare(rifA);
      }
      return 0;
    });

  // Paginación
  const indiceUltimo = paginaActual * clientesPorPagina;
  const indicePrimero = indiceUltimo - clientesPorPagina;
  const clientesPaginados = clientesFiltrados.slice(indicePrimero, indiceUltimo);
  const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina);

  // Cambiar página
  const cambiarPagina = (numero) => {
    setPaginaActual(numero);
  };

  // Cambiar orden
  const toggleOrden = (campo) => {
    if (ordenarPor === campo) {
      setDireccion(direccion === "asc" ? "desc" : "asc");
    } else {
      setOrdenarPor(campo);
      setDireccion("asc");
    }
  };

  if (cargando) {
    return (
      <div className="text-center mt-4">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2">Cargando clientes...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="mb-4">👥 Gestión de Clientes</h2>

      {/* Barra de búsqueda */}
      <div className="mb-4">
        <div className="input-group">
          <span className="input-group-text bg-light">
            <FaSearch />
          </span>
          <input
            type="text"
            className="form-control form-control-lg"
            placeholder="Buscar por nombre o RIF..."
            value={filtro}
            onChange={(e) => {
              setFiltro(e.target.value);
              setPaginaActual(1); // Resetear a página 1 al buscar
            }}
          />
          <span className="input-group-text bg-light">
            <FaFilter />
          </span>
        </div>
      </div>

      {/* Tabla de clientes */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleOrden("nombre")}
                >
                  Nombre
                  {ordenarPor === "nombre" && (
                    <span className="ms-1">
                      {direccion === "asc" ? <FaChevronUp /> : <FaChevronDown />}
                    </span>
                  )}
                </th>
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleOrden("rif")}
                >
                  RIF
                  {ordenarPor === "rif" && (
                    <span className="ms-1">
                      {direccion === "asc" ? <FaChevronUp /> : <FaChevronDown />}
                    </span>
                  )}
                </th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Dirección</th>
              </tr>
            </thead>
            <tbody>
              {clientesPaginados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">
                    <FaUser size={32} className="mb-2" />
                    <br />
                    <small>No se encontraron clientes.</small>
                  </td>
                </tr>
              ) : (
                clientesPaginados.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <FaUser className="text-muted" />
                        <strong>{cliente.nombre}</strong>
                      </div>
                    </td>
                    <td>
                      <code>{cliente.tipo_rif}-{cliente.numero_rif}</code>
                    </td>
                    <td>
                      {cliente.correo ? (
                        <a href={`mailto:${cliente.correo}`} className="text-primary">
                          <FaEnvelope className="me-1" /> {cliente.correo}
                        </a>
                      ) : (
                        <small className="text-muted">Sin correo</small>
                      )}
                    </td>
                    <td>
                      {cliente.telefono ? (
                        <a href={`tel:${cliente.operador}${cliente.telefono}`} className="text-success">
                          <FaPhone className="me-1" /> {cliente.operador}-{cliente.telefono}
                        </a>
                      ) : (
                        <small className="text-muted">Sin teléfono</small>
                      )}
                    </td>
                    <td>
                      <small className="text-muted">{cliente.direccion || "—"}</small>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador y resumen */}
        <div className="card-footer d-flex flex-column flex-md-row justify-content-between align-items-center bg-light">
          <small className="text-muted mb-2 mb-md-0">
            Mostrando{" "}
            <strong>
              {clientesPaginados.length > 0 ? indicePrimero + 1 : 0}
            </strong>{" "}
            a{" "}
            <strong>
              {Math.min(indiceUltimo, clientesFiltrados.length)}
            </strong>{" "}
            de <strong>{clientesFiltrados.length}</strong> clientes
          </small>

          {totalPaginas > 1 && (
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${paginaActual === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => cambiarPagina(paginaActual - 1)}
                    disabled={paginaActual === 1}
                  >
                    ‹ Anterior
                  </button>
                </li>
                {[...Array(totalPaginas)].map((_, i) => (
                  <li key={i + 1} className={`page-item ${paginaActual === i + 1 ? "active" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => cambiarPagina(i + 1)}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${paginaActual === totalPaginas ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => cambiarPagina(paginaActual + 1)}
                    disabled={paginaActual === totalPaginas}
                  >
                    Siguiente ›
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

export default GestionarClientes;