import React from "react";

const ModalNuevoCliente = ({ mostrar, onCerrar, onGuardar }) => {
  const [nombre, setNombre] = React.useState("");
  const [tipoRif, setTipoRif] = React.useState("V");
  const [numeroRif, setNumeroRif] = React.useState("");
  const [correo, setCorreo] = React.useState("");
  const [operador, setOperador] = React.useState("");
  const [telefono, setTelefono] = React.useState("");
  const [direccion, setDireccion] = React.useState("");

  const handleNombreChange = (e) => {
    const value = e.target.value;
    // Convierte la primera letra de cada palabra a mayúscula
    const formattedValue = value
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
    setNombre(formattedValue); // Actualiza el estado con el valor formateado
  };

  const handleGuardar = () => {
    const nuevoCliente = {
      nombre,
      tipo_rif: tipoRif,
      numero_rif: numeroRif,
      correo,
      operador: parseInt(operador),
      telefono: parseInt(telefono),
      direccion,
    };
    onGuardar(nuevoCliente);
    onCerrar();
  };

  if (!mostrar) return null;

  return (
    <div
      className="modal"
      tabIndex="-1"
      role="dialog"
      style={{ display: "block", backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Registrar Nuevo Cliente</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onCerrar}
            ></button>
          </div>
          <div className="modal-body">
            <form>
              <div className="mb-3">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  className="form-control capitalize"
                  value={nombre}
                  onChange={handleNombreChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Tipo RIF</label>
                <select
                  className="form-select"
                  value={tipoRif}
                  onChange={(e) => setTipoRif(e.target.value)}
                  required
                >
                  <option value="V">V</option>
                  <option value="E">E</option>
                  <option value="J">J</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Número RIF</label>
                <input
                  type="text"
                  className="form-control"
                  value={numeroRif}
                  onChange={(e) => setNumeroRif(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Correo</label>
                <input
                  type="email"
                  className="form-control"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Código de Teléfono</label>
                <select
                  className="form-select"
                  value={operador}
                  onChange={(e) => setOperador(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Seleccione un código
                  </option>
                  <option value="0412">0412</option>
                  <option value="0416">0416</option>
                  <option value="0414">0414</option>
                  <option value="0424">0424</option>
                  <option value="0426">0426</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Teléfono</label>
                <input
                  type="number"
                  className="form-control"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  max="99999999999"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  className="form-control capitalize"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  required
                />
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCerrar}
            >
              Cerrar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGuardar}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalNuevoCliente;