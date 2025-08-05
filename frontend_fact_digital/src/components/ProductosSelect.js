import React, { useState } from "react";

const ProductosSelect = ({ productos, onAddProduct }) => {
  const [selectedProduct, setSelectedProduct] = useState("");

  const handleAddProduct = () => {
    if (selectedProduct) {
      // Buscar el producto seleccionado en la lista de productos
      const producto = productos.find((p) => p.id === parseInt(selectedProduct));
      if (producto) {
        // Llamar a la función onAddProduct del componente padre
        onAddProduct(producto);
        setSelectedProduct(""); // Limpiar el select después de agregar
      }
    }
  };

  return (
    <div className="card p-3 shadow-sm mt-4">
      <h2 className="card-title text-center mb-3">Productos</h2>
      <div className="mb-3">
        <select
          className="form-select"
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
        >
          <option value="">Seleccione un producto</option>
          {productos.map((producto) => (
            <option key={producto.id} value={producto.id}>
              {producto.descripcion} - ${producto.precio}
            </option>
          ))}
        </select>
      </div>
      <div className="d-flex justify-content-end">
        <button
          className="btn btn-primary w-25"
          onClick={handleAddProduct}
          disabled={!selectedProduct} // Deshabilitar el botón si no hay producto seleccionado
        >
          Agregar Producto
        </button>
      </div>
    </div>
  );
};

export default ProductosSelect;