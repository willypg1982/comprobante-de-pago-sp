-- Drop database if exists and create it (for local XAMPP setup)
CREATE DATABASE IF NOT EXISTS `soda_payroll` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `soda_payroll`;

-- 1. Table for Company Configuration
CREATE TABLE IF NOT EXISTS `empresa` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `companyName` VARCHAR(255) NOT NULL DEFAULT 'Soda El Parque',
    `employerName` VARCHAR(255) NOT NULL DEFAULT 'Gerardo Pineda Chaves',
    `companyId` VARCHAR(50) NOT NULL DEFAULT '1-0938-0143',
    `companyPhone` VARCHAR(50) NOT NULL DEFAULT '2250-1234',
    `companyCity` VARCHAR(255) NOT NULL DEFAULT 'San José, Costa Rica',
    `logo` LONGTEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table for Employee Profiles
CREATE TABLE IF NOT EXISTS `empleados` (
    `id` VARCHAR(50) PRIMARY KEY,
    `employeeName` VARCHAR(255) NOT NULL,
    `employeeId` VARCHAR(50) NOT NULL,
    `employeePosition` VARCHAR(255) NOT NULL,
    `hourlyRate` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `hourlyRateNocturna` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    
    `hoursDiurnas` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `hoursNocturnas` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `hoursDescanso` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `hoursExtrasDiurnas` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `hoursExtrasNocturnas` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `hoursFeriadoDoble` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    
    `ccssAuto` TINYINT(1) NOT NULL DEFAULT 1,
    `ccssPercentage` DECIMAL(5, 2) NOT NULL DEFAULT 10.83,
    `ccssManualAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    
    `overrideTotals` TINYINT(1) NOT NULL DEFAULT 0,
    `manualGross` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `manualNet` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    
    `holidays` TEXT,
    `earnings` TEXT,
    `deductions` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table for Generated Pay Slips / Vouchers
CREATE TABLE IF NOT EXISTS `comprobantes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employeeId` VARCHAR(50) NOT NULL,
    `employeeName` VARCHAR(255) NOT NULL,
    `employeeIdCard` VARCHAR(50) NOT NULL,
    `employeePosition` VARCHAR(255) NOT NULL,
    `periodYear` INT NOT NULL,
    `periodMonth` INT NOT NULL,
    `fortnight` VARCHAR(10) NOT NULL,
    `periodText` VARCHAR(255) NOT NULL,
    `paymentDay` INT NOT NULL,
    `paymentMonthText` VARCHAR(50) NOT NULL,
    `paymentYearText` INT NOT NULL,
    
    `hourlyRate` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `hourlyRateNocturna` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `hoursDiurnas` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `hoursNocturnas` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `hoursDescanso` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `hoursExtrasDiurnas` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `hoursExtrasNocturnas` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `hoursFeriadoDoble` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    
    `valueDiurnas` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `valueNocturnas` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `valueDescanso` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `valueExtrasDiurnas` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `valueExtrasNocturnas` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `valueFeriadoDoble` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    
    `totalHolidays` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `totalOtherEarnings` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `totalOtherDeductions` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `ccssDeduction` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    
    `totalGross` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `totalDeductions` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `netSalary` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    
    `ccssAuto` TINYINT(1) NOT NULL DEFAULT 1,
    `ccssPercentage` DECIMAL(5, 2) NOT NULL DEFAULT 10.83,
    `ccssManualAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    
    `overrideTotals` TINYINT(1) NOT NULL DEFAULT 0,
    `manualGross` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `manualNet` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`employeeId`) REFERENCES `empleados`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table for Dynamic Concepts / Details per Voucher
CREATE TABLE IF NOT EXISTS `comprobante_detalles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `comprobanteId` INT NOT NULL,
    `conceptType` ENUM('holiday', 'earning', 'deduction') NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `hours` DECIMAL(10, 2) DEFAULT NULL,
    `rate` DECIMAL(10, 2) DEFAULT NULL,
    FOREIGN KEY (`comprobanteId`) REFERENCES `comprobantes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table for Vacation Vouchers
