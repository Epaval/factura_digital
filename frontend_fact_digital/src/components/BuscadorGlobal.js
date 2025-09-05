// src/components/BuscadorGlobal.js
import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";
import ResultadosBusquedaModal from "./ResultadosBusquedaModal";

function BuscadorGlobal({ onSelectProducto, onSelectCliente }) {
  const [termino, setTermino] = useState("");
  const [resultados, setResultados] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Buscar con debounce
  React.useEffect(() => {
    if (!termino.trim()) {
      setResultados([]);
      setMostrarModal(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:5000/buscar?q=${encodeURIComponent(termino)}`);
        const data = await res.json();
        setResultados(data);
        setMostrarModal(true);
      } catch (err) {
        setResultados([]);
        setMostrarModal(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [termino]);

  const handleClose = () => {
    setMostrarModal(false);
    setTimeout(() => setTermino(""), 200); // Opcional: limpiar después de cerrar
  };

  return (
    <div className="position-relative w-100">
      <div className="input-group">
        <span className="input-group-text bg-light">
          <FaSearch />
        </span>
        <input
          type="text"
          className="form-control"
          placeholder="Buscar productos, clientes..."
          value={termino}
          onChange={(e) => setTermino(e.target.value)}
          onFocus={() => termino && resultados.length > 0 && setMostrarModal(true)}
        />
      </div>

      {/* Modal de resultados */}
      {mostrarModal && (
        <ResultadosBusquedaModal
          resultados={resultados}
          onClose={handleClose}
          onSelectProducto={(producto) => {
            onSelectProducto?.(producto);
            handleClose();
          }}
          onSelectCliente={(cliente) => {
            onSelectCliente?.(cliente);
            handleClose();
          }}
        />
      )}
    </div>
  );
}

export default BuscadorGlobal;