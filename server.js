// server.js
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const { YearlyPage } = require("twilio/lib/rest/api/v2010/account/usage/record/yearly");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Para jptech1.png

// === CONEXIÓN A LA BASE DE DATOS (con promesas) ===
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "facturacion",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  supportBigNumbers: false,
  bigNumberStrings: false,
});

// Exporta el pool con promesas
const promiseDb = db.promise();

// Probar conexión
promiseDb
  .query("SELECT 1")
  .then(() => console.log("✅ Conectado a la base de datos MySQL"))
  .catch((err) => {
    console.error("❌ Error conectando a la base de datos:", err);
    process.exit(1);
  });

// === Función para generar PDF desde datos ===
function generarPDFDesdeDatos(doc, factura, productos, dollarRate = 30) {
  const margin = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Obtener fecha y hora actuales
  const now = new Date();
  const fechaHoraActual = now.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Fecha de la factura (de la base de datos)
  const fechaFactura = factura.fecha
    ? new Date(factura.fecha).toLocaleDateString("es-ES")
    : "—";

  // === ENCABEZADO DE LA EMPRESA ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("J&P TECH, C.A.", margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Dirección: Los Samanes Norte, Valencia, Edo. Carabobo", margin, y);
  y += 5;
  doc.text("Teléfono: 0241-888888", margin, y);
  y += 5;
  doc.text("RIF: J-171352250", margin, y);
  y += 10;

  // === DATOS DE LA FACTURA ===
  doc.setFont("helvetica", "bold");
  doc.text("FACTURA", 150, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.text(`N°: ${factura.numero_factura}`, 150, y);
  y += 6;
  doc.text(`Control: ${factura.numero_control}`, 150, y);
  y += 6;
  doc.text(`Fecha: ${fechaFactura}`, 150, y);
  y += 6;
  doc.text(`Hora: ${fechaHoraActual.split(", ")[1] || "—"} `, 150, y);
  y += 10;

  // Línea divisoria
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // === DATOS DEL CLIENTE ===
  doc.setFont("helvetica", "bold");
  doc.text("DATOS DEL CLIENTE", margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.text(`Nombre: ${factura.cliente_nombre}`, margin, y);
  y += 6;
  doc.text(`RIF: ${factura.tipo_rif}-${factura.numero_rif}`, margin, y);
  y += 6;  
  doc.text(`Teléfono: ${factura.telefono || "—"}`, margin, y);
  y += 6;
  doc.text(`Dirección: ${factura.direccion || "—"}`, margin, y);
  y += 6;
  doc.text(`Operador: ${factura.operador || "—"}`, margin, y);
  y += 12;

  // Línea antes de la tabla
  doc.line(margin, y, pageWidth - margin, y);  
  y += 6;
  // === CABECERA DE LA TABLA ===
  doc.setFont("helvetica", "bold");
  doc.text("Código", margin, y);
  doc.text("Descripción", 40, y);
  doc.text("Cant", 100, y, { align: "center" });
  doc.text("P. Unitario", 140, y, { align: "right" });
  doc.text("Total", 1, y, { align: "right" });
  y += 5;

  // Línea debajo del encabezado
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // === FILAS DE PRODUCTOS ===
  productos.forEach((p) => {
    const precio = parseFloat(p.precio);
    const cantidad = parseInt(p.cantidad);
    const total = precio * cantidad;

    if (isNaN(precio) || isNaN(cantidad)) return;

    doc.setFont("helvetica", "normal");
    doc.text(p.codigo || "—", margin, y);
    doc.text(p.descripcion, 40, y);
    doc.text(String(cantidad), 100, y, { align: "center" });
    doc.text(`Bs.${precio.toFixed(2)}`, 140, y, { align: "right" });
    doc.text(`Bs.${total.toFixed(2)}`, 190, y, { align: "right" });
    y += 8;
  });

  y += 10;

  // Línea antes de los totales
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // === TOTALES ===
  const totalSinIVA = productos.reduce(
    (sum, p) => sum + parseFloat(p.precio) * parseInt(p.cantidad),
    0
  );
  const IVA = totalSinIVA * 0.16;
  const totalConIVA = totalSinIVA + IVA;

  doc.setFont("helvetica", "bold");
  doc.text(`Subtotal: Bs.${totalSinIVA.toFixed(2)}`, 150, y);
  y += 8;
  doc.text(`IVA (16%): Bs.${IVA.toFixed(2)}`, 150, y);
  y += 8;
  doc.text(`TOTAL: Bs.${totalConIVA.toFixed(2)}`, 150, y);

  // === TASA DE CAMBIO ===
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Tasa BCV: Bs.${dollarRate.toFixed(8)} (Actualizada: ${fechaHoraActual})`,
    margin,
    y
  );

  // === MENSAJE DE AGRADECIMIENTO ===
  y += 10;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.text("Gracias por su compra.", margin, y);

  return doc;
}

// === Inicializar contadores si no existen ===
const inicializarContadores = async () => {
  try {
    const [rows] = await promiseDb.query(
      "SELECT * FROM contadores WHERE id = 1"
    );
    if (rows.length === 0) {
      await promiseDb.query(
        "INSERT INTO contadores (id, ultimo_numero_factura, ultimo_numero_control) VALUES (1, 0, '00-000000')"
      );
      console.log("✅ Contador inicializado automáticamente.");
    }
  } catch (err) {
    console.error("❌ Error al inicializar contadores:", err);
  }
};

// Ejecutar al iniciar
inicializarContadores();

// === CARGA DE DEPENDENCIAS (jsPDF, QRCode) ===
let jsPDF, QRCode;
try {
  ({ jsPDF } = require("jspdf"));
  QRCode = require("qrcode");
} catch (error) {
  console.error("⚠️ Ejecuta: npm install jspdf qrcode");
}

// --- RUTAS BÁSICAS ---

// GET: Clientes
app.get("/clientes", (req, res) => {
  db.query("SELECT * FROM clientes", (err, results) => {
    if (err)
      return res.status(500).json({ message: "Error al obtener clientes." });
    res.json(results);
  });
});

// GET: Productos
app.get("/productos", (req, res) => {
  db.query("SELECT * FROM productos", (err, results) => {
    if (err)
      return res.status(500).json({ message: "Error al obtener productos." });
    const productos = results.map((p) => ({
      ...p,
      precio: parseFloat(p.precio),
    }));
    res.json(productos);
  });
});

// GET: Último número de factura
app.get("/facturas/ultimo-numero", async (req, res) => {
  try {
    const [rows] = await promiseDb.query(
      "SELECT MAX(numero_factura) AS ultimoNumeroFactura FROM facturas"
    );
    const ultimoNumeroFactura = rows[0].ultimoNumeroFactura || 0;
    const ultimoNumeroControl = `00-${(ultimoNumeroFactura + 1)
      .toString()
      .padStart(6, "0")}`;

    res.json({
      ultimoNumeroFactura,
      ultimoNumeroControl,
    });
  } catch (err) {
    console.error("Error al obtener último número:", err);
    res.status(500).json({ message: "Error al obtener números." });
  }
});

// === RUTA: Generar PDF con pagos incluidos ===
app.post("/facturas/generar-pdf", async (req, res) => {
  const { cliente, productos, dollarRate, caja_id } = req.body;

  if (
    !cliente ||
    !Array.isArray(productos) ||
    typeof dollarRate !== "number" ||
    !caja_id
  ) {
    return res.status(400).json({ message: "Datos incompletos." });
  }

  let connection;
  try {
    connection = await promiseDb.getConnection();
    await connection.beginTransaction();

    // Obtener número de factura
    const [rows] = await connection.query(
      "SELECT CAST(ultimo_numero_factura AS UNSIGNED) AS ultimo_numero_factura FROM contadores WHERE id = 1 FOR UPDATE"
    );
    const ultimoFactura = Number(rows[0]?.ultimo_numero_factura || 0);
    const nuevoFactura = ultimoFactura + 1;
    const numeroControl = `00-${nuevoFactura.toString().padStart(6, "0")}`;
    const fecha = new Date().toISOString().split("T")[0];

    // Calcular total
    const totalSinIVA = productos.reduce(
      (sum, p) => sum + p.precio * p.cantidadSeleccionada * dollarRate,
      0
    );
    const IVA = totalSinIVA * 0.16;
    const totalConIVA = totalSinIVA + IVA;

    // Insertar factura
    const [facturaResult] = await connection.query(
      "INSERT INTO facturas (numero_factura, numero_control, cliente_id, fecha, total, estado, caja_id) VALUES (?, ?, ?, ?, ?, 'pagado', ?)",
      [nuevoFactura, numeroControl, cliente.id, fecha, totalConIVA, caja_id]
    );

    const facturaId = facturaResult.insertId;

    // Insertar detalles
    if (productos.length > 0) {
      const detallesValues = productos.map((p) => [
        facturaId,
        p.id,
        p.cantidadSeleccionada,
        parseFloat(p.precio),
      ]);
      await connection.query(
        "INSERT INTO factura_detalle (factura_id, producto_id, cantidad, precio) VALUES ?",
        [detallesValues]
      );
    }

    // Registrar pagos si vienen
    if (req.body.pagos?.length > 0) {
      const pagosValues = req.body.pagos.map((p) => [
        facturaId,
        p.metodo_pago_id,
        p.monto,
        p.referencia || null,
        caja_id,
      ]);
      await connection.query(
        "INSERT INTO pagos (factura_id, metodo_pago_id, monto, referencia, caja_id) VALUES ?",
        [pagosValues]
      );
    }

    // Actualizar contador
    await connection.query(
      "UPDATE contadores SET ultimo_numero_factura = ? WHERE id = 1",
      [nuevoFactura]
    );

    await connection.commit();
    connection.release();

    // ✅ Preparar datos para el PDF
    const facturaData = {
      numero_factura: nuevoFactura,
      numero_control: numeroControl,
      fecha: fecha,
      total: totalConIVA,
      cliente_nombre: cliente.nombre,
      tipo_rif: cliente.tipo_rif,
      numero_rif: cliente.numero_rif,
      correo: cliente.correo,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      operador: cliente.operador,
    };

    const productosData = productos.map((p) => ({
      codigo: p.codigo,
      descripcion: p.descripcion,
      cantidad: p.cantidadSeleccionada,
      precio: p.precio * dollarRate,
    }));

    // ✅ Generar PDF reutilizable
    const doc = new jsPDF();
    generarPDFDesdeDatos(doc, facturaData, productosData, dollarRate);

    const pdfBytes = doc.output("arraybuffer");
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=factura_${nuevoFactura}.pdf`,
      "X-Numero-Factura": nuevoFactura,
    });
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("❌ Error al generar factura:", error);
    res.status(500).json({ message: "Error al generar factura." });
  }
});

