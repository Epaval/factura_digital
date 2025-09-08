// src/components/GestionarProveedores.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaUserTie, FaIdCard, FaMapMarkerAlt, FaPhone, FaEnvelope, FaSearch, FaEdit, FaTrash } from "react-icons/fa";

function GestionarProveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const porPagina = 10;
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [proveedorEdit, setProveedorEdit] = useState(null);

  useEffect(() => {
    cargarProveedores();
  }, []);

  const cargarProveedores = async () => {
    try {
      const res = await axios.get("http://localhost:5000/proveedores");
      setProveedores(res.data);
    } catch (err) {
      console.error("Error al cargar proveedores:", err);
    } finally {
      setCargando(false);
    }
  };

  const abrirModal = (prov = null) => {
    setProveedorEdit(prov || {
      nombre: "",
      tipo_rif: "J",
      numero_rif: "",
      direccion: "",
      telefono: "",
      persona_contacto: "",
      email_contacto: ""
    });
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setProveedorEdit(null);
  };

  const guardarProveedor = async () => {
    try {
      if (proveedorEdit.id) {
        await axios.put(`http://localhost:5000/proveedores/${proveedorEdit.id}`, proveedorEdit);
      } else {
        await axios.post("http://localhost:5000/proveedores", proveedorEdit);
      }
      cargarProveedores();
      cerrarModal();
    } catch (err) {
      alert("Error al guardar proveedor.");
    }
  };

  const eliminarProveedor = async (id) => {
    if (window.confirm("¿Eliminar este proveedor?")) {
      await axios.delete(`http://localhost:5000/proveedores/${id}`);
      cargarProveedores();
    }
  };

  const proveedoresFiltrados = proveedores.filter(p =>
    p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    p.numero_rif.includes(filtro)
  );

  const indiceUlt = paginaActual * porPagina;
  const indicePrim = indiceUlt - porPagina;
  const paginados = proveedoresFiltrados.slice(indicePrim, indiceUlt);

  if (cargando) return <p>Cargando proveedores...</p>;

  return (
    <div className="p-4">
      <h2 className="mb-4 d-flex align-items-center gap-2">
        <FaUserTie /> Gestión de Proveedores
      </h2>

      <div className="d-flex justify-content-between mb-3">
        <div className="input-group w-50">
          <span className="input-group-text"><FaSearch /></span>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre o RIF..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => abrirModal()}>
          + Nuevo Proveedor
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>Nombre</th>
              <th>RIF</th>
              <th>Contacto</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginados.map(p => (
              <tr key={p.id}>
                <td><strong>{p.nombre}</strong></td>
                <td><code>{p.tipo_rif}-{p.numero_rif}</code></td>
                <td>{p.persona_contacto}</td>
                <td>{p.telefono}</td>
                <td>{p.email_contacto}</td>
                <td>
                  <button className="btn btn-sm btn-outline-primary me-1" onClick={() => abrirModal(p)}>
                    <FaEdit />
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => eliminarProveedor(p.id)}>
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {mostrarModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5>{proveedorEdit.id ? "Editar" : "Nuevo"} Proveedor</h5>
                <button className="btn-close" onClick={cerrarModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label>Nombre</label>
                  <input className="form-control" value={proveedorEdit.nombre} onChange={e => setProveedorEdit({...proveedorEdit, nombre: e.target.value})} />
                </div>
                <div className="row mb-3">
                  <div className="col-3">
                    <label>RIF</label>
                    <select className="form-select" value={proveedorEdit.tipo_rif} onChange={e => setProveedorEdit({...proveedorEdit, tipo_rif: e.target.value})}>
                      <option value="V">V</option>
                      <option value="E">E</option>
                      <option value="J">J</option>
                      <option value="G">G</option>
                    </select>
                  </div>
                  <div className="col-9">
                    <label className="visually-hidden">Número RIF</label>
                    <input className="form-control" value={proveedorEdit.numero_rif} onChange={e => setProveedorEdit({...proveedorEdit, numero_rif: e.target.value})} />
                  </div>
                </div>
                <div className="mb-3">
                  <label>Dirección</label>
                  <input className="form-control" value={proveedorEdit.direccion} onChange={e => setProveedorEdit({...proveedorEdit, direccion: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label>Teléfono</label>
                  <input className="form-control" value={proveedorEdit.telefono} onChange={e => setProveedorEdit({...proveedorEdit, telefono: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label>Persona de Contacto</label>
                  <input className="form-control" value={proveedorEdit.persona_contacto} onChange={e => setProveedorEdit({...proveedorEdit, persona_contacto: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label>Email de Contacto</label>
                  <input type="email" className="form-control" value={proveedorEdit.email_contacto} onChange={e => setProveedorEdit({...proveedorEdit, email_contacto: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={cerrarModal}>Cancelar</button>
                <button className="btn btn-primary" onClick={guardarProveedor}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionarProveedores;