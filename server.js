const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// === CONEXIÓN A LA BASE DE DATOS MEJORADA ===
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "facturacion",
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4',
  timezone: 'local',
  
  // Configuración del pool optimizada
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 100,
  acquireTimeout: 60000,
  idleTimeout: 60000,
  maxIdle: 10,
  
  // Keep alive para reconexión automática
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

// Crear el pool (ya devuelve promesas por defecto)
const db = mysql.createPool(dbConfig);

// Probar conexión
async function testConnection() {
  try {
    const [rows] = await db.query("SELECT 1");
    console.log("✅ Conectado a la base de datos MySQL");
    return true;
  } catch (err) {
    console.error("❌ Error conectando a la base de datos:", err);
    process.exit(1);
  }
}

testConnection();

function getLocalDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localTime = new Date(now - offset);
  return localTime.toISOString().split("T")[0];
}

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
    connection = await db.getConnection();
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
app.get("/clientes", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM clientes");
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener clientes." });
  }
});

app.get("/productos", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM productos");
    
    const productos = results.map(p => ({
      ...p,
      precio: parseFloat(p.precio),
      cantidad: parseInt(p.cantidad) || 0
    }));
    
    res.json(productos);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener productos." });
  }
});

// === RUTA: Guardar factura pendiente (asigna número único) ===
app.post("/facturas/guardar", async (req, res) => {
  const { cliente_id, productos, total } = req.body;

  if (!cliente_id || !Array.isArray(productos) || typeof total !== "number" || total <= 0) {
    return res.status(400).json({ message: "Datos incompletos o inválidos." });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

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

    const [facturaResult] = await connection.query(
      "INSERT INTO facturas (numero_factura, numero_control, cliente_id, fecha, total, estado) VALUES (?, ?, ?, ?, ?, 'pendiente')",
      [nuevoFactura, numeroControl, cliente_id, fecha, total]
    );

    const facturaId = facturaResult.insertId;

    if (productos.length > 0) {
      const detallesValues = productos.map(p => [
        facturaId,
        p.id,
        p.cantidadSeleccionada,
        parseFloat(p.precio)
      ]);
      await connection.query("INSERT INTO factura_detalle (factura_id, producto_id, cantidad, precio) VALUES ?", [detallesValues]);
    }

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
    connection = await db.getConnection();
    await connection.beginTransaction();

    const productosIds = productos.map(p => p.id);
    const [stockRows] = await connection.query(
      "SELECT id, cantidad, descripcion FROM productos WHERE id IN (?) FOR UPDATE",
      [productosIds]
    );

    const stockMap = {};
    stockRows.forEach(row => {
      stockMap[row.id] = { cantidad: row.cantidad, descripcion: row.descripcion };
    });

    const productosSinStock = [];
    for (const producto of productos) {
      const disponible = stockMap[producto.id]?.cantidad || 0;
      const solicitado = producto.cantidadSeleccionada;
      if (solicitado > disponible) {
        productosSinStock.push({
          id: producto.id,
          descripcion: stockMap[producto.id]?.descripcion || "Producto desconocido",
          disponible,
          solicitado
        });
      }
    }

    if (productosSinStock.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        message: "Stock insuficiente para algunos productos.",
        productosSinStock
      });
    }

    let nuevoFactura, numeroControl, facturaId, esNueva = true;

    if (facturaIdExistente) {
      const [facturaRows] = await connection.query(
        "SELECT id, numero_factura, numero_control FROM facturas WHERE id = ? FOR UPDATE",
        [facturaIdExistente]
      );

      if (facturaRows.length === 0 || facturaRows[0].estado !== 'pendiente') {
        await connection.rollback();
        return res.status(400).json({ message: "Factura no encontrada o ya pagada." });
      }

      facturaId = facturaRows[0].id;
      nuevoFactura = facturaRows[0].numero_factura;
      numeroControl = facturaRows[0].numero_control;
      esNueva = false;

      await connection.query(
        "UPDATE facturas SET estado = 'pagado', caja_id = ? WHERE id = ?",
        [caja_id, facturaId]
      );
    } else {
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

      const [result] = await connection.query(
        "INSERT INTO facturas (numero_factura, numero_control, cliente_id, fecha, total, estado, caja_id) VALUES (?, ?, ?, ?, ?, 'pagado', ?)",
        [nuevoFactura, numeroControl, cliente.id, fecha, totalConIVA, caja_id]
      );
      facturaId = result.insertId;

      if (productos.length > 0) {
        const detallesValues = productos.map(p => [
          facturaId,
          p.id,
          p.cantidadSeleccionada,
          parseFloat(p.precio)
        ]);
        await connection.query("INSERT INTO factura_detalle (factura_id, producto_id, cantidad, precio) VALUES ?", [detallesValues]);
      }

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

      await connection.query(
        "UPDATE contadores SET ultimo_numero_factura = ?, ultimo_numero_control = ? WHERE id = 1",
        [nuevoFactura, numeroControl]
      );
    }

    await connection.commit();
    connection.release();

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
app.get("/metodos-pago", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM metodos_pago");
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener métodos de pago." });
  }
});

