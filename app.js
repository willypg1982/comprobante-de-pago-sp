// Costa Rican Month Names Helper
const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"
];

// Backend API URL configuration
const API_URL = "http://localhost:3000/api";
let isServerOnline = false;

// Default Receipt Values matching the original image exactly
const IMAGE_DEFAULTS = {
    companyName: "Soda El Parqueo",
    employerName: "Gerardo Pineda Chaves",
    companyId: "1-0938-0143",
    companyPhone: "2250-1234",
    companyCity: "San José, Costa Rica",
    
    employeeName: "Marisol Hidalgo Barquero",
    employeeId: "1-0938-0143",
    employeePosition: "Ayudante de cocina",
    hourlyRate: 1690.46,
    hourlyRateNocturna: 2253.95,
    
    periodYear: 2026,
    periodMonth: 4, // April
    fortnight: "1", // 1st half
    periodText: "01 al 15 de Abril del 2026",
    paymentDay: 15,
    paymentMonthText: "Abril",
    paymentYearText: 2026,
    
    hoursDiurnas: 104,
    hoursNocturnas: 0,
    hoursDescanso: 16,
    hoursExtrasDiurnas: 0,
    hoursExtrasNocturnas: 0,
    hoursFeriadoDoble: 0,
    
    holidays: [
        { name: "Feriado 11 de Abril", amount: 13523.68 }
    ],
    earnings: [],
    
    ccssAuto: true,
    ccssPercentage: 10.83,
    ccssManualAmount: 0,
    
    deductions: [
        { name: "Rebajo", amount: 13523.68 },
        { name: "Permiso 4 de Abril", amount: 13523.68 }
    ],
    
    overrideTotals: false,
    manualGross: 216378.88,
    manualNet: 180885.98
};

// Default profile for system load if no profiles exist
const DEFAULT_EMPLOYEE = {
    id: "emp-default",
    employeeName: "Marisol Hidalgo Barquero",
    employeeId: "1-0938-0143",
    employeePosition: "Ayudante de cocina",
    hourlyRate: 1690.46,
    hourlyRateNocturna: 2253.95,
    
    hoursDiurnas: 104,
    hoursNocturnas: 0,
    hoursDescanso: 16,
    hoursExtrasDiurnas: 0,
    hoursExtrasNocturnas: 0,
    hoursFeriadoDoble: 0,
    
    holidays: [
        { name: "Feriado 11 de Abril", amount: 13523.68, hours: 8 }
    ],
    earnings: [],
    
    ccssAuto: true,
    ccssPercentage: 10.83,
    ccssManualAmount: 0,
    
    deductions: [
        { name: "Rebajo", amount: 13523.68 },
        { name: "Permiso 4 de Abril", amount: 13523.68 }
    ],
    
    overrideTotals: false,
    manualGross: 216378.88,
    manualNet: 180885.98
};

// Global State
let employees = [];
let activeEmployeeId = "";
let localVouchersHistory = []; // Fallback local history

// Initialize Application
document.addEventListener("DOMContentLoaded", async () => {
    initThemes();
    initTabs();
    initDynamicLists();
    
    // Check server status first and then load data
    await checkServerStatus();
    
    await initEmployees(); // Sets up employee profile database & dropdown selector
    initEventListeners();
    
    calculatePayroll();
    
    // Auto load history on startup
    loadVouchersHistory();
});

// Check Server Status
async function checkServerStatus() {
    const statusIndicator = document.getElementById("statusIndicator");
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        
        const res = await fetch(`${API_URL}/empresa`, { 
            method: "GET",
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        isServerOnline = res.ok;
    } catch (e) {
        isServerOnline = false;
    }
    
    if (statusIndicator) {
        if (isServerOnline) {
            statusIndicator.textContent = "MySQL";
            statusIndicator.style.background = "#10b981"; // Success green
        } else {
            statusIndicator.textContent = "Local";
            statusIndicator.style.background = "#64748b"; // Neutral slate
        }
    }
}

// Theme Management (Light / Dark Mode)
function initThemes() {
    const themeToggle = document.getElementById("themeToggle");
    const sunIcon = themeToggle.querySelector(".sun-icon");
    const moonIcon = themeToggle.querySelector(".moon-icon");
    
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcons(savedTheme);
    
    themeToggle.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        updateThemeIcons(newTheme);
    });
    
    function updateThemeIcons(theme) {
        if (theme === "dark") {
            sunIcon.classList.add("hidden");
            moonIcon.classList.remove("hidden");
        } else {
            sunIcon.classList.remove("hidden");
            moonIcon.classList.add("hidden");
        }
    }
}

// Tab Switching Mechanism
function initTabs() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanes = document.querySelectorAll(".tab-pane");
    
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tabButtons.forEach(b => b.classList.remove("active"));
            tabPanes.forEach(p => p.classList.remove("active"));
            
            btn.classList.add("active");
            const targetTab = btn.getAttribute("data-tab");
            document.getElementById(targetTab).classList.add("active");
            
            // Trigger specific actions when switching tabs
            if (targetTab === "tab-historial") {
                loadVouchersHistory();
            } else if (targetTab === "tab-aguinaldo") {
                calculateAguinaldo();
            } else if (targetTab === "tab-vacaciones") {
                const hourlyRate = parseFloat(document.getElementById("hourlyRate")?.value) || 1690.46;
                const dailyRateInput = document.getElementById("vacationDailyRate");
                if (dailyRateInput) {
                    dailyRateInput.value = (hourlyRate * 8).toFixed(2);
                }
                const daysInput = document.getElementById("vacationDays");
                if (daysInput && (!daysInput.value || parseFloat(daysInput.value) <= 0 || daysInput.value === "14")) {
                    daysInput.value = 15;
                }
                calculateVacations();
                renderVacationVoucherToSheet();
            } else if (targetTab === "tab-generar") {
                calculatePayroll();
            }
        });
    });
}

// Multi-Employee Profile Initialization
async function initEmployees() {
    // Try online sync first
    if (isServerOnline) {
        try {
            const res = await fetch(`${API_URL}/empleados`);
            if (res.ok) {
                employees = await res.json();
                console.log("Employees synced from backend:", employees);
            }
        } catch (e) {
            console.error("Backend fetch employees failed, falling back to localStorage", e);
        }
    }
    
    // Offline fallback or empty backend
    if (!employees || employees.length === 0) {
        const savedEmployees = localStorage.getItem("soda_employees");
        if (savedEmployees) {
            try {
                employees = JSON.parse(savedEmployees);
            } catch (e) {
                console.error("Fallo al decodificar lista de empleados", e);
                employees = [];
            }
        }
        
        if (employees.length === 0) {
            employees = [JSON.parse(JSON.stringify(DEFAULT_EMPLOYEE))];
            localStorage.setItem("soda_employees", JSON.stringify(employees));
        }
    }
    
    // Load active employee ID
    activeEmployeeId = localStorage.getItem("soda_active_employee_id");
    if (!activeEmployeeId || !employees.some(emp => emp.id === activeEmployeeId)) {
        activeEmployeeId = employees[0].id;
        localStorage.setItem("soda_active_employee_id", activeEmployeeId);
    }
    
    // Load global company and period details
    await loadGlobalData();
    
    // Render Selector Dropdown Options
    renderEmployeeSelect();
    
    // Populate Active Employee Profile to UI
    loadEmployeeProfile(activeEmployeeId);
}

