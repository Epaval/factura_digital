// server.js
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// === CONEXIÓN A LA BASE DE DATOS ===
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "facturacion",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

function getLocalDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000; // minutos a ms
  const localTime = new Date(now - offset);
  return localTime.toISOString().split("T")[0]; // YYYY-MM-DD
}

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

  const now = new Date();
  const fechaHoraActual = now.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

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
  doc.text(`Hora: ${fechaHoraActual.split(", ")[1] || "—"}`, 150, y);
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
  doc.text("Total", 180, y, { align: "right" });
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
    doc.text(`Bs.${total.toFixed(2)}`, 180, y, { align: "right" });
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
  let connection;
  try {
    connection = await promiseDb.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      "SELECT * FROM contadores WHERE id = 1 FOR UPDATE"
    );

    if (rows.length === 0) {
      await connection.query(
        "INSERT INTO contadores (id, ultimo_numero_factura, ultimo_numero_control) VALUES (1, 0, '00-000000')"
      );
      console.log("✅ Contador inicializado automáticamente.");
    }

    await connection.commit();
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ Error al inicializar contadores:", err);
  } finally {
    if (connection) connection.release();
  }
};

// === CARGA DE DEPENDENCIAS (jsPDF, QRCode) ===
let jsPDF, QRCode;
try {
  ({ jsPDF } = require("jspdf"));
  QRCode = require("qrcode");
} catch (error) {
  console.error("⚠️ Ejecuta: npm install jspdf qrcode");
}

// --- RUTAS BÁSICAS ---
app.get("/clientes", (req, res) => {
  db.query("SELECT * FROM clientes", (err, results) => {
    if (err) return res.status(500).json({ message: "Error al obtener clientes." });
    res.json(results);
  });
});

app.get("/productos", (req, res) => {
  db.query("SELECT * FROM productos", (err, results) => {
    if (err) return res.status(500).json({ message: "Error al obtener productos." });
    const productos = results.map(p => ({ ...p, precio: parseFloat(p.precio) }));
    res.json(productos);
  });
});