// === RUTAS RESTANTES ===

// GET: Métodos de pago
app.get("/metodos-pago", (req, res) => {
  db.query("SELECT * FROM metodos_pago", (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Error al obtener métodos de pago." });
    res.json(results);
  });
});

// GET: Facturas
app.get("/facturas", (req, res) => {
  const query = `
    SELECT f.id, f.numero_factura, f.numero_control, f.fecha, f.total, f.estado,
           c.nombre AS cliente_nombre, c.tipo_rif, c.numero_rif
    FROM facturas f
    JOIN clientes c ON f.cliente_id = c.id
    ORDER BY f.id DESC
  `;
  db.query(query, (err, results) => {
    if (err)
      return res.status(500).json({ message: "Error al obtener facturas." });
    res.json(results);
  });
});

// GET: Facturas pendientes
app.get("/facturas/pendientes", async (req, res) => {
  const query = `
    SELECT f.id, f.numero_factura, f.numero_control, f.fecha, f.total, f.cliente_id,  f.caja_id AS caja_origen,
           c.nombre AS cliente_nombre, c.tipo_rif, c.numero_rif
    FROM facturas f
    JOIN clientes c ON f.cliente_id = c.id
    WHERE f.estado = 'pendiente'
    ORDER BY f.fecha DESC
  `;
  try {
    const [results] = await promiseDb.query(query);
    const facturas = results.map((f) => ({ ...f, total: Number(f.total) }));
    res.json(facturas);
  } catch (err) {
    res.status(500).json({ message: "Error al cargar facturas pendientes." });
  }
});

