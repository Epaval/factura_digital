// src/components/CalculadoraIVA.js
import React, { useState, useEffect } from "react";
import axios from "axios";

function CalculadoraIVA() {
  const [ventasMes, setVentasMes] = useState(0);
  const [ivaRecaudado, setIvaRecaudado] = useState(0);
  const [comprasConIva, setComprasConIva] = useState(0);
  const [ivaSoportado, setIvaSoportado] = useState(0);
  const [ivaAPagar, setIvaAPagar] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const calcularIVA = async () => {
      try {
        const resVentas = await axios.get("http://localhost:5000/reportes/ventas-mes-actual");

        // ✅ Validar y convertir a número
        const totalVentas = resVentas.data && typeof resVentas.data.total === "number"
          ? resVentas.data.total
          : 0;

        const ivaRec = totalVentas * 0.16;

        setVentasMes(totalVentas);
        setIvaRecaudado(ivaRec);

        // Compras con IVA (opcional)
        const totalCompras = 0;
        const ivaSoport = totalCompras * 0.16;

        setComprasConIva(totalCompras);
        setIvaSoportado(ivaSoport);

        const ivaPagar = Math.max(0, ivaRec - ivaSoport);
        setIvaAPagar(ivaPagar);
      } catch (err) {
        console.error("Error al calcular IVA:", err);
        // ✅ En caso de error, establecer valores seguros
        setVentasMes(0);
        setIvaRecaudado(0);
        setComprasConIva(0);
        setIvaSoportado(0);
        setIvaAPagar(0);
      } finally {
        setCargando(false);
      }
    };

    calcularIVA();
  }, []);

  if (cargando) {
    return <p className="text-center">Cargando datos de IVA...</p>;
  }

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-danger text-white">
        <h5>📊 Cálculo de IVA Mensual</h5>
      </div>
      <div className="card-body">
        <ul className="list-group">
          <li className="list-group-item d-flex justify-content-between">
            <strong>Total Ventas (con IVA)</strong>
            <span>Bs.{ventasMes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </li>
          <li className="list-group-item d-flex justify-content-between text-success">
            <strong>IVA Recaudado (16%)</strong>
            <span>Bs.{ivaRecaudado.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </li>
          <li className="list-group-item d-flex justify-content-between text-info">
            <strong>Compras con IVA</strong>
            <span>Bs.{comprasConIva.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </li>
          <li className="list-group-item d-flex justify-content-between text-primary">
            <strong>IVA Soportado</strong>
            <span>Bs.{ivaSoportado.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </li>
          <li className="list-group-item d-flex justify-content-between fw-bold bg-light">
            <strong>IVA a Pagar al SENIAT</strong>
            <span className="text-danger">
              Bs.{ivaAPagar.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </li>
        </ul>
        <div className="mt-3 alert alert-warning">
          <small>
            <strong>Nota:</strong> Este cálculo es orientativo. Debe validarse con el contador y declararse en el Formulario D-100 del SENIAT.
          </small>
        </div>
      </div>
    </div>
  );
}

export default CalculadoraIVA;