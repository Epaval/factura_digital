// Imprime un ticket pequeño para impresora térmica
function ImprimirTicket({ factura }) {
  const handleImprimir = () => {
    const contenido = `
      🧾 FACTURA
      N°: ${factura.numero_factura}
      Fecha: ${new Date(factura.fecha).toLocaleString()}
      Cliente: ${factura.cliente_nombre}
      
      Productos:
      ${factura.productos.map(p => `  ${p.cantidad}x ${p.descripcion} - Bs.${(p.precio * p.cantidad).toFixed(2)}`).join('\n')}
      
      Total: Bs.${factura.total.toFixed(2)}
      💵 ${factura.tipo_pago}
      
      Gracias por su compra!
    `.trim();

    const ventana = window.open("", "_blank");
    ventana.document.write(`
      <html>
        <head>
          <title>Ticket ${factura.numero_factura}</title>
          <style>
            body { font-family: monospace; white-space: pre; width: 80mm; margin: 0 auto; }
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>${contenido}</body>
      </html>
    `);
    ventana.document.close();
    ventana.print();
  };

  return (
    <button onClick={handleImprimir} className="btn btn-sm btn-outline-dark">
      🖨️ Imprimir Ticket
    </button>
  );
}

export default ImprimirTicket;