app.get("/facturas", async (req, res) => {
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
  
  try {
    const [results] = await db.query(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener facturas." });
  }
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
    const [results] = await db.query(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Error al cargar facturas pendientes." });
  }
});

app.get("/pagos/total/:facturaId", async (req, res) => {
  const { facturaId } = req.params;
  try {
    const [results] = await db.query("SELECT COALESCE(SUM(monto), 0) AS total_pagado FROM pagos WHERE factura_id = ?", [facturaId]);
    res.json({ total_pagado: parseFloat(results[0].total_pagado) });
  } catch (err) {
    res.status(500).json({ message: "Error al calcular total pagado." });
  }
});

app.get("/facturas/cliente/:numero", async (req, res) => {
  const { numero } = req.params;
  const query = `
    SELECT f.id, f.numero_factura, f.numero_control, f.fecha, f.total, f.estado,
           c.nombre AS cliente_nombre, c.tipo_rif, c.numero_rif
    FROM facturas f
    JOIN clientes c ON f.cliente_id = c.id
    WHERE c.numero_rif = ? AND f.estado = 'pendiente'
    ORDER BY f.fecha DESC
  `;
  
  try {
    const [results] = await db.query(query, [numero]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Error al buscar facturas." });
  }
});

app.get("/clientes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db.query("SELECT * FROM clientes WHERE id = ?", [id]);
    if (results.length === 0) return res.status(404).json({ message: "Cliente no encontrado." });
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener cliente." });
  }
});

app.get("/factura-detalle/:facturaId", async (req, res) => {
  const { facturaId } = req.params;
  const sql = `
    SELECT fd.*, p.descripcion, p.codigo, p.precio 
    FROM factura_detalle fd
    JOIN productos p ON fd.producto_id = p.id
    WHERE fd.factura_id = ?
  `;
  
  try {
    const [results] = await db.query(sql, [facturaId]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener detalles." });
  }
});

app.put("/facturas/:id/estado", async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  
  if (!["pagado", "anulado", "SIN PAGO"].includes(estado)) {
    return res.status(400).json({ message: "Estado no válido." });
  }
  
  try {
    const [result] = await db.query("UPDATE facturas SET estado = ? WHERE id = ?", [estado, id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Factura no encontrada." });
    res.json({ message: "Estado actualizado." });
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar estado." });
  }
});

app.get("/empleados/ficha/:ficha", async (req, res) => {
  const { ficha } = req.params;
  const query = "SELECT id, nombre, apellido, ci, ficha, rol FROM empleados WHERE ficha = ?";
  
  try {
    const [results] = await db.query(query, [ficha]);
    if (results.length === 0) return res.status(404).json({ message: "Empleado no encontrado." });
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ message: "Error al buscar empleado." });
  }
});

app.get("/cajas/disponibles", async (req, res) => {
  try {
    const [results] = await db.query("SELECT id, nombre FROM cajas WHERE estado = 'disponible'");
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Error al cargar cajas." });
  }
});