CREATE TABLE IF NOT EXISTS `vacaciones` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employeeId` VARCHAR(50) NOT NULL,
    `employeeName` VARCHAR(255) NOT NULL,
    `employeeIdCard` VARCHAR(50) NOT NULL,
    `employeePosition` VARCHAR(255) NOT NULL,
    `periodLabel` VARCHAR(100) NOT NULL,
    `days` DECIMAL(5, 2) NOT NULL,
    `startDate` VARCHAR(50) DEFAULT NULL,
    `endDate` VARCHAR(50) DEFAULT NULL,
    `returnDate` VARCHAR(50) DEFAULT NULL,
    `dailyRate` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `grossAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `ccssPercent` DECIMAL(5, 2) NOT NULL DEFAULT 10.83,
    `ccssDeduction` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `netAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`employeeId`) REFERENCES `empleados`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- SEED DATA (SAMPLE RECORDS MATCHING MARISOL)
-- ==========================================

-- Insert Company Config
INSERT INTO `empresa` (`id`, `companyName`, `employerName`, `companyId`, `companyPhone`, `companyCity`)
VALUES (1, 'Soda El Parque', 'Gerardo Pineda Chaves', '1-0938-0143', '2250-1234', 'San José, Costa Rica')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- Insert default employee (Marisol Hidalgo Barquero)
INSERT INTO `empleados` (
    `id`, `employeeName`, `employeeId`, `employeePosition`, `hourlyRate`, `hourlyRateNocturna`,
    `hoursDiurnas`, `hoursNocturnas`, `hoursDescanso`, `hoursExtrasDiurnas`, `hoursExtrasNocturnas`,
    `ccssAuto`, `ccssPercentage`, `ccssManualAmount`, `overrideTotals`, `manualGross`, `manualNet`
) VALUES (
    'emp-default', 'Marisol Hidalgo Barquero', '1-0938-0143', 'Ayudante de cocina', 1690.46, 2253.95,
    104.00, 0.00, 16.00, 0.00, 0.00,
    1, 10.83, 0.00, 0, 0.00, 0.00
) ON DUPLICATE KEY UPDATE `id` = `id`;

-- Insert some historical vouchers for Marisol to test history & Aguinaldo
-- 1st voucher: Jan 2026 1st half
INSERT INTO `comprobantes` (
    `id`, `employeeId`, `employeeName`, `employeeIdCard`, `employeePosition`, `periodYear`, `periodMonth`, `fortnight`, `periodText`, `paymentDay`, `paymentMonthText`, `paymentYearText`,
    `hourlyRate`, `hourlyRateNocturna`, `hoursDiurnas`, `hoursNocturnas`, `hoursDescanso`, `hoursExtrasDiurnas`, `hoursExtrasNocturnas`,
    `valueDiurnas`, `valueNocturnas`, `valueDescanso`, `valueExtrasDiurnas`, `valueExtrasNocturnas`,
    `totalHolidays`, `totalOtherEarnings`, `totalOtherDeductions`, `ccssDeduction`,
    `totalGross`, `totalDeductions`, `netSalary`, `ccssAuto`, `ccssPercentage`, `ccssManualAmount`, `overrideTotals`, `manualGross`, `manualNet`
) VALUES (
    1, 'emp-default', 'Marisol Hidalgo Barquero', '1-0938-0143', 'Ayudante de cocina', 2026, 1, '1', '01 al 15 de Enero del 2026', 15, 'Enero', 2026,
    1690.46, 2253.95, 104.00, 0.00, 16.00, 0.00, 0.00,
    175807.84, 0.00, 27047.36, 0.00, 0.00,
    0.00, 0.00, 0.00, 21970.61,
    202855.20, 21970.61, 180884.59, 1, 10.83, 0.00, 0, 0.00, 0.00
);

-- 2nd voucher: Feb 2026 1st half
INSERT INTO `comprobantes` (
    `id`, `employeeId`, `employeeName`, `employeeIdCard`, `employeePosition`, `periodYear`, `periodMonth`, `fortnight`, `periodText`, `paymentDay`, `paymentMonthText`, `paymentYearText`,
    `hourlyRate`, `hourlyRateNocturna`, `hoursDiurnas`, `hoursNocturnas`, `hoursDescanso`, `hoursExtrasDiurnas`, `hoursExtrasNocturnas`,
    `valueDiurnas`, `valueNocturnas`, `valueDescanso`, `valueExtrasDiurnas`, `valueExtrasNocturnas`,
    `totalHolidays`, `totalOtherEarnings`, `totalOtherDeductions`, `ccssDeduction`,
    `totalGross`, `totalDeductions`, `netSalary`, `ccssAuto`, `ccssPercentage`, `ccssManualAmount`, `overrideTotals`, `manualGross`, `manualNet`
) VALUES (
    2, 'emp-default', 'Marisol Hidalgo Barquero', '1-0938-0143', 'Ayudante de cocina', 2026, 2, '1', '01 al 15 de Febrero del 2026', 15, 'Febrero', 2026,
    1690.46, 2253.95, 104.00, 0.00, 16.00, 0.00, 0.00,
    175807.84, 0.00, 27047.36, 0.00, 0.00,
    0.00, 0.00, 0.00, 21970.61,
    202855.20, 21970.61, 180884.59, 1, 10.83, 0.00, 0, 0.00, 0.00
);

-- 3rd voucher: March 2026 1st half
INSERT INTO `comprobantes` (
    `id`, `employeeId`, `employeeName`, `employeeIdCard`, `employeePosition`, `periodYear`, `periodMonth`, `fortnight`, `periodText`, `paymentDay`, `paymentMonthText`, `paymentYearText`,
    `hourlyRate`, `hourlyRateNocturna`, `hoursDiurnas`, `hoursNocturnas`, `hoursDescanso`, `hoursExtrasDiurnas`, `hoursExtrasNocturnas`,
    `valueDiurnas`, `valueNocturnas`, `valueDescanso`, `valueExtrasDiurnas`, `valueExtrasNocturnas`,
    `totalHolidays`, `totalOtherEarnings`, `totalOtherDeductions`, `ccssDeduction`,
    `totalGross`, `totalDeductions`, `netSalary`, `ccssAuto`, `ccssPercentage`, `ccssManualAmount`, `overrideTotals`, `manualGross`, `manualNet`
) VALUES (
    3, 'emp-default', 'Marisol Hidalgo Barquero', '1-0938-0143', 'Ayudante de cocina', 2026, 3, '1', '01 al 15 de Marzo del 2026', 15, 'Marzo', 2026,
    1690.46, 2253.95, 104.00, 0.00, 16.00, 0.00, 0.00,
    175807.84, 0.00, 27047.36, 0.00, 0.00,
    0.00, 0.00, 0.00, 21970.61,
    202855.20, 21970.61, 180884.59, 1, 10.83, 0.00, 0, 0.00, 0.00
);

-- 4th voucher: April 2026 1st half (Exact Match with Image)
INSERT INTO `comprobantes` (
    `id`, `employeeId`, `employeeName`, `employeeIdCard`, `employeePosition`, `periodYear`, `periodMonth`, `fortnight`, `periodText`, `paymentDay`, `paymentMonthText`, `paymentYearText`,
    `hourlyRate`, `hourlyRateNocturna`, `hoursDiurnas`, `hoursNocturnas`, `hoursDescanso`, `hoursExtrasDiurnas`, `hoursExtrasNocturnas`,
    `valueDiurnas`, `valueNocturnas`, `valueDescanso`, `valueExtrasDiurnas`, `valueExtrasNocturnas`,
    `totalHolidays`, `totalOtherEarnings`, `totalOtherDeductions`, `ccssDeduction`,
    `totalGross`, `totalDeductions`, `netSalary`, `ccssAuto`, `ccssPercentage`, `ccssManualAmount`, `overrideTotals`, `manualGross`, `manualNet`
) VALUES (
    4, 'emp-default', 'Marisol Hidalgo Barquero', '1-0938-0143', 'Ayudante de cocina', 2026, 4, '1', '01 al 15 de Abril del 2026', 15, 'Abril', 2026,
    1690.46, 2253.95, 104.00, 0.00, 16.00, 0.00, 0.00,
    175807.84, 0.00, 27047.36, 0.00, 0.00,
    13523.68, 0.00, 27047.36, 23433.83,
    216378.88, 50481.19, 180885.98, 1, 10.83, 0.00, 1, 216378.88, 180885.98
);

-- Insert details for 4th voucher
INSERT INTO `comprobante_detalles` (`comprobanteId`, `conceptType`, `name`, `amount`) VALUES
(4, 'holiday', '11 de Abril', 13523.68),
(4, 'deduction', 'Rebajo', 13523.68),
(4, 'deduction', 'Permiso 4 de Abril', 13523.68);