// === RUTA: Guardar factura temporal (estado 'pendiente') ===
app.post("/facturas/guardar", async (req, res) => {
  const { cliente_id, productos, total } = req.body;

  if (
    !cliente_id ||
    !Array.isArray(productos) ||
    typeof total !== "number" ||
    total <= 0
  ) {
    return res.status(400).json({
      message: "Datos incompletos o inválidos.",
    });
  }

  let connection;
  try {
    connection = await promiseDb.getConnection();
    await connection.beginTransaction();

    // 🔒 Obtener último número con bloqueo
    const [rows] = await connection.query(
      "SELECT MAX(numero_factura) AS ultimo FROM facturas FOR UPDATE"
    );
    const ultimoNumero = rows[0]?.ultimo || 0;
    const numero_factura = ultimoNumero + 1; // ✅ Ahora es matemático, no textual
    const numero_control = `00-${String(numero_factura).padStart(6, "0")}`;
    const fecha = new Date().toISOString().split("T")[0];

    const [facturaResult] = await connection.query(
      "INSERT INTO facturas (numero_factura, numero_control, cliente_id, fecha, total, estado) VALUES (?, ?, ?, ?, ?, 'pendiente')",
      [numero_factura, numero_control, cliente_id, fecha, total]
    );

    const facturaId = facturaResult.insertId;

    if (productos.length > 0) {
      const detallesValues = productos.map((p) => [
        facturaId,
        p.id,
        p.cantidadSeleccionada,
        parseFloat(p.precio),
      ]);
      await connection.query(
        "INSERT INTO factura_detalle (factura_id, producto_id, cantidad, precio) VALUES ?",
        [detallesValues]
      );
    }

    await connection.commit();
    connection.release();

    res.status(201).json({
      id: facturaId,
      numero_factura,
      numero_control,
      cliente_id,
      total,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error("❌ Error al guardar factura:", error);
    res.status(500).json({
      message: "Error interno al guardar la factura.",
    });
  }
});

// GET: Total pagado para una factura
app.get("/pagos/total/:facturaId", (req, res) => {
  const { facturaId } = req.params;
  db.query(
    "SELECT COALESCE(SUM(monto), 0) AS total_pagado FROM pagos WHERE factura_id = ?",
    [facturaId],
    (err, results) => {
      if (err) {
        console.error("Error al calcular total pagado:", err);
        return res.status(500).json({ message: "Error interno." });
      }
      res.json({ total_pagado: parseFloat(results[0].total_pagado) });
    }
  );
});

// GET: Facturas pendientes por RIF o CI del cliente
app.get("/facturas/cliente/:numero", (req, res) => {
  const { numero } = req.params;
  const query = `
    SELECT 
      f.id,
      f.numero_factura,
      f.numero_control,
      f.fecha,
      f.total,
      f.estado,
      c.nombre AS cliente_nombre,
      c.tipo_rif,
      c.numero_rif
    FROM facturas f
    JOIN clientes c ON f.cliente_id = c.id
    WHERE c.numero_rif = ? AND f.estado = 'pendiente'
    ORDER BY f.fecha DESC
  `;
  db.query(query, [numero], (err, results) => {
    if (err) {
      console.error("Error al buscar facturas:", err);
      return res.status(500).json({ message: "Error al buscar facturas." });
    }
    res.json(results);
  });
});

// GET: Obtener un cliente por ID
app.get("/clientes/:id", (req, res) => {
  const { id } = req.params;

  const query = "SELECT * FROM clientes WHERE id = ?";
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error al obtener cliente:", err);
      return res.status(500).json({ message: "Error al obtener cliente." });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Cliente no encontrado." });
    }

    res.json(results[0]); // Devuelve el cliente
  });
});