// === RUTA: Guardar factura pendiente (asigna número único) ===
app.post("/facturas/guardar", async (req, res) => {
  const { cliente_id, productos, total } = req.body;

  if (!cliente_id || !Array.isArray(productos) || typeof total !== "number" || total <= 0) {
    return res.status(400).json({ message: "Datos incompletos o inválidos." });
  }

  let connection;
  try {
    connection = await promiseDb.getConnection();
    await connection.beginTransaction();

    // 🔐 Obtener y bloquear contadores
    const [rows] = await connection.query("SELECT ultimo_numero_factura, ultimo_numero_control FROM contadores WHERE id = 1 FOR UPDATE");
    
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(500).json({ message: "Contador no inicializado." });
    }

    const { ultimo_numero_factura, ultimo_numero_control } = rows[0];
    const nuevoFactura = (ultimo_numero_factura || 0) + 1;
    
    const ultimoControlNum = parseInt(ultimo_numero_control.split("-")[1], 10) || 0;
    const nuevoControlNum = ultimoControlNum + 1;
    const numeroControl = `00-${nuevoControlNum.toString().padStart(6, "0")}`;

    const fecha = getLocalDate();

    // 🔐 Insertar factura pendiente
    const [facturaResult] = await connection.query(
      "INSERT INTO facturas (numero_factura, numero_control, cliente_id, fecha, total, estado) VALUES (?, ?, ?, ?, ?, 'pendiente')",
      [nuevoFactura, numeroControl, cliente_id, fecha, total]
    );

    const facturaId = facturaResult.insertId;

    // 🔐 Insertar detalles
    if (productos.length > 0) {
      const detallesValues = productos.map(p => [
        facturaId,
        p.id,
        p.cantidadSeleccionada,
        parseFloat(p.precio)
      ]);
      await connection.query("INSERT INTO factura_detalle (factura_id, producto_id, cantidad, precio) VALUES ?", [detallesValues]);
    }

    // 🔐 Actualizar contadores (¡incluso para pendientes!)
    await connection.query(
      "UPDATE contadores SET ultimo_numero_factura = ?, ultimo_numero_control = ? WHERE id = 1",
      [nuevoFactura, numeroControl]
    );

    await connection.commit();
    connection.release();

    res.status(201).json({ 
      id: facturaId, 
      numero_factura: nuevoFactura, 
      numero_control: numeroControl, 
      cliente_id, 
      total 
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("❌ Error al guardar factura:", error);
    res.status(500).json({ message: "Error interno al guardar la factura." });
  }
});

// === RUTA: Generar PDF (puede ser nueva o pagar pendiente) ===
app.post("/facturas/generar-pdf", async (req, res) => {
  const { cliente, productos, dollarRate, caja_id, factura_id: facturaIdExistente } = req.body;

  if (!cliente || !Array.isArray(productos) || typeof dollarRate !== "number" || dollarRate <= 0 || !caja_id) {
    return res.status(400).json({ message: "Datos incompletos." });
  }

  let connection;
  try {
    connection = await promiseDb.getConnection();
    await connection.beginTransaction();

    let nuevoFactura, numeroControl, facturaId, esNueva = true;

    if (facturaIdExistente) {
      // ✅ Es una factura pendiente que se está pagando
      const [facturaRows] = await connection.query(
        "SELECT id, numero_factura, numero_control FROM facturas WHERE id = ? FOR UPDATE",
        [facturaIdExistente]
      );

      if (facturaRows.length === 0 || facturaRows[0].estado !== 'pendiente') {
        throw new Error("Factura no encontrada o ya pagada.");
      }

      facturaId = facturaRows[0].id;
      nuevoFactura = facturaRows[0].numero_factura;
      numeroControl = facturaRows[0].numero_control;
      esNueva = false;

      // ✅ Actualizar estado
      await connection.query(
        "UPDATE facturas SET estado = 'pagado', caja_id = ? WHERE id = ?",
        [caja_id, facturaId]
      );
    } else {
      // ✅ Es una nueva factura: asignar número
      const [rows] = await connection.query("SELECT ultimo_numero_factura, ultimo_numero_control FROM contadores WHERE id = 1 FOR UPDATE");
      
      if (rows.length === 0) {
        await connection.rollback();
        return res.status(500).json({ message: "Contador no inicializado." });
      }

      const { ultimo_numero_factura, ultimo_numero_control } = rows[0];
      nuevoFactura = (ultimo_numero_factura || 0) + 1;
      
      const ultimoControlNum = parseInt(ultimo_numero_control.split("-")[1], 10) || 0;
      const nuevoControlNum = ultimoControlNum + 1;
      numeroControl = `00-${nuevoControlNum.toString().padStart(6, "0")}`;

      const fecha = getLocalDate();
      const totalSinIVA = productos.reduce((sum, p) => sum + p.precio * p.cantidadSeleccionada * dollarRate, 0);
      const IVA = totalSinIVA * 0.16;
      const totalConIVA = totalSinIVA + IVA;

      // 🔐 Insertar nueva factura
      const [result] = await connection.query(
        "INSERT INTO facturas (numero_factura, numero_control, cliente_id, fecha, total, estado, caja_id) VALUES (?, ?, ?, ?, ?, 'pagado', ?)",
        [nuevoFactura, numeroControl, cliente.id, fecha, totalConIVA, caja_id]
      );

      facturaId = result.insertId;

      // 🔐 Insertar detalles
      if (productos.length > 0) {
        const detallesValues = productos.map(p => [
          facturaId,
          p.id,
          p.cantidadSeleccionada,
          parseFloat(p.precio)
        ]);
        await connection.query("INSERT INTO factura_detalle (factura_id, producto_id, cantidad, precio) VALUES ?", [detallesValues]);
      }

      // 🔐 Insertar pagos
      if (req.body.pagos?.length > 0) {
        const pagosValues = req.body.pagos.map(p => [
          facturaId,
          p.metodo_pago_id,
          p.monto,
          p.referencia || null,
          caja_id
        ]);
        await connection.query("INSERT INTO pagos (factura_id, metodo_pago_id, monto, referencia, caja_id) VALUES ?", [pagosValues]);
      }

      // 🔐 Actualizar contadores
      await connection.query(
        "UPDATE contadores SET ultimo_numero_factura = ?, ultimo_numero_control = ? WHERE id = 1",
        [nuevoFactura, numeroControl]
      );
    }

    await connection.commit();
    connection.release();

    // ✅ Datos para PDF
    const facturaData = {
      numero_factura: nuevoFactura,
      numero_control: numeroControl,
      fecha: getLocalDate(),
      total: productos.reduce((sum, p) => sum + p.precio * p.cantidadSeleccionada * dollarRate, 0) * 1.16,
      cliente_nombre: cliente.nombre,
      tipo_rif: cliente.tipo_rif,
      numero_rif: cliente.numero_rif,
      correo: cliente.correo,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      operador: cliente.operador
    };

    const productosData = productos.map(p => ({
      codigo: p.codigo,
      descripcion: p.descripcion,
      cantidad: p.cantidadSeleccionada,
      precio: p.precio * dollarRate
    }));

    const doc = new jsPDF();
    generarPDFDesdeDatos(doc, facturaData, productosData, dollarRate);

    const pdfBytes = doc.output("arraybuffer");
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=factura_${nuevoFactura}.pdf`,
      "X-Numero-Factura": nuevoFactura,
      "X-Numero-Control": numeroControl
    });
    res.send(Buffer.from(pdfBytes));

  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error("❌ Error al generar factura:", error);
    res.status(500).json({ message: "Error al generar factura." });
  }
});

// === RUTAS RESTANTES ===
app.get("/metodos-pago", (req, res) => {
  db.query("SELECT * FROM metodos_pago", (err, results) => {
    if (err) return res.status(500).json({ message: "Error al obtener métodos de pago." });
    res.json(results);
  });
});

app.get("/facturas", (req, res) => {
  const query = `
    SELECT 
      f.id,
      f.numero_factura,
      f.numero_control,
      f.fecha,
      f.total,
      f.estado,
      f.cliente_id,
      c.nombre AS cliente_nombre,
      c.tipo_rif,
      c.numero_rif
    FROM facturas f
    JOIN clientes c ON f.cliente_id = c.id
    ORDER BY f.id DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: "Error al obtener facturas." });
    res.json(results);
  });
});