// Populate / Refresh employee dropdown
function renderEmployeeSelect() {
    const select = document.getElementById("employeeProfileSelect");
    if (!select) return;
    
    select.innerHTML = "";
    employees.forEach(emp => {
        const option = document.createElement("option");
        option.value = emp.id;
        option.textContent = emp.employeeName || "Sin Nombre";
        if (emp.id === activeEmployeeId) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

// Load Employee Profile into inputs
function loadEmployeeProfile(empId) {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    
    activeEmployeeId = empId;
    localStorage.setItem("soda_active_employee_id", activeEmployeeId);
    
    // Worker demographics
    document.getElementById("employeeName").value = emp.employeeName ?? "";
    document.getElementById("employeeId").value = emp.employeeId ?? "";
    document.getElementById("employeePosition").value = emp.employeePosition ?? "";
    document.getElementById("hourlyRate").value = emp.hourlyRate ?? 0;
    document.getElementById("hourlyRateNocturna").value = emp.hourlyRateNocturna ?? 0;
    
    // Hourly components
    document.getElementById("hoursDiurnas").value = emp.hoursDiurnas ?? 0;
    document.getElementById("hoursNocturnas").value = emp.hoursNocturnas ?? 0;
    document.getElementById("hoursDescanso").value = emp.hoursDescanso ?? 0;
    document.getElementById("hoursExtrasDiurnas").value = emp.hoursExtrasDiurnas ?? 0;
    document.getElementById("hoursExtrasNocturnas").value = emp.hoursExtrasNocturnas ?? 0;
    if (document.getElementById("hoursFeriadoDoble")) {
        document.getElementById("hoursFeriadoDoble").value = emp.hoursFeriadoDoble ?? 0;
    }
    
    // CCSS calculations settings
    document.getElementById("ccssAuto").checked = emp.ccssAuto ?? true;
    document.getElementById("ccssPercentage").value = emp.ccssPercentage ?? 10.83;
    document.getElementById("ccssManualAmount").value = emp.ccssManualAmount ?? 0;
    
    // Total overrides - always default to false so calculations update live in real-time
    const shouldOverride = (emp.id !== 'emp-default' && emp.overrideTotals === true);
    document.getElementById("overrideTotals").checked = shouldOverride;
    document.getElementById("manualGross").value = emp.manualGross ?? 0;
    document.getElementById("manualNet").value = emp.manualNet ?? 0;
    
    // Clear list boxes
    document.getElementById("holidaysList").innerHTML = "";
    document.getElementById("earningsList").innerHTML = "";
    document.getElementById("deductionsList").innerHTML = "";
    
    // Re-fill list items
    // If it comes from server, ccssAuto and other booleans might be 1/0 numbers, let's normalize
    if (typeof emp.ccssAuto === 'number') emp.ccssAuto = emp.ccssAuto === 1;
    emp.overrideTotals = shouldOverride;
    
    // Parse strings if server returned them inside properties
    let hList = emp.holidays;
    let eList = emp.earnings;
    let dList = emp.deductions;
    
    if (typeof hList === 'string') {
        try { hList = JSON.parse(hList); } catch(e) { hList = []; }
    }
    if (typeof eList === 'string') {
        try { eList = JSON.parse(eList); } catch(e) { eList = []; }
    }
    if (typeof dList === 'string') {
        try { dList = JSON.parse(dList); } catch(e) { dList = []; }
    }
    
    if (hList) {
        hList.forEach(h => addDynamicRow("holidaysList", h.name, h.amount, "h", h.hours || ""));
    }
    if (eList) {
        eList.forEach(e => addDynamicRow("earningsList", e.name, e.amount, "e", e.hours || ""));
    }
    if (dList) {
        dList.forEach(d => addDynamicRow("deductionsList", d.name, d.amount, "d"));
    }
    
    toggleCcssGroup();
    toggleOverrideGroup();
}

// Save Current Employee Profile
async function saveCurrentEmployeeProfile() {
    if (!activeEmployeeId) return;
    
    const idx = employees.findIndex(e => e.id === activeEmployeeId);
    if (idx === -1) return;
    
    const updatedEmployee = {
        id: activeEmployeeId,
        employeeName: document.getElementById("employeeName").value,
        employeeId: document.getElementById("employeeId").value,
        employeePosition: document.getElementById("employeePosition").value,
        hourlyRate: parseFloat(document.getElementById("hourlyRate").value) || 0,
        hourlyRateNocturna: parseFloat(document.getElementById("hourlyRateNocturna").value) || 0,
        
        hoursDiurnas: parseFloat(document.getElementById("hoursDiurnas").value) || 0,
        hoursNocturnas: parseFloat(document.getElementById("hoursNocturnas").value) || 0,
        hoursDescanso: parseFloat(document.getElementById("hoursDescanso").value) || 0,
        hoursExtrasDiurnas: parseFloat(document.getElementById("hoursExtrasDiurnas").value) || 0,
        hoursExtrasNocturnas: parseFloat(document.getElementById("hoursExtrasNocturnas").value) || 0,
        hoursFeriadoDoble: parseFloat(document.getElementById("hoursFeriadoDoble")?.value) || 0,
        
        ccssAuto: document.getElementById("ccssAuto").checked,
        ccssPercentage: parseFloat(document.getElementById("ccssPercentage").value) || 10.83,
        ccssManualAmount: parseFloat(document.getElementById("ccssManualAmount").value) || 0,
        
        overrideTotals: document.getElementById("overrideTotals").checked,
        manualGross: parseFloat(document.getElementById("manualGross").value) || 0,
        manualNet: parseFloat(document.getElementById("manualNet").value) || 0,
        
        holidays: Array.from(document.querySelectorAll("#holidaysList .dynamic-row")).map(row => {
            const hoursVal = row.querySelector(".h-hours") ? parseFloat(row.querySelector(".h-hours").value) : 0;
            return {
                name: row.querySelector(".h-name").value,
                amount: parseFloat(row.querySelector(".h-amount").value) || 0,
                hours: isNaN(hoursVal) ? 0 : hoursVal
            };
        }),
        earnings: Array.from(document.querySelectorAll("#earningsList .dynamic-row")).map(row => {
            const hoursVal = row.querySelector(".e-hours") ? parseFloat(row.querySelector(".e-hours").value) : 0;
            return {
                name: row.querySelector(".e-name").value,
                amount: parseFloat(row.querySelector(".e-amount").value) || 0,
                hours: isNaN(hoursVal) ? 0 : hoursVal
            };
        }),
        deductions: Array.from(document.querySelectorAll("#deductionsList .dynamic-row")).map(row => ({
            name: row.querySelector(".d-name").value,
            amount: parseFloat(row.querySelector(".d-amount").value) || 0
        }))
    };
    
    employees[idx] = updatedEmployee;
    
    // Save locally
    localStorage.setItem("soda_employees", JSON.stringify(employees));
    
    // Save to server if online
    if (isServerOnline) {
        try {
            await fetch(`${API_URL}/empleados/${activeEmployeeId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedEmployee)
            });
        } catch (e) {
            console.error("Failed to sync employee update to backend:", e);
        }
    }
    
    renderEmployeeSelect();
}

// Create New Employee Profile
async function createNewEmployee() {
    const newEmpName = prompt("Ingrese el nombre del nuevo empleado:", "Nuevo Empleado");
    if (newEmpName === null) return; // Prompt cancelled
    
    const name = newEmpName.trim() || "Nuevo Empleado";
    const newEmp = {
        id: "emp-" + Date.now(),
        employeeName: name,
        employeeId: "",
        employeePosition: "Puesto",
        hourlyRate: 0,
        hourlyRateNocturna: 0,
        hoursDiurnas: 0,
        hoursNocturnas: 0,
        hoursDescanso: 0,
        hoursExtrasDiurnas: 0,
        hoursExtrasNocturnas: 0,
        holidays: [],
        earnings: [],
        ccssAuto: true,
        ccssPercentage: 10.83,
        ccssManualAmount: 0,
        deductions: [],
        overrideTotals: false,
        manualGross: 0,
        manualNet: 0
    };
    
    employees.push(newEmp);
    localStorage.setItem("soda_employees", JSON.stringify(employees));
    
    if (isServerOnline) {
        try {
            await fetch(`${API_URL}/empleados`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newEmp)
            });
        } catch (e) {
            console.error("Failed to save new employee to backend:", e);
        }
    }
    
    activeEmployeeId = newEmp.id;
    localStorage.setItem("soda_active_employee_id", activeEmployeeId);
    
    loadEmployeeProfile(newEmp.id);
    calculatePayroll();
    
    // Switch view to Worker demographic tab to fill out ID, Rate etc
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanes = document.querySelectorAll(".tab-pane");
    tabButtons.forEach(b => b.classList.remove("active"));
    tabPanes.forEach(p => p.classList.remove("active"));
    
    const trabBtn = Array.from(tabButtons).find(b => b.getAttribute("data-tab") === "tab-trabajador");
    if (trabBtn) trabBtn.classList.add("active");
    const trabPane = document.getElementById("tab-trabajador");
    if (trabPane) trabPane.classList.add("active");
}

// Delete Employee Profile
async function deleteActiveEmployee() {
    if (employees.length <= 1) {
        alert("Debe haber al menos un perfil de empleado registrado.");
        return;
    }
    
    const activeEmp = employees.find(e => e.id === activeEmployeeId);
    if (!activeEmp) return;
    
    if (confirm(`¿Está seguro de que desea eliminar el perfil de "${activeEmp.employeeName}"?`)) {
        const idToDelete = activeEmployeeId;
        
        employees = employees.filter(e => e.id !== idToDelete);
        localStorage.setItem("soda_employees", JSON.stringify(employees));
        
        if (isServerOnline) {
            try {
                await fetch(`${API_URL}/empleados/${idToDelete}`, {
                    method: "DELETE"
                });
            } catch (e) {
                console.error("Failed to delete employee from backend:", e);
            }
        }
        
        activeEmployeeId = employees[0].id;
        localStorage.setItem("soda_active_employee_id", activeEmployeeId);
        
        loadEmployeeProfile(activeEmployeeId);
        calculatePayroll();
    }
}

// Company Logo Global State & UI Updater
let currentCompanyLogo = null;

function updateCompanyLogoUI(logoDataUrl) {
    currentCompanyLogo = logoDataUrl;
    
    const logoImg = document.getElementById("companyLogoImg");
    const logoPlaceholder = document.getElementById("companyLogoPlaceholder");
    const btnRemove = document.getElementById("btnRemoveLogo");
    
    if (logoImg && logoPlaceholder) {
        if (logoDataUrl) {
            logoImg.src = logoDataUrl;
            logoImg.style.display = "block";
            logoPlaceholder.style.display = "none";
            if (btnRemove) btnRemove.style.display = "inline-block";
        } else {
            logoImg.src = "";
            logoImg.style.display = "none";
            logoPlaceholder.style.display = "block";
            if (btnRemove) btnRemove.style.display = "none";
            const fileInput = document.getElementById("companyLogoInput");
            if (fileInput) fileInput.value = "";
        }
    }
    
    // Update Voucher Preview Headers
    const voucherLogos = [document.getElementById("p-companyLogo"), document.getElementById("p-dup-companyLogo")];
    voucherLogos.forEach(img => {
        if (img) {
            if (logoDataUrl) {
                img.src = logoDataUrl;
                img.style.display = "block";
            } else {
                img.src = "";
                img.style.display = "none";
            }
        }
    });
}

// Save global business config
async function saveGlobalData() {
    const globalData = {
        companyName: document.getElementById("companyName").value,
        employerName: document.getElementById("employerName").value,
        companyId: document.getElementById("companyId").value,
        companyPhone: document.getElementById("companyPhone").value,
        companyCity: document.getElementById("companyCity").value,
        logo: currentCompanyLogo,
        
        periodYear: document.getElementById("periodYear").value,
        periodMonth: document.getElementById("periodMonth").value,
        fortnight: document.querySelector("input[name='fortnight']:checked")?.value || "1",
        periodText: document.getElementById("periodText").value,
        paymentDay: document.getElementById("paymentDay").value,
        paymentMonthText: document.getElementById("paymentMonthText").value,
        paymentYearText: document.getElementById("paymentYearText").value,
    };
    
    localStorage.setItem("soda_global_data", JSON.stringify(globalData));
    if (currentCompanyLogo) {
        localStorage.setItem("soda_company_logo", currentCompanyLogo);
    } else {
        localStorage.removeItem("soda_company_logo");
    }
    
    if (isServerOnline) {
        try {
            await fetch(`${API_URL}/empresa`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(globalData)
            });
        } catch (e) {
            console.error("Failed to save company settings to backend:", e);
        }
    }
}

// Load global business config
async function loadGlobalData() {
    let data;
    if (isServerOnline) {
        try {
            const res = await fetch(`${API_URL}/empresa`);
            if (res.ok) {
                data = await res.json();
            }
        } catch (e) {
            console.error("Failed to load company config from server", e);
        }
    }
    
    if (!data) {
        const raw = localStorage.getItem("soda_global_data");
        if (raw) {
            try {
                data = JSON.parse(raw);
            } catch(e) {}
        }
    }
    
    if (data) {
        if (data.companyName) document.getElementById("companyName").value = data.companyName;
        if (data.employerName) document.getElementById("employerName").value = data.employerName;
        if (data.companyId) document.getElementById("companyId").value = data.companyId;
        if (data.companyPhone) document.getElementById("companyPhone").value = data.companyPhone;
        if (data.companyCity) document.getElementById("companyCity").value = data.companyCity;
        
        const logoToRestore = data.logo || localStorage.getItem("soda_company_logo");
        if (logoToRestore) {
            updateCompanyLogoUI(logoToRestore);
        } else {
            updateCompanyLogoUI(null);
        }
        
        if (data.periodYear) document.getElementById("periodYear").value = data.periodYear;
        if (data.periodMonth) document.getElementById("periodMonth").value = data.periodMonth;
        
        if (data.fortnight) {
            const radio = document.querySelector(`input[name="fortnight"][value="${data.fortnight}"]`);
            if (radio) radio.checked = true;
        }
        
        if (data.periodText && data.periodText.trim() !== "") {
            document.getElementById("periodText").value = data.periodText;
        }
        if (data.paymentDay) document.getElementById("paymentDay").value = data.paymentDay;
        if (data.paymentMonthText && data.paymentMonthText.trim() !== "") {
            document.getElementById("paymentMonthText").value = data.paymentMonthText;
        }
        if (data.paymentYearText) document.getElementById("paymentYearText").value = data.paymentYearText;
    }
    
    // Always guarantee periodText and payment dates are computed if empty
    if (!document.getElementById("periodText").value || document.getElementById("periodText").value.trim() === "") {
        generatePeriodDates();
    }
}

// Modal Popup Management for Mobile / Review
function openVoucherModal() {
    const modal = document.getElementById("voucherModal");
    const container = document.getElementById("modalVoucherContainer");
    const printSheet = document.getElementById("printSheet");
    if (!modal || !container || !printSheet) return;
    
    // Copy the rendered voucher sheet into the modal
    container.innerHTML = printSheet.outerHTML;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden"; // Prevent background scrolling
}

function closeVoucherModal() {
    const modal = document.getElementById("voucherModal");
    if (modal) {
        modal.classList.add("hidden");
    }
    document.body.style.overflow = ""; // Restore scrolling
}

// Save generated voucher to Database and present voucher to user
async function saveVoucherToBackend() {
    // 1. Recalculate payroll to ensure all current form inputs are synced
    calculatePayroll();
    
    let employee = employees.find(e => e.id === activeEmployeeId);
    if (!employee && employees.length > 0) {
        employee = employees[0];
        activeEmployeeId = employee.id;
    }
    
    const payrollDetails = getPayrollDetails();
    
    // Prepare the unified list of concepts
    const concepts = [];
    payrollDetails.holidaysData.forEach(h => {
        concepts.push({ 
            conceptType: 'holiday', 
            name: h.name, 
            amount: h.amount,
            hours: h.hours || null,
            rate: h.hours > 0 ? payrollDetails.hourlyRate : null
        });
    });
    payrollDetails.earningsData.forEach(e => {
        concepts.push({ 
            conceptType: 'earning', 
            name: e.name, 
            amount: e.amount,
            hours: e.hours || null,
            rate: e.hours > 0 ? payrollDetails.hourlyRate : null
        });
    });
    payrollDetails.deductionsData.forEach(d => {
        concepts.push({ conceptType: 'deduction', name: d.name, amount: d.amount });
    });
    
    const voucherData = {
        employeeId: activeEmployeeId || "emp-default",
        employeeName: payrollDetails.employeeName || document.getElementById("employeeName")?.value || "Empleado",
        employeeIdCard: payrollDetails.employeeId || document.getElementById("employeeId")?.value || "",
        employeePosition: payrollDetails.employeePosition || document.getElementById("employeePosition")?.value || "Puesto",
        periodYear: parseInt(document.getElementById("periodYear").value) || new Date().getFullYear(),
        periodMonth: parseInt(document.getElementById("periodMonth").value) || (new Date().getMonth() + 1),
        fortnight: document.querySelector("input[name='fortnight']:checked")?.value || "1",
        periodText: payrollDetails.periodText,
        paymentDay: parseInt(payrollDetails.paymentDay) || 15,
        paymentMonthText: payrollDetails.paymentMonthText,
        paymentYearText: parseInt(payrollDetails.paymentYearText) || new Date().getFullYear(),
        
        hourlyRate: payrollDetails.hourlyRate,
        hourlyRateNocturna: payrollDetails.hourlyRateNocturna,
        hoursDiurnas: payrollDetails.hoursDiurnas,
        hoursNocturnas: payrollDetails.hoursNocturnas,
        hoursDescanso: payrollDetails.hoursDescanso,
        hoursExtrasDiurnas: payrollDetails.hoursExtrasDiurnas,
        hoursExtrasNocturnas: payrollDetails.hoursExtrasNocturnas,
        hoursFeriadoDoble: payrollDetails.hoursFeriadoDoble,
        
        valueDiurnas: payrollDetails.valueDiurnas,
        valueNocturnas: payrollDetails.valueNocturnas,
        valueDescanso: payrollDetails.valueDescanso,
        valueExtrasDiurnas: payrollDetails.valueExtrasDiurnas,
        valueExtrasNocturnas: payrollDetails.valueExtrasNocturnas,
        valueFeriadoDoble: payrollDetails.valueFeriadoDoble,
        
        totalHolidays: payrollDetails.totalHolidays,
        totalOtherEarnings: payrollDetails.totalOtherEarnings,
        totalOtherDeductions: payrollDetails.totalOtherDeductions,
        ccssDeduction: payrollDetails.ccssDeduction,
        
        totalGross: payrollDetails.finalGross,
        totalDeductions: payrollDetails.finalDeductions,
        netSalary: payrollDetails.finalNet,
        
        ccssAuto: payrollDetails.ccssAuto ? 1 : 0,
        ccssPercentage: payrollDetails.ccssPercentage,
        ccssManualAmount: payrollDetails.ccssManualAmount,
        overrideTotals: payrollDetails.overrideTotals ? 1 : 0,
        manualGross: payrollDetails.manualGross,
        manualNet: payrollDetails.manualNet,
        
        concepts: concepts
    };
    
    // 2. Trigger visual highlight animation on the voucher sheet
    const printSheet = document.getElementById("printSheet");
    if (printSheet) {
        printSheet.classList.remove("voucher-highlight-active");
        void printSheet.offsetWidth; // Trigger reflow
        printSheet.classList.add("voucher-highlight-active");
        setTimeout(() => printSheet.classList.remove("voucher-highlight-active"), 900);
    }
    
    // 3. Check for existing voucher in this fortnight for this employee (Max 1 per fortnight)
    let existingVoucher = null;
    
    if (isServerOnline) {
        try {
            const checkRes = await fetch(`${API_URL}/comprobantes`);
            if (checkRes.ok) {
                const allVouchers = await checkRes.json();
                existingVoucher = allVouchers.find(v => 
                    v.employeeId === voucherData.employeeId &&
                    parseInt(v.periodYear) === voucherData.periodYear &&
                    parseInt(v.periodMonth) === voucherData.periodMonth &&
                    String(v.fortnight) === String(voucherData.fortnight)
                );
            }
        } catch (e) {}
    }
    
    if (!existingVoucher) {
        const savedLocal = localStorage.getItem("soda_vouchers") || "[]";
        const localHistory = JSON.parse(savedLocal);
        existingVoucher = localHistory.find(v => 
            v.employeeId === voucherData.employeeId &&
            parseInt(v.periodYear) === voucherData.periodYear &&
            parseInt(v.periodMonth) === voucherData.periodMonth &&
            String(v.fortnight) === String(voucherData.fortnight)
        );
    }
    
    let isReplacing = false;
    if (existingVoucher) {
        const fortnightText = voucherData.fortnight === "1" ? "1ra Quincena" : "2da Quincena";
        const confirmUpdate = confirm(
            `⚠️ Ya existe un comprobante generado para ${voucherData.employeeName} en la ${fortnightText} de ${voucherData.paymentMonthText} del ${voucherData.periodYear}.\n\n` +
            `¿Deseas ACTUALIZARLO y REEMPLAZAR el comprobante anterior con los nuevos datos calculados?`
        );
        if (!confirmUpdate) {
            alert("Operación cancelada. El comprobante anterior se mantiene sin cambios.");
            return;
        }
        isReplacing = true;
        voucherData.allowUpdate = true;
    }
    
    // 4. Save to Database or LocalStorage
    if (isServerOnline) {
        try {
            const res = await fetch(`${API_URL}/comprobantes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(voucherData)
            });
            if (res.ok) {
                const ret = await res.json();
                alert(`✅ ¡${ret.message} (ID: ${ret.id})!`);
                loadVouchersHistory();
                if (window.innerWidth <= 768) {
                    openVoucherModal();
                }
                return;
            } else if (res.status === 409) {
                const errData = await res.json();
                alert(`⚠️ ${errData.message}`);
                return;
            }
        } catch (e) {
            console.error("Failed to save voucher to server, falling back to LocalStorage", e);
        }
    }
    
    // Save to LocalStorage history fallback
    const savedLocal = localStorage.getItem("soda_vouchers") || "[]";
    const history = JSON.parse(savedLocal);
    
    const existingIndex = history.findIndex(v => 
        v.employeeId === voucherData.employeeId &&
        parseInt(v.periodYear) === voucherData.periodYear &&
        parseInt(v.periodMonth) === voucherData.periodMonth &&
        String(v.fortnight) === String(voucherData.fortnight)
    );
    
    if (existingIndex !== -1) {
        voucherData.id = history[existingIndex].id;
        voucherData.createdAt = new Date().toISOString();
        history[existingIndex] = voucherData;
        alert(`✅ ¡Comprobante para ${voucherData.employeeName} actualizado y reemplazado con éxito!`);
    } else {
        voucherData.id = "local-" + Date.now();
        voucherData.createdAt = new Date().toISOString();
        history.unshift(voucherData); // Add at start
        alert(`✅ ¡Comprobante de pago para ${voucherData.employeeName} generado y guardado con éxito!`);
    }
    
    localStorage.setItem("soda_vouchers", JSON.stringify(history));
    loadVouchersHistory();
    
    // If on mobile, open popup modal to review
    if (window.innerWidth <= 768) {
        openVoucherModal();
    }
}

// Fetch generated history & render list
async function loadVouchersHistory() {
    const list = document.getElementById("historyListContainer");
    if (!list) return;
    
    let history = [];
    
    if (isServerOnline) {
        try {
            const res = await fetch(`${API_URL}/comprobantes`);
            if (res.ok) {
                history = await res.json();
            }
        } catch (e) {
            console.error("Failed to load history from backend", e);
        }
    }
    
    // Offline fallback or empty DB
    if (history.length === 0) {
        const savedLocal = localStorage.getItem("soda_vouchers") || "[]";
        history = JSON.parse(savedLocal);
    }
    
    list.innerHTML = "";
    
    if (history.length === 0) {
        list.innerHTML = `<p style="font-size: 0.85rem; text-align: center; color: var(--text-muted); padding: 1.5rem;">No hay comprobantes registrados aún.</p>`;
        return;
    }
    
    let historyModified = false;
    history.forEach(item => {
        // Auto-fix period text if missing or empty
        if (!item.periodText || String(item.periodText).trim() === "" || item.periodText === "undefined") {
            const fText = String(item.fortnight) === "1" ? "01 al 15" : "16 al fin de mes";
            const mName = item.paymentMonthText || (MONTHS && item.periodMonth ? MONTHS[item.periodMonth - 1] : "Mes");
            const yVal = item.periodYear || item.paymentYearText || 2026;
            item.periodText = `${fText} de ${mName} del ${yVal}`;
            historyModified = true;
        }
        
        const row = document.createElement("div");
        row.className = "card";
        row.style.padding = "0.85rem";
        row.style.gap = "0.45rem";
        row.style.fontSize = "0.85rem";
        row.style.background = "var(--bg-input)";
        row.style.border = "1px solid var(--border-color)";
        row.style.borderRadius = "8px";
        
        row.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-weight:700; font-size:0.9rem;">
                <span>${item.employeeName}</span>
                <span style="color:var(--primary-color)">₡${formatColones(item.netSalary)}</span>
            </div>
            <div style="color:var(--text-main); font-size:0.8rem; font-weight:600; margin: 0.15rem 0;">
                📅 <span style="color:var(--text-muted); font-weight:normal;">Período:</span> ${item.periodText}
            </div>
            <div style="display:flex; gap:0.5rem; margin-top:0.4rem;">
                <button type="button" class="btn btn-primary btn-xs" onclick="previewVoucherFromHistory('${item.id}')" style="flex:1;">
                    👁️ Vista Previa
                </button>
                <button type="button" class="btn btn-secondary btn-xs" onclick="printVoucherFromHistory('${item.id}')" style="flex:1;">
                    🖨️ Re-Imprimir
                </button>
            </div>
        `;
        list.appendChild(row);
    });
    
    if (historyModified && !isServerOnline) {
        localStorage.setItem("soda_vouchers", JSON.stringify(history));
    }
}

// Fetch a single past voucher and load it inside the interactive preview sheet
window.previewVoucherFromHistory = async function(id) {
    let voucher;
    
    // Check if it's a local storage mock or standard DB int id
    if (String(id).startsWith("local-")) {
        const savedLocal = localStorage.getItem("soda_vouchers") || "[]";
        const history = JSON.parse(savedLocal);
        voucher = history.find(v => String(v.id) === String(id));
    } else if (isServerOnline) {
        try {
            const res = await fetch(`${API_URL}/comprobantes/${id}`);
            if (res.ok) {
                voucher = await res.json();
            }
        } catch(e) {
            console.error("Failed to fetch receipt from server", e);
        }
    }
    
    if (!voucher) {
        alert("No se pudo cargar el comprobante seleccionado.");
        return;
    }
    
    renderPastVoucherToSheet(voucher);
    if (window.innerWidth <= 768) {
        openVoucherModal();
    } else {
        alert(`Comprobante de ${voucher.employeeName} para el período (${voucher.periodText}) cargado en la vista previa.`);
    }
};

window.printVoucherFromHistory = async function(id) {
    await window.previewVoucherFromHistory(id);
    window.print();
};

// Helper to render historical data directly inside the output print nodes
function renderPastVoucherToSheet(voucher) {
    // Guarantee periodText and dates are valid
    if (!voucher.periodText || String(voucher.periodText).trim() === "" || voucher.periodText === "undefined") {
        const fText = String(voucher.fortnight) === "1" ? "01 al 15" : "16 al fin de mes";
        const mName = voucher.paymentMonthText || (MONTHS && voucher.periodMonth ? MONTHS[voucher.periodMonth - 1] : "Mes");
        const yVal = voucher.periodYear || voucher.paymentYearText || 2026;
        voucher.periodText = `${fText} de ${mName} del ${yVal}`;
        voucher.paymentMonthText = mName;
        voucher.paymentYearText = yVal;
        voucher.paymentDay = String(voucher.fortnight) === "1" ? 15 : 30;
    }

    const tableBodyOriginal = document.getElementById("p-table-body");
    const tableBodyDuplicate = document.getElementById("p-dup-table-body");
    
    let tableHtml = "";
    
    // Build table rows
    if (parseFloat(voucher.hoursDiurnas) > 0) {
        tableHtml += `
            <tr>
                <td>Horas Ordinarias Diurnas</td>
                <td class="text-right">${voucher.hoursDiurnas}</td>
                <td class="text-right">₡${formatColones(voucher.hourlyRate)}</td>
                <td class="text-right text-success">₡${formatColones(voucher.valueDiurnas)}</td>
                <td class="text-right">-</td>
            </tr>
        `;
    }
    
    if (parseFloat(voucher.hoursNocturnas) > 0) {
        tableHtml += `
            <tr>
                <td>Horas Ordinarias Nocturnas</td>
                <td class="text-right">${voucher.hoursNocturnas}</td>
                <td class="text-right">₡${formatColones(voucher.hourlyRateNocturna)}</td>
                <td class="text-right text-success">₡${formatColones(voucher.valueNocturnas)}</td>
                <td class="text-right">-</td>
            </tr>
        `;
    }
    
    if (parseFloat(voucher.hoursDescanso) > 0) {
        tableHtml += `
            <tr>
                <td>Descanso Quincenal Autorizado</td>
                <td class="text-right">${voucher.hoursDescanso}</td>
                <td class="text-right">₡${formatColones(voucher.hourlyRate)}</td>
                <td class="text-right text-success">₡${formatColones(voucher.valueDescanso)}</td>
                <td class="text-right">-</td>
            </tr>
        `;
    }
    
    if (parseFloat(voucher.hoursExtrasDiurnas) > 0) {
        tableHtml += `
            <tr>
                <td>Horas Extras Diurnas (x1.5)</td>
                <td class="text-right">${voucher.hoursExtrasDiurnas}</td>
                <td class="text-right">₡${formatColones(voucher.hourlyRate * 1.5)}</td>
                <td class="text-right text-success">₡${formatColones(voucher.valueExtrasDiurnas)}</td>
                <td class="text-right">-</td>
            </tr>
        `;
    }
    
    if (parseFloat(voucher.hoursExtrasNocturnas) > 0) {
        tableHtml += `
            <tr>
                <td>Horas Extras Nocturnas (x1.5)</td>
                <td class="text-right">${voucher.hoursExtrasNocturnas}</td>
                <td class="text-right">₡${formatColones(voucher.hourlyRateNocturna * 1.5)}</td>
                <td class="text-right text-success">₡${formatColones(voucher.valueExtrasNocturnas)}</td>
                <td class="text-right">-</td>
            </tr>
        `;
    }
    
    if (parseFloat(voucher.hoursFeriadoDoble) > 0) {
        const valDoble = voucher.valueFeriadoDoble ? parseFloat(voucher.valueFeriadoDoble) : (parseFloat(voucher.hoursFeriadoDoble) * parseFloat(voucher.hourlyRate) * 2);
        tableHtml += `
            <tr>
                <td>Día Doble / Feriado de Pago Obligatorio (x2.0)</td>
                <td class="text-right">${voucher.hoursFeriadoDoble}</td>
                <td class="text-right">₡${formatColones(voucher.hourlyRate * 2)}</td>
                <td class="text-right text-success">₡${formatColones(valDoble)}</td>
                <td class="text-right">-</td>
            </tr>
        `;
    }
    
    // Parse dynamic items if any
    let concepts = voucher.concepts || [];
    if (typeof concepts === 'string') {
        try { concepts = JSON.parse(concepts); } catch(e) {}
    }
    
    concepts.forEach(item => {
        const hasHours = item.hours && parseFloat(item.hours) > 0;
        const rateVal = item.rate ? parseFloat(item.rate) : (hasHours ? parseFloat(voucher.hourlyRate) : 0);
        if (item.conceptType === 'holiday') {
            tableHtml += `
                <tr>
                    <td>Feriado de Ley: ${item.name}</td>
                    <td class="text-right">${hasHours ? item.hours : '-'}</td>
                    <td class="text-right">${hasHours ? '₡' + formatColones(rateVal) : '-'}</td>
                    <td class="text-right text-success">₡${formatColones(item.amount)}</td>
                    <td class="text-right">-</td>
                </tr>
            `;
        } else if (item.conceptType === 'earning') {
            tableHtml += `
                <tr>
                    <td>${item.name}</td>
                    <td class="text-right">${hasHours ? item.hours : '-'}</td>
                    <td class="text-right">${hasHours ? '₡' + formatColones(rateVal) : '-'}</td>
                    <td class="text-right text-success">₡${formatColones(item.amount)}</td>
                    <td class="text-right">-</td>
                </tr>
            `;
        } else if (item.conceptType === 'deduction') {
            tableHtml += `
                <tr>
                    <td>Deducción / Rebajo: ${item.name}</td>
                    <td class="text-right">-</td>
                    <td class="text-right">-</td>
                    <td class="text-right">-</td>
                    <td class="text-right text-danger">₡${formatColones(item.amount)}</td>
                </tr>
            `;
        }
    });
    
    // Add CCSS row
    const ccssVal = parseFloat(voucher.ccssDeduction);
    if (ccssVal > 0) {
        tableHtml += `
            <tr>
                <td>Deducción CCSS Obligatoria (${voucher.ccssAuto ? voucher.ccssPercentage + '%' : 'Manual'})</td>
                <td class="text-right">-</td>
                <td class="text-right">-</td>
                <td class="text-right">-</td>
                <td class="text-right text-danger">₡${formatColones(ccssVal)}</td>
            </tr>
        `;
    }
    
    tableBodyOriginal.innerHTML = tableHtml;
    tableBodyDuplicate.innerHTML = tableHtml;
    
    // Update Header / Info tags across both sheets
    const updateText = (id, text) => {
        const els = document.querySelectorAll(`[id="${id}"]`);
        els.forEach(el => {
            el.textContent = text;
        });
    };

    updateText("p-companyName", voucher.companyName || "Soda El Parqueo");
    updateText("p-dup-companyName", voucher.companyName || "Soda El Parqueo");
    
    updateText("p-employerName", voucher.employerName || "Gerardo Pineda Chaves");
    updateText("p-dup-employerName", voucher.employerName || "Gerardo Pineda Chaves");
    updateText("p-footer-employerName", voucher.employerName || "Gerardo Pineda Chaves");
    updateText("p-dup-footer-employerName", voucher.employerName || "Gerardo Pineda Chaves");
    
    updateText("p-companyId", voucher.companyId || "1-0938-0143");
    updateText("p-dup-companyId", voucher.companyId || "1-0938-0143");
    
    updateText("p-companyPhone", voucher.companyPhone || "2250-1234");
    updateText("p-dup-companyPhone", voucher.companyPhone || "2250-1234");
    
    updateText("p-companyCity", voucher.companyCity || "San José, Costa Rica");
    updateText("p-dup-companyCity", voucher.companyCity || "San José, Costa Rica");
    
    updateText("p-employeeName", voucher.employeeName);
    updateText("p-dup-employeeName", voucher.employeeName);
    
    updateText("p-employeeId", voucher.employeeIdCard);
    updateText("p-dup-employeeId", voucher.employeeIdCard);
    
    updateText("p-employeePosition", voucher.employeePosition);
    updateText("p-dup-employeePosition", voucher.employeePosition);
    
    updateText("p-periodText", voucher.periodText);
    updateText("p-dup-periodText", voucher.periodText);
    
    updateText("p-paymentDay", voucher.paymentDay);
    updateText("p-dup-paymentDay", voucher.paymentDay);
    
    updateText("p-paymentMonth", voucher.paymentMonthText);
    updateText("p-dup-paymentMonth", voucher.paymentMonthText);
    
    updateText("p-paymentYear", voucher.paymentYearText);
    updateText("p-dup-paymentYear", voucher.paymentYearText);

    // Render Totals
    updateText("p-totalGross", `₡${formatColones(voucher.totalGross)}`);
    updateText("p-dup-totalGross", `₡${formatColones(voucher.totalGross)}`);
    
    updateText("p-totalDeductions", `₡${formatColones(voucher.totalDeductions)}`);
    updateText("p-netSalary", `₡${formatColones(voucher.netSalary)}`);
    updateText("p-dup-netSalary", `₡${formatColones(voucher.netSalary)}`);

    // Ensure company logo is rendered
    const logoToUse = voucher.logo || currentCompanyLogo;
    const voucherLogos = [document.getElementById("p-companyLogo"), document.getElementById("p-dup-companyLogo")];
    voucherLogos.forEach(img => {
        if (img) {
            if (logoToUse) {
                img.src = logoToUse;
                img.style.display = "block";
            } else {
                img.src = "";
                img.style.display = "none";
            }
        }
    });
}

// Calculate Aguinaldo and display comprehensive breakdown
async function calculateAguinaldo() {
    const valueH2 = document.getElementById("aguinaldoValue");
    const grossSumH3 = document.getElementById("aguinaldoTotalGrossSum");
    const countSpan = document.getElementById("aguinaldoVoucherCount");
    const formulaDiv = document.getElementById("aguinaldoFormulaNote");
    const tableBody = document.getElementById("aguinaldoBreakdownBody");
    const footTotalGross = document.getElementById("footTotalGross");
    const footAguinaldoVal = document.getElementById("footAguinaldoVal");
    
    if (!activeEmployeeId) return;
    
    const yearSelect = document.getElementById("aguinaldoYearSelect");
    const targetYear = yearSelect ? parseInt(yearSelect.value) : new Date().getFullYear();
    
    let reportData = null;
    
    if (isServerOnline) {
        try {
            const res = await fetch(`${API_URL}/empleados/${activeEmployeeId}/aguinaldo?year=${targetYear}`);
            if (res.ok) {
                reportData = await res.json();
            }
        } catch (e) {
            console.error("Failed to fetch Aguinaldo report from backend, calculating locally", e);
        }
    }
    
    // Offline local calculation fallback
    if (!reportData) {
        const savedLocal = localStorage.getItem("soda_vouchers") || "[]";
        const history = JSON.parse(savedLocal);
        
        const employeeReceipts = history.filter(v => 
            v.employeeId === activeEmployeeId && 
            (parseInt(v.periodYear) === targetYear || parseInt(v.paymentYearText) === targetYear)
        );
        
        // Sort receipts chronologically
        employeeReceipts.sort((a, b) => {
            const mA = parseInt(a.periodMonth) || 1;
            const mB = parseInt(b.periodMonth) || 1;
            if (mA !== mB) return mA - mB;
            return (a.fortnight || "1").localeCompare(b.fortnight || "1");
        });
        
        let totalGrossSum = 0;
        const receiptsList = employeeReceipts.map(r => {
            const grossVal = parseFloat(r.totalGross) || 0;
            totalGrossSum += grossVal;
            return {
                id: r.id,
                periodText: r.periodText || `Quincena ${r.fortnight || 1} - ${r.paymentMonthText || 'Mes'}`,
                totalGross: grossVal
            };
        });
        
        reportData = {
            totalGrossSum,
            aguinaldoAccrued: totalGrossSum / 12,
            vouchersCount: employeeReceipts.length,
            receiptsList
        };
    }
    
    const totalGross = reportData.totalGrossSum || 0;
    const aguinaldoVal = reportData.aguinaldoAccrued || (totalGross / 12);
    const count = reportData.vouchersCount || (reportData.receiptsList ? reportData.receiptsList.length : 0);
    
    // Render outputs to KPI UI
    if (valueH2) valueH2.textContent = `₡${formatColones(aguinaldoVal)}`;
    if (grossSumH3) grossSumH3.textContent = `₡${formatColones(totalGross)}`;
    if (countSpan) countSpan.textContent = `${count} comprobante(s) sumado(s)`;
    if (formulaDiv) {
        formulaDiv.innerHTML = `📐 <strong>Fórmula:</strong> ₡${formatColones(totalGross)} (Total Salarios) ÷ 12 meses = <strong style="color:var(--primary-color);">₡${formatColones(aguinaldoVal)}</strong>`;
    }
    if (footTotalGross) footTotalGross.textContent = `₡${formatColones(totalGross)}`;
    if (footAguinaldoVal) footAguinaldoVal.textContent = `₡${formatColones(aguinaldoVal)}`;
    
    tableBody.innerHTML = "";
    
    const items = reportData.receiptsList && reportData.receiptsList.length > 0 
        ? reportData.receiptsList 
        : (reportData.monthlyBreakdown || []);
        
    if (items.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="2" style="padding: 1.5rem; text-align: center; color: var(--text-muted);">
                    No se registran comprobantes de pago para este empleado en el año ${targetYear}.
                </td>
            </tr>
        `;
        return;
    }
    
    items.forEach(item => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid var(--border-color)";
        const label = item.periodText || item.monthName || "Comprobante";
        const amt = item.totalGross !== undefined ? item.totalGross : item.grossAmount;
        
        tr.innerHTML = `
            <td style="padding: 0.6rem 0.5rem; font-weight:600;">${label}</td>
            <td style="padding: 0.6rem 0.5rem; text-align: right; font-weight:700; color:var(--text-main);">₡${formatColones(amt)}</td>
        `;
        tableBody.appendChild(tr);
    });
}

// Calculate Vacation amounts
function calculateVacations() {
    const hourlyRate = parseFloat(document.getElementById("hourlyRate")?.value) || 1690.46;
    let dailyRateInput = document.getElementById("vacationDailyRate");
    let dailyRate = parseFloat(dailyRateInput?.value);
    if (isNaN(dailyRate) || dailyRate <= 0) {
        dailyRate = hourlyRate * 8;
        if (dailyRateInput) dailyRateInput.value = dailyRate.toFixed(2);
    }
    
    const daysInput = document.getElementById("vacationDays");
    const days = (daysInput && parseFloat(daysInput.value) > 0) ? parseFloat(daysInput.value) : 15;
    const ccssPercent = parseFloat(document.getElementById("vacationCcssPercent")?.value) || 10.83;
    const periodLabel = document.getElementById("vacationPeriodLabel")?.value || "2025 - 2026";
    const startDate = document.getElementById("vacationStartDate")?.value || "";
    const endDate = document.getElementById("vacationEndDate")?.value || "";
    const returnDate = document.getElementById("vacationReturnDate")?.value || "";
    
    const gross = days * dailyRate;
    const ccss = gross * (ccssPercent / 100);
    const net = gross - ccss;
    
    const grossDisplay = document.getElementById("vacationGrossDisplay");
    const netDisplay = document.getElementById("vacationNetDisplay");
    if (grossDisplay) grossDisplay.textContent = `₡${formatColones(gross)}`;
    if (netDisplay) netDisplay.textContent = `₡${formatColones(net)}`;
    
    return {
        days,
        dailyRate,
        ccssPercent,
        periodLabel,
        startDate,
        endDate,
        returnDate,
        gross,
        ccss,
        net,
        employeeName: document.getElementById("employeeName")?.value || "Marisol Hidalgo Barquero",
        employeeId: document.getElementById("employeeId")?.value || "1-0938-0143",
        employeePosition: document.getElementById("employeePosition")?.value || "Ayudante de cocina",
        companyName: document.getElementById("companyName")?.value || "Soda El Parque",
        employerName: document.getElementById("employerName")?.value || "Gerardo Pineda Chaves",
        companyId: document.getElementById("companyId")?.value || "1-0938-0143",
        companyPhone: document.getElementById("companyPhone")?.value || "2250-1234",
        companyCity: document.getElementById("companyCity")?.value || "San José, Costa Rica"
    };
}

// Render the Vacation Voucher inside the document sheet
function renderVacationVoucherToSheet() {
    const vac = calculateVacations();
    const printSheet = document.getElementById("printSheet");
    if (!printSheet) return;
    
    const formatDateStr = (dateVal) => {
        if (!dateVal) return "Por definir";
        const parts = dateVal.split("-");
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return dateVal;
    };
    
    const datesInfo = `Desde el ${formatDateStr(vac.startDate)} hasta el ${formatDateStr(vac.endDate)} (Reincorporación: ${formatDateStr(vac.returnDate)})`;
    
    const buildVoucherHtml = (badgeSubtitle) => `
        <div class="payroll-voucher" style="padding: 1.2rem; border-bottom: 2px dashed #000; margin-bottom: 1.5rem;">
            <!-- Voucher Header -->
            <div class="voucher-header">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    ${currentCompanyLogo ? `<img src="${currentCompanyLogo}" alt="Logo" class="voucher-logo-img">` : ''}
                    <div class="header-main">
                        <h2 class="company-title">${vac.companyName}</h2>
                        <p class="company-detail">
                            Patrono: <span>${vac.employerName}</span> &nbsp;|&nbsp;
                            Cédula: <span>${vac.companyId}</span>
                        </p>
                        <p class="company-sub-detail">
                            Tel: <span>${vac.companyPhone}</span> &nbsp;|&nbsp;
                            <span>${vac.companyCity}</span>
                        </p>
                    </div>
                </div>
                <div class="header-badge" style="background: rgba(13, 148, 136, 0.1); border-color: var(--primary-color);">
                    <span class="badge-title" style="color: var(--primary-color);">COMPROBANTE DE VACACIONES</span>
                    <span class="badge-subtitle">${badgeSubtitle}</span>
                </div>
            </div>

            <!-- Meta Information Grid -->
            <div class="voucher-meta-grid" style="grid-template-columns: 2fr 1.5fr 1fr; margin-bottom: 0.8rem;">
                <div class="meta-item">
                    <span class="meta-label">TRABAJADOR:</span>
                    <span class="meta-value">${vac.employeeName}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">CÉDULA:</span>
                    <span class="meta-value">${vac.employeeId}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">PUESTO:</span>
                    <span class="meta-value">${vac.employeePosition}</span>
                </div>
                <div class="meta-item" style="grid-column: span 2;">
                    <span class="meta-label">PERÍODO LABORAL DE VACACIONES:</span>
                    <span class="meta-value">${vac.periodLabel}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">DÍAS PAGADOS:</span>
                    <span class="meta-value" style="color: var(--primary-color); font-weight: 800;">${vac.days} días</span>
                </div>
            </div>

            <!-- Vacation Table -->
            <div class="voucher-table-container">
                <table class="voucher-table">
                    <thead>
                        <tr>
                            <th>Concepto de Vacaciones</th>
                            <th class="text-right">Días</th>
                            <th class="text-right">Salario Diario</th>
                            <th class="text-right">Ingresos (₡)</th>
                            <th class="text-right">Deducciones (₡)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <strong>Pago y Disfrute de Vacaciones de Ley</strong><br>
                                <span style="font-size: 0.75rem; color: var(--text-muted);">${datesInfo}</span>
                            </td>
                            <td class="text-right">${vac.days}</td>
                            <td class="text-right">₡${formatColones(vac.dailyRate)}</td>
                            <td class="text-right text-success">₡${formatColones(vac.gross)}</td>
                            <td class="text-right">-</td>
                        </tr>
                        <tr>
                            <td>Deducción CCSS Obligatoria (${vac.ccssPercent}%)</td>
                            <td class="text-right">-</td>
                            <td class="text-right">-</td>
                            <td class="text-right">-</td>
                            <td class="text-right text-danger">₡${formatColones(vac.ccss)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Summary Totals -->
            <div class="voucher-summary" style="margin: 0.8rem 0;">
                <div class="summary-box">
                    <span class="summary-label">Total Bruto Vacaciones:</span>
                    <span class="summary-val text-success">₡${formatColones(vac.gross)}</span>
                </div>
                <div class="summary-box">
                    <span class="summary-label">Total Deducciones CCSS:</span>
                    <span class="summary-val text-danger">₡${formatColones(vac.ccss)}</span>
                </div>
                <div class="summary-box total-net-box">
                    <span class="summary-label">NETO A PAGAR:</span>
                    <span class="summary-val">₡${formatColones(vac.net)}</span>
                </div>
            </div>

            <!-- Legal Constancia -->
            <div class="legal-notice">
                <p class="legal-text">
                    Hago constar que he recibido de <strong>${vac.employerName}</strong> a mi entera satisfacción la suma neta de <strong>₡${formatColones(vac.net)}</strong> por concepto de disfrute y pago de mis vacaciones de ley correspondientes al período señalado (Art. 153-161 Código de Trabajo de Costa Rica).
                </p>
                <div class="date-stamp-row">
                    Comprobante emitido el ${new Date().toLocaleDateString('es-CR')}
                </div>
            </div>

            <!-- Signatures Section -->
            <div class="signatures-section" style="margin-top: 1.2rem;">
                <div class="signature-block">
                    <div class="signature-line"></div>
                    <span class="signature-label">Firma Responsable Empresa</span>
                </div>
                <div class="signature-block">
                    <div class="signature-line"></div>
                    <span class="signature-label">Recibido Conforme Trabajador</span>
                </div>
            </div>
        </div>
    `;

    printSheet.innerHTML = buildVoucherHtml("Original - Trabajador") + buildVoucherHtml("Copia - Patrono");
    
    // Animate pulse
    printSheet.classList.remove("voucher-highlight-active");
    void printSheet.offsetWidth;
    printSheet.classList.add("voucher-highlight-active");
    setTimeout(() => printSheet.classList.remove("voucher-highlight-active"), 900);
    
    // If mobile, open modal
    if (window.innerWidth <= 768) {
        openVoucherModal();
    }
}

// Save Vacation Voucher to Backend MySQL & LocalStorage
async function saveVacationsToBackend() {
    const vac = calculateVacations();
    renderVacationVoucherToSheet();
    
    const payload = {
        employeeId: activeEmployeeId || "emp-default",
        employeeName: vac.employeeName,
        employeeIdCard: vac.employeeId,
        employeePosition: vac.employeePosition,
        periodLabel: vac.periodLabel,
        days: vac.days,
        startDate: vac.startDate,
        endDate: vac.endDate,
        returnDate: vac.returnDate,
        dailyRate: vac.dailyRate,
        grossAmount: vac.gross,
        ccssPercent: vac.ccssPercent,
        ccssDeduction: vac.ccss,
        netAmount: vac.net
    };
    
    if (isServerOnline) {
        try {
            const res = await fetch(`${API_URL}/vacaciones`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const ret = await res.json();
                alert(`✅ ¡Comprobante de Vacaciones guardado con éxito en Base de Datos (ID: ${ret.id})!`);
                return;
            }
        } catch (e) {
            console.error("Failed to save vacations to backend, saving locally", e);
        }
    }
    
    // LocalStorage fallback
    payload.id = "vac-local-" + Date.now();
    payload.createdAt = new Date().toISOString();
    const saved = localStorage.getItem("soda_vacations") || "[]";
    const history = JSON.parse(saved);
    history.unshift(payload);
    localStorage.setItem("soda_vacations", JSON.stringify(history));
    alert(`✅ ¡Comprobante de Vacaciones para ${vac.employeeName} generado y guardado con éxito!`);
}

// Event Listeners Registration
function initEventListeners() {
    // Inputs triggering live recalculation
    const inputIds = [
        "companyName", "employerName", "companyId", "companyPhone", "companyCity",
        "employeeName", "employeeId", "employeePosition", "hourlyRate", "hourlyRateNocturna",
        "hoursDiurnas", "hoursNocturnas", "hoursDescanso", "hoursExtrasDiurnas", "hoursExtrasNocturnas", "hoursFeriadoDoble",
        "ccssAuto", "ccssPercentage", "ccssManualAmount", "overrideTotals", "manualGross", "manualNet",
        "periodYear", "periodMonth", "periodText", "paymentDay", "paymentMonthText", "paymentYearText"
    ];
    
    inputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", () => {
                if (id === "ccssAuto") {
                    toggleCcssGroup();
                }
                if (id === "overrideTotals") {
                    toggleOverrideGroup();
                }
                const calculationFieldIds = [
                    "hourlyRate", "hourlyRateNocturna",
                    "hoursDiurnas", "hoursNocturnas", "hoursDescanso", "hoursExtrasDiurnas", "hoursExtrasNocturnas", "hoursFeriadoDoble",
                    "ccssPercentage", "ccssManualAmount"
                ];
                if (calculationFieldIds.includes(id)) {
                    // Automatically uncheck manual override when user alters hours, rates or deductions so all totals calculate live
                    const overrideCheckbox = document.getElementById("overrideTotals");
                    if (overrideCheckbox && overrideCheckbox.checked) {
                        overrideCheckbox.checked = false;
                        toggleOverrideGroup();
                    }
                }
                calculatePayroll();
            });
        }
    });
    
    // Dropdown profile switcher
    document.getElementById("employeeProfileSelect").addEventListener("change", (e) => {
        loadEmployeeProfile(e.target.value);
        calculatePayroll();
    });
    
    // Management buttons
    document.getElementById("btnCreateNewEmployee").addEventListener("click", createNewEmployee);
    document.getElementById("btnSaveEmployee").addEventListener("click", async () => {
        await saveCurrentEmployeeProfile();
        alert("¡Perfil de empleado guardado con éxito!");
    });
    document.getElementById("btnDeleteEmployee").addEventListener("click", deleteActiveEmployee);
    
    document.getElementById("btnSaveCompany").addEventListener("click", async () => {
        await saveGlobalData();
        alert("¡Datos y logo de la empresa guardados con éxito en la base de datos!");
    });
    
    // Company Logo Upload & Removal Event Listeners
    const logoInput = document.getElementById("companyLogoInput");
    if (logoInput) {
        logoInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 3 * 1024 * 1024) {
                    alert("⚠️ La imagen seleccionada es muy grande. Por favor sube una imagen de menos de 3 MB.");
                    return;
                }
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const logoDataUrl = event.target.result;
                    updateCompanyLogoUI(logoDataUrl);
                    localStorage.setItem("soda_company_logo", logoDataUrl);
                    await saveGlobalData();
                    calculatePayroll();
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    const btnRemoveLogo = document.getElementById("btnRemoveLogo");
    if (btnRemoveLogo) {
        btnRemoveLogo.addEventListener("click", async () => {
            if (confirm("¿Deseas eliminar el logo de la empresa?")) {
                updateCompanyLogoUI(null);
                localStorage.removeItem("soda_company_logo");
                await saveGlobalData();
                calculatePayroll();
            }
        });
    }
    
    // Fortnight radio inputs & period selectors
    document.querySelectorAll("input[name='fortnight']").forEach(radio => {
        radio.addEventListener("change", () => {
            generatePeriodDates();
            calculatePayroll();
        });
    });
    
    document.getElementById("periodYear").addEventListener("change", () => {
        generatePeriodDates();
        calculatePayroll();
    });
    
    document.getElementById("periodMonth").addEventListener("change", () => {
        generatePeriodDates();
        calculatePayroll();
    });
    
    // Period helper button
    document.getElementById("btnRecalculatePeriod").addEventListener("click", () => {
        generatePeriodDates();
        calculatePayroll();
    });
    
    // Print triggers
    document.getElementById("btnPrint").addEventListener("click", () => {
        window.print();
    });
    
    // Save Voucher trigger
    document.getElementById("btnSaveVoucher").addEventListener("click", saveVoucherToBackend);
    
    // Refresh History trigger
    document.getElementById("btnRefreshHistory").addEventListener("click", async () => {
        await checkServerStatus();
        await loadVouchersHistory();
    });
    
    // Calculate Aguinaldo trigger
    document.getElementById("btnCalculateAguinaldo").addEventListener("click", async () => {
        await checkServerStatus();
        await calculateAguinaldo();
    });
    
    const yearSelect = document.getElementById("aguinaldoYearSelect");
    if (yearSelect) {
        yearSelect.addEventListener("change", async () => {
            await checkServerStatus();
            await calculateAguinaldo();
        });
    }
    
    // Load Defaults trigger
    document.getElementById("btnLoadImageDefaults").addEventListener("click", () => {
        if (confirm("¿Estás seguro de que deseas cargar los valores por defecto del recibo físico en el perfil actual? Esto sobrescribirá los datos del trabajador activo.")) {
            // Restore active employee profile values using image defaults
            const idx = employees.findIndex(e => e.id === activeEmployeeId);
            if (idx !== -1) {
                const name = employees[idx].employeeName;
                employees[idx] = JSON.parse(JSON.stringify(DEFAULT_EMPLOYEE));
                employees[idx].id = activeEmployeeId;
                employees[idx].employeeName = name; // Preserve name
            }
            loadEmployeeProfile(activeEmployeeId);
            calculatePayroll();
        }
    });
    
    // Clear Data trigger
    document.getElementById("btnClearData").addEventListener("click", () => {
        if (confirm("¿Deseas limpiar todos los campos del trabajador activo?")) {
            clearAllFields();
            calculatePayroll();
        }
    });
    
    // Modal Event Listeners
    const btnModalClose = document.getElementById("btnModalClose");
    if (btnModalClose) {
        btnModalClose.addEventListener("click", closeVoucherModal);
    }
    
    const btnModalPrint = document.getElementById("btnModalPrint");
    if (btnModalPrint) {
        btnModalPrint.addEventListener("click", () => {
            window.print();
        });
    }
    
    const voucherModal = document.getElementById("voucherModal");
    if (voucherModal) {
        voucherModal.addEventListener("click", (e) => {
            if (e.target === voucherModal) {
                closeVoucherModal();
            }
        });
    }
    
    // Vacation Event Listeners
    const vacInputIds = [
        "vacationDays", "vacationDailyRate", "vacationCcssPercent",
        "vacationPeriodLabel", "vacationStartDate", "vacationEndDate", "vacationReturnDate"
    ];
    vacInputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", () => {
                calculateVacations();
                const activeTab = document.querySelector(".tab-btn.active")?.getAttribute("data-tab");
                if (activeTab === "tab-vacaciones") {
                    renderVacationVoucherToSheet();
                }
            });
        }
    });

    const btnGenerateVacations = document.getElementById("btnGenerateVacations");
    if (btnGenerateVacations) {
        btnGenerateVacations.addEventListener("click", saveVacationsToBackend);
    }

    const btnPrintVacations = document.getElementById("btnPrintVacations");
    if (btnPrintVacations) {
        btnPrintVacations.addEventListener("click", () => {
            renderVacationVoucherToSheet();
            window.print();
        });
    }
}

