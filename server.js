const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '15mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '15mb' }));
app.use(express.static(__dirname));

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'soda_payroll'
};

let pool;

// Connect to MySQL and initialize schema if needed
async function initializeDB() {
    try {
        // First try to connect without database name to ensure it exists
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });
        
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await connection.end();
        
        // Now open the regular pool with the database specified
        pool = mysql.createPool(dbConfig);
        console.log(`Connected to MySQL Database: ${dbConfig.database}`);
        
        // Create tables dynamically if they are missing
        await pool.query(`
            CREATE TABLE IF NOT EXISTS \`empresa\` (
                \`id\` INT PRIMARY KEY AUTO_INCREMENT,
                \`companyName\` VARCHAR(255) NOT NULL DEFAULT 'Soda El Parque',
                \`employerName\` VARCHAR(255) NOT NULL DEFAULT 'Gerardo Pineda Chaves',
                \`companyId\` VARCHAR(50) NOT NULL DEFAULT '1-0938-0143',
                \`companyPhone\` VARCHAR(50) NOT NULL DEFAULT '2250-1234',
                \`companyCity\` VARCHAR(255) NOT NULL DEFAULT 'San José, Costa Rica'
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS \`empleados\` (
                \`id\` VARCHAR(50) PRIMARY KEY,
                \`employeeName\` VARCHAR(255) NOT NULL,
                \`employeeId\` VARCHAR(50) NOT NULL,
                \`employeePosition\` VARCHAR(255) NOT NULL,
                \`hourlyRate\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`hourlyRateNocturna\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`hoursDiurnas\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`hoursNocturnas\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`hoursDescanso\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`hoursExtrasDiurnas\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`hoursExtrasNocturnas\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`hoursFeriadoDoble\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`ccssAuto\` TINYINT(1) NOT NULL DEFAULT 1,
                \`ccssPercentage\` DECIMAL(5, 2) NOT NULL DEFAULT 10.83,
                \`ccssManualAmount\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`overrideTotals\` TINYINT(1) NOT NULL DEFAULT 0,
                \`manualGross\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`manualNet\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS \`comprobantes\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`employeeId\` VARCHAR(50) NOT NULL,
                \`employeeName\` VARCHAR(255) NOT NULL,
                \`employeeIdCard\` VARCHAR(50) NOT NULL,
                \`employeePosition\` VARCHAR(255) NOT NULL,
                \`periodYear\` INT NOT NULL,
                \`periodMonth\` INT NOT NULL,
                \`fortnight\` VARCHAR(10) NOT NULL,
                \`periodText\` VARCHAR(255) NOT NULL,
                \`paymentDay\` INT NOT NULL,
                \`paymentMonthText\` VARCHAR(50) NOT NULL,
                \`paymentYearText\` INT NOT NULL,
                \`hourlyRate\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`hourlyRateNocturna\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`hoursDiurnas\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`hoursNocturnas\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`hoursDescanso\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`hoursExtrasDiurnas\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`hoursExtrasNocturnas\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`hoursFeriadoDoble\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`valueDiurnas\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`valueNocturnas\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`valueDescanso\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`valueExtrasDiurnas\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`valueExtrasNocturnas\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`valueFeriadoDoble\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`totalHolidays\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`totalOtherEarnings\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`totalOtherDeductions\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`ccssDeduction\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`totalGross\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`totalDeductions\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`netSalary\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`ccssAuto\` TINYINT(1) NOT NULL DEFAULT 1,
                \`ccssPercentage\` DECIMAL(5, 2) NOT NULL DEFAULT 10.83,
                \`ccssManualAmount\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`overrideTotals\` TINYINT(1) NOT NULL DEFAULT 0,
                \`manualGross\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`manualNet\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`createdAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        
        // Auto-migration for existing tables
        try { await pool.query('ALTER TABLE `empresa` ADD COLUMN `logo` LONGTEXT DEFAULT NULL'); } catch(e) {}
        try { await pool.query('ALTER TABLE `empleados` ADD COLUMN `hoursFeriadoDoble` DECIMAL(10, 2) NOT NULL DEFAULT 0.00'); } catch(e) {}
        try { await pool.query('ALTER TABLE `comprobantes` ADD COLUMN `hoursFeriadoDoble` DECIMAL(10, 2) NOT NULL DEFAULT 0.00'); } catch(e) {}
        try { await pool.query('ALTER TABLE `comprobantes` ADD COLUMN `valueFeriadoDoble` DECIMAL(10, 2) NOT NULL DEFAULT 0.00'); } catch(e) {}
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS \`comprobante_detalles\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`comprobanteId\` INT NOT NULL,
                \`conceptType\` ENUM('holiday', 'earning', 'deduction') NOT NULL,
                \`name\` VARCHAR(255) NOT NULL,
                \`amount\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`hours\` DECIMAL(10, 2) DEFAULT NULL,
                \`rate\` DECIMAL(10, 2) DEFAULT NULL,
                FOREIGN KEY (\`comprobanteId\`) REFERENCES \`comprobantes\`(\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Ensure hours and rate columns exist in case table was created earlier
        try {
            await pool.query('ALTER TABLE `comprobante_detalles` ADD COLUMN `hours` DECIMAL(10, 2) DEFAULT NULL');
        } catch (e) {}
        try {
            await pool.query('ALTER TABLE `comprobante_detalles` ADD COLUMN `rate` DECIMAL(10, 2) DEFAULT NULL');
        } catch (e) {}

        await pool.query(`
            CREATE TABLE IF NOT EXISTS \`vacaciones\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`employeeId\` VARCHAR(50) NOT NULL,
                \`employeeName\` VARCHAR(255) NOT NULL,
                \`employeeIdCard\` VARCHAR(50) NOT NULL,
                \`employeePosition\` VARCHAR(255) NOT NULL,
                \`periodLabel\` VARCHAR(100) NOT NULL,
                \`days\` DECIMAL(5, 2) NOT NULL,
                \`startDate\` VARCHAR(50) DEFAULT NULL,
                \`endDate\` VARCHAR(50) DEFAULT NULL,
                \`returnDate\` VARCHAR(50) DEFAULT NULL,
                \`dailyRate\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`grossAmount\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`ccssPercent\` DECIMAL(5, 2) NOT NULL DEFAULT 10.83,
                \`ccssDeduction\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`netAmount\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`createdAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Check if there is company info, seed if empty
        const [companies] = await pool.query('SELECT * FROM empresa LIMIT 1');
        if (companies.length === 0) {
            await pool.query(`
                INSERT INTO empresa (id, companyName, employerName, companyId, companyPhone, companyCity, logo)
                VALUES (1, 'Soda El Parque', 'Gerardo Pineda Chaves', '1-0938-0143', '2250-1234', 'San José, Costa Rica', NULL)
            `);
        }

        // Seed default employee if empty
        const [emps] = await pool.query('SELECT * FROM empleados LIMIT 1');
        if (emps.length === 0) {
            await pool.query(`
                INSERT INTO empleados (
                    id, employeeName, employeeId, employeePosition, hourlyRate, hourlyRateNocturna,
                    hoursDiurnas, hoursNocturnas, hoursDescanso, hoursExtrasDiurnas, hoursExtrasNocturnas,
                    ccssAuto, ccssPercentage, ccssManualAmount, overrideTotals, manualGross, manualNet
                ) VALUES (
                    'emp-default', 'Marisol Hidalgo Barquero', '1-0938-0143', 'Ayudante de cocina', 1690.46, 2253.95,
                    104.00, 0.00, 16.00, 0.00, 0.00,
                    1, 10.83, 0.00, 0, 0.00, 0.00
                )
            `);
        } else {
            // Auto-correct any legacy emp-default record with overrideTotals = 1
            try {
                await pool.query("UPDATE empleados SET overrideTotals = 0 WHERE id = 'emp-default' AND overrideTotals = 1");
            } catch(e) {}
        }
        
    } catch (error) {
        console.error('MySQL connection error. Please make sure XAMPP MySQL is running! Error details:', error.message);
    }
}

// REST API Endpoints

// 1. GET/POST /api/empresa
app.get('/api/empresa', async (req, res) => {
    try {
        if (!pool) return res.status(503).json({ error: 'Database not initialized' });
        const [rows] = await pool.query('SELECT * FROM empresa ORDER BY id DESC LIMIT 1');
        res.json(rows[0] || {
            companyName: "Soda El Parque",
            employerName: "Gerardo Pineda Chaves",
            companyId: "1-0938-0143",
            companyPhone: "2250-1234",
            companyCity: "San José, Costa Rica",
            logo: null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/empresa', async (req, res) => {
    try {
        if (!pool) return res.status(503).json({ error: 'Database not initialized' });
        const { companyName, employerName, companyId, companyPhone, companyCity, logo } = req.body;
        
        // Update first row or insert if not exists
        await pool.query(`
            INSERT INTO empresa (id, companyName, employerName, companyId, companyPhone, companyCity, logo)
            VALUES (1, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                companyName = VALUES(companyName),
                employerName = VALUES(employerName),
                companyId = VALUES(companyId),
                companyPhone = VALUES(companyPhone),
                companyCity = VALUES(companyCity),
                logo = VALUES(logo)
        `, [companyName, employerName, companyId, companyPhone, companyCity, logo || null]);
        
        res.json({ message: 'Company information and logo updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. GET/POST/PUT/DELETE /api/empleados
app.get('/api/empleados', async (req, res) => {
    try {
        if (!pool) return res.status(503).json({ error: 'Database not initialized' });
        const [rows] = await pool.query('SELECT * FROM empleados');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/empleados', async (req, res) => {
    try {
        if (!pool) return res.status(503).json({ error: 'Database not initialized' });
        const {
            id, employeeName, employeeId, employeePosition, hourlyRate, hourlyRateNocturna,
            hoursDiurnas, hoursNocturnas, hoursDescanso, hoursExtrasDiurnas, hoursExtrasNocturnas, hoursFeriadoDoble,
            ccssAuto, ccssPercentage, ccssManualAmount, overrideTotals, manualGross, manualNet,
            holidays, earnings, deductions
        } = req.body;
        
        await pool.query(`
            INSERT INTO empleados (
                id, employeeName, employeeId, employeePosition, hourlyRate, hourlyRateNocturna,
                hoursDiurnas, hoursNocturnas, hoursDescanso, hoursExtrasDiurnas, hoursExtrasNocturnas, hoursFeriadoDoble,
                ccssAuto, ccssPercentage, ccssManualAmount, overrideTotals, manualGross, manualNet,
                holidays, earnings, deductions
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                employeeName = VALUES(employeeName),
                employeeId = VALUES(employeeId),
                employeePosition = VALUES(employeePosition),
                hourlyRate = VALUES(hourlyRate),
                hourlyRateNocturna = VALUES(hourlyRateNocturna),
                hoursDiurnas = VALUES(hoursDiurnas),
                hoursNocturnas = VALUES(hoursNocturnas),
                hoursDescanso = VALUES(hoursDescanso),
                hoursExtrasDiurnas = VALUES(hoursExtrasDiurnas),
                hoursExtrasNocturnas = VALUES(hoursExtrasNocturnas),
                hoursFeriadoDoble = VALUES(hoursFeriadoDoble),
                ccssAuto = VALUES(ccssAuto),
                ccssPercentage = VALUES(ccssPercentage),
                ccssManualAmount = VALUES(ccssManualAmount),
                overrideTotals = VALUES(overrideTotals),
                manualGross = VALUES(manualGross),
                manualNet = VALUES(manualNet),
                holidays = VALUES(holidays),
                earnings = VALUES(earnings),
                deductions = VALUES(deductions)
        `, [
            id, employeeName, employeeId, employeePosition, hourlyRate, hourlyRateNocturna,
            hoursDiurnas, hoursNocturnas, hoursDescanso, hoursExtrasDiurnas, hoursExtrasNocturnas, hoursFeriadoDoble || 0,
            ccssAuto ? 1 : 0, ccssPercentage, ccssManualAmount, overrideTotals ? 1 : 0, manualGross, manualNet,
            typeof holidays === 'object' ? JSON.stringify(holidays) : (holidays || '[]'),
            typeof earnings === 'object' ? JSON.stringify(earnings) : (earnings || '[]'),
            typeof deductions === 'object' ? JSON.stringify(deductions) : (deductions || '[]')
        ]);
        
        res.status(201).json({ message: 'Employee profile created successfully', id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/empleados/:id', async (req, res) => {
    try {
        if (!pool) return res.status(503).json({ error: 'Database not initialized' });
        const { id } = req.params;
        const {
            employeeName, employeeId, employeePosition, hourlyRate, hourlyRateNocturna,
            hoursDiurnas, hoursNocturnas, hoursDescanso, hoursExtrasDiurnas, hoursExtrasNocturnas, hoursFeriadoDoble,
            ccssAuto, ccssPercentage, ccssManualAmount, overrideTotals, manualGross, manualNet,
            holidays, earnings, deductions
        } = req.body;
        
        await pool.query(`
            UPDATE empleados SET 
                employeeName = ?, employeeId = ?, employeePosition = ?, 
                hourlyRate = ?, hourlyRateNocturna = ?, 
                hoursDiurnas = ?, hoursNocturnas = ?, hoursDescanso = ?, 
                hoursExtrasDiurnas = ?, hoursExtrasNocturnas = ?, hoursFeriadoDoble = ?,
                ccssAuto = ?, ccssPercentage = ?, ccssManualAmount = ?, 
                overrideTotals = ?, manualGross = ?, manualNet = ?,
                holidays = ?, earnings = ?, deductions = ?
            WHERE id = ?
        `, [
            employeeName, employeeId, employeePosition, hourlyRate, hourlyRateNocturna,
            hoursDiurnas, hoursNocturnas, hoursDescanso, hoursExtrasDiurnas, hoursExtrasNocturnas, hoursFeriadoDoble || 0,
            ccssAuto ? 1 : 0, ccssPercentage, ccssManualAmount, overrideTotals ? 1 : 0, manualGross, manualNet,
            typeof holidays === 'object' ? JSON.stringify(holidays) : (holidays || '[]'),
            typeof earnings === 'object' ? JSON.stringify(earnings) : (earnings || '[]'),
            typeof deductions === 'object' ? JSON.stringify(deductions) : (deductions || '[]'),
            id
        ]);
        
        res.json({ message: 'Employee profile updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/empleados/:id', async (req, res) => {
    try {
        if (!pool) return res.status(503).json({ error: 'Database not initialized' });
        const { id } = req.params;
        await pool.query('DELETE FROM empleados WHERE id = ?', [id]);
        res.json({ message: 'Employee profile deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. GET/POST /api/comprobantes
app.get('/api/comprobantes', async (req, res) => {
    try {
        if (!pool) return res.status(503).json({ error: 'Database not initialized' });
        const [rows] = await pool.query('SELECT * FROM comprobantes ORDER BY id DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/comprobantes', async (req, res) => {
    let connection;
    try {
        if (!pool) return res.status(503).json({ error: 'Database not initialized' });
        connection = await pool.getConnection();
        await connection.beginTransaction();
        
        const {
            employeeId, employeeName, employeeIdCard, employeePosition,
            periodYear, periodMonth, fortnight, periodText, paymentDay, paymentMonthText, paymentYearText,
            hourlyRate, hourlyRateNocturna, hoursDiurnas, hoursNocturnas, hoursDescanso, hoursExtrasDiurnas, hoursExtrasNocturnas, hoursFeriadoDoble,
            valueDiurnas, valueNocturnas, valueDescanso, valueExtrasDiurnas, valueExtrasNocturnas, valueFeriadoDoble,
            totalHolidays, totalOtherEarnings, totalOtherDeductions, ccssDeduction,
            totalGross, totalDeductions, netSalary,
            ccssAuto, ccssPercentage, ccssManualAmount, overrideTotals, manualGross, manualNet,
            concepts,
            allowUpdate
        } = req.body;
        
        // Check if voucher for this employee and fortnight already exists
        const [existing] = await connection.query(
            'SELECT id FROM comprobantes WHERE employeeId = ? AND periodYear = ? AND periodMonth = ? AND fortnight = ?',
            [employeeId, periodYear, periodMonth, fortnight]
        );
        
        let comprobanteId;
        let isUpdated = false;
        
        if (existing.length > 0) {
            if (!allowUpdate) {
                await connection.rollback();
                return res.status(409).json({
                    exists: true,
                    existingId: existing[0].id,
                    message: `Ya existe un comprobante para este empleado en el período seleccionado.`
                });
            }
            // User authorized replacement/update
            comprobanteId = existing[0].id;
            isUpdated = true;
            
            await connection.query(`
                UPDATE comprobantes SET
                    employeeName = ?, employeeIdCard = ?, employeePosition = ?,
                    periodText = ?, paymentDay = ?, paymentMonthText = ?, paymentYearText = ?,
                    hourlyRate = ?, hourlyRateNocturna = ?, hoursDiurnas = ?, hoursNocturnas = ?, hoursDescanso = ?,
                    hoursExtrasDiurnas = ?, hoursExtrasNocturnas = ?, hoursFeriadoDoble = ?,
                    valueDiurnas = ?, valueNocturnas = ?, valueDescanso = ?, valueExtrasDiurnas = ?, valueExtrasNocturnas = ?, valueFeriadoDoble = ?,
                    totalHolidays = ?, totalOtherEarnings = ?, totalOtherDeductions = ?, ccssDeduction = ?,
                    totalGross = ?, totalDeductions = ?, netSalary = ?,
                    ccssAuto = ?, ccssPercentage = ?, ccssManualAmount = ?, overrideTotals = ?, manualGross = ?, manualNet = ?,
                    createdAt = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [
                employeeName, employeeIdCard, employeePosition,
                periodText, paymentDay, paymentMonthText, paymentYearText,
                hourlyRate, hourlyRateNocturna, hoursDiurnas, hoursNocturnas, hoursDescanso,
                hoursExtrasDiurnas, hoursExtrasNocturnas, hoursFeriadoDoble || 0,
                valueDiurnas, valueNocturnas, valueDescanso, valueExtrasDiurnas, valueExtrasNocturnas, valueFeriadoDoble || 0,
                totalHolidays, totalOtherEarnings, totalOtherDeductions, ccssDeduction,
                totalGross, totalDeductions, netSalary,
                ccssAuto ? 1 : 0, ccssPercentage, ccssManualAmount, overrideTotals ? 1 : 0, manualGross, manualNet,
                comprobanteId
            ]);
            
            // Clear previous child concepts for clean replacement
            await connection.query('DELETE FROM comprobante_detalles WHERE comprobanteId = ?', [comprobanteId]);
        } else {
            // Insert new parent comprobante
            const [result] = await connection.query(`
                INSERT INTO comprobantes (
                    employeeId, employeeName, employeeIdCard, employeePosition,
                    periodYear, periodMonth, fortnight, periodText, paymentDay, paymentMonthText, paymentYearText,
                    hourlyRate, hourlyRateNocturna, hoursDiurnas, hoursNocturnas, hoursDescanso, hoursExtrasDiurnas, hoursExtrasNocturnas, hoursFeriadoDoble,
                    valueDiurnas, valueNocturnas, valueDescanso, valueExtrasDiurnas, valueExtrasNocturnas, valueFeriadoDoble,
                    totalHolidays, totalOtherEarnings, totalOtherDeductions, ccssDeduction,
                    totalGross, totalDeductions, netSalary,
                    ccssAuto, ccssPercentage, ccssManualAmount, overrideTotals, manualGross, manualNet
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                employeeId, employeeName, employeeIdCard, employeePosition,
                periodYear, periodMonth, fortnight, periodText, paymentDay, paymentMonthText, paymentYearText,
                hourlyRate, hourlyRateNocturna, hoursDiurnas, hoursNocturnas, hoursDescanso, hoursExtrasDiurnas, hoursExtrasNocturnas, hoursFeriadoDoble || 0,
                valueDiurnas, valueNocturnas, valueDescanso, valueExtrasDiurnas, valueExtrasNocturnas, valueFeriadoDoble || 0,
                totalHolidays, totalOtherEarnings, totalOtherDeductions, ccssDeduction,
                totalGross, totalDeductions, netSalary,
                ccssAuto ? 1 : 0, ccssPercentage, ccssManualAmount, overrideTotals ? 1 : 0, manualGross, manualNet
            ]);
            comprobanteId = result.insertId;
        }
        
        // Insert child concept details if any
        if (concepts && Array.isArray(concepts) && concepts.length > 0) {
            for (const item of concepts) {
                await connection.query(`
                    INSERT INTO comprobante_detalles (comprobanteId, conceptType, name, amount, hours, rate)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [comprobanteId, item.conceptType, item.name, item.amount, item.hours !== undefined ? item.hours : null, item.rate !== undefined ? item.rate : null]);
            }
        }
        
        await connection.commit();
        res.status(201).json({ 
            message: isUpdated ? 'Comprobante actualizado y reemplazado con éxito' : 'Comprobante generado y guardado con éxito', 
            id: comprobanteId,
            updated: isUpdated
        });
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// 4. GET /api/comprobantes/:id
app.get('/api/comprobantes/:id', async (req, res) => {
    try {
        if (!pool) return res.status(503).json({ error: 'Database not initialized' });
        const { id } = req.params;
        
        const [compRows] = await pool.query('SELECT * FROM comprobantes WHERE id = ?', [id]);
        if (compRows.length === 0) {
            return res.status(404).json({ error: 'Receipt not found' });
        }
        
        const comprobante = compRows[0];
        
        const [detailRows] = await pool.query('SELECT * FROM comprobante_detalles WHERE comprobanteId = ?', [id]);
        comprobante.concepts = detailRows;
        
        res.json(comprobante);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. GET /api/empleados/:id/aguinaldo (computes sum of gross salaries in the selected year / 12)
app.get('/api/empleados/:id/aguinaldo', async (req, res) => {
    try {
        if (!pool) return res.status(503).json({ error: 'Database not initialized' });
        const { id } = req.params;
        const targetYear = parseInt(req.query.year) || new Date().getFullYear();
        
        const [receipts] = await pool.query(`
            SELECT id, periodYear, periodMonth, fortnight, periodText, totalGross, paymentMonthText
            FROM comprobantes 
            WHERE employeeId = ? AND (periodYear = ? OR paymentYearText = ?)
            ORDER BY periodMonth ASC, fortnight ASC
        `, [id, targetYear, targetYear]);
        
        // Group by month to show a nice breakdown
        const monthlyBreakdown = {};
        let totalGrossSum = 0;
        
        receipts.forEach(r => {
            const m = r.periodMonth;
            if (!monthlyBreakdown[m]) {
                monthlyBreakdown[m] = {
                    monthName: r.paymentMonthText || `Mes ${m}`,
                    grossAmount: 0,
                    receipts: []
                };
            }
            const grossVal = parseFloat(r.totalGross) || 0;
            monthlyBreakdown[m].grossAmount += grossVal;
            monthlyBreakdown[m].receipts.push({
                id: r.id,
                fortnight: r.fortnight,
                periodText: r.periodText,
                totalGross: grossVal
            });
            totalGrossSum += grossVal;
        });
        
        const breakdownArray = Object.keys(monthlyBreakdown).map(m => ({
            monthIndex: parseInt(m),
            ...monthlyBreakdown[m]
        })).sort((a, b) => a.monthIndex - b.monthIndex);
        
        const aguinaldoAccrued = totalGrossSum / 12;
        
        res.json({
            employeeId: id,
            year: targetYear,
            totalGrossSum,
            aguinaldoAccrued,
            vouchersCount: receipts.length,
            receiptsList: receipts,
            monthlyBreakdown: breakdownArray
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. GET & POST /api/vacaciones
app.get('/api/vacaciones', async (req, res) => {
    try {
        if (!pool) return res.status(503).json({ error: 'Database not initialized' });
        const [rows] = await pool.query('SELECT * FROM vacaciones ORDER BY id DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/vacaciones', async (req, res) => {
    try {
        if (!pool) return res.status(503).json({ error: 'Database not initialized' });
        const {
            employeeId, employeeName, employeeIdCard, employeePosition,
            periodLabel, days, startDate, endDate, returnDate,
            dailyRate, grossAmount, ccssPercent, ccssDeduction, netAmount
        } = req.body;
        
        const [result] = await pool.query(`
            INSERT INTO vacaciones (
                employeeId, employeeName, employeeIdCard, employeePosition,
                periodLabel, days, startDate, endDate, returnDate,
                dailyRate, grossAmount, ccssPercent, ccssDeduction, netAmount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            employeeId, employeeName, employeeIdCard, employeePosition,
            periodLabel, days, startDate || null, endDate || null, returnDate || null,
            dailyRate, grossAmount, ccssPercent, ccssDeduction, netAmount
        ]);
        
        res.status(201).json({ message: 'Comprobante de vacaciones guardado con éxito', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start the server
initializeDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Soda El Parque backend server running on http://localhost:${PORT}`);
    });
});
