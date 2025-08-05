import React from 'react';

const ProductosTable = ({ selectedProducts, handleCantidadChange, handleEliminarProducto }) => {
    return (
        <div className="mt-4">
            
            <table className="table table-bordered table-striped">
                <thead className="thead-dark">
                    <tr>
                        <th>Código</th>
                        <th>Descripción</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th>Subtotal</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {selectedProducts.map((producto, index) => (
                        <tr key={index}>
                            <td>{producto.codigo}</td>
                            <td>{producto.descripcion}</td>
                            <td>
                                <input
                                    type="number"
                                    value={producto.cantidadSeleccionada}
                                    onChange={(e) => handleCantidadChange(index, parseInt(e.target.value))}
                                    min="1"
                                />
                            </td>
                            <td>${producto.precio}</td>
                            <td>${(producto.precio * producto.cantidadSeleccionada).toFixed(2)}</td>
                            <td>
                                <button 
                                    className="btn btn-danger" 
                                    onClick={() => handleEliminarProducto(index)} // Llama a la función de eliminar
                                >
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    ))}
                    {/* Fila para mostrar el total de la factura */}
                    <tr>
                        <td colSpan="4" style={{ textAlign: 'right' }}><strong>Total sin IVA:</strong></td>
                        <td>${selectedProducts.reduce((total, producto) => total + (producto.precio * producto.cantidadSeleccionada), 0).toFixed(2)}</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td colSpan="4" style={{ textAlign: 'right' }}><strong>IVA (16%):</strong></td>
                        <td>${(selectedProducts.reduce((total, producto) => total + (producto.precio * producto.cantidadSeleccionada), 0) * 0.16).toFixed(2)}</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td colSpan="4" style={{ textAlign: 'right' }}><strong>Total con IVA:</strong></td>
                        <td>${(selectedProducts.reduce((total, producto) => total + (producto.precio * producto.cantidadSeleccionada), 0) * 1.16).toFixed(2)}</td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default ProductosTable;