// Add Custom items mechanics
function initDynamicLists() {
    document.getElementById("btnAddHoliday").addEventListener("click", () => {
        addDynamicRow("holidaysList", "", 0, "h");
    });
    document.getElementById("btnAddEarning").addEventListener("click", () => {
        addDynamicRow("earningsList", "", 0, "e");
    });
    document.getElementById("btnAddDeduction").addEventListener("click", () => {
        addDynamicRow("deductionsList", "", 0, "d");
    });
}

// Appends row for lists
function addDynamicRow(listId, name = "", amount = 0, prefix = "", hours = "") {
    const list = document.getElementById(listId);
    const rowId = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const row = document.createElement("div");
    row.className = "dynamic-row";
    if (prefix === 'h' || prefix === 'e') {
        row.className += " has-hours";
    }
    row.setAttribute("data-id", rowId);
    
    let html = '';
    if (prefix === 'h' || prefix === 'e') {
        html = `
            <input type="number" step="0.1" placeholder="Horas" class="${prefix}-hours" value="${hours}" style="width: 70px;">
            <input type="text" placeholder="Concepto" class="${prefix}-name" value="${name}">
            <input type="number" step="0.01" placeholder="Monto" class="${prefix}-amount" value="${amount}">
            <button type="button" class="btn-remove" onclick="removeRow(this)">×</button>
        `;
    } else {
        html = `
            <input type="text" placeholder="Concepto" class="${prefix}-name" value="${name}">
            <input type="number" step="0.01" placeholder="Monto" class="${prefix}-amount" value="${amount}">
            <button type="button" class="btn-remove" onclick="removeRow(this)">×</button>
        `;
    }
    row.innerHTML = html;
    
    list.appendChild(row);
    
    // Add event listeners to new row inputs
    row.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", () => {
            const overrideCheckbox = document.getElementById("overrideTotals");
            if (overrideCheckbox && overrideCheckbox.checked) {
                overrideCheckbox.checked = false;
                toggleOverrideGroup();
            }
            if (input.classList.contains(`${prefix}-hours`)) {
                const hVal = parseFloat(input.value);
                if (!isNaN(hVal) && hVal > 0) {
                    const diurnalHourlyRate = parseFloat(document.getElementById("hourlyRate").value) || 0;
                    row.querySelector(`.${prefix}-amount`).value = (hVal * diurnalHourlyRate).toFixed(2);
                }
            }
            calculatePayroll();
        });
    });
    
    const overrideCheckbox = document.getElementById("overrideTotals");
    if (overrideCheckbox && overrideCheckbox.checked) {
        overrideCheckbox.checked = false;
        toggleOverrideGroup();
    }
    calculatePayroll();
    return row;
}

