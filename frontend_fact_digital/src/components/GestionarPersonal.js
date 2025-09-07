import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaUserPlus,
  FaEdit,
  FaSearch,
  FaTimes,
  FaSave,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaIdCard,
  FaUserShield,
  FaUserCog,
  FaUser,
  FaDollarSign,
} from "react-icons/fa";

function GestionarPersonal() {
  const [empleados, setEmpleados] = useState([]);
  const [empleadosFiltrados, setEmpleadosFiltrados] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  const empleadosPorPagina = 6;

  // Formulario
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    ci: "",
    telefono: "",
    ficha: "",
    rol: "cajero",
    email: "",
    direccion: "",
    salario_inicial: "",
  });

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const cargarEmpleados = async () => {
    try {
      const res = await axios.get("http://localhost:5000/empleados");
      const data = Array.isArray(res.data) ? res.data : [];
      setEmpleados(data);
      setEmpleadosFiltrados(data);
    } catch (err) {
      setError("Error al cargar empleados.");
    } finally {
      setCargando(false);
    }
  };

  // Filtrar empleados por nombre o ficha
  useEffect(() => {
    const texto = busqueda.toLowerCase().trim();
    if (!texto) {
      setEmpleadosFiltrados(empleados);
    } else {
      setEmpleadosFiltrados(
        empleados.filter(
          (emp) =>
            emp.nombre.toLowerCase().includes(texto) ||
            emp.apellido.toLowerCase().includes(texto) ||
            emp.ficha.toLowerCase().includes(texto)
        )
      );
    }
    setPaginaActual(1); // Resetear a página 1 al filtrar
  }, [busqueda, empleados]);

  // Paginación
  const indiceFinal = paginaActual * empleadosPorPagina;
  const indiceInicial = indiceFinal - empleadosPorPagina;
  const empleadosPaginados = empleadosFiltrados.slice(indiceInicial, indiceFinal);
  const totalPaginas = Math.ceil(empleadosFiltrados.length / empleadosPorPagina);

  const abrirModal = (emp = null) => {
    if (emp) {
      setEditando(emp.id);
      setForm({
        nombre: emp.nombre,
        apellido: emp.apellido,
        ci: emp.ci,
        telefono: emp.telefono || "",
        ficha: emp.ficha,
        rol: emp.rol,
        email: emp.email || "",
        direccion: emp.direccion || "",
        salario_inicial: "",
      });
    } else {
      setEditando(null);
      setForm({
        nombre: "",
        apellido: "",
        ci: "",
        telefono: "",
        ficha: "",
        rol: "cajero",
        email: "",
        direccion: "",
        salario_inicial: "",
      });
    }
    setMostrarModal(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await axios.put(`http://localhost:5000/empleados/${editando}`, form);
      } else {
        await axios.post("http://localhost:5000/empleados", form);
      }
      cargarEmpleados();
      setMostrarModal(false);
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar.");
    }
  };

  if (cargando) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-3">Cargando empleados...</p>
      </div>
    );
  }

  return (
    <div className="gestionar-personal p-4">
      <h3 className="mb-4 d-flex align-items-center gap-2 text-primary">
        <FaUserPlus /> Gestión de Personal
      </h3>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Botón para nuevo empleado */}
      <div className="mb-4 text-center">
        <button
          className="btn btn-success btn-lg d-flex align-items-center gap-2 mx-auto"
          onClick={() => abrirModal()}
        >
          <FaUserPlus /> Registrar Empleado
        </button>
      </div>

      {/* Búsqueda */}
      <div className="mb-4">
        <div className="input-group input-group-lg">
          <span className="input-group-text bg-light text-primary">
            <FaSearch />
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre, apellido o ficha..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
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

      {/* Tabla */}
      <div className="table-responsive shadow-sm rounded">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Empleado</th>
              <th>CI</th>
              <th>Ficha</th>
              <th>Rol</th>
              <th>Contacto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleadosPaginados.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center text-muted py-4">
                  No hay empleados que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              empleadosPaginados.map((emp) => (
                <tr key={emp.id}>
                  <td className="fw-bold text-primary">{emp.id}</td>
                  <td>
                    <strong>{emp.nombre} {emp.apellido}</strong>
                  </td>
                  <td>
                    <code>{emp.ci}</code>
                  </td>
                  <td>
                    <strong className="text-info">{emp.ficha}</strong>
                  </td>
                  <td>
                    <span
                      className={`badge d-flex align-items-center justify-content-center gap-1 ${
                        emp.rol === "admin"
                          ? "bg-danger"
                          : emp.rol === "supervisor"
                          ? "bg-warning text-dark"
                          : "bg-primary"
                      } px-3 py-2 rounded-pill`}
                    >
                      {emp.rol === "admin" && <FaUserShield size={12} />}
                      {emp.rol === "supervisor" && <FaUserCog size={12} />}
                      {emp.rol === "cajero" && <FaUser size={12} />}
                      {emp.rol.charAt(0).toUpperCase() + emp.rol.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="small text-truncate" style={{ maxWidth: "180px" }}>
                      <div className="d-flex align-items-center gap-1 mb-1">
                        <FaEnvelope size={12} className="text-muted" /> {emp.email || "-"}
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <FaPhone size={12} className="text-muted" /> {emp.telefono || "-"}
                      </div>
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                      onClick={() => abrirModal(emp)}
                      title="Editar empleado"
                    >
                      <FaEdit size={14} /> Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginador */}
      {totalPaginas > 1 && (
        <nav className="d-flex justify-content-center mt-4">
          <ul className="pagination pagination-sm">
            <li className={`page-item ${paginaActual === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setPaginaActual(paginaActual - 1)}
                disabled={paginaActual === 1}
              >
                Anterior
              </button>
            </li>
            {[...Array(totalPaginas)].map((_, i) => (
              <li
                key={i + 1}
                className={`page-item ${paginaActual === i + 1 ? "active" : ""}`}
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
                Siguiente
              </button>
            </li>
          </ul>
        </nav>
      )}

      {/* Modal */}
      {mostrarModal && (
        <div
          className="modal show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div
                className="modal-header bg-gradient text-white d-flex align-items-center"
                style={{
                  background:
                    "linear-gradient(45deg, #007bff, #0056b3)",
                }}
              >
                <h5 className="modal-title d-flex align-items-center gap-2">
                  {editando ? (
                    <>
                      <FaEdit /> Editar Empleado
                    </>
                  ) : (
                    <>
                      <FaUserPlus /> Nuevo Empleado
                    </>
                  )}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white ms-auto"
                  onClick={() => setMostrarModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-4">
                    <div className="col-md-6">
                      <label className="form-label d-flex align-items-center gap-2">
                        <FaUser /> Nombre
                      </label>
                      <input
                        className="form-control form-control-lg"
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label d-flex align-items-center gap-2">
                        <FaUser /> Apellido
                      </label>
                      <input
                        className="form-control form-control-lg"
                        name="apellido"
                        value={form.apellido}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label d-flex align-items-center gap-2">
                        <FaIdCard /> CI
                      </label>
                      <input
                        className="form-control form-control-lg"
                        name="ci"
                        value={form.ci}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label d-flex align-items-center gap-2">
                        <FaUserPlus /> Ficha
                      </label>
                      <input
                        className="form-control form-control-lg"
                        name="ficha"
                        value={form.ficha}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label d-flex align-items-center gap-2">
                        <FaPhone /> Teléfono
                      </label>
                      <input
                        className="form-control form-control-lg"
                        name="telefono"
                        value={form.telefono}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label d-flex align-items-center gap-2">
                        <FaEnvelope /> Email
                      </label>
                      <input
                        type="email"
                        className="form-control form-control-lg"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label d-flex align-items-center gap-2">
                        <FaUserShield /> Rol
                      </label>
                      <select
                        className="form-select form-select-lg"
                        name="rol"
                        value={form.rol}
                        onChange={handleChange}
                        required
                      >
                        <option value="cajero">Cajero</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label d-flex align-items-center gap-2">
                        <FaMapMarkerAlt /> Dirección
                      </label>
                      <input
                        className="form-control form-control-lg"
                        name="direccion"
                        value={form.direccion}
                        onChange={handleChange}
                      />
                    </div>
                    {!editando && (
                      <div className="col-md-6">
                        <label className="form-label d-flex align-items-center gap-2">
                          <FaDollarSign /> Salario Inicial (Bs)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-lg"
                          name="salario_inicial"
                          value={form.salario_inicial}
                          onChange={handleChange}
                        />
                      </div>
                    )}
                    {editando && (
                      <div className="col-md-6">
                        <label className="form-label d-flex align-items-center gap-2">
                          <FaDollarSign /> Nuevo Salario (Bs)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-lg"
                          name="nuevo_salario"
                          onChange={handleChange}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer bg-light p-3 d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-lg px-4"
                    onClick={() => setMostrarModal(false)}
                  >
                    <FaTimes /> Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary btn-lg px-4">
                    <FaSave /> {editando ? "Actualizar" : "Registrar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionarPersonal;