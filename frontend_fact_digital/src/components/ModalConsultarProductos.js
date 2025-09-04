// src/components/ModalConsultarProductos.js
import React, { useState } from 'react';

const ModalConsultarProductos = ({ 
  mostrar, 
  onCerrar, 
  productos, 
  onActualizarProducto, 
  onAgregarProducto 
}) => {
  const [filtro, setFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('codigo'); // 'codigo' o 'descripcion'
  const [paginaActual, setPaginaActual] = useState(1);
  const [productoSeleccionado, setProductoSeleccionado] = useState({
    id: null,
    codigo: '',
    descripcion: '',
    cantidad: 0,
    precio: 0,
  }); // ✅ Inicializado con valores por defecto
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoFormulario, setModoFormulario] = useState('crear'); // 'crear' o 'editar'
  const elementosPorPagina = 5;

  if (!mostrar) return null;

  // Filtrar productos
  const productosFiltrados = productos.filter(producto => {
    const filtroMinusculas = filtro.toLowerCase();
    if (tipoFiltro === 'codigo') {
      return producto.codigo.toLowerCase().includes(filtroMinusculas);
    } else {
      return producto.descripcion.toLowerCase().includes(filtroMinusculas);
    }
  });

  // Paginación
  const indiceUltimoProducto = paginaActual * elementosPorPagina;
  const indicePrimerProducto = indiceUltimoProducto - elementosPorPagina;
  const productosAMostrar = productosFiltrados.slice(indicePrimerProducto, indiceUltimoProducto);
  const totalPaginas = Math.ceil(productosFiltrados.length / elementosPorPagina);

  // Manejar clic en "Actualizar"
  const handleActualizarClick = (producto) => {
    setProductoSeleccionado({
      ...producto,
      cantidad: Number(producto.cantidad) || 0,
      precio: Number(producto.precio) || 0,
    });
    setModoFormulario('editar');
    setMostrarFormulario(true);
  };

  // Manejar clic en "Agregar Producto"
  const handleAgregarClick = () => {
    setProductoSeleccionado({
      id: null,
      codigo: '',
      descripcion: '',
      cantidad: 0,
      precio: 0,
    });
    setModoFormulario('crear');
    setMostrarFormulario(true);
  };

  // Manejar cambio en inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductoSeleccionado(prev => ({
      ...prev,
      [name]: name === 'precio' || name === 'cantidad' 
        ? parseFloat(value) || 0  // ✅ Convertir a número
        : value
    }));
  };

  // Enviar formulario
  const handleFormSubmit = (e) => {
    e.preventDefault();

    // ✅ Aseguramos que precio y cantidad sean números
    const productoListo = {
      ...productoSeleccionado,
      precio: parseFloat(productoSeleccionado.precio) || 0,
      cantidad: parseInt(productoSeleccionado.cantidad) || 0,
    };

    if (modoFormulario === 'editar') {
      onActualizarProducto(productoListo);
    } else {
      onAgregarProducto(productoListo);
    }

    setMostrarFormulario(false);
  };

  return (
    <div className="modal" tabIndex="-1" role="dialog" style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Listado de Productos</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onCerrar}></button>
          </div>
          <div className="modal-body">
            {mostrarFormulario ? (
              // Formulario para crear o editar
              <form onSubmit={handleFormSubmit}>
                <div className="mb-3">
                  <label htmlFor="codigo" className="form-label">Código</label>
                  <input
                    type="text"
                    className="form-control"
                    id="codigo"
                    name="codigo"
                    value={productoSeleccionado.codigo}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="descripcion" className="form-label">Descripción</label>
                  <input
                    type="text"
                    className="form-control capitalize"
                    id="descripcion"
                    name="descripcion"
                    value={productoSeleccionado.descripcion}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="cantidad" className="form-label">Cantidad</label>
                  <input
                    type="number"
                    className="form-control"
                    id="cantidad"
                    name="cantidad"
                    value={productoSeleccionado.cantidad}
                    onChange={handleInputChange}
                    required
                    min="0"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="precio" className="form-label">Precio</label>
                  <input
                    type="number"
                    className="form-control"
                    id="precio"
                    name="precio"
                    value={productoSeleccionado.precio}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    min="0"
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  {modoFormulario === 'editar' ? 'Guardar Cambios' : 'Agregar Producto'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary ms-2"
                  onClick={() => setMostrarFormulario(false)}
                >
                  Cancelar
                </button>
              </form>
            ) : (
              // Tabla de productos
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <label htmlFor="tipoFiltro">Filtrar por:</label>
                    <select
                      id="tipoFiltro"
                      className="form-select"
                      value={tipoFiltro}
                      onChange={(e) => setTipoFiltro(e.target.value)}
                    >
                      <option value="codigo">Código</option>
                      <option value="descripcion">Descripción</option>
                    </select>
                  </div>
                  <button className="btn btn-success" onClick={handleAgregarClick}>
                    Agregar Producto
                  </button>
                </div>
                <div className="mb-3">
                  <label htmlFor="filtro">Buscar:</label>
                  <input
                    type="text"
                    id="filtro"
                    className="form-control"
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    placeholder="Filtrar productos..."
                  />
                </div>
                <table className="table table-bordered table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Código</th>
                      <th>Descripción</th>
                      <th>Cantidad</th>
                      <th>Precio</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosAMostrar.length > 0 ? (
                      productosAMostrar.map((producto) => (
                        <tr key={producto.id}>
                          <td>{producto.codigo}</td>
                          <td>{producto.descripcion}</td>
                          <td>{producto.cantidad}</td>
                          <td>Bs.{parseFloat(producto.precio).toFixed(2)}</td>
                          <td>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleActualizarClick(producto)}
                            >
                              Actualizar
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center">No se encontraron productos</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Paginación */}
                <nav>
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${paginaActual === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}>
                        Anterior
                      </button>
                    </li>
                    {[...Array(totalPaginas)].map((_, index) => (
                      <li key={index} className={`page-item ${paginaActual === index + 1 ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => setPaginaActual(index + 1)}>
                          {index + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${paginaActual === totalPaginas ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}>
                        Siguiente
                      </button>
                    </li>
                  </ul>
                </nav>
              </>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onCerrar}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalConsultarProductos;