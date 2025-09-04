// src/components/PagosChart.js
import React from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function PagosChart({ pagosPorTipo }) {
  const data = {
    labels: pagosPorTipo.map(p => p.nombre),
    datasets: [
      {
        data: pagosPorTipo.map(p => parseFloat(p.total)),
        backgroundColor: [
          "#4CAF50",
          "#2196F3",
          "#FF9800",
          "#f44336",
          "#9C27B0",
          "#00BCD4",
        ],
      },
    ],
  };

  return (
    <div style={{ width: "300px", margin: "0 auto" }}>
      <Pie data={data} options={{ responsive: true }} />
    </div>
  );
}

export default PagosChart;