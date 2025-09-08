// src/components/AsignarProveedorProducto.js
import React, { useState, useEffect } from "react";
import axios from "axios";

function AsignarProveedorProducto() {
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      const [prodRes, provRes] = await Promise.all([
        axios.get("http://localhost:5000/productos"),
        axios.get("http://localhost:5000/proveedores")
      ]);
      setProductos(prodRes.data);
      setProveedores(provRes.data);
      setCargando(false);
    };
    cargarDatos();
  }, []);

  const actualizarProveedor = async (productoId, proveedorId) => {
    await axios.put(`http://localhost:5000/productos/${productoId}`, { proveedor_id: proveedorId });
    setProductos(prev => prev.map(p => p.id === productoId ? { ...p, proveedor_id: proveedorId } : p));
  };

  if (cargando) return <p>Cargando...</p>;

  return (
    <div className="p-4">
      <h2>📦 Asignar Proveedor a Productos</h2>
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio Venta</th>
              <th>Proveedor Actual</th>
              <th>Asignar Proveedor</th>
            </tr>
          </thead>
          <tbody>
            {productos.map(p => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td>Bs.{p.precio.toFixed(2)}</td>
                <td>
                  {p.proveedor_nombre || <small className="text-muted">Sin asignar</small>}
                </td>
                <td>
                  <select
                    className="form-select"
                    value={p.proveedor_id || ""}
                    onChange={e => actualizarProveedor(p.id, e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    {proveedores.map(prov => (
                      <option key={prov.id} value={prov.id}>
                        {prov.nombre}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AsignarProveedorProducto;