// Removes a dynamic row
window.removeRow = function(btn) {
    const overrideCheckbox = document.getElementById("overrideTotals");
    if (overrideCheckbox && overrideCheckbox.checked) {
        overrideCheckbox.checked = false;
        toggleOverrideGroup();
    }
    const row = btn.closest(".dynamic-row");
    row.remove();
    calculatePayroll();
};

// Autocomplete Fortnight date helper
function generatePeriodDates() {
    const year = parseInt(document.getElementById("periodYear").value);
    const monthIndex = parseInt(document.getElementById("periodMonth").value) - 1;
    const fortnight = document.querySelector("input[name='fortnight']:checked").value;
    
    const monthName = MONTHS[monthIndex];
    
    if (fortnight === "1") {
        document.getElementById("periodText").value = `01 al 15 de ${monthName} del ${year}`;
        document.getElementById("paymentDay").value = 15;
        document.getElementById("paymentMonthText").value = monthName;
        document.getElementById("paymentYearText").value = year;
    } else {
        // Find last day of this month
        const lastDay = new Date(year, monthIndex + 1, 0).getDate();
        document.getElementById("periodText").value = `16 al ${lastDay} de ${monthName} del ${year}`;
        document.getElementById("paymentDay").value = lastDay;
        document.getElementById("paymentMonthText").value = monthName;
        document.getElementById("paymentYearText").value = year;
    }
}