app.post("/cajas/abrir", async (req, res) => {
  const { empleado_id, caja_id } = req.body;
  if (!empleado_id || !caja_id) return res.status(400).json({ message: "Datos incompletos." });

  let connection;
  try {
    connection = await db.getConnection();
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
    connection = await db.getConnection();
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
    const [cajas] = await db.query(`
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
    const [facturaRows] = await db.query(`
      SELECT f.numero_factura, f.numero_control, f.fecha, f.total,
             c.nombre AS cliente_nombre, c.tipo_rif, c.numero_rif, c.correo, c.telefono, c.direccion, c.operador
      FROM facturas f
      JOIN clientes c ON f.cliente_id = c.id
      WHERE f.id = ?
    `, [id]);

    if (facturaRows.length === 0) return res.status(404).json({ message: "Factura no encontrada." });

    const factura = facturaRows[0];

    const [productosRows] = await db.query(`
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

app.get("/pagos/factura/:facturaId", async (req, res) => {
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

  try {
    const [results] = await db.query(query, [facturaId]);
    res.json(results);
  } catch (err) {
    console.error("Error al obtener pagos:", err);
    res.status(500).json({ message: "Error al obtener pagos." });
  }
});

app.post("/pagos", async (req, res) => {
  const { factura_id, metodo_pago_id, monto, referencia, caja_id } = req.body;

  if (!factura_id || !metodo_pago_id || typeof monto !== "number" || monto <= 0 || !caja_id) {
    return res.status(400).json({ message: "Datos de pago incompletos o inválidos." });
  }

  const query = `
    INSERT INTO pagos (factura_id, metodo_pago_id, monto, referencia, caja_id)
    VALUES (?, ?, ?, ?, ?)
  `;

  try {
    const [result] = await db.query(query, [factura_id, metodo_pago_id, monto, referencia || null, caja_id]);
    
    res.status(201).json({
      id: result.insertId,
      factura_id,
      metodo_pago_id,
      monto,
      referencia,
      caja_id,
      fecha: getLocalDate(),
    });
  } catch (err) {
    console.error("Error al registrar pago:", err);
    res.status(500).json({ message: "Error al registrar pago." });
  }
});

app.get("/facturas/caja/:caja_id", async (req, res) => {
  const { caja_id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT 
          f.id, 
          f.numero_factura, 
          f.total, 
          f.estado, 
          f.fecha, 
          c.nombre AS cliente_nombre, 
          c.numero_rif 
       FROM facturas f
       LEFT JOIN clientes c ON f.cliente_id = c.id
       WHERE f.caja_id = ?
         AND DATE(f.fecha) = CURDATE()
       ORDER BY f.id DESC`,
      [caja_id]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error al cargar facturas del día:", err);
    res.status(500).json({ message: "Error al cargar facturas." });
  }
});

app.get("/facturas/todas", async (req, res) => {
  try {
    const [rows] = await db.query(`
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

// === RUTA: Dashboard del Admin ===
app.get("/reportes/admin", async (req, res) => {
  try {
    const hoy = new Date().toISOString().split("T")[0];
    const primerDiaMes = hoy.substring(0, 8) + "01";

    const [totalDiario] = await db.query(
      "SELECT COALESCE(SUM(total), 0) as total FROM facturas WHERE estado = 'pagado' AND DATE(fecha) = ?",
      [hoy]
    );
    const totalDiarioVal = parseFloat(totalDiario[0].total) || 0;

    const [totalSemanal] = await db.query(
      "SELECT COALESCE(SUM(total), 0) as total FROM facturas WHERE estado = 'pagado' AND YEARWEEK(fecha, 1) = YEARWEEK(CURDATE(), 1)"
    );
    const totalSemanalVal = parseFloat(totalSemanal[0].total) || 0;

    const [totalMensual] = await db.query(
      "SELECT COALESCE(SUM(total), 0) as total FROM facturas WHERE estado = 'pagado' AND fecha >= ?",
      [primerDiaMes]
    );
    const totalMensualVal = parseFloat(totalMensual[0].total) || 0;

    const [totalGeneral] = await db.query(
      "SELECT COALESCE(SUM(total), 0) as total FROM facturas WHERE estado = 'pagado'"
    );
    const totalGeneralVal = parseFloat(totalGeneral[0].total) || 0;

    const [impuestos] = await db.query(
      "SELECT COALESCE(SUM(total * 0.16), 0) as iva FROM facturas WHERE estado = 'pagado'"
    );
    const impuestosVal = parseFloat(impuestos[0].iva) || 0;

    const [pagosPorTipo] = await db.query(`
      SELECT mp.nombre, COALESCE(SUM(p.monto), 0) as total
      FROM metodos_pago mp
      LEFT JOIN pagos p ON mp.id = p.metodo_pago_id
      GROUP BY mp.id, mp.nombre
    `);

    const [facturacionPorCaja] = await db.query(`
      SELECT c.nombre, COALESCE(SUM(f.total), 0) as total
      FROM cajas c
      LEFT JOIN facturas f ON c.id = f.caja_id AND f.estado = 'pagado'
      GROUP BY c.id, c.nombre
    `);

    const [facturacionPorEmpleado] = await db.query(`
      SELECT e.nombre, e.apellido, COALESCE(SUM(f.total), 0) as total
      FROM empleados e
      LEFT JOIN cajas c ON e.id = c.empleado_id
      LEFT JOIN facturas f ON c.id = f.caja_id AND f.estado = 'pagado'
      GROUP BY e.id
      ORDER BY total DESC
      LIMIT 10
    `);

    const [productosVendidos] = await db.query(`
      SELECT 
        p.descripcion,
        p.codigo,
        SUM(fd.cantidad) as cantidad_vendida,
        SUM(fd.cantidad * fd.precio) as ingreso_total
      FROM factura_detalle fd
      JOIN productos p ON fd.producto_id = p.id
      JOIN facturas f ON fd.factura_id = f.id
      WHERE f.estado = 'pagado'
      GROUP BY p.id
      ORDER BY cantidad_vendida DESC
      LIMIT 10
    `);

    const [ultimasFacturas] = await db.query(`
      SELECT 
        f.numero_factura,
        f.numero_control,
        c.nombre AS cliente_nombre,
        c.tipo_rif,
        c.numero_rif,
        f.fecha,
        f.total,
        f.estado
      FROM facturas f
      JOIN clientes c ON f.cliente_id = c.id
      WHERE f.estado = 'pagado'
      ORDER BY f.id DESC
      LIMIT 20
    `);

    const [comprasPorCliente] = await db.query(`
      SELECT 
        c.id,
        c.nombre,
        c.tipo_rif,
        c.numero_rif,
        COALESCE(SUM(f.total), 0) as total_comprado,
        COUNT(f.id) as total_facturas
      FROM clientes c
      LEFT JOIN facturas f ON c.id = f.cliente_id AND f.estado = 'pagado'
      GROUP BY c.id
      ORDER BY total_comprado DESC
    `);   

    res.json({
      totalDiario: totalDiarioVal,
      totalSemanal: totalSemanalVal,
      totalMensual: totalMensualVal,
      totalGeneral: totalGeneralVal,
      impuestos: impuestosVal,
      productosVendidos,
      ultimasFacturas,
      comprasPorCliente,
      pagosPorTipo,
      facturacionPorCaja,
      facturacionPorEmpleado,
    });

  } catch (err) {
    console.error("Error al cargar reportes:", err);
    res.status(500).json({ message: "Error al cargar reportes." });
  }
});

// RUTAS PARA CLIENTES
app.post("/clientes", async (req, res) => {
  const { nombre, tipo_rif, numero_rif, correo, telefono, direccion, operador } = req.body;

  if (!nombre || !tipo_rif || !numero_rif) {
    return res.status(400).json({ message: "Nombre, tipo y número de RIF son obligatorios." });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO clientes (nombre, tipo_rif, numero_rif, correo, telefono, direccion, operador) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [nombre, tipo_rif, numero_rif, correo || null, telefono || null, direccion || null, operador || null]
    );

    const nuevoCliente = {
      id: result.insertId,
      nombre,
      tipo_rif,
      numero_rif,
      correo,
      telefono,
      direccion,
      operador
    };

    res.status(201).json(nuevoCliente);
  } catch (err) {
    console.error("Error al registrar cliente:", err);
    res.status(500).json({ message: "Error al registrar cliente." });
  }
});

app.put("/clientes/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, tipo_rif, numero_rif, correo, telefono, direccion, operador } = req.body;

  if (!nombre || !tipo_rif || !numero_rif) {
    return res.status(400).json({ message: "Nombre, tipo y número de RIF son obligatorios." });
  }

  try {
    const [result] = await db.query(
      `UPDATE clientes 
       SET nombre = ?, tipo_rif = ?, numero_rif = ?, correo = ?, telefono = ?, direccion = ?, operador = ? 
       WHERE id = ?`,
      [nombre, tipo_rif, numero_rif, correo || null, telefono || null, direccion || null, operador || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Cliente no encontrado." });
    }

    const [rows] = await db.query("SELECT * FROM clientes WHERE id = ?", [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error("Error al actualizar cliente:", err);
    res.status(500).json({ message: "Error al actualizar cliente." });
  }
});

app.post("/productos", async (req, res) => {
  const { rol } = req.body;
  const { codigo, descripcion, precio, cantidad } = req.body;

  const rolValido = ["admin", "supervisor"].includes(rol?.trim().toLowerCase());
  if (!rolValido) {
    return res.status(403).json({ message: "Acceso denegado. Rol no autorizado." });
  }

  if (!codigo || !descripcion || typeof precio !== "number" || typeof cantidad !== "number") {
    return res.status(400).json({ message: "Datos incompletos o inválidos." });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO productos (codigo, descripcion, precio, cantidad) VALUES (?, ?, ?, ?)",
      [codigo, descripcion, precio, cantidad]
    );

    res.status(201).json({
      id: result.insertId,
      codigo,
      descripcion,
      precio,
      cantidad,
    });
  } catch (err) {
    console.error("Error al agregar producto:", err);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.put("/productos/:id", async (req, res) => {
  const { id } = req.params;
  const { codigo, descripcion, precio, cantidad, rol } = req.body;

  const rolValido = ["admin", "supervisor"].includes(rol?.trim().toLowerCase());
  if (!rolValido) {
    return res.status(403).json({ 
      message: "Acceso denegado. Solo admin o supervisor pueden editar productos." 
    });
  }

  if (!codigo || !descripcion) {
    return res.status(400).json({ 
      message: "Código y descripción son obligatorios." 
    });
  }

  if (typeof precio !== "number" || isNaN(precio) || precio < 0) {
    return res.status(400).json({ 
      message: "Precio debe ser un número válido y mayor o igual a 0." 
    });
  }

  if (typeof cantidad !== "number" || isNaN(cantidad) || cantidad < 0) {
    return res.status(400).json({ 
      message: "Cantidad debe ser un número válido y mayor o igual a 0." 
    });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query("SELECT * FROM productos WHERE id = ?", [id]);
    if (rows.length === 0) {
      throw new Error("Producto no encontrado.");
    }

    await connection.query(
      "UPDATE productos SET codigo = ?, descripcion = ?, precio = ?, cantidad = ? WHERE id = ?",
      [codigo, descripcion, precio, cantidad, id]
    );

    const [actualizado] = await connection.query("SELECT * FROM productos WHERE id = ?", [id]);

    await connection.commit();
    connection.release();

    res.json({
      ...actualizado[0],
      precio: parseFloat(actualizado[0].precio),
      cantidad: parseInt(actualizado[0].cantidad)
    });
  } catch (err) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error("Error al actualizar producto:", err);
    res.status(500).json({ 
      message: err.message || "Error interno del servidor." 
    });
  }
});

// Ruta específica para actualizar SOLO el precio (usada por el módulo de compras)
app.put("/productos/:id/actualizar-precio", async (req, res) => {
  const { id } = req.params;
  const { precio } = req.body;

  // Validar que el precio sea un número válido
  if (typeof precio !== "number" || isNaN(precio) || precio < 0) {
    return res.status(400).json({ 
      message: "Precio debe ser un número válido y mayor o igual a 0." 
    });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Verificar que el producto exista
    const [rows] = await connection.query("SELECT * FROM productos WHERE id = ?", [id]);
    if (rows.length === 0) {
      throw new Error("Producto no encontrado.");
    }

    // Actualizar SOLO el precio
    await connection.query(
      "UPDATE productos SET precio = ? WHERE id = ?",
      [precio, id]
    );

    // Obtener producto actualizado
    const [actualizado] = await connection.query("SELECT * FROM productos WHERE id = ?", [id]);

    await connection.commit();
    connection.release();

    res.json({
      id: actualizado[0].id,
      precio: parseFloat(actualizado[0].precio),
      message: "Precio actualizado exitosamente."
    });
  } catch (err) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error("Error al actualizar precio:", err);
    res.status(500).json({ 
      message: err.message || "Error interno del servidor." 
    });
  }
});

app.get("/reportes/ventas-producto", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.id AS producto_id,
        p.codigo,
        p.descripcion,
        COALESCE(SUM(fd.cantidad), 0) AS cantidad_vendida,
        COALESCE(SUM(fd.cantidad * fd.precio), 0) AS ingreso_total
      FROM productos p
      LEFT JOIN factura_detalle fd ON p.id = fd.producto_id
      GROUP BY p.id, p.codigo, p.descripcion
      ORDER BY cantidad_vendida DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error al cargar ventas." });
  }
});

app.post("/productos/actualizar-precios", async (req, res) => {
  const { porcentaje, tipo, rol } = req.body;

  if (!["admin"].includes(rol?.trim().toLowerCase())) {
    return res.status(403).json({ message: "Acceso denegado. Solo el admin puede realizar esta acción." });
  }

  const numPorcentaje = parseFloat(porcentaje);
  if (isNaN(numPorcentaje) || numPorcentaje < 0 || numPorcentaje > 100) {
    return res.status(400).json({ message: "Porcentaje inválido. Debe estar entre 0 y 100." });
  }

  if (!["aumentar", "disminuir"].includes(tipo)) {
    return res.status(400).json({ message: "Tipo inválido. Usa 'aumentar' o 'disminuir'." });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [productos] = await connection.query("SELECT id, precio FROM productos");
    if (productos.length === 0) {
      await connection.commit();
      return res.json({ actualizados: 0, mensaje: "No hay productos para actualizar." });
    }

    const factor = 1 + (numPorcentaje / 100);
    const query =
      tipo === "aumentar"
        ? "UPDATE productos SET precio = precio * ?"
        : "UPDATE productos SET precio = precio / ?";

    await connection.query(query, [factor]);

    await connection.commit();
    connection.release();

    res.json({
      actualizados: productos.length,
      porcentaje: numPorcentaje,
      tipo,
      mensaje: `Precios ${tipo === "aumentar" ? "aumentados" : "disminuidos"} en ${numPorcentaje}%. ${productos.length} productos actualizados.`
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Error al actualizar precios:", err);
    res.status(500).json({ message: "Error al actualizar precios." });
  }
});

app.put("/facturas/:id/anular", async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    
    const [facturaRows] = await connection.query(
      "SELECT id, estado FROM facturas WHERE id = ? FOR UPDATE",
      [id]
    );
    if (facturaRows.length === 0) {
      return res.status(404).json({ message: "Factura no encontrada." });
    }
    const factura = facturaRows[0];
    if (factura.estado === "sin pago") {
      return res.status(400).json({ message: "La factura ya está anulada." });
    }

    const [detalles] = await connection.query(
      "SELECT producto_id, cantidad FROM factura_detalle WHERE factura_id = ?",
      [id]
    );
    if (detalles.length === 0) {
      return res.status(400).json({ message: "No hay productos en esta factura." });
    }

    for (const detalle of detalles) {
      await connection.query(
        "UPDATE productos SET cantidad = cantidad + ? WHERE id = ?",
        [detalle.cantidad, detalle.producto_id]
      );
    }

    await connection.query(
      "UPDATE facturas SET estado = 'sin pago' WHERE id = ?",
      [id]
    );

    await connection.commit();

    res.json({
      message: "Factura anulada exitosamente y inventario devuelto.",
      factura_id: id,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Error al anular factura:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

app.get("/buscar", async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.json([]);
  }
  const searchTerm = `%${q.trim()}%`;
  try {
    const [productos] = await db.query(
      `SELECT 
        'producto' AS tipo,
        id,
        codigo,
        descripcion,
        precio,
        cantidad
      FROM productos 
      WHERE codigo LIKE ? OR descripcion LIKE ?
      LIMIT 5`,
      [searchTerm, searchTerm]
    );

    const [clientes] = await db.query(
      `SELECT 
        'cliente' AS tipo,
        id,
        nombre,
        numero_rif,
        tipo_rif
      FROM clientes 
      WHERE nombre LIKE ? OR numero_rif LIKE ?
      LIMIT 5`,
      [searchTerm, searchTerm]
    );

    const resultados = [
      ...productos.map(p => ({
        tipo: p.tipo,
        id: p.id,
        codigo: p.codigo,
        descripcion: p.descripcion,
        precio: parseFloat(p.precio),
        cantidad: p.cantidad
      })),
      ...clientes.map(c => ({
        tipo: c.tipo,
        id: c.id,
        nombre: c.nombre,
        unidad: `${c.tipo_rif}-${c.numero_rif}`
      }))
    ];

    res.json(resultados);
  } catch (error) {
    console.error("Error en /buscar:", error);
    res.status(500).json([]);
  }
});

app.post("/logs/precio", async (req, res) => {
  const { empleado_id, empleado_nombre, accion, porcentaje, total_productos_afectados } = req.body;

  try {
    await db.query(
      `INSERT INTO precio_logs 
       (empleado_id, empleado_nombre, accion, porcentaje, total_productos_afectados) 
       VALUES (?, ?, ?, ?, ?)`,
      [empleado_id, empleado_nombre, accion, porcentaje, total_productos_afectados]
    );
    res.status(201).json({ message: "Log de precios guardado." });
  } catch (error) {
    console.error("Error al guardar log de precios:", error);
    res.status(500).json({ message: "Error al guardar el registro." });
  }
});



app.get("/logs/precio", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id,
        empleado_id,
        empleado_nombre,
        accion,
        porcentaje,
        total_productos_afectados,
        fecha
      FROM precio_logs
      ORDER BY fecha DESC
    `);

    const logs = rows.map(log => ({
      ...log,
      fecha: new Date(log.fecha).toLocaleString('es-VE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }));

    res.json(logs);
  } catch (error) {
    console.error("Error al cargar logs de precios:", error);
    res.status(500).json({ message: "Error al cargar el historial de cambios." });
  }
});

app.get("/impuestos/pendientes", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        i.id,
        i.factura_id,
        f.numero_factura,
        f.fecha,
        c.nombre AS cliente_nombre,
        i.monto_iva,
        i.estado,
        i.fecha_registro,
        i.fecha_pago  
      FROM impuestos i
      JOIN facturas f ON i.factura_id = f.id
      JOIN clientes c ON f.cliente_id = c.id
      WHERE i.estado = 'pendiente'
      ORDER BY i.fecha_registro DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Error al obtener impuestos pendientes:", error);
    res.status(500).json({ message: "Error al cargar impuestos." });
  }
});

app.post("/impuestos/pagar", async (req, res) => {
  const { impuestoIds } = req.body;

  if (!Array.isArray(impuestoIds) || impuestoIds.length === 0) {
    return res.status(400).json({ message: "IDs de impuestos inválidos." });
  }

  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await db.query(
      `UPDATE impuestos 
       SET estado = 'pagado', fecha_pago = ? 
       WHERE id IN (?) AND estado = 'pendiente'`,
      [now, [impuestoIds]]
    );

    res.json({ message: "Impuestos marcados como pagados." });
  } catch (error) {
    console.error("Error al pagar impuestos:", error);
    res.status(500).json({ message: "Error al procesar el pago." });
  }
});

//RUTAS PARA EMPLEADOS =======================

app.get("/empleados", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, nombre, apellido, ci, ficha, telefono, rol, email, direccion created_at 
      FROM empleados 
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener empleados:", error);
    res.status(500).json({ message: "Error al cargar empleados." });
  }
});


app.put("/empleados/:id/rol", async (req, res) => {
  const { id } = req.params;
  const { rol } = req.body;

  const validRoles = ['cajero', 'supervisor', 'admin', 'desactivado'];
  if (!validRoles.includes(rol)) {
    return res.status(400).json({ message: "Rol no válido." });
  }
  try {
    await db.query("UPDATE empleados SET rol = ? WHERE id = ?", [rol, id]);
    res.json({ message: "Rol actualizado correctamente." });
  } catch (error) {
    console.error("Error al actualizar rol:", error);
    res.status(500).json({ message: "Error al actualizar rol." });
  }
});

//Registrar un nuevo empleado
app.post("/empleados", async (req, res) => {
  const { nombre, apellido, ci, telefono, ficha, rol, email, direccion } = req.body;
  // Validación básica
  if (!nombre || !apellido || !ci || !ficha || !rol) {
    return res.status(400).json({ message: "Campos obligatorios faltantes." });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO empleados (nombre, apellido, ci, telefono, ficha, rol, email, direccion) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, ci, telefono, ficha, rol, email, direccion]
    );
    // Registrar salario inicial (si se proporciona)
    if (req.body.salario_inicial && req.body.salario_inicial > 0) {
      await db.query(
        `INSERT INTO salarios (empleado_id, ultimo_salario, salario_actual, porcentaje_aumento) 
         VALUES (?, 0, ?, 0)`,
        [result.insertId, req.body.salario_inicial]
      );
    }
    res.status(201).json({ message: "Empleado registrado exitosamente." });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "CI o ficha ya registrada." });
    }
    res.status(500).json({ message: "Error al registrar empleado." });
  }
});

//Actaulizar un empleado
app.put("/empleados/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, ci, telefono, rol, email, direccion, nuevo_salario } = req.body;

  try {
    // Verificar que el empleado exista
    const [existing] = await db.query("SELECT * FROM empleados WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Empleado no encontrado." });
    }
    // Actualizar datos del empleado
    await db.query(
      `UPDATE empleados 
       SET nombre = ?, apellido = ?, ci = ?, telefono = ?, rol = ?, email = ?, direccion = ? 
       WHERE id = ?`,
      [nombre, apellido, ci, telefono, rol, email, direccion, id]
    );
    // Si se envió un nuevo salario
    if (nuevo_salario && !isNaN(parseFloat(nuevo_salario))) {
      const [current] = await db.query(
        "SELECT salario_actual FROM salarios WHERE empleado_id = ? ORDER BY fecha_act_salario DESC LIMIT 1", [id]
      );
      const ultimo_salario = current.length > 0 ? current[0].salario_actual : 0;
      const porcentaje_aumento = ultimo_salario > 0 
        ? ((nuevo_salario - ultimo_salario) / ultimo_salario) * 100 
        : 100;

      await db.query(
        `INSERT INTO salarios (empleado_id, ultimo_salario, salario_actual, porcentaje_aumento) 
         VALUES (?, ?, ?, ?)`,
        [id, ultimo_salario, parseFloat(nuevo_salario), porcentaje_aumento]
      );
    }
    res.json({ message: "Empleado actualizado correctamente." });
  } catch (error) {
    console.error("Error al actualizar empleado:", error);
    res.status(500).json({ message: "Error al actualizar empleado." });
  }
});

//REPORTE DE VENTAS DIARIAS ========
app.get("/reportes/ventas-diarias", async (req, res) => {
  const query = `
    SELECT 
      DAY(f.fecha) AS dia,
      COALESCE(SUM(f.total), 0) AS total
    FROM facturas f
    WHERE MONTH(f.fecha) = MONTH(CURDATE())
      AND YEAR(f.fecha) = YEAR(CURDATE())
    GROUP BY DAY(f.fecha)
    ORDER BY dia
  `;

  try {
    const [results] = await db.query(query);
    
    // Asegurar que todos los días del mes estén presentes (rellenar con 0 si no hay ventas)
    const diasDelMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const ventasPorDia = Array.from({ length: diasDelMes }, (_, i) => {
      const dia = i + 1;
      const venta = results.find(r => parseInt(r.dia) === dia);
      return {
        dia,
        total: venta ? parseFloat(venta.total) : 0
      };
    });

    res.json(ventasPorDia);
  } catch (err) {
    console.error("Error al obtener ventas diarias:", err);
    res.status(500).json({ message: "Error al cargar ventas diarias." });
  }
});

//======COMPARTIVO DE VENTAS POR MES EN UN GRAFICO======

app.get("/reportes/ventas-comparacion", async (req, res) => {
  const query = `
    SELECT 
      YEAR(f.fecha) AS anno,
      MONTH(f.fecha) AS mes,
      DAY(f.fecha) AS dia,
      COALESCE(SUM(f.total), 0) AS total
    FROM facturas f
    WHERE 
      (MONTH(f.fecha) = MONTH(CURDATE()) AND YEAR(f.fecha) = YEAR(CURDATE()))
      OR 
      (MONTH(f.fecha) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) 
       AND YEAR(f.fecha) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)))
    GROUP BY YEAR(f.fecha), MONTH(f.fecha), DAY(f.fecha)
    ORDER BY anno, mes, dia
  `;

  try {
    const [results] = await db.query(query);

    // Convertir a número y asegurar tipo
    const resultsParsed = results.map(r => ({
      anno: parseInt(r.anno),
      mes: parseInt(r.mes),
      dia: parseInt(r.dia),
      total: parseFloat(r.total)
    }));

    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    const annoActual = hoy.getFullYear();
    const mesAnterior = mesActual === 1 ? 12 : mesActual - 1;
    const annoAnterior = mesActual === 1 ? annoActual - 1 : annoActual;

    const ventasMesActual = resultsParsed.filter(
      (r) => r.mes === mesActual && r.anno === annoActual
    );
    const ventasMesAnterior = resultsParsed.filter(
      (r) => r.mes === mesAnterior && r.anno === annoAnterior
    );

    const diasDelMes = new Date(annoActual, mesActual, 0).getDate();

    const datosMesActual = Array.from({ length: diasDelMes }, (_, i) => {
      const dia = i + 1;
      const venta = ventasMesActual.find((v) => v.dia === dia);
      return venta ? venta.total : 0;
    });

    const datosMesAnterior = Array.from({ length: diasDelMes }, (_, i) => {
      const dia = i + 1;
      const venta = ventasMesAnterior.find((v) => v.dia === dia);
      return venta ? venta.total : 0;
    });

    res.json({
      mesActual: datosMesActual,
      mesAnterior: datosMesAnterior,
      labels: Array.from({ length: diasDelMes }, (_, i) => i + 1),
    });
  } catch (err) {
    console.error("Error al obtener comparación de ventas:", err);
    res.status(500).json({ message: "Error al cargar comparación de ventas." });
  }
});

//====PAGO DEL IVA=============
// 1. Ventas del mes actual
app.get("/reportes/ventas-mes-actual", async (req, res) => {
  const query = `
    SELECT COALESCE(SUM(total), 0) AS total
    FROM facturas
    WHERE MONTH(fecha) = MONTH(CURDATE())
      AND YEAR(fecha) = YEAR(CURDATE())
  `;
  const [results] = await db.query(query);
  res.json(results[0]);
});

// 2. Historial de pagos de IVA
app.get("/pagos-iva", async (req, res) => {
  const [results] = await db.query("SELECT * FROM pagos_iva ORDER BY fecha_pago DESC");
  res.json(results);
});

// 3. Registrar pago de IVA
app.post("/pagos-iva", async (req, res) => {
  const { monto, mes, referencia } = req.body;
  await db.query(
    "INSERT INTO pagos_iva (monto, mes, referencia, fecha_pago) VALUES (?, ?, ?, NOW())",
    [monto, mes, referencia]
  );
  res.status(201).json({ message: "Pago de IVA registrado" });
});

//====PAGO DE IMPUESTOS===========
app.get("/impuestos/pendientes-mes", async (req, res) => {
  const query = `
    SELECT 
      id,
      factura_id,
      monto_total,
      monto_sin_iva,
      monto_iva,
      estado_registro,
      fecha_registro,
      estado,
      fecha_pago
    FROM impuestos
    WHERE estado = 'pendiente'
      AND MONTH(fecha_registro) = MONTH(CURDATE())
      AND YEAR(fecha_registro) = YEAR(CURDATE())
    ORDER BY fecha_registro DESC
  `;

  try {
    const [results] = await db.query(query);

    // ✅ Asegurar que los números sean tipo number y fechas formateadas
    const datos = results.map(imp => ({
      id: imp.id,
      factura_id: imp.factura_id,
      base_imponible: parseFloat(imp.monto_sin_iva),
      iva_calculado: parseFloat(imp.monto_iva),
      total_factura: parseFloat(imp.monto_total),
      estado_registro: imp.estado_registro,
      fecha_generacion: imp.fecha_registro,
      estado: imp.estado,
      fecha_pago: imp.fecha_pago
    }));

    res.json(datos);
  } catch (err) {
    console.error("Error al obtener impuestos pendientes:", err);
    res.status(500).json({ 
      message: "Error al cargar impuestos pendientes.", 
      error: err.message 
    });
  }
});

//=======Registrar pago de IVA del mes=========
app.post("/impuestos/pagar-mes", async (req, res) => {
  const { mes, anno } = req.body;

  const query = `
    UPDATE impuestos
    SET estado = 'pagado', fecha_pago = NOW()
    WHERE estado = 'pendiente'
      AND MONTH(fecha_generacion) = ?
      AND YEAR(fecha_generacion) = ?
  `;

  try {
    const [result] = await db.query(query, [mes, anno]);
    res.json({ message: "Pago de IVA registrado", filas_actualizadas: result.affectedRows });
  } catch (err) {
    console.error("Error al pagar IVA:", err);
    res.status(500).json({ message: "Error al registrar pago." });
  }
});

// Pagar impuestos seleccionados
app.post("/impuestos/pagar-seleccionados", async (req, res) => {
  const { impuestoIds } = req.body;

  if (!Array.isArray(impuestoIds) || impuestoIds.length === 0) {
    return res.status(400).json({ message: "IDs de impuestos requeridos." });
  }

  const placeholders = impuestoIds.map(() => "?").join(",");
  const query = `
    UPDATE impuestos
    SET estado = 'pagado', fecha_pago = NOW()
    WHERE id IN (${placeholders})
      AND estado = 'pendiente'
  `;

  try {
    const [result] = await db.query(query, impuestoIds);
    res.json({
      message: `${result.affectedRows} impuesto(s) pagado(s) correctamente.`
    });
  } catch (err) {
    console.error("Error al pagar impuestos seleccionados:", err);
    res.status(500).json({ message: "Error al registrar el pago." });
  }
});

//===============PROVEEDORES=====================

// Proveedores
app.get("/proveedores", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM proveedores ORDER BY nombre");
  res.json(rows);
});

app.post("/proveedores", async (req, res) => {
  const { nombre, tipo_rif, numero_rif, direccion, telefono, persona_contacto, email_contacto } = req.body;
  await db.query(
    `INSERT INTO proveedores (nombre, tipo_rif, numero_rif, direccion, telefono, persona_contacto, email_contacto)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [nombre, tipo_rif, numero_rif, direccion, telefono, persona_contacto, email_contacto]
  );
  res.status(201).json({ message: "Proveedor creado" });
});

app.put("/proveedores/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, tipo_rif, numero_rif, direccion, telefono, persona_contacto, email_contacto } = req.body;
  await db.query(
    `UPDATE proveedores SET nombre=?, tipo_rif=?, numero_rif=?, direccion=?, telefono=?, persona_contacto=?, email_contacto=?
     WHERE id=?`,
    [nombre, tipo_rif, numero_rif, direccion, telefono, persona_contacto, email_contacto, id]
  );
  res.json({ message: "Proveedor actualizado" });
});

app.delete("/proveedores/:id", async (req, res) => {
  await db.query("DELETE FROM proveedores WHERE id=?", [req.params.id]);
  res.json({ message: "Proveedor eliminado" });
});

//=======COMPRAS============

app.post("/compras", async (req, res) => {
  const { proveedor_id, fecha_compra, total } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO compras (proveedor_id, fecha_compra, total) VALUES (?, ?, ?)`,
      [proveedor_id, fecha_compra, total]
    );
    res.status(201).json({ id: result.insertId, message: "Compra registrada" });
  } catch (err) {
    console.error("Error al crear compra:", err);
    res.status(500).json({ message: "Error al registrar compra" });
  }
});

app.post("/detalle-compras", async (req, res) => {
  const { compra_id, producto_id, cantidad, precio_compra, subtotal } = req.body;
  try {
    await db.query(
      `INSERT INTO detalle_compras (compra_id, producto_id, cantidad, precio_compra, subtotal)
       VALUES (?, ?, ?, ?, ?)`,
      [compra_id, producto_id, cantidad, precio_compra, subtotal]
    );
    res.status(201).json({ message: "Detalle agregado" });
  } catch (err) {
    console.error("Error al agregar detalle:", err);
    res.status(500).json({ message: "Error al guardar detalle" });
  }
});

// Ruta: GET /compras/con-detalles
app.get("/compras/con-detalles", async (req, res) => {
  const query = `
    SELECT 
      c.id,
      c.fecha_compra,
      c.total,
      p.nombre AS proveedor_nombre,
      dc.producto_id,
      pr.codigo AS producto_codigo,
      pr.descripcion AS producto_nombre,
      dc.cantidad,
      dc.precio_compra,
      dc.subtotal
    FROM compras c
    JOIN proveedores p ON c.proveedor_id = p.id
    JOIN detalle_compras dc ON c.id = dc.compra_id
    JOIN productos pr ON dc.producto_id = pr.id
    ORDER BY c.fecha_compra DESC, c.id DESC
  `;

  try {
    const [rows] = await db.query(query);

    // Agrupar detalles por compra
    const compras = [];
    const map = new Map();

    rows.forEach(row => {
      if (!map.has(row.id)) {
        map.set(row.id, {
          id: row.id,
          fecha_compra: row.fecha_compra,
          total: parseFloat(row.total),
          proveedor_nombre: row.proveedor_nombre,
          detalles: []
        });
        compras.push(map.get(row.id));
      }

      map.get(row.id).detalles.push({
        producto_id: row.producto_id,
        producto_codigo: row.producto_codigo,
        producto_nombre: row.producto_nombre,
        cantidad: row.cantidad,
        precio_compra: parseFloat(row.precio_compra),
        subtotal: parseFloat(row.subtotal)
      });
    });

    res.json(compras);
  } catch (err) {
    console.error("Error al obtener detalles de compras:", err);
    res.status(500).json({ message: "Error al cargar detalles de compras." });
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