app.get("/facturas/pendientes", async (req, res) => {
  const query = `
    SELECT f.id, f.numero_factura, f.numero_control, f.fecha, f.total, f.cliente_id, f.caja_id AS caja_origen,
           c.nombre AS cliente_nombre, c.tipo_rif, c.numero_rif
    FROM facturas f
    JOIN clientes c ON f.cliente_id = c.id
    WHERE f.estado = 'pendiente'
    AND DATE(fecha) = CURDATE()
    ORDER BY f.fecha DESC
  `;
  try {
    const [results] = await promiseDb.query(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Error al cargar facturas pendientes." });
  }
});

app.get("/pagos/total/:facturaId", (req, res) => {
  const { facturaId } = req.params;
  db.query("SELECT COALESCE(SUM(monto), 0) AS total_pagado FROM pagos WHERE factura_id = ?", [facturaId], (err, results) => {
    if (err) return res.status(500).json({ message: "Error al calcular total pagado." });
    res.json({ total_pagado: parseFloat(results[0].total_pagado) });
  });
});

app.get("/facturas/cliente/:numero", (req, res) => {
  const { numero } = req.params;
  const query = `
    SELECT f.id, f.numero_factura, f.numero_control, f.fecha, f.total, f.estado,
           c.nombre AS cliente_nombre, c.tipo_rif, c.numero_rif
    FROM facturas f
    JOIN clientes c ON f.cliente_id = c.id
    WHERE c.numero_rif = ? AND f.estado = 'pendiente'
    ORDER BY f.fecha DESC
  `;
  db.query(query, [numero], (err, results) => {
    if (err) return res.status(500).json({ message: "Error al buscar facturas." });
    res.json(results);
  });
});

app.get("/clientes/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM clientes WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Error al obtener cliente." });
    if (results.length === 0) return res.status(404).json({ message: "Cliente no encontrado." });
    res.json(results[0]);
  });
});