// Toggles display based on checkboxes
function toggleCcssGroup() {
    const ccssAuto = document.getElementById("ccssAuto").checked;
    document.getElementById("ccssPercentageGroup").style.display = ccssAuto ? "block" : "none";
    document.getElementById("ccssManualGroup").style.display = ccssAuto ? "none" : "block";
}

// Toggles display based on checkboxes
function toggleOverrideGroup() {
    const override = document.getElementById("overrideTotals").checked;
    document.getElementById("overrideInputsGroup").style.display = override ? "flex" : "none";
}

// Return computed payload details
function getPayrollDetails() {
    const companyName = document.getElementById("companyName").value;
    const employerName = document.getElementById("employerName").value;
    const companyId = document.getElementById("companyId").value;
    const companyPhone = document.getElementById("companyPhone").value;
    const companyCity = document.getElementById("companyCity").value;
    
    const employeeName = document.getElementById("employeeName").value;
    const employeeId = document.getElementById("employeeId").value;
    const employeePosition = document.getElementById("employeePosition").value;
    
    const hourlyRate = parseFloat(document.getElementById("hourlyRate").value) || 0;
    const hourlyRateNocturna = parseFloat(document.getElementById("hourlyRateNocturna").value) || 0;
    
    const hoursDiurnas = parseFloat(document.getElementById("hoursDiurnas").value) || 0;
    const hoursNocturnas = parseFloat(document.getElementById("hoursNocturnas").value) || 0;
    const hoursDescanso = parseFloat(document.getElementById("hoursDescanso").value) || 0;
    const hoursExtrasDiurnas = parseFloat(document.getElementById("hoursExtrasDiurnas").value) || 0;
    const hoursExtrasNocturnas = parseFloat(document.getElementById("hoursExtrasNocturnas").value) || 0;
    const hoursFeriadoDoble = parseFloat(document.getElementById("hoursFeriadoDoble")?.value) || 0;
    
    let periodText = document.getElementById("periodText")?.value;
    let paymentDay = document.getElementById("paymentDay")?.value;
    let paymentMonthText = document.getElementById("paymentMonthText")?.value;
    let paymentYearText = document.getElementById("paymentYearText")?.value;
    
    if (!periodText || periodText.trim() === "") {
        generatePeriodDates();
        periodText = document.getElementById("periodText")?.value || "01 al 15 de Abril del 2026";
        paymentDay = document.getElementById("paymentDay")?.value || 15;
        paymentMonthText = document.getElementById("paymentMonthText")?.value || "Abril";
        paymentYearText = document.getElementById("paymentYearText")?.value || 2026;
    }
    
    const ccssAuto = document.getElementById("ccssAuto").checked;
    const ccssPercentage = parseFloat(document.getElementById("ccssPercentage").value) || 10.83;
    const ccssManualAmount = parseFloat(document.getElementById("ccssManualAmount").value) || 0;
    
    const overrideTotals = document.getElementById("overrideTotals").checked;
    const manualGross = parseFloat(document.getElementById("manualGross").value) || 0;
    const manualNet = parseFloat(document.getElementById("manualNet").value) || 0;

    const valueDiurnas = hoursDiurnas * hourlyRate;
    const valueNocturnas = hoursNocturnas * hourlyRateNocturna;
    const valueDescanso = hoursDescanso * hourlyRate;
    const valueExtrasDiurnas = hoursExtrasDiurnas * (hourlyRate * 1.5);
    const valueExtrasNocturnas = hoursExtrasNocturnas * (hourlyRateNocturna * 1.5);
    const valueFeriadoDoble = hoursFeriadoDoble * (hourlyRate * 2.0);
    
    // Dynamic Feriados
    let totalHolidays = 0;
    const holidaysData = [];
    document.querySelectorAll("#holidaysList .dynamic-row").forEach(row => {
        const name = row.querySelector(".h-name").value || "Feriado";
        const amt = parseFloat(row.querySelector(".h-amount").value) || 0;
        const hoursVal = row.querySelector(".h-hours") ? parseFloat(row.querySelector(".h-hours").value) : 0;
        const hours = isNaN(hoursVal) ? 0 : hoursVal;
        totalHolidays += amt;
        if (amt > 0) {
            holidaysData.push({ name, amount: amt, hours });
        }
    });
    
    // Dynamic Other Earnings
    let totalOtherEarnings = 0;
    const earningsData = [];
    document.querySelectorAll("#earningsList .dynamic-row").forEach(row => {
        const name = row.querySelector(".e-name").value || "Otro Ingreso";
        const amt = parseFloat(row.querySelector(".e-amount").value) || 0;
        const hoursVal = row.querySelector(".e-hours") ? parseFloat(row.querySelector(".e-hours").value) : 0;
        const hours = isNaN(hoursVal) ? 0 : hoursVal;
        totalOtherEarnings += amt;
        if (amt > 0) {
            earningsData.push({ name, amount: amt, hours });
        }
    });

    const calculatedGross = valueDiurnas + valueNocturnas + valueDescanso + valueExtrasDiurnas + valueExtrasNocturnas + valueFeriadoDoble + totalHolidays + totalOtherEarnings;
    
    let ccssDeduction = 0;
    if (ccssAuto) {
        ccssDeduction = calculatedGross * (ccssPercentage / 100);
    } else {
        ccssDeduction = ccssManualAmount;
    }
    
    // Custom Deductions
    let totalOtherDeductions = 0;
    const deductionsData = [];
    document.querySelectorAll("#deductionsList .dynamic-row").forEach(row => {
        const name = row.querySelector(".d-name").value || "Deducción";
        const amt = parseFloat(row.querySelector(".d-amount").value) || 0;
        totalOtherDeductions += amt;
        if (amt > 0) {
            deductionsData.push({ name, amount: amt });
        }
    });

    const calculatedDeductions = ccssDeduction + totalOtherDeductions;
    const calculatedNet = calculatedGross - calculatedDeductions;
    
    const finalGross = overrideTotals ? manualGross : calculatedGross;
    const finalNet = overrideTotals ? manualNet : calculatedNet;
    const finalDeductions = overrideTotals ? (finalGross - finalNet) : calculatedDeductions;

    return {
        companyName, employerName, companyId, companyPhone, companyCity,
        employeeName, employeeId, employeePosition,
        hourlyRate, hourlyRateNocturna,
        hoursDiurnas, hoursNocturnas, hoursDescanso, hoursExtrasDiurnas, hoursExtrasNocturnas, hoursFeriadoDoble,
        valueDiurnas, valueNocturnas, valueDescanso, valueExtrasDiurnas, valueExtrasNocturnas, valueFeriadoDoble,
        periodText, paymentDay, paymentMonthText, paymentYearText,
        ccssAuto, ccssPercentage, ccssManualAmount,
        overrideTotals, manualGross, manualNet,
        totalHolidays, holidaysData,
        totalOtherEarnings, earningsData,
        totalOtherDeductions, deductionsData,
        ccssDeduction, finalGross, finalDeductions, finalNet
    };
}