// GET: Detalles de una factura (para recuperar productos)
app.get("/factura-detalle/:facturaId", (req, res) => {
  const { facturaId } = req.params;
  const sql = `
    SELECT fd.*, p.descripcion, p.codigo, p.precio 
    FROM factura_detalle fd
    JOIN productos p ON fd.producto_id = p.id
    WHERE fd.factura_id = ?
  `;
  db.query(sql, [facturaId], (err, results) => {
    if (err)
      return res.status(500).json({ message: "Error al obtener detalles." });
    res.json(results);
  });
});

// Actulizar estado de factura (pagad)
app.put("/facturas/:id/estado", (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!["pagado", "anulado"].includes(estado)) {
    return res.status(400).json({ message: "Estado no válido." });
  }

  const query = "UPDATE facturas SET estado = ? WHERE id = ?";
  db.query(query, [estado, id], (err, result) => {
    if (err)
      return res.status(500).json({ message: "Error al actualizar estado." });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Factura no encontrada." });
    res.json({ message: "Estado actualizado." });
  });
});

// Rutas de empleados y cajas
app.get("/empleados/ficha/:ficha", (req, res) => {
  const { ficha } = req.params;
  const query =
    "SELECT id, nombre, apellido, ci FROM empleados WHERE ficha = ?";
  db.query(query, [ficha], (err, results) => {
    if (err)
      return res.status(500).json({ message: "Error al buscar empleado." });
    if (results.length === 0)
      return res.status(404).json({ message: "Empleado no encontrado." });
    res.json(results[0]);
  });
});

