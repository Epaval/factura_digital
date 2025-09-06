import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaUserShield, FaUserCog, FaUserTimes, FaEdit, FaSave, FaTimes, FaUserPlus, FaSearch } from "react-icons/fa";

function GestionarEmpleados() {
  const [empleados, setEmpleados] = useState([]);
  const [empleadosFiltrados, setEmpleadosFiltrados] = useState([]);
  const [editando, setEditando] = useState(null);
  const [nuevosRoles, setNuevosRoles] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  const empleadosPorPagina = 5;

  // Cargar empleados
  useEffect(() => {
    const cargarEmpleados = async () => {
      try {
        const res = await axios.get("http://localhost:5000/empleados");
        const data = Array.isArray(res.data) ? res.data : [];
        setEmpleados(data);
        setEmpleadosFiltrados(data);

        // Inicializar roles
        const rolesIniciales = {};
        data.forEach(emp => {
          rolesIniciales[emp.id] = emp.rol;
        });
        setNuevosRoles(rolesIniciales);
      } catch (err) {
        setError("Error al cargar empleados.");
      } finally {
        setCargando(false);
      }
    };

    cargarEmpleados();
  }, []);

  // Filtrar empleados por nombre o ficha
  useEffect(() => {
    const texto = busqueda.toLowerCase().trim();
    if (!texto) {
      setEmpleadosFiltrados(empleados);
    } else {
      setEmpleadosFiltrados(
        empleados.filter(emp =>
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

  // Manejar cambio de rol
  const handleRolChange = (id, nuevoRol) => {
    setNuevosRoles(prev => ({
      ...prev,
      [id]: nuevoRol
    }));
  };

  // Iniciar edición
  const iniciarEdicion = (id) => {
    setEditando(id);
  };

  // Guardar cambios
  const guardarCambios = async (id) => {
    const nuevoRol = nuevosRoles[id];
    if (!nuevoRol) {
      alert("Por favor seleccione un rol válido.");
      return;
    }

    try {
      await axios.put(`http://localhost:5000/empleados/${id}/rol`, { rol: nuevoRol });
      setEmpleados(prev => prev.map(emp =>
        emp.id === id ? { ...emp, rol: nuevoRol } : emp
      ));
      setEmpleadosFiltrados(prev => prev.map(emp =>
        emp.id === id ? { ...emp, rol: nuevoRol } : emp
      ));
      setEditando(null);
    } catch (err) {
      setError("Error al actualizar el rol.");
    }
  };

  // Cancelar edición
  const cancelarEdicion = (id) => {
    setNuevosRoles(prev => ({
      ...prev,
      [id]: empleados.find(e => e.id === id)?.rol || 'cajero'
    }));
    setEditando(null);
  };

  // Obtener ícono según rol
  const getIconoRol = (rol) => {
    switch (rol) {
      case 'admin':
        return <FaUserShield className="text-danger" />;
      case 'supervisor':
        return <FaUserCog className="text-warning" />;
      case 'desactivado':
        return <FaUserTimes className="text-secondary" />;
      default:
        return <FaUserPlus className="text-primary" />;
    }
  };

  if (cargando) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status" />
        <p>Cargando empleados...</p>
      </div>
    );
  }

  return (
    <div className="gestionar-empleados p-4">
      <h3 className="mb-4 d-flex align-items-center gap-2">
        👥 Gestión de Empleados
      </h3>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filtro de búsqueda */}
      <div className="mb-4">
        <div className="input-group input-group-lg">
          <span className="input-group-text bg-light">
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
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleadosPaginados.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center text-muted py-4">
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
                    <strong className="text-primary">{emp.ficha}</strong>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      {getIconoRol(emp.rol)}
                      <span
                        className={`badge ${
                          emp.rol === 'admin' ? 'bg-danger' :
                          emp.rol === 'supervisor' ? 'bg-warning text-dark' :
                          emp.rol === 'desactivado' ? 'bg-secondary' : 'bg-primary'
                        } px-3 py-2 rounded-pill`}
                      >
                        {emp.rol === 'desactivado'
                          ? 'Desactivado'
                          : emp.rol.charAt(0).toUpperCase() + emp.rol.slice(1)
                        }
                      </span>
                    </div>
                  </td>
                  <td>
                    {editando === emp.id ? (
                      <div className="d-flex gap-2">
                        <select
                          className="form-select form-select-sm"
                          value={nuevosRoles[emp.id] || emp.rol}
                          onChange={(e) => handleRolChange(emp.id, e.target.value)}
                        >
                          <option value="cajero">Cajero</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="admin">Admin</option>
                          <option value="desactivado">Desactivado</option>
                        </select>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => guardarCambios(emp.id)}
                          title="Guardar"
                        >
                          <FaSave />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => cancelarEdicion(emp.id)}
                          title="Cancelar"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                        onClick={() => iniciarEdicion(emp.id)}
                        title="Editar rol"
                      >
                        <FaEdit size={14} /> Editar
                      </button>
                    )}
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
              <li key={i + 1} className={`page-item ${paginaActual === i + 1 ? "active" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setPaginaActual(i + 1)}
                >
                  {i + 1}
                </button>
              </li>
            ))}
            <li className={`page-item ${paginaActual === totalPaginas ? "disabled" : ""}`}>
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

      {/* Nota */}
      <div className="mt-3 text-muted">
        <small>
          <strong>Nota:</strong> Los empleados con rol <code>desactivado</code> no podrán iniciar sesión.
        </small>
      </div>
    </div>
  );
}

export default GestionarEmpleados;