app.get("/factura-detalle/:facturaId", (req, res) => {
  const { facturaId } = req.params;
  const sql = `
    SELECT fd.*, p.descripcion, p.codigo, p.precio 
    FROM factura_detalle fd
    JOIN productos p ON fd.producto_id = p.id
    WHERE fd.factura_id = ?
  `;
  db.query(sql, [facturaId], (err, results) => {
    if (err) return res.status(500).json({ message: "Error al obtener detalles." });
    res.json(results);
  });
});

app.put("/facturas/:id/estado", (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  if (!["pagado", "anulado", "SIN PAGO"].includes(estado)) {
    return res.status(400).json({ message: "Estado no válido." });
  }
  db.query("UPDATE facturas SET estado = ? WHERE id = ?", [estado, id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error al actualizar estado." });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Factura no encontrada." });
    res.json({ message: "Estado actualizado." });
  });
});

app.get("/empleados/ficha/:ficha", (req, res) => {
  const { ficha } = req.params;
  const query = "SELECT id, nombre, apellido, ci, ficha, rol FROM empleados WHERE ficha = ?";
  
  db.query(query, [ficha], (err, results) => {
    if (err) return res.status(500).json({ message: "Error al buscar empleado." });
    if (results.length === 0) return res.status(404).json({ message: "Empleado no encontrado." });
    
    res.json(results[0]);
  });
});

app.get("/cajas/disponibles", (req, res) => {
  db.query("SELECT id, nombre FROM cajas WHERE estado = 'disponible'", (err, results) => {
    if (err) return res.status(500).json({ message: "Error al cargar cajas." });
    res.json(results);
  });
});

app.post("/cajas/abrir", async (req, res) => {
  const { empleado_id, caja_id } = req.body;
  if (!empleado_id || !caja_id) return res.status(400).json({ message: "Datos incompletos." });

  let connection;
  try {
    connection = await promiseDb.getConnection();
    await connection.beginTransaction();

    const [cajas] = await connection.query("SELECT estado FROM cajas WHERE id = ? FOR UPDATE", [caja_id]);
    if (cajas.length === 0 || cajas[0].estado !== "disponible") {
      throw new Error("La caja no está disponible.");
    }

    await connection.query("UPDATE cajas SET estado = 'ocupada', empleado_id = ?, fecha_apertura = NOW() WHERE id = ?", [empleado_id, caja_id]);
    await connection.query("INSERT INTO historial_cajas (empleado_id, caja_id, fecha_apertura) VALUES (?, ?, NOW())", [empleado_id, caja_id]);

    await connection.commit();
    connection.release();
    res.json({ message: "Caja abierta exitosamente." });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(400).json({ message: error.message });
  }
});

app.post("/cajas/cerrar", async (req, res) => {
  const { caja_id } = req.body;
  if (!caja_id || typeof caja_id !== "number") return res.status(400).json({ message: "Caja no válida." });

  let connection;
  try {
    connection = await promiseDb.getConnection();
    await connection.beginTransaction();

    const [cajas] = await connection.query("SELECT estado, empleado_id FROM cajas WHERE id = ? FOR UPDATE", [caja_id]);
    if (cajas.length === 0 || cajas[0].estado !== "ocupada") {
      throw new Error("La caja no está abierta.");
    }

    const [total] = await connection.query("SELECT COALESCE(SUM(total), 0) AS total FROM facturas WHERE caja_id = ? AND estado = 'pagado'", [caja_id]);

    await connection.query("UPDATE historial_cajas SET fecha_cierre = NOW(), total_facturado = ? WHERE caja_id = ? AND fecha_cierre IS NULL", [total[0].total, caja_id]);
    await connection.query("UPDATE cajas SET estado = 'disponible', empleado_id = NULL, fecha_apertura = NULL, fecha_cierre = NOW() WHERE id = ?", [caja_id]);

    await connection.commit();
    connection.release();

    res.json({ message: "Caja cerrada exitosamente.", total: total[0].total });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(400).json({ message: error.message });
  }
});

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

    const estadoCajas = cajas.map(caja => ({
      id: caja.id,
      nombre: caja.nombre,
      estado: caja.estado,
      empleado: caja.empleado_nombre ? `${caja.empleado_nombre} ${caja.empleado_apellido}` : null,
      total_facturado: parseFloat(caja.total_facturado),
      ultima_actualizacion: caja.ultima_factura ? new Date(caja.ultima_factura).toLocaleTimeString() : "—"
    }));

    res.json(estadoCajas);
  } catch (error) {
    console.error("Error al obtener estado de cajas:", error);
    res.status(500).json({ message: "Error al cargar estado de cajas." });
  }
});