app.get("/cajas/disponibles", (req, res) => {
  const query = "SELECT id, nombre FROM cajas WHERE estado = 'disponible'";
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: "Error al cargar cajas." });
    res.json(results);
  });
});

// POST: Abrir caja
app.post("/cajas/abrir", async (req, res) => {
  const { empleado_id, caja_id } = req.body;
  if (!empleado_id || !caja_id)
    return res.status(400).json({ message: "Datos incompletos." });

  let connection;
  try {
    connection = await promiseDb.getConnection();
    await connection.beginTransaction();

    const [cajas] = await connection.query(
      "SELECT estado FROM cajas WHERE id = ? FOR UPDATE",
      [caja_id]
    );
    if (cajas.length === 0 || cajas[0].estado !== "disponible") {
      throw new Error("La caja no está disponible.");
    }

    await connection.query(
      "UPDATE cajas SET estado = 'ocupada', empleado_id = ?, fecha_apertura = NOW() WHERE id = ?",
      [empleado_id, caja_id]
    );

    await connection.query(
      "INSERT INTO historial_cajas (empleado_id, caja_id, fecha_apertura) VALUES (?, ?, NOW())",
      [empleado_id, caja_id]
    );

    await connection.commit();
    connection.release();
    res.json({ message: "Caja abierta exitosamente." });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(400).json({ message: error.message });
  }
});

