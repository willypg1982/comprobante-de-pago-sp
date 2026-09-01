# 📄 Sistema de Comprobantes de Pago y Planilla (Soda El Parque)

Sistema web completo para el cálculo de nómina quincenal, deducciones de ley de Costa Rica (CCSS), control de horas ordinarias diurnas/nocturnas, descansos, horas extras, feriados dobles (pago obligatorio), emisión de comprobantes de pago (original y patrono), gestión de vacaciones y cálculo de aguinaldo anual.

---

## 🚀 Características Principales

* **Cálculo de Nómina en Tiempo Real:** Cálculo automático de horas diurnas, nocturnas, descanso semanal, horas extras (x1.5) y feriados de pago obligatorio (x2.0).
* **Deducciones de Ley:** Deducción CCSS editable con recálculo dinámico.
* **Control de Quincenas:** Protección contra duplicados (máximo 1 comprobante por quincena por trabajador con confirmación de actualización).
* **Módulo de Vacaciones (🏖️):** Emisión y cálculo del comprobante oficial de disfrute y pago de vacaciones según Art. 153-161 del Código de Trabajo de Costa Rica.
* **Cálculo de Aguinaldo Anual (🎄):** Resumen acumulativo de todos los salarios brutos del año con desglose y fórmula legal ($\text{Total Devengado} \div 12$).
* **Personalización de Empresa:** Carga y almacenamiento del logotipo comercial en la base de datos y encabezados de comprobantes.
* **Diseño Responsivo e Impresión:** Compatible con pantallas móviles (vista emergente modal) y diseño de alta fidelidad listo para imprimir o exportar a PDF (formato Carta/A4).

---

## 🛠️ Tecnologías Utilizadas

* **Frontend:** HTML5, CSS3, JavaScript (Vanilla ES6+)
* **Backend:** Node.js, Express.js, REST API
* **Base de Datos:** MySQL / MariaDB (`soda_payroll`)
* **Contenedores:** Docker, Docker Compose

---

## 💻 Instalación y Ejecución

### Opción 1: Con Node.js y MySQL (XAMPP)

1. Inicia el servicio de **MySQL** en XAMPP.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor:
   ```bash
   npm start
   ```
4. Abre tu navegador en [http://localhost:3000](http://localhost:3000).

---

### Opción 2: Con Docker

Levanta la aplicación y la base de datos en contenedores aislados con un solo comando:
```bash
docker compose up -d --build
```
Accede a [http://localhost:3000](http://localhost:3000).

---

## 📂 Estructura del Proyecto

```text
├── index.html           # Interfaz de usuario y plantilla de comprobantes
├── styles.css           # Estilos visuales, temas claro/oscuro e impresión
├── app.js               # Lógica de cálculo de nómina y frontend
├── server.js            # Servidor backend con endpoints REST
├── schema.sql           # Script de creación y estructura de Base de Datos
├── Dockerfile           # Imagen Docker para el servidor
├── docker-compose.yml   # Orquestación de App + Base de Datos MySQL
├── package.json         # Dependencias de npm
└── README.md            # Documentación del proyecto
```

---

## 📄 Licencia
Este proyecto es de uso privado y comercial para la administración de nómina de Soda El Parque.