app.get("/facturas/:id/pdf", async (req, res) => {
  const { id } = req.params;
  try {
    const [facturaRows] = await promiseDb.query(`
      SELECT f.numero_factura, f.numero_control, f.fecha, f.total,
             c.nombre AS cliente_nombre, c.tipo_rif, c.numero_rif, c.correo, c.telefono, c.direccion, c.operador
      FROM facturas f
      JOIN clientes c ON f.cliente_id = c.id
      WHERE f.id = ?
    `, [id]);

    if (facturaRows.length === 0) return res.status(404).json({ message: "Factura no encontrada." });

    const factura = facturaRows[0];

    const [productosRows] = await promiseDb.query(`
      SELECT p.codigo, p.descripcion, fd.cantidad, fd.precio
      FROM factura_detalle fd
      JOIN productos p ON fd.producto_id = p.id
      WHERE fd.factura_id = ?
    `, [id]);

    if (productosRows.length === 0) return res.status(400).json({ message: "No hay productos en esta factura." });

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

app.get("/pagos/factura/:facturaId", (req, res) => {
  const { facturaId } = req.params;

  const query = `
    SELECT 
      p.id,
      p.monto,
      p.referencia,
      p.fecha,
      mp.nombre AS metodo_pago
    FROM pagos p
    JOIN metodos_pago mp ON p.metodo_pago_id = mp.id
    WHERE p.factura_id = ?
    ORDER BY p.fecha DESC
  `;

  db.query(query, [facturaId], (err, results) => {
    if (err) {
      console.error("Error al obtener pagos:", err);
      return res.status(500).json({ message: "Error al obtener pagos." });
    }
    res.json(results);
  });
});

app.post("/pagos", (req, res) => {
  const { factura_id, metodo_pago_id, monto, referencia, caja_id } = req.body;

  if (!factura_id || !metodo_pago_id || typeof monto !== "number" || monto <= 0 || !caja_id) {
    return res.status(400).json({ message: "Datos de pago incompletos o inválidos." });
  }

  const query = `
    INSERT INTO pagos (factura_id, metodo_pago_id, monto, referencia, caja_id)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(query, [factura_id, metodo_pago_id, monto, referencia || null, caja_id], (err, result) => {
    if (err) {
      console.error("Error al registrar pago:", err);
      return res.status(500).json({ message: "Error al registrar pago." });
    }

    res.status(201).json({
      id: result.insertId,
      factura_id,
      metodo_pago_id,
      monto,
      referencia,
      caja_id,
      fecha: getLocalDate(),
    });
  });
});

app.get("/facturas/caja/:caja_id", async (req, res) => {
  const { caja_id } = req.params;
  try {
    const [rows] = await promiseDb.query(
      `SELECT f.id, f.numero_factura, f.total, f.estado, f.fecha, 
              c.nombre AS cliente_nombre, c.numero_rif 
       FROM facturas f
       LEFT JOIN clientes c ON f.cliente_id = c.id
       WHERE f.caja_id = ?
       ORDER BY f.id DESC`,
      [caja_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error al cargar facturas." });
  }
});

app.get("/facturas/todas", async (req, res) => {
  try {
    const [rows] = await promiseDb.query(`
      SELECT 
        f.id,
        f.numero_factura,
        f.total,
        f.estado,
        f.fecha,
        f.caja_id,
        c.nombre AS cliente_nombre,
        e.nombre AS empleado_nombre,
        e.apellido AS empleado_apellido
      FROM facturas f
      LEFT JOIN clientes c ON f.cliente_id = c.id
      LEFT JOIN cajas ca ON f.caja_id = ca.id
      LEFT JOIN empleados e ON ca.empleado_id = e.id
      ORDER BY f.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al cargar facturas." });
  }
});

// ✅ Iniciar servidor
const startServer = async () => {
  await inicializarContadores();
  app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  });
};

startServer();