// POST: Cerrar caja
app.post("/cajas/cerrar", async (req, res) => {
  const { caja_id } = req.body;
  if (!caja_id || typeof caja_id !== "number") {
    return res.status(400).json({ message: "Caja no válida." });
  }

  let connection;
  try {
    connection = await promiseDb.getConnection();
    await connection.beginTransaction();

    const [cajas] = await connection.query(
      "SELECT estado, empleado_id FROM cajas WHERE id = ? FOR UPDATE",
      [caja_id]
    );
    if (cajas.length === 0 || cajas[0].estado !== "ocupada") {
      throw new Error("La caja no está abierta.");
    }

    const [total] = await connection.query(
      "SELECT COALESCE(SUM(total), 0) AS total FROM facturas WHERE caja_id = ? AND estado = 'pagado'",
      [caja_id]
    );

    await connection.query(
      "UPDATE historial_cajas SET fecha_cierre = NOW(), total_facturado = ? WHERE caja_id = ? AND fecha_cierre IS NULL",
      [total[0].total, caja_id]
    );

    await connection.query(
      "UPDATE cajas SET estado = 'disponible', empleado_id = NULL, fecha_apertura = NULL, fecha_cierre = NOW() WHERE id = ?",
      [caja_id]
    );

    await connection.commit();
    connection.release();

    res.json({ message: "Caja cerrada exitosamente.", total: total[0].total });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(400).json({ message: error.message });
  }
});

// GET: Estado de todas las cajas
app.get("/cajas/estado", async (req, res) => {
  try {
    const [cajas] = await promiseDb.query(`
      SELECT 
        c.id,
        c.nombre,
        c.estado,
        e.nombre AS empleado_nombre,
        e.apellido AS empleado_apellido,
        COALESCE(SUM(f.total), 0) AS total_facturado,
        MAX(f.fecha) AS ultima_factura
      FROM cajas c
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN facturas f ON c.id = f.caja_id
      GROUP BY c.id, c.nombre, c.estado, e.nombre, e.apellido
      ORDER BY c.id
    `);

    const estadoCajas = cajas.map((caja) => ({
      id: caja.id,
      nombre: caja.nombre,
      estado: caja.estado,
      empleado: caja.empleado_nombre
        ? `${caja.empleado_nombre} ${caja.empleado_apellido}`
        : null,
      total_facturado: parseFloat(caja.total_facturado),
      ultima_actualizacion: caja.ultima_factura
        ? new Date(caja.ultima_factura).toLocaleTimeString()
        : "—",
    }));

    res.json(estadoCajas);
  } catch (error) {
    console.error("Error al obtener estado de cajas:", error);
    res.status(500).json({ message: "Error al cargar estado de cajas." });
  }
});

// GET: Generar PDF de una factura existente (sin crear nueva)
app.get("/facturas/:id/pdf", async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener factura + cliente
    const [facturaRows] = await promiseDb.query(
      `
      SELECT 
        f.numero_factura,
        f.numero_control,
        f.fecha,
        f.total,
        c.nombre AS cliente_nombre,
        c.tipo_rif,
        c.numero_rif,
        c.correo,
        c.telefono,
        c.direccion,
        c.operador
      FROM facturas f
      JOIN clientes c ON f.cliente_id = c.id
      WHERE f.id = ?
    `,
      [id]
    );

    if (facturaRows.length === 0) {
      return res.status(404).json({ message: "Factura no encontrada." });
    }

    const factura = facturaRows[0];

    // Obtener productos
    const [productosRows] = await promiseDb.query(
      `
      SELECT 
        p.codigo,
        p.descripcion,
        fd.cantidad,
        fd.precio
      FROM factura_detalle fd
      JOIN productos p ON fd.producto_id = p.id
      WHERE fd.factura_id = ?
    `,
      [id]
    );

    if (productosRows.length === 0) {
      return res
        .status(400)
        .json({ message: "No hay productos en esta factura." });
    }

    // ✅ Generar PDF reutilizable
    const doc = new jsPDF();
    generarPDFDesdeDatos(doc, factura, productosRows);

    const pdfBytes = doc.output("arraybuffer");
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=factura_${factura.numero_factura}.pdf`,
    });
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("❌ Error al generar PDF:", error);
    res.status(500).json({ message: "Error al generar PDF." });
  }
});
// ✅ Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