// Primary Calculations Engine
function calculatePayroll() {
    const details = getPayrollDetails();
    
    // Update live previews
    const tableBodyOriginal = document.getElementById("p-table-body");
    const tableBodyDuplicate = document.getElementById("p-dup-table-body");
    
    let tableHtml = "";
    
    // Ordinarias Diurnas
    if (details.hoursDiurnas > 0) {
        tableHtml += `
            <tr>
                <td>Horas Ordinarias Diurnas</td>
                <td class="text-right">${details.hoursDiurnas}</td>
                <td class="text-right">₡${formatColones(details.hourlyRate)}</td>
                <td class="text-right text-success">₡${formatColones(details.valueDiurnas)}</td>
                <td class="text-right">-</td>
            </tr>
        `;
    }
    
    // Ordinarias Nocturnas
    if (details.hoursNocturnas > 0) {
        tableHtml += `
            <tr>
                <td>Horas Ordinarias Nocturnas</td>
                <td class="text-right">${details.hoursNocturnas}</td>
                <td class="text-right">₡${formatColones(details.hourlyRateNocturna)}</td>
                <td class="text-right text-success">₡${formatColones(details.valueNocturnas)}</td>
                <td class="text-right">-</td>
            </tr>
        `;
    }
    
    // Descanso Quincenal
    if (details.hoursDescanso > 0) {
        tableHtml += `
            <tr>
                <td>Descanso Quincenal Autorizado</td>
                <td class="text-right">${details.hoursDescanso}</td>
                <td class="text-right">₡${formatColones(details.hourlyRate)}</td>
                <td class="text-right text-success">₡${formatColones(details.valueDescanso)}</td>
                <td class="text-right">-</td>
            </tr>
        `;
    }
    
    // Extras Diurnas
    if (details.hoursExtrasDiurnas > 0) {
        tableHtml += `
            <tr>
                <td>Horas Extras Diurnas (x1.5)</td>
                <td class="text-right">${details.hoursExtrasDiurnas}</td>
                <td class="text-right">₡${formatColones(details.hourlyRate * 1.5)}</td>
                <td class="text-right text-success">₡${formatColones(details.valueExtrasDiurnas)}</td>
                <td class="text-right">-</td>
            </tr>
        `;
    }
    
    // Extras Nocturnas
    if (details.hoursExtrasNocturnas > 0) {
        tableHtml += `
            <tr>
                <td>Horas Extras Nocturnas (x1.5)</td>
                <td class="text-right">${details.hoursExtrasNocturnas}</td>
                <td class="text-right">₡${formatColones(details.hourlyRateNocturna * 1.5)}</td>
                <td class="text-right text-success">₡${formatColones(details.valueExtrasNocturnas)}</td>
                <td class="text-right">-</td>
            </tr>
        `;
    }
    
    // Feriado de Pago Obligatorio (Día Doble x2.0)
    if (details.hoursFeriadoDoble > 0) {
        tableHtml += `
            <tr>
                <td>Día Doble / Feriado Obligatorio (x2.0)</td>
                <td class="text-right">${details.hoursFeriadoDoble}</td>
                <td class="text-right">₡${formatColones(details.hourlyRate * 2)}</td>
                <td class="text-right text-success">₡${formatColones(details.valueFeriadoDoble)}</td>
                <td class="text-right">-</td>
            </tr>
        `;
    }
    
    // Holidays
    details.holidaysData.forEach(item => {
        const hasHours = item.hours && item.hours > 0;
        tableHtml += `
            <tr>
                <td>Feriado de Ley: ${item.name}</td>
                <td class="text-right">${hasHours ? item.hours : '-'}</td>
                <td class="text-right">${hasHours ? '₡' + formatColones(details.hourlyRate) : '-'}</td>
                <td class="text-right text-success">₡${formatColones(item.amount)}</td>
                <td class="text-right">-</td>
            </tr>
        `;
    });
    
    // Other Earnings
    details.earningsData.forEach(item => {
        const hasHours = item.hours && item.hours > 0;
        tableHtml += `
            <tr>
                <td>${item.name}</td>
                <td class="text-right">${hasHours ? item.hours : '-'}</td>
                <td class="text-right">${hasHours ? '₡' + formatColones(details.hourlyRate) : '-'}</td>
                <td class="text-right text-success">₡${formatColones(item.amount)}</td>
                <td class="text-right">-</td>
            </tr>
        `;
    });
    
    // CCSS Deduction
    if (details.ccssDeduction > 0) {
        tableHtml += `
            <tr>
                <td>Deducción CCSS Obligatoria (${details.ccssAuto ? details.ccssPercentage.toFixed(2) + '%' : 'Manual'})</td>
                <td class="text-right">-</td>
                <td class="text-right">-</td>
                <td class="text-right">-</td>
                <td class="text-right text-danger">₡${formatColones(details.ccssDeduction)}</td>
            </tr>
        `;
    }
    
    // Custom Deductions
    details.deductionsData.forEach(item => {
        tableHtml += `
            <tr>
                <td>Deducción / Rebajo: ${item.name}</td>
                <td class="text-right">-</td>
                <td class="text-right">-</td>
                <td class="text-right">-</td>
                <td class="text-right text-danger">₡${formatColones(item.amount)}</td>
            </tr>
        `;
    });
    
    tableBodyOriginal.innerHTML = tableHtml;
    tableBodyDuplicate.innerHTML = tableHtml;
    
    // Update Header / Info tags across both sheets
    const updateText = (id, text) => {
        const els = document.querySelectorAll(`[id="${id}"]`);
        els.forEach(el => {
            el.textContent = text;
        });
    };

    updateText("p-companyName", details.companyName);
    updateText("p-dup-companyName", details.companyName);
    
    updateText("p-employerName", details.employerName);
    updateText("p-dup-employerName", details.employerName);
    updateText("p-footer-employerName", details.employerName);
    updateText("p-dup-footer-employerName", details.employerName);
    
    updateText("p-companyId", details.companyId);
    updateText("p-dup-companyId", details.companyId);
    
    updateText("p-companyPhone", details.companyPhone);
    updateText("p-dup-companyPhone", details.companyPhone);
    
    updateText("p-companyCity", details.companyCity);
    updateText("p-dup-companyCity", details.companyCity);
    
    updateText("p-employeeName", details.employeeName);
    updateText("p-dup-employeeName", details.employeeName);
    
    updateText("p-employeeId", details.employeeId);
    updateText("p-dup-employeeId", details.employeeId);
    
    updateText("p-employeePosition", details.employeePosition);
    updateText("p-dup-employeePosition", details.employeePosition);
    
    updateText("p-periodText", details.periodText);
    updateText("p-dup-periodText", details.periodText);
    
    updateText("p-paymentDay", details.paymentDay);
    updateText("p-dup-paymentDay", details.paymentDay);
    
    updateText("p-paymentMonth", details.paymentMonthText);
    updateText("p-dup-paymentMonth", details.paymentMonthText);
    
    updateText("p-paymentYear", details.paymentYearText);
    updateText("p-dup-paymentYear", details.paymentYearText);

    // Render Totals
    updateText("p-totalGross", `₡${formatColones(details.finalGross)}`);
    updateText("p-dup-totalGross", `₡${formatColones(details.finalGross)}`);
    
    updateText("p-totalDeductions", `₡${formatColones(details.finalDeductions)}`);
    updateText("p-dup-totalDeductions", `₡${formatColones(details.finalDeductions)}`);
    
    updateText("p-netSalary", `₡${formatColones(details.finalNet)}`);
    updateText("p-dup-netSalary", `₡${formatColones(details.finalNet)}`);
}

