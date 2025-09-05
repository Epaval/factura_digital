// src/components/ImprimirTicket.js
import React from "react";

function ImprimirTicket({ factura, productos }) {
  const handleImprimir = () => {
    const contenido = `
      FACDIN - Facturación Digital
      --------------------------------
      FACTURA N°: ${factura.numero_factura}
      FECHA: ${new Date(factura.fecha).toLocaleString()}
      CAJA: ${factura.caja_id}
      CLIENTE: ${factura.cliente_nombre}
      RIF: ${factura.tipo_rif}-${factura.numero_rif}
      --------------------------------
      CANT  DESCRIPCIÓN           P.UNIT   SUBTOTAL
      --------------------------------
      ${productos
        .map(
          (p) =>
            `${p.cantidad.toString().padStart(4)}x ${p.descripcion.slice(0, 15).padEnd(15)} Bs.${p.precio.toFixed(2).padStart(8)} Bs.${(
              p.precio * p.cantidad
            ).toFixed(2)}`
        )
        .join("\n")}
      --------------------------------
      TOTAL: Bs.${factura.total?.toFixed(2)}
      MÉTODO DE PAGO: ${factura.metodo_pago || "Efectivo"}
      --------------------------------
      ¡Gracias por su compra!
    `.trim();

    const ventana = window.open("", "_blank");
    ventana.document.write(`
      <html>
        <head>
          <title>Ticket ${factura.numero_factura}</title>
          <style>
            body {
              font-family: monospace;
              white-space: pre;
              width: 80mm;
              margin: 0 auto;
              font-size: 10px;
              line-height: 1.2;
            }
            @media print {
              @page { margin: 0; }
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>${contenido}</body>
      </html>
    `);
    ventana.document.close();
    setTimeout(() => {
      ventana.print();
      ventana.close();
    }, 500);
  };

  return (
    <button onClick={handleImprimir} className="btn btn-sm btn-outline-dark w-100">
      🖨️ Imprimir Ticket
    </button>
  );
}

export default ImprimirTicket;