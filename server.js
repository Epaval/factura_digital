const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});


db.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

// Ruta para guardar un nuevo cliente
app.post('/clientes', (req, res) => {
    const {tipo_rif, numero_rif, nombre, correo, operador, telefono, direccion } = req.body;
    // Validar que todos los campos estén presentes
    if (!nombre || !tipo_rif || !numero_rif || !correo || !operador || !telefono || !direccion) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }
    // Insertar el nuevo cliente en la base de datos
    const query = `
        INSERT INTO clientes (tipo_rif, numero_rif, nombre, correo, operador, telefono, direccion)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [tipo_rif, numero_rif, nombre, correo, operador, telefono, direccion];
    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al guardar el cliente:', err);
            return res.status(500).json({ message: 'Error al guardar el cliente.' });
        }
        // Devolver el cliente recién creado
        const nuevoCliente = {
            id: result.insertId, tipo_rif, numero_rif,nombre, correo,operador,
            telefono, direccion,                   
        };
        res.status(201).json(nuevoCliente);
    });
});
// Ruta para obtener el último número de factura y número de control
app.get('/facturas/ultimo-numero', (req, res) => {
    const query = 'SELECT MAX(numero_factura) AS ultimoNumeroFactura, MAX(numero_control) AS ultimoNumeroControl FROM facturas';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener el último número de factura y control:', err);
            return res.status(500).json({ message: 'Error al obtener el último número de factura y control.' });
        }

        const ultimoNumeroFactura = results[0].ultimoNumeroFactura || 0; // Si no hay facturas, devuelve 0
        const ultimoNumeroControl = results[0].ultimoNumeroControl || '00-00000'; // Si no hay facturas, devuelve '00-000000'

        res.json({ ultimoNumeroFactura, ultimoNumeroControl });
    });
});

// Rutas para productos
app.get('/productos', (req, res) => {
    db.query('SELECT * FROM productos', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Rutas para clientes
app.get('/clientes', (req, res) => {
    db.query('SELECT * FROM clientes', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});
//obtner productos
app.get('/productos', (req, res) => {
    db.query('SELECT * FROM productos', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Ruta para guardar una nueva factura
app.post('/facturas', (req, res) => {
    const { numero_factura, numero_control, cliente_id, fecha, total, detalles } = req.body;
    // Validar que todos los campos estén presentes
    if (!numero_factura || !numero_control || !cliente_id || !fecha || !total || !detalles) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }
    // Insertar la nueva factura en la base de datos
    const query = `
        INSERT INTO facturas (numero_factura, numero_control, cliente_id, fecha, total)
        VALUES (?, ?, ?, ?, ?)
    `;
    const values = [numero_factura, numero_control, cliente_id, fecha, total];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al guardar la factura:', err);
            return res.status(500).json({ message: 'Error al guardar la factura.' });
        }
        // Guardar los detalles de la factura
        const facturaId = result.insertId;
        const detallesQuery = `
            INSERT INTO factura_detalle (factura_id, producto_id, cantidad, precio)
            VALUES ?
        `;
        const detallesValues = detalles.map(detalle => [
            facturaId,
            detalle.producto_id,
            detalle.cantidad,
            detalle.precio,
        ]);

        db.query(detallesQuery, [detallesValues], (err) => {
            if (err) {
                console.error('Error al guardar los detalles de la factura:', err);
                return res.status(500).json({ message: 'Error al guardar los detalles de la factura.' });
            }
            // Devolver la factura recién creada
            const nuevaFactura = {
                id: facturaId,
                numero_factura,
                numero_control,
                cliente_id,
                fecha,
                total,
                detalles,
            };
            res.status(201).json(nuevaFactura);
        });
    });
});

// Ruta para actualizar un cliente existente
app.put('/clientes/:id', (req, res) => {
    const clienteId = req.params.id; // Obtener el ID del cliente desde la URL
    const { tipo_rif, numero_rif, nombre, correo, operador, telefono, direccion } = req.body;

    // Validar que todos los campos estén presentes
    if (!nombre || !tipo_rif || !numero_rif || !correo || !operador || !telefono || !direccion) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    // Query para actualizar el cliente en la base de datos
    const query = `
        UPDATE clientes
        SET tipo_rif = ?, numero_rif = ?, nombre = ?, correo = ?, operador = ?, telefono = ?, direccion = ?
        WHERE id = ?
    `;
    const values = [tipo_rif, numero_rif, nombre, correo, operador, telefono, direccion, clienteId];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al actualizar el cliente:', err);
            return res.status(500).json({ message: 'Error al actualizar el cliente.' });
        }

        // Verificar si se actualizó algún registro
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }

        // Devolver el cliente actualizado
        const clienteActualizado = {
            id: clienteId,
            tipo_rif,
            numero_rif,
            nombre,
            correo,
            operador,
            telefono,
            direccion,
        };
        res.status(200).json(clienteActualizado);
    });
});

// Ruta para actualizar un producto existente
app.put('/productos/:id', (req, res) => {
    const productoId = req.params.id; // Obtener el ID del producto desde la URL
    const { codigo, descripcion, cantidad, precio } = req.body;
    // Validar que todos los campos estén presentes
    if (!codigo || !descripcion || !cantidad || !precio) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }
    // Query para actualizar el producto en la base de datos
    const query = `
        UPDATE productos
        SET codigo = ?, descripcion = ?, cantidad = ?, precio = ?
        WHERE id = ?
    `;
    const values = [codigo, descripcion, cantidad, precio, productoId];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al actualizar el producto:', err);
            return res.status(500).json({ message: 'Error al actualizar el producto.' });
        }
        // Verificar si se actualizó algún registro
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        // Devolver el producto actualizado
        const productoActualizado = {
            id: productoId,
            codigo,
            descripcion,
            cantidad,
            precio,
        };
        res.status(200).json(productoActualizado);
    });
});

// Ruta para crear un nuevo producto
app.post('/productos', (req, res) => {
    const { codigo, descripcion, cantidad, precio } = req.body;

    // Validar que todos los campos estén presentes
    if (!codigo || !descripcion || !cantidad || !precio) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    // Query para insertar el nuevo producto en la base de datos
    const query = `
        INSERT INTO productos (codigo, descripcion, cantidad, precio)
        VALUES (?, ?, ?, ?)
    `;
    const values = [codigo, descripcion, cantidad, precio];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al crear el producto:', err);
            return res.status(500).json({ message: 'Error al crear el producto.' });
        }

        // Devolver el producto recién creado
        const nuevoProducto = {
            id: result.insertId, // El ID generado por la base de datos
            codigo,
            descripcion,
            cantidad,
            precio,
        };
        res.status(201).json(nuevoProducto);
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});