// Resets everything to blanks
function clearAllFields() {
    document.getElementById("employeeName").value = "";
    document.getElementById("employeeId").value = "";
    document.getElementById("employeePosition").value = "";
    document.getElementById("hourlyRate").value = 0;
    document.getElementById("hourlyRateNocturna").value = 0;
    
    document.getElementById("hoursDiurnas").value = 0;
    document.getElementById("hoursNocturnas").value = 0;
    document.getElementById("hoursDescanso").value = 0;
    document.getElementById("hoursExtrasDiurnas").value = 0;
    document.getElementById("hoursExtrasNocturnas").value = 0;
    if (document.getElementById("hoursFeriadoDoble")) {
        document.getElementById("hoursFeriadoDoble").value = 0;
    }
    
    document.getElementById("ccssAuto").checked = true;
    document.getElementById("ccssPercentage").value = 10.83;
    document.getElementById("ccssManualAmount").value = 0;
    
    document.getElementById("overrideTotals").checked = false;
    document.getElementById("manualGross").value = 0;
    document.getElementById("manualNet").value = 0;
    
    document.getElementById("holidaysList").innerHTML = "";
    document.getElementById("earningsList").innerHTML = "";
    document.getElementById("deductionsList").innerHTML = "";
    
    toggleCcssGroup();
    toggleOverrideGroup();
}

// Colones Currency Formatter (e.g. 15000.5 -> "15,000.50")
function formatColones(num) {
    return Number(num).toLocaleString('es-CR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
