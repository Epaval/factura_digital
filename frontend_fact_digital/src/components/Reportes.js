// src/components/Reportes.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Reportes() {
  const [reportes, setReportes] = useState(null);
  const [ventasComparacion, setVentasComparacion] = useState({
    mesActual: [],
    mesAnterior: [],
    labels: [],
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar reportes generales (total diario, impuestos, etc.)
        const resReportes = await axios.get("http://localhost:5000/reportes/admin");
        setReportes(resReportes.data);

        // Cargar comparación de ventas: mes actual vs mes anterior
        const resComparacion = await axios.get("http://localhost:5000/reportes/ventas-comparacion");
        //console.log("Datos de comparación recibidos:", resComparacion.data);
        setVentasComparacion(resComparacion.data);
      } catch (err) {
        console.error("Error al cargar reportes:", err);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  if (cargando) {
    return (
      <div className="text-center mt-4">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2">Cargando reportes...</p>
      </div>
    );
  }

  const { mesActual, mesAnterior, labels } = ventasComparacion;

  // Preparar datos para el gráfico
  const data = {
    labels: labels,
    datasets: [
      {
        label: "Mes Actual",
        data: mesActual,
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: "Mes Anterior",
        data: mesAnterior,
        borderColor: "rgba(150, 150, 150, 0.7)",
        backgroundColor: "rgba(150, 150, 150, 0.1)",
        borderDash: [5, 5],
        tension: 0.4,
        fill: false,
        pointRadius: 3,
        pointBackgroundColor: "rgba(150, 150, 150, 0.7)",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: (context) => `Bs. ${context.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `Bs. ${value.toLocaleString()}`,
        },
      },
      x: {
        title: {
          display: true,
          text: "Día del mes",
        },
      },
    },
  };

  return (
    <div className="p-4">
      <h2 className="mb-4">📊 Reportes Administrativos</h2>

      {/* Tarjetas de resumen */}
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="card bg-primary text-white shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Total Diario</h5>
              <h3 className="fw-bold">
                Bs.{reportes?.totalDiario?.toFixed(2) || "0.00"}
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card bg-success text-white shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Impuestos (IVA)</h5>
              <h3 className="fw-bold">
                Bs.{reportes?.impuestos?.toFixed(2) || "0.00"}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de comparación de ventas */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">📈 Ventas Diarias: Mes Actual vs Mes Anterior</h5>
        </div>
        <div className="card-body">
          {labels.length === 0 ? (
            <div className="text-center text-muted py-5">
              No hay datos de ventas disponibles.
            </div>
          ) : (
            <div style={{ height: "400px", maxWidth: "100%" }}>
              <Line data={data} options={options} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reportes;