// ===== RETIMBRASUR - Sistema de Inspección PCI =====
const APP_VERSION = 'v2.0.0';
console.log(`%c🔥 RETIMBRASUR ${APP_VERSION}`, 'color: #ff6b35; font-size: 16px; font-weight: bold;');
console.log('%c✅ Cambios en esta versión:', 'color: #10b981; font-weight: bold;');
console.log('   • Datos de presión se guardan correctamente');
console.log('   • Gráficas muestran datos reales');
console.log('   • Dictado por voz mejorado con auto-reinicio');

// ===== AppSheet Integration =====
// Parse URL parameters from AppSheet
function getURLParameters() {
    const params = new URLSearchParams(window.location.search);
    return {
        // Client and Work Center Info
        clientId: params.get('clientId') || '',
        clientName: params.get('clientName') || '',
        clientAddress: params.get('clientAddress') || '',
        clientPhone: params.get('clientPhone') || '',
        workCenterId: params.get('workCenterId') || '',
        workCenterName: params.get('workCenterName') || '',
        workCenterAddress: params.get('workCenterAddress') || '',

        // Equipment Info (if coming from specific equipment)
        equipmentId: params.get('equipmentId') || '',
        equipmentType: params.get('equipmentType') || '',
        equipmentLocation: params.get('equipmentLocation') || '',

        // Technician Info
        technicianName: params.get('technicianName') || '',
        technicianId: params.get('technicianId') || '',

        // AppSheet callback URL
        returnUrl: params.get('returnUrl') || '',
        appsheetMode: params.get('appsheetMode') === 'true'
    };
}

// Global variable to store AppSheet data
const appSheetData = getURLParameters();

// Function to send data back to AppSheet
function sendDataToAppSheet(inspection) {
    if (!appSheetData.returnUrl) {
        console.log('No return URL specified, data will only be stored locally');
        return;
    }

    // Prepare data for AppSheet
    const appSheetPayload = {
        inspectionId: inspection.id,
        clientId: appSheetData.clientId,
        workCenterId: appSheetData.workCenterId,
        equipmentType: inspection.equipmentType,
        equipmentId: inspection.equipmentId,
        location: inspection.location,
        inspectionDate: inspection.inspectionDate,
        technician: inspection.technician,
        status: inspection.status,

        // Results summary
        totalItems: inspection.checklist.length,
        conformeCount: inspection.checklist.filter(i => i.status === 'ok').length,
        warningCount: inspection.checklist.filter(i => i.status === 'warning').length,
        errorCount: inspection.checklist.filter(i => i.status === 'error').length,
        completionPercentage: Math.round((inspection.checklist.filter(i => i.checked).length / inspection.checklist.length) * 100),

        // Detailed results
        checklistResults: JSON.stringify(inspection.checklist),
        observations: inspection.observations,
        recommendations: inspection.recommendations,

        // Timestamps
        createdAt: inspection.createdAt,
        updatedAt: inspection.updatedAt
    };

    // Create form to submit data back to AppSheet
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = appSheetData.returnUrl;

    // Add all data as hidden fields
    Object.keys(appSheetPayload).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = appSheetPayload[key];
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
}

// ===== Work Center Management =====
let workCenters = JSON.parse(localStorage.getItem('workCenters')) || [];
let currentWorkCenter = null;

// Load work centers from localStorage
function loadWorkCenters() {
    workCenters = JSON.parse(localStorage.getItem('workCenters')) || [];
    return workCenters;
}

// Save work center
function saveWorkCenter(center) {
    const existingIndex = workCenters.findIndex(c => c.id === center.id);

    if (existingIndex >= 0) {
        workCenters[existingIndex] = {
            ...workCenters[existingIndex],
            ...center,
            updatedAt: new Date().toISOString()
        };
    } else {
        workCenters.push({
            ...center,
            id: center.id || generateId(),
            equipment: center.equipment || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    localStorage.setItem('workCenters', JSON.stringify(workCenters));
    return workCenters[existingIndex >= 0 ? existingIndex : workCenters.length - 1];
}

// Delete work center
function deleteWorkCenter(centerId) {
    workCenters = workCenters.filter(c => c.id !== centerId);
    localStorage.setItem('workCenters', JSON.stringify(workCenters));
}

// Get work center by ID
function getWorkCenter(centerId) {
    return workCenters.find(c => c.id === centerId);
}

// Add equipment to work center
function addEquipmentToCenter(centerId, equipment) {
    const center = getWorkCenter(centerId);
    if (!center) return null;

    const existingEquipmentIndex = center.equipment.findIndex(e => e.id === equipment.id);

    if (existingEquipmentIndex >= 0) {
        center.equipment[existingEquipmentIndex] = {
            ...center.equipment[existingEquipmentIndex],
            ...equipment,
            updatedAt: new Date().toISOString()
        };
    } else {
        center.equipment.push({
            ...equipment,
            id: equipment.id || generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    saveWorkCenter(center);
    return center;
}

// Remove equipment from work center
function removeEquipmentFromCenter(centerId, equipmentId) {
    const center = getWorkCenter(centerId);
    if (!center) return null;

    center.equipment = center.equipment.filter(e => e.id !== equipmentId);
    saveWorkCenter(center);
    return center;
}

// Get equipment by center
function getEquipmentByCenter(centerId) {
    const center = getWorkCenter(centerId);
    return center ? center.equipment : [];
}

// Get equipment by ID from center
function getEquipmentById(centerId, equipmentId) {
    // Validate parameters
    if (!centerId || !equipmentId) {
        console.warn('getEquipmentById: centerId or equipmentId is missing');
        return null;
    }

    const equipment = getEquipmentByCenter(centerId);

    // Validate equipment array exists
    if (!equipment || !Array.isArray(equipment)) {
        console.warn(`getEquipmentById: No equipment found for center ${centerId}`);
        return null;
    }

    return equipment.find(e => e.id === equipmentId) || null;
}

// ===== Data Structures =====
const equipmentTypes = {
    'extintores': {
        name: 'Extintores',
        icon: '🧯',
        checklist: [
            'Accesibilidad y señalización correcta',
            'Precinto y pasador en buen estado',
            'Presión del manómetro en zona verde',
            'Manguera y boquilla sin obstrucciones',
            'Etiqueta de mantenimiento visible',
            'Ausencia de golpes o corrosión',
            'Peso correcto del extintor',
            'Soporte de pared en buen estado',
            'Distancia al suelo correcta (80-120cm)',
            'Fecha de caducidad vigente',
            'Instrucciones de uso legibles',
            'Ausencia de fugas o derrames'
        ]
    },
    'bies': {
        name: 'BIEs (Bocas de Incendio Equipadas)',
        icon: '🚰',
        checklist: [
            'Armario en buen estado y señalizado',
            'Puerta del armario abre correctamente',
            'Manguera sin deterioros ni roturas',
            'Lanza y boquilla en buen estado',
            'Válvula de apertura funcional',
            'Manómetro en zona operativa',
            'Racores sin fugas',
            'Devanadera gira correctamente',
            'Cristal del armario intacto',
            'Iluminación de emergencia funcional',
            'Ausencia de obstrucciones',
            'Etiqueta de revisión actualizada',
            'Conexión a red sin fugas',
            'Longitud de manguera adecuada',
            'Junta de racor en buen estado'
        ]
    },
    'grupos-presion': {
        name: 'Grupos de Presión',
        icon: '⚙️',
        checklist: [
            'Bomba principal funciona correctamente',
            'Bomba jockey operativa',
            'Presiones de arranque y paro correctas',
            'Manómetros calibrados y legibles',
            'Ausencia de fugas en tuberías',
            'Válvulas de retención operativas',
            'Cuadro eléctrico sin anomalías',
            'Alarmas acústicas y visuales funcionales',
            'Nivel de combustible adecuado (si diesel)',
            'Baterías en buen estado',
            'Ventilación del local adecuada',
            'Drenajes libres de obstrucciones',
            'Depósito de agua con nivel correcto',
            'Válvulas de prueba operativas',
            'Registro de arranques actualizado',
            'Ausencia de vibraciones anormales',
            'Sistema de control automático funcional',
            'Iluminación de emergencia operativa'
        ]
    },
    'hidrantes': {
        name: 'Hidrantes y Monitores',
        icon: '🚿',
        checklist: [
            'Accesibilidad sin obstáculos',
            'Señalización visible',
            'Tapa y cuerpo sin daños',
            'Válvula de apertura/cierre funcional',
            'Racores en buen estado',
            'Ausencia de fugas',
            'Drenaje operativo',
            'Pintura en buen estado',
            'Distancia a edificios correcta',
            'Presión de servicio adecuada',
            'Tapones de racor presentes',
            'Cadenas de tapa en buen estado',
            'Arqueta sin agua acumulada',
            'Válvula de pie operativa'
        ]
    },
    'gas': {
        name: 'Extinción por Gas',
        icon: '💨',
        checklist: [
            'Botellas con presión correcta',
            'Manómetros en zona verde',
            'Válvulas de disparo operativas',
            'Sistema de detección funcional',
            'Pulsadores manuales accesibles',
            'Señalización de zona protegida',
            'Sirenas de pre-descarga funcionales',
            'Cerramientos herméticos',
            'Compuertas de ventilación operativas',
            'Peso de botellas correcto',
            'Ausencia de corrosión en botellas',
            'Etiquetas de identificación legibles',
            'Sistema de retardo funcional',
            'Pulsadores de aborto operativos',
            'Iluminación de emergencia',
            'Ventilación post-descarga funcional',
            'Cuadro de control sin alarmas',
            'Baterías de respaldo cargadas',
            'Registro de inspecciones actualizado',
            'Certificado de agente extintor vigente'
        ]
    },
    'sprinklers': {
        name: 'Sprinklers (Rociadores)',
        icon: '💧',
        checklist: [
            'Rociadores sin obstrucciones',
            'Ausencia de pintura en rociadores',
            'Deflectores en buen estado',
            'Distancia a almacenamiento correcta',
            'Válvula de alarma operativa',
            'Presostatos funcionales',
            'Gong de alarma audible',
            'Manómetros en zona correcta',
            'Válvulas de control abiertas y precintadas',
            'Ausencia de fugas en tuberías',
            'Drenajes operativos',
            'Rociadores de repuesto disponibles',
            'Etiquetas de identificación presentes',
            'Sistema de supervisión funcional',
            'Compresores de aire operativos (sistema seco)',
            'Ausencia de corrosión en tuberías'
        ]
    },
    'agua-pulverizada': {
        name: 'Agua Pulverizada - Diluvio',
        icon: '🌊',
        checklist: [
            'Boquillas sin obstrucciones',
            'Válvula de diluvio operativa',
            'Sistema de detección funcional',
            'Presostatos calibrados',
            'Manómetros legibles',
            'Ausencia de fugas',
            'Filtros limpios',
            'Drenajes operativos',
            'Válvulas de prueba funcionales',
            'Cuadro de control sin alarmas',
            'Cableado en buen estado',
            'Señalización adecuada',
            'Pulsadores manuales accesibles',
            'Sistema de supervisión activo',
            'Baterías de respaldo cargadas',
            'Registro de pruebas actualizado',
            'Ausencia de corrosión en boquillas'
        ]
    },
    'deteccion': {
        name: 'Sistemas de Detección',
        icon: '🔔',
        checklist: [
            'Central de detección sin alarmas',
            'Detectores limpios y operativos',
            'Pulsadores manuales funcionales',
            'Sirenas audibles en toda la zona',
            'Señalización luminosa operativa',
            'Baterías de respaldo cargadas',
            'Cableado sin daños visibles',
            'Etiquetas de identificación presentes',
            'Zonas correctamente identificadas',
            'Ausencia de detectores obstruidos',
            'Prueba de funcionamiento positiva',
            'Registro de eventos actualizado',
            'Conexión a central receptora activa',
            'Módulos de control operativos',
            'Ausencia de falsos positivos',
            'Iluminación de emergencia funcional',
            'Planos de zonas actualizados',
            'Personal formado en uso del sistema',
            'Protocolo de evacuación visible',
            'Simulacros realizados según normativa',
            'Certificado de instalación vigente',
            'Mantenimiento preventivo al día'
        ]
    },
    'espuma': {
        name: 'Sistemas de Espuma',
        icon: '🧼',
        checklist: [
            'Tanque de espumógeno con nivel correcto',
            'Concentración de espumógeno adecuada',
            'Proporcionador calibrado',
            'Lanzas de espuma operativas',
            'Cámaras de espuma sin obstrucciones',
            'Válvulas de control funcionales',
            'Manómetros en zona correcta',
            'Ausencia de fugas en sistema',
            'Mangueras en buen estado',
            'Drenajes operativos',
            'Etiquetas de identificación legibles',
            'Fecha de caducidad de espumógeno vigente',
            'Sistema de dosificación preciso',
            'Prueba de descarga satisfactoria',
            'Ausencia de contaminación en tanque',
            'Filtros limpios',
            'Válvulas de alivio operativas',
            'Señalización adecuada',
            'Registro de recargas actualizado'
        ]
    },
    'puertas-rf': {
        name: 'Puertas Resistentes al Fuego',
        icon: '🚪',
        checklist: [
            'Cierre automático funcional',
            'Ausencia de obstáculos en recorrido',
            'Juntas intumescentes en buen estado',
            'Cerradura y pestillos operativos',
            'Bisagras sin holguras',
            'Señalización visible',
            'Ausencia de daños en hoja',
            'Marco sin deformaciones',
            'Retenedor electromagnético funcional',
            'Etiqueta de certificación presente'
        ]
    }
};

// ===== State Management =====
let currentEquipmentType = null;
let inspections = JSON.parse(localStorage.getItem('inspections')) || [];
let currentInspection = null;

// ===== INSPECTION REMINDER SYSTEM =====
// Periodicidad de inspecciones por tipo de equipo (en meses)
const inspectionPeriodicity = {
    'extintores': 12,           // Anual
    'bies': 12,                 // Anual
    'grupos-presion': 12,       // Anual
    'hidrantes': 12,            // Anual
    'gas': 12,                  // Anual
    'sprinklers': 12,           // Anual
    'agua-pulverizada': 12,     // Anual
    'deteccion': 12,            // Anual
    'espuma': 12,               // Anual
    'puertas-rf': 12            // Anual
};

// Calculate next inspection date
function calculateNextInspection(lastDate, equipmentType) {
    if (!lastDate) return null;

    const months = inspectionPeriodicity[equipmentType] || 12;
    const nextDate = new Date(lastDate);
    nextDate.setMonth(nextDate.getMonth() + months);

    return nextDate;
}

// Get inspection status based on next inspection date
// Returns: 'ok' (green), 'warning' (yellow), 'overdue' (red)
function getInspectionStatus(nextInspectionDate) {
    if (!nextInspectionDate) return 'unknown';

    const today = new Date();
    const next = new Date(nextInspectionDate);
    const diffTime = next - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return 'overdue';  // Vencido (rojo)
    } else if (diffDays <= 30) {
        return 'warning';  // Próximo a vencer (amarillo)
    } else {
        return 'ok';       // Al día (verde)
    }
}

// Get days until/since inspection
function getDaysUntilInspection(nextInspectionDate) {
    if (!nextInspectionDate) return null;

    const today = new Date();
    const next = new Date(nextInspectionDate);
    const diffTime = next - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

// Get status badge HTML for equipment card
function getInspectionStatusBadge(status, daysUntil) {
    const badges = {
        'ok': {
            class: 'inspection-badge-ok',
            icon: '✓',
            text: 'Al día'
        },
        'warning': {
            class: 'inspection-badge-warning',
            icon: '⚠️',
            text: daysUntil > 0 ? `${daysUntil} días` : 'Próximo'
        },
        'overdue': {
            class: 'inspection-badge-overdue',
            icon: '✗',
            text: daysUntil < 0 ? `Vencido ${Math.abs(daysUntil)}d` : 'Vencido'
        },
        'unknown': {
            class: 'inspection-badge-unknown',
            icon: '?',
            text: 'Sin datos'
        }
    };

    const badge = badges[status] || badges['unknown'];
    return `<span class="${badge.class}">${badge.icon} ${badge.text}</span>`;
}

// ===== DOM Elements =====
// ===== DOM Elements =====
let screens = {};

// ===== Utility Functions =====
function showScreen(screenName) {
    console.log('Showing screen:', screenName); // Debug log
    Object.values(screens).forEach(screen => {
        if (screen) screen.classList.remove('active');
    });
    if (screens[screenName]) {
        screens[screenName].classList.add('active');
    } else {
        console.error('Screen not found:', screenName);
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
        <span>${message}</span>
    `;

    document.getElementById('toastContainer').appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===== Equipment Selection =====
// ===== Equipment Selection =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    screens = {
        welcome: document.getElementById('welcomeScreen'),
        inspection: document.getElementById('inspectionScreen'),
        history: document.getElementById('historyScreen')
    };

    console.log('DOM initialized, screens:', screens);

    document.querySelectorAll('.equipment-card').forEach(card => {
        card.addEventListener('click', () => {
            const type = card.dataset.type;
            console.log('Card clicked:', type); // Debug log
            startInspection(type);
        });
    });
});

function startInspection(type) {
    console.log('startInspection called with:', type);
    currentEquipmentType = type;
    const equipment = equipmentTypes[type];
    console.log('Equipment found:', equipment);

    document.getElementById('equipmentTitle').textContent = `Inspección: ${equipment.name}`;
    document.getElementById('equipmentSubtitle').textContent = `${equipment.checklist.length} puntos de verificación`;

    // Set current date
    console.log('Setting date...');
    const dateInput = document.getElementById('inspectionDate');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    } else {
        console.error('Date input not found!');
    }

    // Generate checklist
    console.log('Generating checklist...');
    generateChecklist(equipment.checklist);

    // Handle specific data for Pressure Groups
    console.log('Handling specific data...');
    const specificContainer = document.getElementById('specificDataContainer');
    specificContainer.innerHTML = '';

    if (type === 'grupos-presion') {
        specificContainer.innerHTML = `
            <div class="form-section">
                <h3 class="section-title">Datos Técnicos del Grupo de Presión</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="nominalFlow">Caudal Nominal (m³/h)</label>
                        <input type="number" id="nominalFlow" step="0.1" placeholder="Qn">
                    </div>
                    <div class="form-group">
                        <label for="nominalPressure">Presión Nominal (bar)</label>
                        <input type="number" id="nominalPressure" step="0.1" placeholder="Pn">
                    </div>
                    <div class="form-group">
                        <label for="rpm">Velocidad (RPM)</label>
                        <input type="number" id="rpm" placeholder="RPM">
                    </div>
                </div>
                
                <h4 style="margin-top: 15px; margin-bottom: 10px; color: var(--text-primary);">Curva de Comportamiento (Prueba de Caudal)</h4>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="pressureZero">Presión a Caudal Cero (0%)</label>
                        <input type="number" id="pressureZero" step="0.1" placeholder="Bar">
                    </div>
                    <div class="form-group">
                        <label for="pressure50">Presión a Caudal 50%</label>
                        <input type="number" id="pressure50" step="0.1" placeholder="Bar">
                    </div>
                    <div class="form-group">
                        <label for="pressureNominal">Presión a Caudal Nominal (100%)</label>
                        <input type="number" id="pressureNominal" step="0.1" placeholder="Bar">
                    </div>
                    <div class="form-group">
                        <label for="pressureOverload">Presión a Sobrecarga (140%)</label>
                        <input type="number" id="pressureOverload" step="0.1" placeholder="Bar">
                    </div>
                </div>
            </div>
        `;
    }

    // Reset form
    console.log('Resetting form...');
    resetInspectionForm();

    console.log('Showing inspection screen...');
    showScreen('inspection');
    updateProgress();
}

function resetInspectionForm() {
    document.getElementById('equipmentId').value = '';
    document.getElementById('location').value = '';
    document.getElementById('manufacturer').value = '';
    document.getElementById('brand').value = '';
    document.getElementById('model').value = '';
    document.getElementById('observations').value = '';
    document.getElementById('recommendations').value = '';

    // Clear specific data inputs if they exist
    const specificInputs = ['nominalFlow', 'nominalPressure', 'rpm', 'pressureZero', 'pressure50', 'pressureNominal', 'pressureOverload'];
    specificInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });
}

function generateChecklist(items) {
    const container = document.getElementById('checklistContainer');
    container.innerHTML = '';

    items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'checklist-item';
        div.innerHTML = `
            <input type="checkbox" id="check-${index}" data-index="${index}">
            <label for="check-${index}">${item}</label>
            <select class="status-select" data-index="${index}">
                <option value="">Sin revisar</option>
                <option value="ok">✓ Conforme</option>
                <option value="warning">⚠ Observación</option>
                <option value="error">✗ No conforme</option>
            </select>
        `;
        container.appendChild(div);
    });

    // Add event listeners
    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateProgress);
    });

    container.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', updateProgress);
    });
}

function updateProgress() {
    const checkboxes = document.querySelectorAll('#checklistContainer input[type="checkbox"]');
    const checked = document.querySelectorAll('#checklistContainer input[type="checkbox"]:checked').length;
    const percentage = Math.round((checked / checkboxes.length) * 100);

    document.getElementById('progressText').textContent = `${percentage}%`;
}

// ===== Form Submission =====
document.getElementById('submitBtn').addEventListener('click', () => {
    if (validateForm()) {
        saveInspection('completed');

        // If in AppSheet mode and has return URL, send data back
        if (appSheetData.appsheetMode && appSheetData.returnUrl && currentInspection) {
            showToast('Enviando datos a AppSheet...', 'info');
            setTimeout(() => {
                sendDataToAppSheet(currentInspection);
            }, 1500);
        } else {
            showModal();
        }
    }
});

document.getElementById('saveDraftBtn').addEventListener('click', () => {
    if (validateBasicInfo()) {
        saveInspection('draft');
        showToast('Borrador guardado correctamente', 'success');
        showScreen('welcome');
    }
});

function validateBasicInfo() {
    const equipmentId = document.getElementById('equipmentId').value;
    const location = document.getElementById('location').value;
    const technician = document.getElementById('technician').value;

    if (!equipmentId || !location || !technician) {
        showToast('Por favor, completa la información básica del equipo', 'error');
        return false;
    }

    return true;
}

function validateForm() {
    if (!validateBasicInfo()) return false;

    const inspectionDate = document.getElementById('inspectionDate').value;
    if (!inspectionDate) {
        showToast('Por favor, selecciona la fecha de inspección', 'error');
        return false;
    }

    const checkboxes = document.querySelectorAll('#checklistContainer input[type="checkbox"]');
    const checked = document.querySelectorAll('#checklistContainer input[type="checkbox"]:checked').length;

    if (checked === 0) {
        showToast('Por favor, marca al menos un punto de verificación', 'error');
        return false;
    }

    return true;
}

function saveInspection(status) {
    const checklistItems = [];
    const equipment = equipmentTypes[currentEquipmentType];

    document.querySelectorAll('#checklistContainer .checklist-item').forEach((item, index) => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        const select = item.querySelector('.status-select');

        checklistItems.push({
            item: equipment.checklist[index],
            checked: checkbox.checked,
            status: select.value
        });
    });

    const inspection = {
        id: currentInspection?.id || generateId(),
        equipmentType: currentEquipmentType,
        equipmentName: equipment.name,
        equipmentId: document.getElementById('equipmentId').value,
        location: document.getElementById('location').value,
        inspectionDate: document.getElementById('inspectionDate').value,
        technician: document.getElementById('technician').value,
        manufacturer: document.getElementById('manufacturer').value,
        brand: document.getElementById('brand').value,
        model: document.getElementById('model').value,
        manufacturingDate: document.getElementById('manufacturingDate').value,
        lastRetestDate: document.getElementById('lastRetestDate').value,
        observations: document.getElementById('observations').value,
        recommendations: document.getElementById('recommendations').value,
        checklist: checklistItems,
        status: status,
        createdAt: currentInspection?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),

        // Work Center data
        workCenterId: currentWorkCenter?.id || null,
        workCenterName: currentWorkCenter?.name || null,

        // AppSheet integration data
        clientId: appSheetData.clientId || currentWorkCenter?.clientId,
        clientName: appSheetData.clientName || currentWorkCenter?.clientName,
        clientAddress: appSheetData.clientAddress,
        clientPhone: appSheetData.clientPhone || currentWorkCenter?.phone,
        technicianId: appSheetData.technicianId
    };

    // Add pressure group specific fields if applicable
    if (currentEquipmentType === 'grupos-presion') {
        const nominalFlowEl = document.getElementById('nominalFlow');
        const nominalPressureEl = document.getElementById('nominalPressure');
        const powerEl = document.getElementById('power');
        const rpmEl = document.getElementById('rpm');
        const pressureZeroEl = document.getElementById('pressureZero');
        const pressure50El = document.getElementById('pressure50');
        const pressureNominalEl = document.getElementById('pressureNominal');
        const pressureOverloadEl = document.getElementById('pressureOverload');

        if (nominalFlowEl) inspection.nominalFlow = nominalFlowEl.value;
        if (nominalPressureEl) inspection.nominalPressure = nominalPressureEl.value;
        if (powerEl) inspection.power = powerEl.value;
        if (rpmEl) inspection.rpm = rpmEl.value;
        if (pressureZeroEl) inspection.pressureZero = pressureZeroEl.value;
        if (pressure50El) inspection.pressure50 = pressure50El.value;
        if (pressureNominalEl) inspection.pressureNominal = pressureNominalEl.value;
        if (pressureOverloadEl) inspection.pressureOverload = pressureOverloadEl.value;
    }

    // Save equipment to work center if checkbox is checked
    const saveEquipmentCheck = document.getElementById('saveEquipmentCheck');
    if (saveEquipmentCheck && saveEquipmentCheck.checked && currentWorkCenter) {
        const equipmentData = {
            id: currentEquipmentId || inspection.equipmentId,
            type: currentEquipmentType,
            location: inspection.location,
            manufacturer: inspection.manufacturer,
            brand: inspection.brand,
            model: inspection.model,
            manufacturingDate: inspection.manufacturingDate,
            lastRetestDate: inspection.lastRetestDate
        };

        addEquipmentToCenter(currentWorkCenter.id, equipmentData);
        console.log('Equipment saved to center:', equipmentData);
    }

    // Update or add inspection
    const existingIndex = inspections.findIndex(i => i.id === inspection.id);
    if (existingIndex >= 0) {
        inspections[existingIndex] = inspection;
    } else {
        inspections.push(inspection);
    }

    localStorage.setItem('inspections', JSON.stringify(inspections));
    currentInspection = inspection;
}

// ===== Modal & Report Generation =====
function showModal() {
    const modal = document.getElementById('reportModal');
    const reportContent = document.getElementById('reportContent');

    reportContent.innerHTML = generateReportHTML();
    modal.classList.add('active');

    // Render chart if it's a pressure group inspection
    if (currentInspection.equipmentType === 'grupos-presion') {
        setTimeout(() => {
            renderPressureChart(currentInspection);
        }, 100);
    }
}

// Handle all modal close buttons
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) {
            modal.classList.remove('active');
        }
    });
});

document.getElementById('closeModalBtn').addEventListener('click', () => {
    document.getElementById('reportModal').classList.remove('active');
    showScreen('welcome');
});

function generateReportHTML() {
    const inspection = currentInspection;
    const equipment = equipmentTypes[inspection.equipmentType];

    const conformeCount = inspection.checklist.filter(i => i.status === 'ok').length;
    const warningCount = inspection.checklist.filter(i => i.status === 'warning').length;
    const errorCount = inspection.checklist.filter(i => i.status === 'error').length;

    return `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
            <!-- Header with Logo -->
            <div style="text-align: center; margin-bottom: 30px; padding: 30px 20px; background: linear-gradient(135deg, #ff6b35, #004e89); color: white; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <div style="margin-bottom: 15px;">
                    <div style="background: white; width: 120px; height: 60px; margin: 0 auto; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                        <span style="color: #ff6b35; font-size: 20px; font-weight: 800;">RETIMBRASUR</span>
                    </div>
                </div>
                <h1 style="margin: 15px 0 0 0; font-size: 26px; font-weight: 800; letter-spacing: 1px;">INFORME DE INSPECCIÓN</h1>
                <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.95;">${equipment.name}</p>
            </div>
            
            ${inspection.clientName ? `
            <div style="margin-bottom: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Información del Cliente</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px; font-weight: bold; width: 40%;">Cliente:</td>
                        <td style="padding: 8px;">${inspection.clientName}</td>
                    </tr>
                    ${inspection.clientAddress ? `
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Dirección:</td>
                        <td style="padding: 8px;">${inspection.clientAddress}</td>
                    </tr>
                    ` : ''}
                    ${inspection.clientPhone ? `
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Teléfono:</td>
                        <td style="padding: 8px;">${inspection.clientPhone}</td>
                    </tr>
                    ` : ''}
                    ${inspection.workCenterName ? `
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Centro de Trabajo:</td>
                        <td style="padding: 8px;">${inspection.workCenterName}</td>
                    </tr>
                    ` : ''}
                    ${inspection.workCenterAddress ? `
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Dirección del Centro:</td>
                        <td style="padding: 8px;">${inspection.workCenterAddress}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>
            ` : ''}
            
            <div style="margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Información del Equipo</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px; font-weight: bold; width: 40%;">ID del Equipo:</td>
                        <td style="padding: 8px;">${inspection.equipmentId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Ubicación:</td>
                        <td style="padding: 8px;">${inspection.location}</td>
                    </tr>
                    ${inspection.manufacturer ? `
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Fabricante:</td>
                        <td style="padding: 8px;">${inspection.manufacturer}</td>
                    </tr>
                    ` : ''}
                    ${inspection.brand ? `
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Marca:</td>
                        <td style="padding: 8px;">${inspection.brand}</td>
                    </tr>
                    ` : ''}
                    ${inspection.model ? `
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Modelo:</td>
                        <td style="padding: 8px;">${inspection.model}</td>
                    </tr>
                    ` : ''}
                    ${inspection.manufacturingDate ? `
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Fecha de Fabricación:</td>
                        <td style="padding: 8px;">${formatDate(inspection.manufacturingDate)}</td>
                    </tr>
                    ` : ''}
                    ${inspection.lastRetestDate ? `
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Último Retimbrado:</td>
                        <td style="padding: 8px;">${formatDate(inspection.lastRetestDate)}</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Fecha de Inspección:</td>
                        <td style="padding: 8px;">${formatDate(inspection.inspectionDate)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Técnico:</td>
                        <td style="padding: 8px;">${inspection.technician}</td>
                    </tr>
                </table>
            </div>
            
                </table>
            </div>

            ${inspection.nominalFlow || inspection.nominalPressure ? `
            <div style="margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Datos Técnicos del Grupo de Presión</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                    <tr>
                        <td style="padding: 8px; font-weight: bold; width: 33%;">Caudal Nominal:</td>
                        <td style="padding: 8px; width: 33%;">${inspection.nominalFlow || '-'} m³/h</td>
                        <td style="padding: 8px; font-weight: bold; width: 33%;">Presión Nominal:</td>
                        <td style="padding: 8px;">${inspection.nominalPressure || '-'} bar</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Velocidad:</td>
                        <td style="padding: 8px;">${inspection.rpm || '-'} RPM</td>
                        <td colspan="2"></td>
                    </tr>
                </table>
                
                <h4 style="margin: 0 0 10px 0; color: #555;">Curva de Comportamiento (Prueba de Caudal)</h4>
                
                <!-- Canvas for Chart.js -->
                <div style="width: 100%; height: 300px; margin-bottom: 20px;">
                    <canvas id="curveChart"></canvas>
                </div>

                <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
                    <tr style="background: #e0e0e0;">
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Punto de Prueba</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Caudal</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Presión Leída</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Estado</th>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Caudal Cero (0%)</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">0 m³/h</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${inspection.pressureZero || '-'} bar</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">-</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Caudal 50%</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${inspection.nominalFlow ? (inspection.nominalFlow * 0.5).toFixed(1) : '-'} m³/h</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${inspection.pressure50 || '-'} bar</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">-</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Caudal Nominal (100%)</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${inspection.nominalFlow || '-'} m³/h</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${inspection.pressureNominal || '-'} bar</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: ${inspection.pressureNominal >= inspection.nominalPressure ? 'green' : 'red'}; font-weight: bold;">
                            ${inspection.pressureNominal >= inspection.nominalPressure ? 'CUMPLE' : 'NO CUMPLE'}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Sobrecarga (140%)</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${inspection.nominalFlow ? (inspection.nominalFlow * 1.4).toFixed(1) : '-'} m³/h</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${inspection.pressureOverload || '-'} bar</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: ${inspection.pressureOverload >= (inspection.nominalPressure * 0.7) ? 'green' : 'red'}; font-weight: bold;">
                            ${inspection.pressureOverload >= (inspection.nominalPressure * 0.7) ? 'CUMPLE' : 'NO CUMPLE'}
                        </td>
                    </tr>
                </table>
            </div>
            ` : ''}
            
            <div style="margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Resumen de Resultados</h3>
                <div style="display: flex; gap: 10px; justify-content: space-around;">
                    <div style="text-align: center; padding: 10px; background: #10b981; color: white; border-radius: 8px; flex: 1;">
                        <div style="font-size: 24px; font-weight: bold;">${conformeCount}</div>
                        <div style="font-size: 12px;">Conforme</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #f59e0b; color: white; border-radius: 8px; flex: 1;">
                        <div style="font-size: 24px; font-weight: bold;">${warningCount}</div>
                        <div style="font-size: 12px;">Observaciones</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #ef4444; color: white; border-radius: 8px; flex: 1;">
                        <div style="font-size: 24px; font-weight: bold;">${errorCount}</div>
                        <div style="font-size: 12px;">No Conforme</div>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Lista de Verificación</h3>
                <table style="width: 100%; border-collapse: collapse; background: white;">
                    <thead>
                        <tr style="background: #333; color: white;">
                            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Punto de Verificación</th>
                            <th style="padding: 10px; text-align: center; border: 1px solid #ddd; width: 120px;">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${inspection.checklist.map(item => `
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd;">${item.item}</td>
                                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                                    ${getStatusBadge(item.status)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            ${inspection.photos && inspection.photos.length > 0 ? `
                <div style="margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
                    <h3 style="margin: 0 0 15px 0; color: #333;">📸 Fotografías del Equipo (${inspection.photos.length})</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                        ${inspection.photos.map((photo, index) => `
                            <div style="position: relative; border: 2px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <img src="${photo}" style="width: 100%; height: auto; display: block;" alt="Foto ${index + 1}">
                                <div style="position: absolute; bottom: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                                    ${index + 1}/${inspection.photos.length}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : (inspection.photo ? `
                <div style="margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
                    <h3 style="margin: 0 0 15px 0; color: #333;">📸 Fotografía del Equipo</h3>
                    <div style="text-align: center;">
                        <img src="${inspection.photo}" style="max-width: 100%; height: auto; border: 2px solid #ddd; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" alt="Foto del equipo">
                    </div>
                </div>
            ` : '')}

            ${inspection.observations ? `
                <div style="margin-bottom: 20px; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">Observaciones</h3>
                    <p style="margin: 0; white-space: pre-wrap;">${inspection.observations}</p>
                </div>
            ` : ''}

            ${inspection.recommendations ? `
                <div style="margin-bottom: 20px; padding: 15px; background: #dbeafe; border-radius: 8px; border-left: 4px solid #3b82f6;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">Recomendaciones</h3>
                    <p style="margin: 0; white-space: pre-wrap;">${inspection.recommendations}</p>
                </div>
            ` : ''}

            ${inspection.technicianSignature || inspection.clientSignature ? `
                <div style="margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
                    <h3 style="margin: 0 0 15px 0; color: #333;">✍️ Firmas</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                        ${inspection.technicianSignature ? `
                            <div style="text-align: center;">
                                <p style="margin: 0 0 10px 0; font-weight: 600; color: #555;">Firma del Técnico</p>
                                <div style="background: white; padding: 10px; border: 2px solid #ddd; border-radius: 8px;">
                                    <img src="${inspection.technicianSignature}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" alt="Firma del técnico">
                                </div>
                            </div>
                        ` : ''}
                        ${inspection.clientSignature ? `
                            <div style="text-align: center;">
                                <p style="margin: 0 0 10px 0; font-weight: 600; color: #555;">Firma del Cliente</p>
                                <div style="background: white; padding: 10px; border: 2px solid #ddd; border-radius: 8px;">
                                    <img src="${inspection.clientSignature}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" alt="Firma del cliente">
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}

            <!-- Professional Footer -->
            <div style="margin-top: 40px; padding: 25px; background: linear-gradient(135deg, #1e293b, #334155); color: white; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 15px;">
                    <h3 style="margin: 0 0 5px 0; font-size: 18px; color: #ff6b35;">RETIMBRASUR</h3>
                    <p style="margin: 0; font-size: 13px; opacity: 0.9;">Protección Contra Incendios - Inspección y Mantenimiento</p>
                </div>
                <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 15px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; font-size: 12px;">
                    <div>
                        <strong style="display: block; margin-bottom: 5px; color: #ff6b35;">📞 Contacto</strong>
                        <p style="margin: 0; opacity: 0.9;">Tel: +34 XXX XXX XXX</p>
                        <p style="margin: 3px 0 0 0; opacity: 0.9;">Email: info@retimbrasur.es</p>
                    </div>
                    <div>
                        <strong style="display: block; margin-bottom: 5px; color: #ff6b35;">📍 Dirección</strong>
                        <p style="margin: 0; opacity: 0.9;">Calle Ejemplo, 123</p>
                        <p style="margin: 3px 0 0 0; opacity: 0.9;">28001 Madrid, España</p>
                    </div>
                    <div>
                        <strong style="display: block; margin-bottom: 5px; color: #ff6b35;">📄 Documento</strong>
                        <p style="margin: 0; opacity: 0.9;">Fecha: ${formatDate(new Date())}</p>
                        <p style="margin: 3px 0 0 0; opacity: 0.9;">Sistema v1.0</p>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 11px; opacity: 0.8;">
                    <p style="margin: 0;">Este documento es confidencial y está destinado exclusivamente al cliente indicado.</p>
                    <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} RETIMBRASUR - Todos los derechos reservados</p>
                </div>
            </div>
        </div>
    `;
}

function getStatusBadge(status) {
    const badges = {
        'ok': '<span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">✓ Conforme</span>',
        'warning': '<span style="background: #f59e0b; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">⚠ Observación</span>',
        'error': '<span style="background: #ef4444; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">✗ No Conforme</span>',
        '': '<span style="background: #9ca3af; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">Sin revisar</span>'
    };
    return badges[status] || badges[''];
}

// ===== PDF Download =====
document.getElementById('downloadPdfBtn').addEventListener('click', () => {
    showToast('Generando PDF...', 'info');

    // In a real application, you would use a library like jsPDF or html2pdf
    // For now, we'll create a printable version
    const printWindow = window.open('', '', 'height=800,width=800');
    printWindow.document.write('<html><head><title>Informe de Inspección</title>');
    printWindow.document.write('<style>body{font-family: Arial, sans-serif; padding: 20px;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(document.getElementById('reportContent').innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();

    showToast('PDF generado correctamente', 'success');
});

// ===== History =====
document.getElementById('historyBtn').addEventListener('click', () => {
    loadHistory();
    showScreen('history');
});

// Back button from inspection screen
document.getElementById('backBtn').addEventListener('click', () => {
    showScreen('welcome');
});

document.getElementById('backToMainBtn').addEventListener('click', () => {
    showScreen('welcome');
});

function loadHistory(filter = 'all') {
    const historyList = document.getElementById('historyList');
    let filteredInspections = inspections;

    if (filter !== 'all') {
        filteredInspections = inspections.filter(i => i.equipmentType === filter);
    }

    if (filteredInspections.length === 0) {
        historyList.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                <div style="font-size: 4rem; margin-bottom: 20px;">📋</div>
                <h3>No hay inspecciones registradas</h3>
                <p>Las inspecciones completadas aparecerán aquí</p>
            </div>
        `;
        return;
    }

    historyList.innerHTML = filteredInspections
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .map(inspection => `
            <div class="history-item" data-id="${inspection.id}">
                <div class="history-info">
                    <h4>${inspection.equipmentName} - ${inspection.equipmentId}</h4>
                    <p>📍 ${inspection.location} | 👤 ${inspection.technician} | 📅 ${formatDate(inspection.inspectionDate)}</p>
                </div>
                <div class="history-status status-${inspection.status}">
                    ${inspection.status === 'completed' ? 'Completada' : 'Borrador'}
                </div>
            </div>
        `).join('');

    // Add click listeners
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            viewInspection(id);
        });
    });
}

document.getElementById('filterType').addEventListener('change', (e) => {
    loadHistory(e.target.value);
});

function viewInspection(id) {
    const inspection = inspections.find(i => i.id === id);
    if (!inspection) return;

    currentInspection = inspection;
    currentEquipmentType = inspection.equipmentType;

    const equipment = equipmentTypes[inspection.equipmentType];

    document.getElementById('equipmentTitle').textContent = `Inspección: ${equipment.name}`;
    document.getElementById('equipmentSubtitle').textContent = `Visualizando inspección guardada`;

    // Fill form with inspection data
    document.getElementById('equipmentId').value = inspection.equipmentId;
    document.getElementById('location').value = inspection.location;
    document.getElementById('manufacturer').value = inspection.manufacturer || '';
    document.getElementById('brand').value = inspection.brand || '';
    document.getElementById('model').value = inspection.model || '';
    document.getElementById('manufacturingDate').value = inspection.manufacturingDate || '';
    document.getElementById('lastRetestDate').value = inspection.lastRetestDate || '';
    document.getElementById('inspectionDate').value = inspection.inspectionDate;
    document.getElementById('technician').value = inspection.technician;
    document.getElementById('observations').value = inspection.observations;
    document.getElementById('recommendations').value = inspection.recommendations;

    // Generate checklist
    generateChecklist(equipment.checklist);

    // Handle specific data for Pressure Groups
    const specificContainer = document.getElementById('specificDataContainer');
    specificContainer.innerHTML = '';

    if (currentEquipmentType === 'grupos-presion') {
        specificContainer.innerHTML = `
            <div class="form-section">
                <h3 class="section-title">Datos Técnicos del Grupo de Presión</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="nominalFlow">Caudal Nominal (m³/h)</label>
                        <input type="number" id="nominalFlow" step="0.1" placeholder="Qn">
                    </div>
                    <div class="form-group">
                        <label for="nominalPressure">Presión Nominal (bar)</label>
                        <input type="number" id="nominalPressure" step="0.1" placeholder="Pn">
                    </div>
                    <div class="form-group">
                        <label for="rpm">Velocidad (RPM)</label>
                        <input type="number" id="rpm" placeholder="RPM">
                    </div>
                </div>
                
                <h4 style="margin-top: 15px; margin-bottom: 10px; color: var(--text-primary);">Curva de Comportamiento (Prueba de Caudal)</h4>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="pressureZero">Presión a Caudal Cero (0%)</label>
                        <input type="number" id="pressureZero" step="0.1" placeholder="Bar">
                    </div>
                    <div class="form-group">
                        <label for="pressure50">Presión a Caudal 50%</label>
                        <input type="number" id="pressure50" step="0.1" placeholder="Bar">
                    </div>
                    <div class="form-group">
                        <label for="pressureNominal">Presión a Caudal Nominal (100%)</label>
                        <input type="number" id="pressureNominal" step="0.1" placeholder="Bar">
                    </div>
                    <div class="form-group">
                        <label for="pressureOverload">Presión a Sobrecarga (140%)</label>
                        <input type="number" id="pressureOverload" step="0.1" placeholder="Bar">
                    </div>
                </div>
            </div>
        `;

        // Fill specific fields
        if (document.getElementById('nominalFlow')) document.getElementById('nominalFlow').value = inspection.nominalFlow || '';
        if (document.getElementById('nominalPressure')) document.getElementById('nominalPressure').value = inspection.nominalPressure || '';
        if (document.getElementById('rpm')) document.getElementById('rpm').value = inspection.rpm || '';
        if (document.getElementById('pressureZero')) document.getElementById('pressureZero').value = inspection.pressureZero || '';
        if (document.getElementById('pressure50')) document.getElementById('pressure50').value = inspection.pressure50 || '';
        if (document.getElementById('pressureNominal')) document.getElementById('pressureNominal').value = inspection.pressureNominal || '';
        if (document.getElementById('pressureOverload')) document.getElementById('pressureOverload').value = inspection.pressureOverload || '';
    }

    // Fill checklist with saved data
    inspection.checklist.forEach((item, index) => {
        const checkbox = document.querySelector(`#check-${index}`);
        const select = document.querySelector(`.status-select[data-index="${index}"]`);

        if (checkbox) checkbox.checked = item.checked;
        if (select) select.value = item.status;
    });

    updateProgress();
    showScreen('inspection');
}

// ===== Export to Excel (AppSheet Compatible Format) =====
document.getElementById('exportBtn').addEventListener('click', exportToExcel);

function exportToExcel() {
    if (inspections.length === 0) {
        showToast('No hay inspecciones para exportar', 'error');
        return;
    }

    // Check if XLSX library is loaded
    if (typeof XLSX === 'undefined') {
        console.warn('XLSX library not loaded, falling back to CSV');
        exportToCSV();
        return;
    }

    showToast('Generando archivo Excel...', 'info');

    // Prepare data in AppSheet format
    const excelData = inspections.map(inspection => {
        const conformeCount = inspection.checklist.filter(i => i.status === 'ok').length;
        const warningCount = inspection.checklist.filter(i => i.status === 'warning').length;
        const errorCount = inspection.checklist.filter(i => i.status === 'error').length;
        const totalItems = inspection.checklist.length;
        const completedItems = inspection.checklist.filter(i => i.checked).length;
        const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        // AppSheet format: Column names without spaces, ISO dates, clean structure
        return {
            'ID': inspection.id,
            'WorkCenter_ID': inspection.workCenterId || '',
            'WorkCenter_Name': inspection.workCenterName || '',
            'Equipment_Type': inspection.equipmentType || '',
            'Equipment_ID': inspection.equipmentId || '',
            'Location': inspection.location || '',
            'Manufacturer': inspection.manufacturer || '',
            'Brand': inspection.brand || '',
            'Model': inspection.model || '',
            'Manufacturing_Date': inspection.manufacturingDate || '',
            'Last_Retest_Date': inspection.lastRetestDate || '',
            'Inspection_Date': inspection.inspectionDate || '',
            'Technician': inspection.technician || '',
            'Technician_ID': inspection.technicianId || '',
            'Status': inspection.status || 'draft',
            'Total_Items': totalItems,
            'Checked_Items': completedItems,
            'OK_Count': conformeCount,
            'Warning_Count': warningCount,
            'Error_Count': errorCount,
            'Completion_Percentage': percentage,
            'Observations': inspection.observations || '',
            'Recommendations': inspection.recommendations || '',
            'Photo_Count': inspection.photos ? inspection.photos.length : (inspection.photo ? 1 : 0),
            'Has_Technician_Signature': inspection.technicianSignature ? 'YES' : 'NO',
            'Has_Client_Signature': inspection.clientSignature ? 'YES' : 'NO',
            'GPS_Latitude': inspection.gpsCoordinates ? inspection.gpsCoordinates.latitude : '',
            'GPS_Longitude': inspection.gpsCoordinates ? inspection.gpsCoordinates.longitude : '',
            'GPS_Accuracy': inspection.gpsCoordinates ? inspection.gpsCoordinates.accuracy : '',
            'Created_At': inspection.createdAt || '',
            'Updated_At': inspection.updatedAt || '',
            'Synced': inspection.synced ? 'YES' : 'NO',
            'Synced_At': inspection.syncedAt || ''
        };
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const colWidths = [
        { wch: 36 }, // ID
        { wch: 20 }, // WorkCenter_ID
        { wch: 25 }, // WorkCenter_Name
        { wch: 20 }, // Equipment_Type
        { wch: 15 }, // Equipment_ID
        { wch: 30 }, // Location
        { wch: 20 }, // Manufacturer
        { wch: 15 }, // Brand
        { wch: 15 }, // Model
        { wch: 15 }, // Manufacturing_Date
        { wch: 15 }, // Last_Retest_Date
        { wch: 15 }, // Inspection_Date
        { wch: 20 }, // Technician
        { wch: 15 }, // Technician_ID
        { wch: 12 }, // Status
        { wch: 12 }, // Total_Items
        { wch: 12 }, // Checked_Items
        { wch: 10 }, // OK_Count
        { wch: 12 }, // Warning_Count
        { wch: 12 }, // Error_Count
        { wch: 18 }, // Completion_Percentage
        { wch: 40 }, // Observations
        { wch: 40 }, // Recommendations
        { wch: 12 }, // Photo_Count
        { wch: 20 }, // Has_Technician_Signature
        { wch: 18 }, // Has_Client_Signature
        { wch: 15 }, // GPS_Latitude
        { wch: 15 }, // GPS_Longitude
        { wch: 12 }, // GPS_Accuracy
        { wch: 20 }, // Created_At
        { wch: 20 }, // Updated_At
        { wch: 10 }, // Synced
        { wch: 20 }  // Synced_At
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Inspecciones');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `RETIMBRASUR_Inspecciones_${timestamp}.xlsx`;

    // Export file
    XLSX.writeFile(wb, filename);

    showToast(`✓ Exportado: ${inspections.length} inspecciones`, 'success');
}

// Fallback CSV export if XLSX not available
function exportToCSV() {
    let csv = 'ID,WorkCenter_ID,WorkCenter_Name,Equipment_Type,Equipment_ID,Location,Manufacturer,Brand,Model,Manufacturing_Date,Last_Retest_Date,Inspection_Date,Technician,Status,Total_Items,Checked_Items,OK_Count,Warning_Count,Error_Count,Completion_Percentage,Observations,Recommendations,Photo_Count,Created_At\n';

    inspections.forEach(inspection => {
        const conformeCount = inspection.checklist.filter(i => i.status === 'ok').length;
        const warningCount = inspection.checklist.filter(i => i.status === 'warning').length;
        const errorCount = inspection.checklist.filter(i => i.status === 'error').length;
        const totalItems = inspection.checklist.length;
        const completedItems = inspection.checklist.filter(i => i.checked).length;
        const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        const row = [
            inspection.id,
            inspection.workCenterId || '',
            `"${(inspection.workCenterName || '').replace(/"/g, '""')}"`,
            inspection.equipmentType || '',
            `"${(inspection.equipmentId || '').replace(/"/g, '""')}"`,
            `"${(inspection.location || '').replace(/"/g, '""')}"`,
            `"${(inspection.manufacturer || '').replace(/"/g, '""')}"`,
            `"${(inspection.brand || '').replace(/"/g, '""')}"`,
            `"${(inspection.model || '').replace(/"/g, '""')}"`,
            inspection.manufacturingDate || '',
            inspection.lastRetestDate || '',
            inspection.inspectionDate || '',
            `"${(inspection.technician || '').replace(/"/g, '""')}"`,
            inspection.status || 'draft',
            totalItems,
            completedItems,
            conformeCount,
            warningCount,
            errorCount,
            percentage,
            `"${(inspection.observations || '').replace(/"/g, '""')}"`,
            `"${(inspection.recommendations || '').replace(/"/g, '""')}"`,
            inspection.photos ? inspection.photos.length : (inspection.photo ? 1 : 0),
            inspection.createdAt || ''
        ];

        csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `RETIMBRASUR_Inspecciones_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Exportado a CSV correctamente', 'success');
}

// ===== Import Inspections from Excel/CSV =====
document.addEventListener('DOMContentLoaded', () => {
    const importBtn = document.getElementById('importBtn');
    const importModal = document.getElementById('importModal');
    const closeImportModal = document.getElementById('closeImportModal');
    const cancelImportBtn = document.getElementById('cancelImportBtn');
    const importFileInput = document.getElementById('importFile');
    const executeImportBtn = document.getElementById('executeImportBtn');
    const importResults = document.getElementById('importResults');
    const importError = document.getElementById('importError');
    const importStats = document.getElementById('importStats');
    const importErrorText = document.getElementById('importErrorText');

    let fileData = null;

    // Open modal
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            importModal.classList.add('active');
            // Reset modal state
            importFileInput.value = '';
            fileData = null;
            executeImportBtn.disabled = true;
            importResults.style.display = 'none';
            importError.style.display = 'none';
            document.querySelector('input[name="importMode"][value="new"]').checked = true;
        });
    }

    // Close modal
    [closeImportModal, cancelImportBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                importModal.classList.remove('active');
            });
        }
    });

    // File selection handler
    if (importFileInput) {
        importFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) {
                executeImportBtn.disabled = true;
                fileData = null;
                return;
            }

            try {
                importError.style.display = 'none';
                importResults.style.display = 'none';

                // Read file
                const data = await readImportFile(file);
                fileData = data;
                executeImportBtn.disabled = false;

                showToast(`✓ Archivo cargado: ${data.length} inspecciones detectadas`, 'success');
            } catch (error) {
                console.error('Error reading file:', error);
                importError.style.display = 'block';
                importErrorText.textContent = error.message;
                executeImportBtn.disabled = true;
                fileData = null;
            }
        });
    }

    // Execute import
    if (executeImportBtn) {
        executeImportBtn.addEventListener('click', () => {
            if (!fileData || fileData.length === 0) {
                showToast('No hay datos para importar', 'error');
                return;
            }

            const mode = document.querySelector('input[name="importMode"]:checked').value;

            try {
                const stats = performImport(fileData, mode);

                // Show results
                importResults.style.display = 'block';
                importError.style.display = 'none';

                importStats.innerHTML = `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                        <div style="padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: #4caf50;">${stats.imported}</div>
                            <div style="color: var(--text-secondary); font-size: 0.85rem;">Importadas</div>
                        </div>
                        <div style="padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: #ff9800;">${stats.updated}</div>
                            <div style="color: var(--text-secondary); font-size: 0.85rem;">Actualizadas</div>
                        </div>
                        <div style="padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: #2196f3;">${stats.skipped}</div>
                            <div style="color: var(--text-secondary); font-size: 0.85rem;">Omitidas</div>
                        </div>
                        <div style="padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px;">
                            <div style="font-size: 1.5rem; font-weight: 700;">${stats.total}</div>
                            <div style="color: var(--text-secondary); font-size: 0.85rem;">Total</div>
                        </div>
                    </div>
                `;

                showToast(`✓ Importación completada: ${stats.imported} nuevas, ${stats.updated} actualizadas`, 'success');

                // Refresh display if on dashboard
                if (currentWorkCenter) {
                    loadInspections();
                }

                // Auto-close after 3 seconds
                setTimeout(() => {
                    importModal.classList.remove('active');
                }, 3000);

            } catch (error) {
                console.error('Error during import:', error);
                importError.style.display = 'block';
                importResults.style.display = 'none';
                importErrorText.textContent = error.message;
                showToast('Error al importar inspecciones', 'error');
            }
        });
    }

    // Read file (Excel or CSV)
    async function readImportFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    let parsedData = [];

                    if (file.name.endsWith('.csv')) {
                        // Parse CSV
                        parsedData = parseCSV(data);
                    } else {
                        // Parse Excel with SheetJS
                        if (typeof XLSX === 'undefined') {
                            reject(new Error('Librería XLSX no disponible. Solo archivos CSV son soportados.'));
                            return;
                        }

                        const workbook = XLSX.read(data, { type: 'binary' });
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        parsedData = XLSX.utils.sheet_to_json(worksheet);
                    }

                    // Validate and normalize data
                    const normalized = normalizeImportData(parsedData);
                    resolve(normalized);

                } catch (error) {
                    reject(new Error(`Error al leer archivo: ${error.message}`));
                }
            };

            reader.onerror = () => {
                reject(new Error('Error al leer el archivo'));
            };

            if (file.name.endsWith('.csv')) {
                reader.readAsText(file);
            } else {
                reader.readAsBinaryString(file);
            }
        });
    }

    // Parse CSV manually
    function parseCSV(text) {
        const lines = text.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('Archivo CSV vacío o inválido');
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }

        return data;
    }

    // Normalize imported data to match internal format
    function normalizeImportData(data) {
        const normalized = [];

        data.forEach((row, index) => {
            try {
                // Support both underscore (AppSheet) and original format
                const inspection = {
                    id: row.ID || row.id || `imported-${Date.now()}-${index}`,
                    workCenterId: row.WorkCenter_ID || row.workCenterId || '',
                    workCenterName: row.WorkCenter_Name || row.workCenterName || '',
                    equipmentType: row.Equipment_Type || row.equipmentType || '',
                    equipmentId: row.Equipment_ID || row.equipmentId || '',
                    location: row.Location || row.location || '',
                    manufacturer: row.Manufacturer || row.manufacturer || '',
                    brand: row.Brand || row.brand || '',
                    model: row.Model || row.model || '',
                    manufacturingDate: row.Manufacturing_Date || row.manufacturingDate || '',
                    lastRetestDate: row.Last_Retest_Date || row.lastRetestDate || '',
                    inspectionDate: row.Inspection_Date || row.inspectionDate || new Date().toISOString().split('T')[0],
                    technician: row.Technician || row.technician || '',
                    status: row.Status || row.status || 'draft',
                    observations: row.Observations || row.observations || '',
                    recommendations: row.Recommendations || row.recommendations || '',
                    checklist: row.checklist || {},
                    photos: row.photos || [],
                    technicianSignature: row.technicianSignature || null,
                    clientSignature: row.clientSignature || null,
                    createdAt: row.Created_At || row.createdAt || new Date().toISOString(),
                    updatedAt: row.Updated_At || row.updatedAt || new Date().toISOString(),
                    synced: (row.Synced === 'YES' || row.synced === true) ? true : false
                };

                // Parse GPS coordinates if available
                if (row.GPS_Latitude || row.gpsLatitude) {
                    inspection.gpsCoordinates = {
                        latitude: row.GPS_Latitude || row.gpsLatitude,
                        longitude: row.GPS_Longitude || row.gpsLongitude,
                        accuracy: row.GPS_Accuracy || row.gpsAccuracy || '',
                        timestamp: row.gpsTimestamp || new Date().toISOString()
                    };
                }

                normalized.push(inspection);
            } catch (error) {
                console.warn(`Skipping row ${index + 1}: ${error.message}`);
            }
        });

        if (normalized.length === 0) {
            throw new Error('No se encontraron inspecciones válidas en el archivo');
        }

        return normalized;
    }

    // Perform import based on mode
    function performImport(data, mode) {
        let existingInspections = JSON.parse(localStorage.getItem('inspections')) || [];
        let imported = 0;
        let updated = 0;
        let skipped = 0;

        if (mode === 'replace') {
            // Replace all
            localStorage.setItem('inspections', JSON.stringify(data));
            return {
                imported: data.length,
                updated: 0,
                skipped: 0,
                total: data.length
            };
        }

        data.forEach(newInspection => {
            const existingIndex = existingInspections.findIndex(i => i.id === newInspection.id);

            if (existingIndex >= 0) {
                // Inspection exists
                if (mode === 'overwrite') {
                    // Update existing
                    existingInspections[existingIndex] = {
                        ...existingInspections[existingIndex],
                        ...newInspection,
                        updatedAt: new Date().toISOString()
                    };
                    updated++;
                } else {
                    // Skip (mode === 'new')
                    skipped++;
                }
            } else {
                // New inspection
                existingInspections.push(newInspection);
                imported++;
            }
        });

        // Save to localStorage
        localStorage.setItem('inspections', JSON.stringify(existingInspections));
        inspections = existingInspections;

        return {
            imported,
            updated,
            skipped,
            total: data.length
        };
    }
});

// ===== OCR Plate Scanner =====
document.addEventListener('DOMContentLoaded', () => {
    const scanPlateBtn = document.getElementById('scanPlateBtn');
    const ocrModal = document.getElementById('ocrPlateModal');
    const closeOCRModal = document.getElementById('closeOCRModal');
    const cancelOCRBtn = document.getElementById('cancelOCRBtn');
    const capturePhotoBtn = document.getElementById('capturePhotoBtn');
    const retryOCRBtn = document.getElementById('retryOCRBtn');

    const cameraPreview = document.getElementById('ocrCameraPreview');
    const captureCanvas = document.getElementById('ocrCaptureCanvas');
    const cameraPlaceholder = document.getElementById('ocrCameraPlaceholder');

    const ocrProcessing = document.getElementById('ocrProcessing');
    const ocrResults = document.getElementById('ocrResults');
    const ocrError = document.getElementById('ocrError');
    const ocrStatus = document.getElementById('ocrStatus');
    const ocrExtractedText = document.getElementById('ocrExtractedText');
    const ocrErrorText = document.getElementById('ocrErrorText');

    let cameraStream = null;
    let capturedImageData = null;

    // Open OCR Modal
    if (scanPlateBtn) {
        scanPlateBtn.addEventListener('click', async () => {
            ocrModal.classList.add('active');
            resetOCRModal();
            await startCamera();
        });
    }

    // Close OCR Modal
    [closeOCRModal, cancelOCRBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                stopCamera();
                ocrModal.classList.remove('active');
            });
        }
    });

    // Capture Photo
    if (capturePhotoBtn) {
        capturePhotoBtn.addEventListener('click', async () => {
            if (!cameraStream) {
                showToast('Cámara no disponible', 'error');
                return;
            }

            try {
                // Capture frame from video
                const canvas = captureCanvas;
                const ctx = canvas.getContext('2d');

                canvas.width = cameraPreview.videoWidth;
                canvas.height = cameraPreview.videoHeight;

                ctx.drawImage(cameraPreview, 0, 0, canvas.width, canvas.height);

                // Show captured image
                cameraPreview.style.display = 'none';
                canvas.style.display = 'block';
                capturePhotoBtn.style.display = 'none';

                // Get image data
                capturedImageData = canvas.toDataURL('image/png');

                // Stop camera
                stopCamera();

                // Process with OCR
                await processOCR(capturedImageData);

            } catch (error) {
                console.error('Error capturing photo:', error);
                showOCRError('Error al capturar la foto');
            }
        });
    }

    // Retry OCR
    if (retryOCRBtn) {
        retryOCRBtn.addEventListener('click', async () => {
            resetOCRModal();
            await startCamera();
        });
    }

    // Start Camera
    async function startCamera() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Cámara no soportada en este navegador');
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }, // Prefer back camera
                audio: false
            });

            cameraStream = stream;
            cameraPreview.srcObject = stream;
            cameraPreview.style.display = 'block';
            cameraPlaceholder.style.display = 'none';
            capturePhotoBtn.style.display = 'block';

        } catch (error) {
            console.error('Error starting camera:', error);
            showOCRError('No se pudo acceder a la cámara. Verifica los permisos.');
        }
    }

    // Stop Camera
    function stopCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
    }

    // Process OCR
    async function processOCR(imageData) {
        try {
            // Check if Tesseract is loaded
            if (typeof Tesseract === 'undefined') {
                throw new Error('Librería OCR no disponible');
            }

            // Show processing status
            ocrProcessing.style.display = 'block';
            ocrResults.style.display = 'none';
            ocrError.style.display = 'none';
            retryOCRBtn.style.display = 'none';

            ocrStatus.textContent = 'Inicializando OCR...';

            // Run Tesseract OCR
            const worker = await Tesseract.createWorker('spa', 1, {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        const progress = Math.round(m.progress * 100);
                        ocrStatus.textContent = `Reconociendo texto... ${progress}%`;
                    }
                }
            });

            const { data } = await worker.recognize(imageData);
            await worker.terminate();

            const extractedText = data.text.trim();

            if (!extractedText) {
                throw new Error('No se detectó texto en la imagen');
            }

            // Show results
            ocrProcessing.style.display = 'none';
            ocrResults.style.display = 'block';
            ocrExtractedText.textContent = extractedText;
            retryOCRBtn.style.display = 'inline-flex';

            // Parse and fill form
            parseAndFillForm(extractedText);

            showToast('✓ Texto extraído correctamente', 'success');

        } catch (error) {
            console.error('OCR Error:', error);
            ocrProcessing.style.display = 'none';
            showOCRError(error.message || 'Error al procesar la imagen');
            retryOCRBtn.style.display = 'inline-flex';
        }
    }

    // Parse extracted text and fill form fields
    function parseAndFillForm(text) {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        // Common patterns for equipment plates
        const patterns = {
            // Manufacturer/Brand
            manufacturer: /(?:fabricante|manufacturer|made\s+by|marca)[:\s]+([a-zA-Z0-9\s]+)/i,
            brand: /(?:marca|brand|make)[:\s]+([a-zA-Z0-9\s]+)/i,
            // Model
            model: /(?:modelo|model|type)[:\s]+([a-zA-Z0-9\s\-]+)/i,
            // Serial number (for equipmentId)
            serial: /(?:s\/n|serial|n[úu]mero\s+de\s+serie|serie)[:\s]+([a-zA-Z0-9\-]+)/i,
            // Manufacturing date (various formats)
            date: /(?:fecha|date|fabricaci[óo]n|manufactured)[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4})/i,
            // Year only
            year: /(?:a[ñn]o|year)[:\s]+(\d{4})/i,
            // Pressure (for extinguishers)
            pressure: /(?:presi[óo]n|pressure)[:\s]+([\d.]+)\s*(bar|psi|kg)/i,
            // Capacity
            capacity: /(?:capacidad|capacity)[:\s]+([\d.]+)\s*(kg|l|litros)/i
        };

        let foundData = {};

        // Try to match patterns
        for (const [key, pattern] of Object.entries(patterns)) {
            for (const line of lines) {
                const match = line.match(pattern);
                if (match) {
                    foundData[key] = match[1].trim();
                    break;
                }
            }
        }

        // Also try heuristic approach for unstructured plates
        // Look for common brand names
        const commonBrands = ['KIDDE', 'GLORIA', 'VIKING', 'TYCO', 'ANSUL', 'FIRE', 'EXTINTOR', 'AMEREX', 'BADGER'];
        for (const line of lines) {
            for (const brand of commonBrands) {
                if (line.toUpperCase().includes(brand)) {
                    if (!foundData.brand && !foundData.manufacturer) {
                        foundData.brand = brand;
                        break;
                    }
                }
            }
        }

        // Fill form fields
        const manufacturerInput = document.getElementById('manufacturer');
        const brandInput = document.getElementById('brand');
        const modelInput = document.getElementById('model');
        const manufacturingDateInput = document.getElementById('manufacturingDate');

        let filled = 0;

        if (foundData.manufacturer && manufacturerInput) {
            manufacturerInput.value = foundData.manufacturer;
            manufacturerInput.style.background = 'rgba(76, 175, 80, 0.1)';
            setTimeout(() => { manufacturerInput.style.background = ''; }, 2000);
            filled++;
        }

        if (foundData.brand && brandInput) {
            brandInput.value = foundData.brand;
            brandInput.style.background = 'rgba(76, 175, 80, 0.1)';
            setTimeout(() => { brandInput.style.background = ''; }, 2000);
            filled++;
        }

        if (foundData.model && modelInput) {
            modelInput.value = foundData.model;
            modelInput.style.background = 'rgba(76, 175, 80, 0.1)';
            setTimeout(() => { modelInput.style.background = ''; }, 2000);
            filled++;
        }

        // Parse date
        if ((foundData.date || foundData.year) && manufacturingDateInput) {
            let dateStr = foundData.date || `01/01/${foundData.year}`;

            // Try to parse various date formats
            const parsedDate = parseDate(dateStr);
            if (parsedDate) {
                manufacturingDateInput.value = parsedDate;
                manufacturingDateInput.style.background = 'rgba(76, 175, 80, 0.1)';
                setTimeout(() => { manufacturingDateInput.style.background = ''; }, 2000);
                filled++;
            }
        }

        if (filled === 0) {
            showToast('No se detectaron campos automáticamente. Revisa el texto extraído.', 'warning');
        } else {
            showToast(`✓ ${filled} campo(s) rellenado(s) automáticamente`, 'success');
        }
    }

    // Parse date from various formats
    function parseDate(dateStr) {
        // Try different formats
        const formats = [
            /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/,  // DD/MM/YYYY or MM/DD/YYYY
            /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/,  // YYYY/MM/DD
            /(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})/,  // DD/MM/YY
        ];

        for (const format of formats) {
            const match = dateStr.match(format);
            if (match) {
                let year, month, day;

                if (format === formats[0]) {
                    // Could be DD/MM/YYYY or MM/DD/YYYY - assume DD/MM/YYYY (European format)
                    day = match[1].padStart(2, '0');
                    month = match[2].padStart(2, '0');
                    year = match[3];
                } else if (format === formats[1]) {
                    // YYYY/MM/DD
                    year = match[1];
                    month = match[2].padStart(2, '0');
                    day = match[3].padStart(2, '0');
                } else {
                    // DD/MM/YY
                    day = match[1].padStart(2, '0');
                    month = match[2].padStart(2, '0');
                    year = '20' + match[3];  // Assume 20xx
                }

                // Validate the date is actually valid
                const dateObj = new Date(`${year}-${month}-${day}`);
                if (isNaN(dateObj.getTime())) {
                    continue; // Invalid date, try next format
                }

                // Verify the components match (catches invalid dates like 31/02)
                if (dateObj.getFullYear() !== parseInt(year) ||
                    dateObj.getMonth() + 1 !== parseInt(month) ||
                    dateObj.getDate() !== parseInt(day)) {
                    continue; // Date components don't match, invalid
                }

                return `${year}-${month}-${day}`;
            }
        }

        // If just a year
        if (/^\d{4}$/.test(dateStr)) {
            const year = parseInt(dateStr);
            if (year >= 1900 && year <= 2100) {
                return `${dateStr}-01-01`;
            }
        }

        return null;
    }

    // Show OCR Error
    function showOCRError(message) {
        ocrError.style.display = 'block';
        ocrResults.style.display = 'none';
        ocrProcessing.style.display = 'none';
        ocrErrorText.textContent = message;
    }

    // Reset OCR Modal
    function resetOCRModal() {
        ocrProcessing.style.display = 'none';
        ocrResults.style.display = 'none';
        ocrError.style.display = 'none';
        captureCanvas.style.display = 'none';
        cameraPreview.style.display = 'none';
        cameraPlaceholder.style.display = 'flex';
        capturePhotoBtn.style.display = 'none';
        retryOCRBtn.style.display = 'none';
        capturedImageData = null;
    }
});

// ===== Chart Rendering =====
function renderPressureChart(inspection) {
    const canvas = document.getElementById('curveChart');
    if (!canvas) {
        console.warn('Canvas element "curveChart" not found');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Unable to get 2D context from canvas');
        return;
    }

    const nominalFlow = parseFloat(inspection.nominalFlow) || 0;
    const nominalPressure = parseFloat(inspection.nominalPressure) || 0;

    const dataPoints = [
        { x: 0, y: parseFloat(inspection.pressureZero) || 0 },
        { x: nominalFlow * 0.5, y: parseFloat(inspection.pressure50) || 0 },
        { x: nominalFlow, y: parseFloat(inspection.pressureNominal) || 0 },
        { x: nominalFlow * 1.4, y: parseFloat(inspection.pressureOverload) || 0 }
    ];

    // Theoretical Curve (Simplified)
    // Typically P(0) ~ 1.2-1.4 Pn, P(100) = Pn, P(140) >= 0.7 Pn
    const theoreticalPoints = [
        { x: 0, y: nominalPressure * 1.2 }, // Estimate
        { x: nominalFlow, y: nominalPressure },
        { x: nominalFlow * 1.4, y: nominalPressure * 0.7 }
    ];

    new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Curva Real',
                    data: dataPoints,
                    borderColor: 'rgba(0, 78, 137, 1)',
                    backgroundColor: 'rgba(0, 78, 137, 0.2)',
                    borderWidth: 3,
                    pointRadius: 6,
                    pointBackgroundColor: dataPoints.map(p => {
                        // Simple validation coloring
                        if (p.x === nominalFlow && p.y < nominalPressure) return 'red';
                        if (p.x === nominalFlow * 1.4 && p.y < nominalPressure * 0.7) return 'red';
                        return 'green';
                    }),
                    fill: false,
                    tension: 0.3
                },
                {
                    label: 'Presión Nominal (Pn)',
                    data: [{ x: 0, y: nominalPressure }, { x: nominalFlow * 1.5, y: nominalPressure }],
                    borderColor: 'rgba(255, 99, 132, 0.8)',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: 'Límite 70% Pn (Sobrecarga)',
                    data: [{ x: 0, y: nominalPressure * 0.7 }, { x: nominalFlow * 1.5, y: nominalPressure * 0.7 }],
                    borderColor: 'rgba(255, 159, 64, 0.8)',
                    borderDash: [2, 2],
                    borderWidth: 1,
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Caudal (m³/h)'
                    },
                    min: 0,
                    suggestedMax: nominalFlow * 1.5
                },
                y: {
                    title: {
                        display: true,
                        text: 'Presión (bar)'
                    },
                    min: 0,
                    suggestedMax: nominalPressure * 1.5
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Curva Q-H: Caudal vs Presión'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${context.parsed.y} bar @ ${context.parsed.x} m³/h`;
                        }
                    }
                }
            }
        }
    });
}

// ===== Work Center UI Management =====
let currentEquipmentId = null;

// Load and populate center dropdown
function populateCenterDropdown() {
    const centerSelect = document.getElementById('centerSelect');
    const filterCenter = document.getElementById('filterCenter');

    loadWorkCenters();

    // Clear existing options except first
    centerSelect.innerHTML = '<option value="">-- Selecciona un centro --</option>';
    if (filterCenter) {
        filterCenter.innerHTML = '<option value="all">Todos los centros</option>';
    }

    workCenters.forEach(center => {
        const option = document.createElement('option');
        option.value = center.id;
        option.textContent = center.name;
        centerSelect.appendChild(option);

        if (filterCenter) {
            const filterOption = document.createElement('option');
            filterOption.value = center.id;
            filterOption.textContent = center.name;
            filterCenter.appendChild(filterOption);
        }
    });
}

// Display center information
function displayCenterInfo(centerId) {
    const center = getWorkCenter(centerId);
    if (!center) return;

    document.getElementById('centerInfoName').textContent = center.name;
    document.getElementById('centerInfoAddress').textContent = center.address || '-';
    document.getElementById('centerInfoClient').textContent = center.clientName || '-';
    document.getElementById('centerInfoPhone').textContent = center.phone || '-';
    document.getElementById('centerInfoEquipment').textContent = center.equipment ? center.equipment.length : 0;

    document.getElementById('centerInfo').style.display = 'block';
}

// Filter equipment based on search and type
function filterEquipment(searchTerm, typeFilter) {
    if (!currentWorkCenter) return;

    const equipment = getEquipmentByCenter(currentWorkCenter.id);
    let filtered = equipment;

    // Apply type filter
    if (typeFilter && typeFilter !== 'all') {
        filtered = filtered.filter(eq => eq.type === typeFilter);
    }

    // Apply search filter
    if (searchTerm && searchTerm.trim() !== '') {
        const search = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(eq => {
            const id = (eq.id || '').toLowerCase();
            const location = (eq.location || '').toLowerCase();
            const manufacturer = (eq.manufacturer || '').toLowerCase();
            const brand = (eq.brand || '').toLowerCase();
            const model = (eq.model || '').toLowerCase();

            return id.includes(search) ||
                location.includes(search) ||
                manufacturer.includes(search) ||
                brand.includes(search) ||
                model.includes(search);
        });
    }

    // Display filtered equipment
    displayEquipmentList(filtered, currentWorkCenter.id);
}

// Display equipment list (separated from filtering logic)
function displayEquipmentList(equipment, centerId) {
    const container = document.getElementById('equipmentListContainer');

    if (equipment.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                <div style="font-size: 4rem; margin-bottom: 20px;">🔍</div>
                <h3>No se encontraron equipos</h3>
                <p>Intenta con otros términos de búsqueda</p>
            </div>
        `;
        return;
    }

    container.innerHTML = equipment.map(eq => {
        const typeInfo = equipmentTypes[eq.type];
        const lastInspection = inspections
            .filter(i => i.equipmentId === eq.id && i.workCenterId === centerId)
            .sort((a, b) => new Date(b.inspectionDate) - new Date(a.inspectionDate))[0];

        return `
            <div class="equipment-card saved-equipment" data-equipment-id="${eq.id}" data-type="${eq.type}">
                <div class="card-icon">${typeInfo ? typeInfo.icon : '🔧'}</div>
                <h3>${typeInfo ? typeInfo.name : eq.type}</h3>
                <div class="equipment-details">
                    <p><strong>ID:</strong> ${eq.id}</p>
                    <p><strong>Ubicación:</strong> ${eq.location || '-'}</p>
                    ${lastInspection ? `
                        <p class="last-inspection">
                            <strong>Última inspección:</strong><br>
                            ${formatDate(lastInspection.inspectionDate)} - 
                            <span class="status-${lastInspection.status}">${lastInspection.status === 'completed' ? '✓ Completada' : '📝 Borrador'}</span>
                        </p>
                    ` : '<p class="last-inspection">Sin inspecciones previas</p>'}
                </div>
                <button class="btn btn-primary btn-sm inspect-equipment-btn">
                    Inspeccionar
                </button>
            </div>
        `;
    }).join('');

    // Add click listeners to equipment cards
    container.querySelectorAll('.saved-equipment').forEach(card => {
        const inspectBtn = card.querySelector('.inspect-equipment-btn');
        inspectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const equipmentId = card.dataset.equipmentId;
            const type = card.dataset.type;
            startInspectionWithEquipment(equipmentId, type);
        });
    });
}

// Start inspection with saved equipment data
function startInspectionWithEquipment(equipmentId, type) {
    currentEquipmentId = equipmentId;
    const equipment = getEquipmentById(currentWorkCenter.id, equipmentId);

    if (!equipment) {
        showToast('Equipo no encontrado', 'error');
        return;
    }

    // Start normal inspection
    startInspection(type);

    // Pre-fill equipment data
    document.getElementById('equipmentId').value = equipment.id || '';
    document.getElementById('location').value = equipment.location || '';
    document.getElementById('manufacturer').value = equipment.manufacturer || '';
    document.getElementById('brand').value = equipment.brand || '';
    document.getElementById('model').value = equipment.model || '';

    if (equipment.manufacturingDate) {
        document.getElementById('manufacturingDate').value = equipment.manufacturingDate;
    }
    if (equipment.lastRetestDate) {
        document.getElementById('lastRetestDate').value = equipment.lastRetestDate;
    }
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    screens = {
        workCenter: document.getElementById('workCenterScreen'),
        welcome: document.getElementById('welcomeScreen'),
        inspection: document.getElementById('inspectionScreen'),
        history: document.getElementById('historyScreen')
    };

    console.log('DOM initialized, screens:', screens);

    // Populate center dropdown
    populateCenterDropdown();

    // ===== Work Center Screen Event Listeners =====
    document.getElementById('centerSelect').addEventListener('change', (e) => {
        const centerId = e.target.value;
        if (centerId) {
            currentWorkCenter = getWorkCenter(centerId);
            displayCenterInfo(centerId);
        } else {
            document.getElementById('centerInfo').style.display = 'none';
        }
    });

    document.getElementById('newCenterBtn').addEventListener('click', () => {
        document.getElementById('newCenterModal').classList.add('active');
    });

    document.getElementById('continueToCenterBtn').addEventListener('click', () => {
        if (currentWorkCenter) {
            loadEquipmentList(currentWorkCenter.id);
            showScreen('welcome');
        }
    });

    // ===== New Center Modal =====
    document.getElementById('closeCenterModal').addEventListener('click', () => {
        document.getElementById('newCenterModal').classList.remove('active');
    });

    document.getElementById('cancelCenterBtn').addEventListener('click', () => {
        document.getElementById('newCenterModal').classList.remove('active');
    });

    document.getElementById('saveCenterBtn').addEventListener('click', () => {
        const name = document.getElementById('centerName').value.trim();
        const address = document.getElementById('centerAddress').value.trim();

        if (!name || !address) {
            showToast('Por favor completa los campos requeridos', 'error');
            return;
        }

        const newCenter = saveWorkCenter({
            name: name,
            address: address,
            clientName: document.getElementById('centerClient').value.trim(),
            phone: document.getElementById('centerPhone').value.trim(),
            notes: document.getElementById('centerNotes').value.trim()
        });

        // Clear form
        document.getElementById('centerName').value = '';
        document.getElementById('centerAddress').value = '';
        document.getElementById('centerClient').value = '';
        document.getElementById('centerPhone').value = '';
        document.getElementById('centerNotes').value = '';

        // Close modal
        document.getElementById('newCenterModal').classList.remove('active');

        // Update dropdown and select new center
        populateCenterDropdown();
        document.getElementById('centerSelect').value = newCenter.id;
        currentWorkCenter = newCenter;
        displayCenterInfo(newCenter.id);

        showToast('Centro creado correctamente', 'success');
    });

    // ===== Equipment Screen Event Listeners =====
    document.getElementById('backToCenterBtn').addEventListener('click', () => {
        showScreen('workCenter');
        currentWorkCenter = null;
    });

    document.getElementById('newEquipmentBtn').addEventListener('click', () => {
        document.getElementById('newEquipmentModal').classList.add('active');
    });

    document.getElementById('closeEquipmentModal').addEventListener('click', () => {
        document.getElementById('newEquipmentModal').classList.remove('active');
    });

    // Equipment type selection in modal
    document.querySelectorAll('#newEquipmentModal .equipment-card').forEach(card => {
        card.addEventListener('click', () => {
            const type = card.dataset.type;
            currentEquipmentId = null; // New equipment
            document.getElementById('newEquipmentModal').classList.remove('active');
            startInspection(type);
        });
    });

    // Check if coming from AppSheet with work center
    if (appSheetData.workCenterId) {
        console.log('Cargando desde AppSheet con centro:', appSheetData.workCenterId);

        // Try to find existing center or create new one
        let center = getWorkCenter(appSheetData.workCenterId);

        if (!center && appSheetData.workCenterName) {
            // Create center from AppSheet data
            center = saveWorkCenter({
                id: appSheetData.workCenterId,
                name: appSheetData.workCenterName,
                address: appSheetData.workCenterAddress || '',
                clientName: appSheetData.clientName || '',
                phone: appSheetData.clientPhone || ''
            });
        }

        if (center) {
            currentWorkCenter = center;
            populateCenterDropdown();
            document.getElementById('centerSelect').value = center.id;
            displayCenterInfo(center.id);

            if (appSheetData.equipmentType) {
                // Auto-start inspection
                loadEquipmentList(center.id);
                showScreen('welcome');
                setTimeout(() => startInspection(appSheetData.equipmentType), 500);
            } else {
                loadEquipmentList(center.id);
                showScreen('welcome');
            }
        }
    }

    // Check if coming from AppSheet with equipment type
    if (appSheetData.appsheetMode && appSheetData.equipmentType) {
        console.log('Iniciando desde AppSheet con tipo de equipo:', appSheetData.equipmentType);

        // Show AppSheet mode indicator
        if (appSheetData.clientName) {
            showToast(`Cliente: ${appSheetData.clientName}${appSheetData.workCenterName ? ' - ' + appSheetData.workCenterName : ''}`, 'info');
        }

        // Auto-start inspection for the specified equipment type
        startInspection(appSheetData.equipmentType);
    } else if (!appSheetData.workCenterId) {
        showScreen('workCenter');
    }

    console.log('Sistema de Inspección PCI iniciado correctamente');

    // Log AppSheet data if available
    if (appSheetData.appsheetMode) {
        console.log('Modo AppSheet activado:', appSheetData);
    }

    // ===== PHOTO CAPTURE FUNCTIONALITY =====
    let currentPhotosArray = [];  // Changed from single photo to array
    let currentPhotoData = null;  // Legacy variable - declared for compatibility
    const MAX_PHOTOS = 5;

    // Function to compress image using Canvas API
    function compressImage(file, maxWidth = 1024, quality = 0.8) {
        return new Promise((resolve, reject) => {
            // Validate file size (max 10MB before compression)
            if (file.size > 10 * 1024 * 1024) {
                reject(new Error('La foto es demasiado grande. Máximo 10MB'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // Calculate new dimensions maintaining aspect ratio
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth || height > maxWidth) {
                        if (width > height) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        } else {
                            width = Math.round((width * maxWidth) / height);
                            height = maxWidth;
                        }
                    }

                    // Create canvas for compression
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('No se pudo crear el contexto del canvas'));
                        return;
                    }

                    try {
                        // Optional: Fill background with white for transparent images
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, width, height);

                        // Draw image on canvas
                        ctx.drawImage(img, 0, 0, width, height);

                        // Convert to JPEG with specified quality
                        canvas.toBlob(
                            (blob) => {
                                if (!blob) {
                                    reject(new Error('Error al comprimir la imagen'));
                                    return;
                                }
                                const compressedReader = new FileReader();
                                compressedReader.onloadend = () => {
                                const originalSizeKB = (file.size / 1024).toFixed(2);
                                const compressedSizeKB = (blob.size / 1024).toFixed(2);
                                const compressionRatio = ((1 - blob.size / file.size) * 100).toFixed(1);

                                console.log(`Image compressed: ${originalSizeKB}KB → ${compressedSizeKB}KB (${compressionRatio}% reduction)`);

                                resolve({
                                    dataUrl: compressedReader.result,
                                    originalSize: file.size,
                                    compressedSize: blob.size,
                                    compressionRatio: compressionRatio
                                });
                            };
                            compressedReader.readAsDataURL(blob);
                        },
                        'image/jpeg',
                        quality
                    );
                    } catch (error) {
                        reject(new Error(`Error al procesar la imagen: ${error.message}`));
                    }
                };
                img.onerror = () => reject(new Error('Error al cargar la imagen'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsDataURL(file);
        });
    }

    const photoInput = document.getElementById('equipmentPhoto');
    const photosGallery = document.getElementById('photosGallery');
    const addMorePhotosBtn = document.getElementById('addMorePhotosBtn');

    // Render photos gallery
    function renderPhotosGallery() {
        if (!photosGallery) return;

        if (currentPhotosArray.length === 0) {
            photosGallery.style.display = 'none';
            if (addMorePhotosBtn) addMorePhotosBtn.style.display = 'none';
            return;
        }

        photosGallery.style.display = 'grid';
        if (addMorePhotosBtn) {
            addMorePhotosBtn.style.display = currentPhotosArray.length < MAX_PHOTOS ? 'inline-flex' : 'none';
        }

        photosGallery.innerHTML = currentPhotosArray.map((photoData, index) => `
            <div class="photo-thumbnail" data-index="${index}">
                <img src="${photoData}" alt="Foto ${index + 1}">
                <button type="button" class="btn-remove-photo-thumb" data-index="${index}">✕</button>
                <div class="photo-number-badge">${index + 1}/${currentPhotosArray.length}</div>
            </div>
        `).join('');

        // Add remove listeners
        photosGallery.querySelectorAll('.btn-remove-photo-thumb').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                removePhoto(index);
            });
        });
    }

    // Remove photo at index
    function removePhoto(index) {
        currentPhotosArray.splice(index, 1);
        renderPhotosGallery();
        showToast('Foto eliminada', 'info');
    }

    // Add photo to array
    async function addPhoto(file) {
        if (currentPhotosArray.length >= MAX_PHOTOS) {
            showToast(`Máximo ${MAX_PHOTOS} fotos permitidas`, 'warning');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showToast('Por favor selecciona un archivo de imagen válido', 'error');
            return;
        }

        // Show loading toast
        showToast('Comprimiendo imagen...', 'info');

        try {
            // Compress the image
            const compressed = await compressImage(file, 1024, 0.8);

            currentPhotosArray.push(compressed.dataUrl);
            renderPhotosGallery();

            // Show success message with compression stats
            const compressionMsg = `Imagen ${currentPhotosArray.length} agregada: ${(compressed.originalSize / 1024).toFixed(0)}KB → ${(compressed.compressedSize / 1024).toFixed(0)}KB (${compressed.compressionRatio}% reducción)`;
            showToast(compressionMsg, 'success');

            // Clear input
            if (photoInput) photoInput.value = '';
        } catch (error) {
            showToast(error.message || 'Error al procesar la imagen', 'error');
            if (photoInput) photoInput.value = '';
        }
    }

    // Photo input event listener
    if (photoInput) {
        photoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await addPhoto(file);
            }
        });
    }

    // Add more photos button
    if (addMorePhotosBtn) {
        addMorePhotosBtn.addEventListener('click', () => {
            if (photoInput) {
                photoInput.click();
            }
        });
    }

    console.log('Photo capture functionality initialized');

    // ===== POST-INSPECTION MODAL AND MULTI-EQUIPMENT WORKFLOW =====
    const postInspectionModal = document.getElementById('postInspectionModal');
    const addAnotherEquipmentBtn = document.getElementById('addAnotherEquipmentBtn');
    const generateReportBtn = document.getElementById('generateReportBtn');
    const backToEquipmentListBtn = document.getElementById('backToEquipmentListBtn');
    const addNextBtn = document.getElementById('addNextBtn');
    const generateCenterReportBtn = document.getElementById('generateCenterReportBtn');

    // Show/hide add next button based on work center
    function updateAddNextButtonVisibility() {
        if (addNextBtn && currentWorkCenter) {
            addNextBtn.style.display = 'inline-flex';
        } else if (addNextBtn) {
            addNextBtn.style.display = 'none';
        }
    }

    // Call this when starting inspection
    const originalStartInspection = window.startInspection;
    window.startInspection = function (type) {
        originalStartInspection.call(this, type);
        updateAddNextButtonVisibility();
    };

    // Add Next Equipment button (inline in form)
    if (addNextBtn) {
        addNextBtn.addEventListener('click', () => {
            saveInspection('completed');

            // Reset form and photo
            resetInspectionForm();
            currentPhotoData = null;
            if (photoInput) photoInput.value = '';
            if (photoPreview) photoPreview.style.display = 'none';

            // Open equipment type modal
            document.getElementById('newEquipmentModal').classList.add('active');

            showToast('Inspección guardada. Selecciona el siguiente equipo', 'success');
        });
    }

    // Modify submit button behavior
    const originalSubmitBtn = document.getElementById('submitBtn');
    if (originalSubmitBtn && originalSubmitBtn.parentNode) {
        // Remove existing listener and add new one
        const newSubmitBtn = originalSubmitBtn.cloneNode(true);
        originalSubmitBtn.parentNode.replaceChild(newSubmitBtn, originalSubmitBtn);

        newSubmitBtn.addEventListener('click', () => {
            saveInspection('completed');

            if (currentWorkCenter) {
                // Show post-inspection modal
                postInspectionModal.classList.add('active');
            } else {
                // Original behavior if no work center
                showToast('Inspección completada correctamente', 'success');
                generateReport();
            }
        });
    }

    // Post-inspection modal buttons
    if (addAnotherEquipmentBtn) {
        addAnotherEquipmentBtn.addEventListener('click', () => {
            postInspectionModal.classList.remove('active');

            // Reset form and photo
            resetInspectionForm();
            currentPhotoData = null;
            if (photoInput) photoInput.value = '';
            if (photoPreview) photoPreview.style.display = 'none';

            document.getElementById('newEquipmentModal').classList.add('active');
        });
    }

    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', () => {
            postInspectionModal.classList.remove('active');
            generateReport();
        });
    }

    if (backToEquipmentListBtn) {
        backToEquipmentListBtn.addEventListener('click', () => {
            postInspectionModal.classList.remove('active');
            loadEquipmentList(currentWorkCenter.id);
            showScreen('welcome');
            showToast('Inspección guardada correctamente', 'success');
        });
    }

    // ===== INTEGRATE PHOTOS WITH SAVE INSPECTION =====
    const originalSaveInspection = window.saveInspection;
    window.saveInspection = function (status = 'draft') {
        // Call original function
        const result = originalSaveInspection.call(this, status);

        // Add photos to the last saved inspection if available
        if (currentPhotosArray.length > 0 && inspections.length > 0) {
            const lastInspection = inspections[inspections.length - 1];
            lastInspection.photos = [...currentPhotosArray];
            // Keep first photo as legacy 'photo' for backward compatibility
            lastInspection.photo = currentPhotosArray[0];
            localStorage.setItem('inspections', JSON.stringify(inspections));
        }

        // Add photos to equipment if saving to center
        const saveEquipmentCheck = document.getElementById('saveEquipmentCheck');
        if (currentPhotosArray.length > 0 && saveEquipmentCheck && saveEquipmentCheck.checked && currentWorkCenter) {
            const equipmentId = document.getElementById('equipmentId').value;
            const equipment = getEquipmentById(currentWorkCenter.id, equipmentId);
            if (equipment) {
                equipment.photos = [...currentPhotosArray];
                // Keep first photo as legacy 'photo' for backward compatibility
                equipment.photo = currentPhotosArray[0];
                saveWorkCenter(currentWorkCenter);
            }
        }

        return result;
    };

    // ===== LOAD EQUIPMENT LIST WITH DELETE BUTTONS AND CENTER REPORT =====
    const originalLoadEquipmentList = window.loadEquipmentList;
    window.loadEquipmentList = function (centerId) {
        const container = document.getElementById('equipmentListContainer');
        const equipment = getEquipmentByCenter(centerId);
        const center = getWorkCenter(centerId);
        const centerInspections = inspections.filter(i => i.workCenterId === centerId);

        document.getElementById('centerNameTitle').textContent = center ? center.name : 'Equipos del Centro';

        // Show/hide center report button
        const centerReportBtn = document.getElementById('generateCenterReportBtn');
        if (centerReportBtn) {
            centerReportBtn.style.display = centerInspections.length > 0 ? 'inline-flex' : 'none';
        }

        if (equipment.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                    <div style="font-size: 4rem; margin-bottom: 20px;">🔧</div>
                    <h3>No hay equipos registrados</h3>
                    <p>Agrega un nuevo equipo para comenzar</p>
                </div>
            `;
            // Reset search and filter
            const searchInput = document.getElementById('equipmentSearchInput');
            const typeFilter = document.getElementById('equipmentTypeFilter');
            if (searchInput) searchInput.value = '';
            if (typeFilter) typeFilter.value = 'all';
            return;
        }

        // Display equipment with photos
        renderEquipmentListWithPhotos(equipment, centerId);

        // Setup search and filter event listeners
        const searchInput = document.getElementById('equipmentSearchInput');
        const typeFilter = document.getElementById('equipmentTypeFilter');

        if (searchInput) {
            // Reset search
            searchInput.value = '';

            // Only add listener if not already added (prevent memory leaks)
            if (!searchInput.dataset.listenerAdded) {
                searchInput.dataset.listenerAdded = 'true';
                searchInput.addEventListener('input', (e) => {
                    const searchTerm = e.target.value;
                    const typeValue = typeFilter ? typeFilter.value : 'all';
                    filterEquipmentWithPhotos(searchTerm, typeValue, centerId);
                });
            }
        }

        if (typeFilter) {
            // Reset filter
            typeFilter.value = 'all';

            // Only add listener if not already added (prevent memory leaks)
            if (!typeFilter.dataset.listenerAdded) {
                typeFilter.dataset.listenerAdded = 'true';
                typeFilter.addEventListener('change', (e) => {
                    const typeValue = e.target.value;
                    const searchTerm = searchInput ? searchInput.value : '';
                    filterEquipmentWithPhotos(searchTerm, typeValue, centerId);
                });
            }
        }
    };

    // Filter equipment with photos
    function filterEquipmentWithPhotos(searchTerm, typeFilter, centerId) {
        const equipment = getEquipmentByCenter(centerId);
        let filtered = equipment;

        // Apply type filter
        if (typeFilter && typeFilter !== 'all') {
            filtered = filtered.filter(eq => eq.type === typeFilter);
        }

        // Apply search filter
        if (searchTerm && searchTerm.trim() !== '') {
            const search = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(eq => {
                const id = (eq.id || '').toLowerCase();
                const location = (eq.location || '').toLowerCase();
                const manufacturer = (eq.manufacturer || '').toLowerCase();
                const brand = (eq.brand || '').toLowerCase();
                const model = (eq.model || '').toLowerCase();

                return id.includes(search) ||
                    location.includes(search) ||
                    manufacturer.includes(search) ||
                    brand.includes(search) ||
                    model.includes(search);
            });
        }

        // Display filtered equipment
        renderEquipmentListWithPhotos(filtered, centerId);
    }

    // Render equipment list with photos
    function renderEquipmentListWithPhotos(equipment, centerId) {
        const container = document.getElementById('equipmentListContainer');

        if (equipment.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                    <div style="font-size: 4rem; margin-bottom: 20px;">🔍</div>
                    <h3>No se encontraron equipos</h3>
                    <p>Intenta con otros términos de búsqueda</p>
                </div>
            `;
            return;
        }

        container.innerHTML = equipment.map(eq => {
            const typeInfo = equipmentTypes[eq.type];
            const lastInspection = inspections
                .filter(i => i.equipmentId === eq.id && i.workCenterId === centerId)
                .sort((a, b) => new Date(b.inspectionDate) - new Date(a.inspectionDate))[0];

            // Get photos from equipment or last inspection
            const photos = eq.photos || (lastInspection && lastInspection.photos) || (eq.photo ? [eq.photo] : (lastInspection && lastInspection.photo ? [lastInspection.photo] : []));
            const photoUrl = photos.length > 0 ? photos[0] : null;
            const photoCount = photos.length;

            // Calculate inspection reminder status
            let reminderBadge = '';
            if (lastInspection && lastInspection.inspectionDate) {
                const nextInspectionDate = calculateNextInspection(lastInspection.inspectionDate, eq.type);
                if (nextInspectionDate) {
                    const status = getInspectionStatus(nextInspectionDate);
                    const daysUntil = getDaysUntilInspection(nextInspectionDate);
                    reminderBadge = getInspectionStatusBadge(status, daysUntil);
                }
            }

            return `
                <div class="equipment-card saved-equipment" data-equipment-id="${eq.id}" data-type="${eq.type}">
                    <button class="btn-delete-equipment" data-equipment-id="${eq.id}">✕</button>

                    ${photoUrl ? `
                        <div class="equipment-photo-preview">
                            <img src="${photoUrl}" alt="Foto del equipo">
                            ${photoCount > 1 ? `<div class="photo-count-badge">📷 ${photoCount}</div>` : ''}
                        </div>
                    ` : `
                        <div class="equipment-photo-placeholder">
                            <span class="placeholder-icon">📷</span>
                            <span class="placeholder-text">Sin fotos</span>
                        </div>
                    `}

                    <div class="card-icon">${typeInfo ? typeInfo.icon : '🔧'}</div>
                    <h3>${typeInfo ? typeInfo.name : eq.type}</h3>
                    <div class="equipment-details">
                        <p><strong>ID:</strong> ${eq.id}</p>
                        <p><strong>Ubicación:</strong> ${eq.location || 'No especificada'}</p>
                        ${eq.manufacturer ? `<p><strong>Fabricante:</strong> ${eq.manufacturer}</p>` : ''}
                        ${lastInspection ? `
                            <div class="last-inspection">
                                <p><strong>Última inspección:</strong> ${new Date(lastInspection.inspectionDate).toLocaleDateString()}</p>
                                ${reminderBadge ? `<p style="margin-top: 8px;">${reminderBadge}</p>` : ''}
                            </div>
                        ` : `<p style="margin-top: 10px;">${getInspectionStatusBadge('unknown', null)}</p>`}
                    </div>
                    <button class="btn btn-primary btn-sm inspect-equipment-btn" data-equipment-id="${eq.id}">
                        Inspeccionar
                    </button>
                </div>
            `;
        }).join('');

        // Add click listeners for inspect buttons
        container.querySelectorAll('.inspect-equipment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const equipmentId = btn.dataset.equipmentId;
                const type = btn.closest('.equipment-card').dataset.type;
                startInspectionWithEquipment(equipmentId, type);
            });
        });

        // Add delete button event listeners
        container.querySelectorAll('.btn-delete-equipment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const equipmentId = btn.dataset.equipmentId;

                if (confirm('¿Estás seguro de que quieres eliminar este equipo?')) {
                    removeEquipmentFromCenter(currentWorkCenter.id, equipmentId);
                    loadEquipmentList(currentWorkCenter.id);
                    showToast('Equipo eliminado correctamente', 'success');
                }
            });
        });
    };

    // ===== GENERATE CENTER REPORT BUTTON =====
    if (generateCenterReportBtn) {
        generateCenterReportBtn.addEventListener('click', () => {
            generateCenterReport();
        });
    }

    // ===== GENERATE CONSOLIDATED CENTER REPORT =====
    function generateCenterReport() {
        if (!currentWorkCenter) {
            showToast('No hay centro seleccionado', 'error');
            return;
        }

        const centerInspections = inspections.filter(i => i.workCenterId === currentWorkCenter.id);

        if (centerInspections.length === 0) {
            showToast('No hay inspecciones para este centro', 'warning');
            return;
        }

        // Group by equipment
        const equipmentGroups = {};
        centerInspections.forEach(insp => {
            if (!equipmentGroups[insp.equipmentId]) {
                equipmentGroups[insp.equipmentId] = [];
            }
            equipmentGroups[insp.equipmentId].push(insp);
        });

        // Generate consolidated HTML
        let reportHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #ff6b35; padding-bottom: 20px;">
                    <h1 style="color: #1e293b; margin-bottom: 10px;">Informe Consolidado</h1>
                    <h2 style="color: #ff6b35; margin-bottom: 5px;">${currentWorkCenter.name}</h2>
                    <p style="color: #64748b;">${currentWorkCenter.address || ''}</p>
                    <p style="color: #64748b;">Fecha: ${new Date().toLocaleDateString()}</p>
                </div>

                <div style="margin-bottom: 30px; padding: 15px; background: #f8fafc; border-left: 4px solid #ff6b35;">
                    <h3 style="margin-top: 0; color: #1e293b;">Resumen</h3>
                    <p><strong>Total de equipos inspeccionados:</strong> ${Object.keys(equipmentGroups).length}</p>
                    <p><strong>Total de inspecciones:</strong> ${centerInspections.length}</p>
                    <p><strong>Cliente:</strong> ${currentWorkCenter.clientName || 'No especificado'}</p>
                </div>
        `;

        // Add each equipment section
        const pressureGroupsData = []; // Store pressure groups for chart rendering

        Object.keys(equipmentGroups).forEach((equipmentId, index) => {
            const inspList = equipmentGroups[equipmentId];
            const latestInsp = inspList.sort((a, b) => new Date(b.inspectionDate) - new Date(a.inspectionDate))[0];
            const equipment = getEquipmentById(currentWorkCenter.id, equipmentId);
            const typeInfo = equipmentTypes[latestInsp.equipmentType];

            reportHTML += `
                <div style="margin-bottom: 40px; page-break-inside: avoid; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h3 style="color: #1e293b; border-bottom: 3px solid #ff6b35; padding-bottom: 10px; margin-bottom: 20px;">
                        ${typeInfo ? typeInfo.icon : '🔧'} ${typeInfo ? typeInfo.name : latestInsp.equipmentType} - ${equipmentId}
                    </h3>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; background: #f8fafc; padding: 15px; border-radius: 8px;">
                        <div><strong style="color: #64748b;">📍 Ubicación:</strong> ${latestInsp.location || 'No especificada'}</div>
                        <div><strong style="color: #64748b;">📅 Última inspección:</strong> ${new Date(latestInsp.inspectionDate).toLocaleDateString()}</div>
                        <div><strong style="color: #64748b;">👤 Técnico:</strong> ${latestInsp.technician || 'No especificado'}</div>
                        <div><strong style="color: #64748b;">📋 Inspecciones:</strong> ${inspList.length}</div>
                    </div>
            `;

            // PRESSURE GROUP SPECIFIC DATA
            if (latestInsp.equipmentType === 'grupos-presion') {
                const canvasId = `consolidatedChart_${index}`;
                pressureGroupsData.push({ inspection: latestInsp, canvasId });

                reportHTML += `
                    <div style="margin: 20px 0; padding: 15px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                        <h4 style="margin: 0 0 15px 0; color: #1e40af;">⚙️ Datos Técnicos del Grupo de Presión</h4>

                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px;">
                            <div><strong>Caudal Nominal:</strong> ${latestInsp.nominalFlow || '-'} m³/h</div>
                            <div><strong>Presión Nominal:</strong> ${latestInsp.nominalPressure || '-'} bar</div>
                            <div><strong>Potencia:</strong> ${latestInsp.power || '-'} kW</div>
                            <div><strong>RPM:</strong> ${latestInsp.rpm || '-'}</div>
                        </div>

                        <h4 style="margin: 15px 0 10px 0; color: #1e40af;">📊 Curva de Comportamiento</h4>
                        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <canvas id="${canvasId}" style="width: 100%; height: 300px;"></canvas>
                        </div>

                        <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; margin-top: 10px;">
                            <thead>
                                <tr style="background: #1e293b; color: white;">
                                    <th style="padding: 10px; border: 1px solid #cbd5e1;">Punto de Prueba</th>
                                    <th style="padding: 10px; border: 1px solid #cbd5e1;">Caudal</th>
                                    <th style="padding: 10px; border: 1px solid #cbd5e1;">Presión</th>
                                    <th style="padding: 10px; border: 1px solid #cbd5e1;">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style="background: #f8fafc;">
                                    <td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>Caudal 0%</strong></td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">0 m³/h</td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${latestInsp.pressureZero || '-'} bar</td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">-</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>Caudal 50%</strong></td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${latestInsp.nominalFlow ? (latestInsp.nominalFlow * 0.5).toFixed(1) : '-'} m³/h</td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${latestInsp.pressure50 || '-'} bar</td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">-</td>
                                </tr>
                                <tr style="background: #f8fafc;">
                                    <td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>Caudal 100%</strong></td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${latestInsp.nominalFlow || '-'} m³/h</td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${latestInsp.pressureNominal || '-'} bar</td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">
                                        <span style="color: ${latestInsp.pressureNominal >= latestInsp.nominalPressure ? '#10b981' : '#ef4444'}; font-weight: bold;">
                                            ${latestInsp.pressureNominal >= latestInsp.nominalPressure ? '✓ CUMPLE' : '✗ NO CUMPLE'}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>Sobrecarga 140%</strong></td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${latestInsp.nominalFlow ? (latestInsp.nominalFlow * 1.4).toFixed(1) : '-'} m³/h</td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${latestInsp.pressureOverload || '-'} bar</td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">
                                        <span style="color: ${latestInsp.pressureOverload >= (latestInsp.nominalPressure * 0.7) ? '#10b981' : '#ef4444'}; font-weight: bold;">
                                            ${latestInsp.pressureOverload >= (latestInsp.nominalPressure * 0.7) ? '✓ CUMPLE' : '✗ NO CUMPLE'}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `;
            }

            // EQUIPMENT PHOTO
            if (equipment && equipment.photo) {
                reportHTML += `
                    <div style="margin: 15px 0;">
                        <h4 style="color: #64748b; margin-bottom: 8px;">📸 Foto del Equipo</h4>
                        <img src="${equipment.photo}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" alt="Foto del equipo">
                    </div>
                `;
            } else if (latestInsp.photo) {
                reportHTML += `
                    <div style="margin: 15px 0;">
                        <h4 style="color: #64748b; margin-bottom: 8px;">📸 Foto de la Inspección</h4>
                        <img src="${latestInsp.photo}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" alt="Foto de la inspección">
                    </div>
                `;
            }

            // CHECKLIST SUMMARY
            if (latestInsp.checklist && latestInsp.checklist.length > 0) {
                const okCount = latestInsp.checklist.filter(i => i.status === 'ok').length;
                const warningCount = latestInsp.checklist.filter(i => i.status === 'warning').length;
                const errorCount = latestInsp.checklist.filter(i => i.status === 'error').length;

                reportHTML += `
                    <div style="margin: 15px 0; padding: 12px; background: #f1f5f9; border-radius: 8px;">
                        <h4 style="color: #475569; margin: 0 0 10px 0;">✅ Resultados de Inspección</h4>
                        <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <span style="width: 12px; height: 12px; background: #10b981; border-radius: 50%; display: inline-block;"></span>
                                <span><strong>${okCount}</strong> Conforme${okCount !== 1 ? 's' : ''}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <span style="width: 12px; height: 12px; background: #f59e0b; border-radius: 50%; display: inline-block;"></span>
                                <span><strong>${warningCount}</strong> Advertencia${warningCount !== 1 ? 's' : ''}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <span style="width: 12px; height: 12px; background: #ef4444; border-radius: 50%; display: inline-block;"></span>
                                <span><strong>${errorCount}</strong> No Conforme${errorCount !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    </div>
                `;
            }

            // OBSERVATIONS
            if (latestInsp.observations) {
                reportHTML += `
                    <div style="margin: 15px 0; padding: 12px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                        <h4 style="margin: 0 0 8px 0; color: #92400e;">💬 Observaciones</h4>
                        <p style="margin: 0; color: #78350f; line-height: 1.6;">${latestInsp.observations}</p>
                    </div>
                `;
            }

            reportHTML += `</div>`; // Close equipment section
        });

        reportHTML += '</div>';

        // Show in modal
        document.getElementById('reportContent').innerHTML = reportHTML;
        document.getElementById('reportModal').classList.add('active');

        // Render pressure charts after modal is visible
        setTimeout(() => {
            pressureGroupsData.forEach(({ inspection, canvasId }) => {
                const canvas = document.getElementById(canvasId);
                if (!canvas) {
                    console.warn(`Canvas ${canvasId} not found`);
                    return;
                }

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    console.error(`Unable to get context for ${canvasId}`);
                    return;
                }

                // Render pressure chart
                const nominalFlow = parseFloat(inspection.nominalFlow) || 0;
                const nominalPressure = parseFloat(inspection.nominalPressure) || 0;

                const dataPoints = [
                    { x: 0, y: parseFloat(inspection.pressureZero) || 0 },
                    { x: nominalFlow * 0.5, y: parseFloat(inspection.pressure50) || 0 },
                    { x: nominalFlow, y: parseFloat(inspection.pressureNominal) || 0 },
                    { x: nominalFlow * 1.4, y: parseFloat(inspection.pressureOverload) || 0 }
                ];

                new Chart(ctx, {
                    type: 'line',
                    data: {
                        datasets: [
                            {
                                label: 'Curva Real',
                                data: dataPoints,
                                borderColor: 'rgba(59, 130, 246, 1)',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                borderWidth: 3,
                                pointRadius: 6,
                                pointBackgroundColor: dataPoints.map((p, i) => {
                                    if (i === 2 && p.y < nominalPressure) return '#ef4444';
                                    if (i === 3 && p.y < nominalPressure * 0.7) return '#ef4444';
                                    return '#10b981';
                                }),
                                fill: true,
                                tension: 0.3
                            },
                            {
                                label: 'Presión Nominal (Pn)',
                                data: [{ x: 0, y: nominalPressure }, { x: nominalFlow * 1.5, y: nominalPressure }],
                                borderColor: 'rgba(239, 68, 68, 0.8)',
                                borderDash: [5, 5],
                                borderWidth: 2,
                                pointRadius: 0,
                                fill: false
                            },
                            {
                                label: 'Límite 70% Pn',
                                data: [{ x: 0, y: nominalPressure * 0.7 }, { x: nominalFlow * 1.5, y: nominalPressure * 0.7 }],
                                borderColor: 'rgba(245, 158, 11, 0.8)',
                                borderDash: [2, 2],
                                borderWidth: 1,
                                pointRadius: 0,
                                fill: false
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: { font: { size: 12 } }
                            },
                            title: {
                                display: true,
                                text: 'Curva Caudal vs Presión',
                                font: { size: 14, weight: 'bold' }
                            }
                        },
                        scales: {
                            x: {
                                type: 'linear',
                                title: { display: true, text: 'Caudal (m³/h)' },
                                min: 0
                            },
                            y: {
                                type: 'linear',
                                title: { display: true, text: 'Presión (bar)' },
                                min: 0
                            }
                        }
                    }
                });
            });
        }, 200);
    }

    // Make function globally available
    window.generateCenterReport = generateCenterReport;

    // ===== RESET INSPECTION FORM TO CLEAR PHOTOS =====
    const originalResetInspectionForm = window.resetInspectionForm;
    window.resetInspectionForm = function () {
        // Call original function
        if (originalResetInspectionForm) {
            originalResetInspectionForm.call(this);
        }

        // Reset photos array
        currentPhotosArray = [];
        if (photoInput) photoInput.value = '';
        renderPhotosGallery();
    };

    // ===== START INSPECTION WITH EQUIPMENT TO LOAD PHOTOS =====
    const originalStartInspectionWithEquipment = window.startInspectionWithEquipment;
    window.startInspectionWithEquipment = function (equipmentId, type) {
        // Call original function
        originalStartInspectionWithEquipment.call(this, equipmentId, type);

        // Load photos if available
        const equipment = getEquipmentById(currentWorkCenter.id, equipmentId);
        if (equipment) {
            // Use photos array if available, otherwise migrate from single photo
            if (equipment.photos && Array.isArray(equipment.photos)) {
                currentPhotosArray = [...equipment.photos];
            } else if (equipment.photo) {
                // Migrate single photo to array
                currentPhotosArray = [equipment.photo];
            } else {
                currentPhotosArray = [];
            }
            renderPhotosGallery();
        }

        // Update button visibility
        updateAddNextButtonVisibility();
    };

    console.log('Multi-equipment workflow and photo integration initialized');

    // ===== STATISTICS SCREEN =====
    const viewStatisticsBtn = document.getElementById('viewStatisticsBtn');
    const backFromStatsBtn = document.getElementById('backFromStatsBtn');

    if (viewStatisticsBtn) {
        viewStatisticsBtn.addEventListener('click', () => {
            if (currentWorkCenter) {
                generateStatistics(currentWorkCenter.id);
                showScreen('statisticsScreen');
            }
        });
    }

    if (backFromStatsBtn) {
        backFromStatsBtn.addEventListener('click', () => {
            showScreen('welcome');
        });
    }

    // Update screens object to include statistics
    screens.statisticsScreen = document.getElementById('statisticsScreen');

    // Generate statistics for a work center
    function generateStatistics(centerId) {
        const center = getWorkCenter(centerId);
        const equipment = getEquipmentByCenter(centerId);
        const centerInspections = inspections.filter(i => i.workCenterId === centerId && i.status === 'completed');

        // Update subtitle
        document.getElementById('statsSubtitle').textContent = center ? center.name : 'Análisis y métricas';

        // Calculate statistics
        const totalEquipment = equipment.length;
        const totalInspections = centerInspections.length;

        // Equipment with at least one inspection
        const inspectedEquipmentIds = new Set(centerInspections.map(i => i.equipmentId));
        const pendingEquipment = equipment.filter(eq => !inspectedEquipmentIds.has(eq.id));
        const pendingCount = pendingEquipment.length;

        // Last inspection date
        const lastInspection = centerInspections.length > 0
            ? centerInspections.sort((a, b) => new Date(b.inspectionDate) - new Date(a.inspectionDate))[0]
            : null;
        const lastInspectionDate = lastInspection
            ? new Date(lastInspection.inspectionDate).toLocaleDateString('es-ES')
            : '-';

        // Update summary cards
        document.getElementById('totalEquipmentCount').textContent = totalEquipment;
        document.getElementById('totalInspectionsCount').textContent = totalInspections;
        document.getElementById('pendingEquipmentCount').textContent = pendingCount;
        document.getElementById('lastInspectionDate').textContent = lastInspectionDate;

        // Equipment by type chart
        const equipmentByType = {};
        equipment.forEach(eq => {
            const typeName = equipmentTypes[eq.type] ? equipmentTypes[eq.type].name : eq.type;
            equipmentByType[typeName] = (equipmentByType[typeName] || 0) + 1;
        });

        renderEquipmentTypeChart(equipmentByType);

        // Inspection status chart
        const inspectionStatusData = {
            'Con Inspección': totalEquipment - pendingCount,
            'Sin Inspección': pendingCount
        };

        renderInspectionStatusChart(inspectionStatusData);

        // Pending equipment list
        renderPendingEquipmentList(pendingEquipment);
    }

    // Render equipment type chart
    let equipmentTypeChartInstance = null;
    function renderEquipmentTypeChart(data) {
        const canvas = document.getElementById('equipmentTypeChart');
        if (!canvas) {
            console.warn('Canvas element "equipmentTypeChart" not found');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Unable to get 2D context from equipmentTypeChart canvas');
            return;
        }

        // Destroy previous chart if exists
        if (equipmentTypeChartInstance) {
            equipmentTypeChartInstance.destroy();
        }

        const labels = Object.keys(data);
        const values = Object.values(data);

        const colors = [
            'rgba(255, 107, 53, 0.8)',
            'rgba(0, 78, 137, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 146, 60, 0.8)',
            'rgba(168, 85, 247, 0.8)'
        ];

        equipmentTypeChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, labels.length),
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#f8fafc',
                            font: {
                                size: 12
                            },
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Render inspection status chart
    let inspectionStatusChartInstance = null;
    function renderInspectionStatusChart(data) {
        const canvas = document.getElementById('inspectionStatusChart');
        if (!canvas) {
            console.warn('Canvas element "inspectionStatusChart" not found');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Unable to get 2D context from inspectionStatusChart canvas');
            return;
        }

        // Destroy previous chart if exists
        if (inspectionStatusChartInstance) {
            inspectionStatusChartInstance.destroy();
        }

        const labels = Object.keys(data);
        const values = Object.values(data);

        inspectionStatusChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cantidad',
                    data: values,
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)'
                    ],
                    borderColor: [
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Equipos: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#94a3b8',
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Render pending equipment list
    function renderPendingEquipmentList(pendingEquipment) {
        const container = document.getElementById('pendingEquipmentList');
        if (!container) return;

        if (pendingEquipment.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 15px;">✓</div>
                    <h4>¡Excelente!</h4>
                    <p>Todos los equipos han sido inspeccionados</p>
                </div>
            `;
            return;
        }

        container.innerHTML = pendingEquipment.map(eq => {
            const typeInfo = equipmentTypes[eq.type];
            return `
                <div class="pending-item">
                    <div class="pending-item-info">
                        <strong>${typeInfo ? typeInfo.icon : '🔧'} ${typeInfo ? typeInfo.name : eq.type} - ${eq.id}</strong>
                        <p>📍 ${eq.location || 'Ubicación no especificada'}</p>
                    </div>
                    <div class="pending-badge">Sin inspeccionar</div>
                </div>
            `;
        }).join('');
    }

    // Update loadEquipmentList to show/hide statistics button
    const originalLoadEquipmentListForStats = window.loadEquipmentList;
    window.loadEquipmentList = function(centerId) {
        // Call original function
        if (originalLoadEquipmentListForStats) {
            originalLoadEquipmentListForStats.call(this, centerId);
        }

        // Show/hide statistics button
        const statsBtn = document.getElementById('viewStatisticsBtn');
        const equipment = getEquipmentByCenter(centerId);
        if (statsBtn) {
            statsBtn.style.display = equipment.length > 0 ? 'inline-flex' : 'none';
        }
    };

    console.log('Statistics functionality initialized');

    // ===== DIGITAL SIGNATURES =====
    let technicianSignatureData = null;
    let clientSignatureData = null;

    const techCanvas = document.getElementById('technicianSignature');
    const clientCanvas = document.getElementById('clientSignature');
    const clearTechBtn = document.getElementById('clearTechnicianSignature');
    const clearClientBtn = document.getElementById('clearClientSignature');
    const techPlaceholder = document.getElementById('techPlaceholder');
    const clientPlaceholder = document.getElementById('clientPlaceholder');

    // Signature pad class
    class SignaturePad {
        constructor(canvas, placeholder) {
            this.canvas = canvas;
            this.context = canvas.getContext('2d');
            this.placeholder = placeholder;
            this.isDrawing = false;
            this.hasDrawn = false;

            // Set canvas size properly
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;

            // Configure context
            this.context.strokeStyle = '#000000';
            this.context.lineWidth = 2;
            this.context.lineCap = 'round';
            this.context.lineJoin = 'round';

            this.setupEventListeners();
        }

        setupEventListeners() {
            // Mouse events
            this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
            this.canvas.addEventListener('mousemove', this.draw.bind(this));
            this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
            this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

            // Touch events
            this.canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('mousedown', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                this.canvas.dispatchEvent(mouseEvent);
            });

            this.canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                this.canvas.dispatchEvent(mouseEvent);
            });

            this.canvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                const mouseEvent = new MouseEvent('mouseup', {});
                this.canvas.dispatchEvent(mouseEvent);
            });
        }

        startDrawing(e) {
            this.isDrawing = true;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.context.beginPath();
            this.context.moveTo(x, y);
        }

        draw(e) {
            if (!this.isDrawing) return;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.context.lineTo(x, y);
            this.context.stroke();

            if (!this.hasDrawn) {
                this.hasDrawn = true;
                if (this.placeholder) this.placeholder.classList.add('hidden');
                this.canvas.parentElement.classList.add('signed');
            }
        }

        stopDrawing() {
            if (this.isDrawing) {
                this.isDrawing = false;
                this.context.closePath();
            }
        }

        clear() {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.hasDrawn = false;
            if (this.placeholder) this.placeholder.classList.remove('hidden');
            this.canvas.parentElement.classList.remove('signed');
        }

        getDataURL() {
            return this.hasDrawn ? this.canvas.toDataURL('image/png') : null;
        }

        isEmpty() {
            return !this.hasDrawn;
        }
    }

    // Initialize signature pads
    let techSignaturePad = null;
    let clientSignaturePad = null;

    if (techCanvas && clientCanvas) {
        techSignaturePad = new SignaturePad(techCanvas, techPlaceholder);
        clientSignaturePad = new SignaturePad(clientCanvas, clientPlaceholder);

        // Clear buttons
        if (clearTechBtn) {
            clearTechBtn.addEventListener('click', () => {
                techSignaturePad.clear();
                technicianSignatureData = null;
                showToast('Firma del técnico borrada', 'info');
            });
        }

        if (clearClientBtn) {
            clearClientBtn.addEventListener('click', () => {
                clientSignaturePad.clear();
                clientSignatureData = null;
                showToast('Firma del cliente borrada', 'info');
            });
        }

        // Integrate signatures with saveInspection
        const originalSaveInspectionWithSignatures = window.saveInspection;
        window.saveInspection = function(status = 'draft') {
            // Get signature data
            if (techSignaturePad && !techSignaturePad.isEmpty()) {
                technicianSignatureData = techSignaturePad.getDataURL();
            }
            if (clientSignaturePad && !clientSignaturePad.isEmpty()) {
                clientSignatureData = clientSignaturePad.getDataURL();
            }

            // Call original function
            const result = originalSaveInspectionWithSignatures.call(this, status);

            // Add signatures to last inspection
            if (inspections.length > 0) {
                const lastInspection = inspections[inspections.length - 1];
                if (technicianSignatureData) lastInspection.technicianSignature = technicianSignatureData;
                if (clientSignatureData) lastInspection.clientSignature = clientSignatureData;
                localStorage.setItem('inspections', JSON.stringify(inspections));
            }

            return result;
        };

        // Clear signatures on reset
        const originalResetWithSignatures = window.resetInspectionForm;
        window.resetInspectionForm = function() {
            if (originalResetWithSignatures) originalResetWithSignatures.call(this);
            if (techSignaturePad) techSignaturePad.clear();
            if (clientSignaturePad) clientSignaturePad.clear();
            technicianSignatureData = null;
            clientSignatureData = null;
        };

        console.log('Digital signatures initialized');
    }
});

// ===== AppSheet Synchronization Module =====
document.addEventListener('DOMContentLoaded', () => {
    // AppSheet API Configuration
    const APPSHEET_CONFIG = {
        apiUrl: '', // TO BE CONFIGURED: AppSheet API endpoint
        appId: '', // TO BE CONFIGURED: AppSheet App ID
        apiKey: '', // TO BE CONFIGURED: AppSheet API Key
        tableName: 'Inspecciones', // Table name in AppSheet
        photosTableName: 'Fotos', // Photos table in AppSheet
        driveFolder: 'RETIMBRASUR_Photos', // Google Drive folder for photos
        maxRetries: 3,
        retryDelay: 2000 // 2 seconds
    };

    // Sync status tracking
    let syncStatus = {
        isSyncing: false,
        lastSync: localStorage.getItem('lastSyncDate') || null,
        pendingSync: JSON.parse(localStorage.getItem('pendingSync')) || [],
        errors: []
    };

    // Create sync button in header
    function createSyncButton() {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) return;

        const syncBtn = document.createElement('button');
        syncBtn.id = 'syncAppSheetBtn';
        syncBtn.className = 'btn btn-secondary';
        syncBtn.innerHTML = `
            <span class="icon">🔄</span>
            <span class="sync-text">Sincronizar</span>
        `;
        syncBtn.title = 'Sincronizar con AppSheet';

        // Add sync status indicator
        const syncIndicator = document.createElement('span');
        syncIndicator.id = 'syncIndicator';
        syncIndicator.className = 'sync-indicator';
        syncIndicator.style.cssText = `
            position: absolute;
            top: -5px;
            right: -5px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #ccc;
            border: 2px solid white;
        `;
        syncBtn.style.position = 'relative';
        syncBtn.appendChild(syncIndicator);

        // Insert before export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            headerActions.insertBefore(syncBtn, exportBtn);
        } else {
            headerActions.appendChild(syncBtn);
        }

        // Update sync indicator
        updateSyncIndicator();

        // Sync button click handler
        syncBtn.addEventListener('click', async () => {
            await syncWithAppSheet();
        });

        return syncBtn;
    }

    // Update sync indicator color
    function updateSyncIndicator() {
        const indicator = document.getElementById('syncIndicator');
        if (!indicator) return;

        const pendingCount = syncStatus.pendingSync.length;

        if (syncStatus.isSyncing) {
            indicator.style.background = '#2196F3'; // Blue - syncing
            indicator.style.animation = 'pulse 1.5s infinite';
        } else if (pendingCount > 0) {
            indicator.style.background = '#ff9800'; // Orange - pending
            indicator.title = `${pendingCount} inspecciones pendientes de sincronizar`;
        } else {
            indicator.style.background = '#4caf50'; // Green - synced
            indicator.title = syncStatus.lastSync ? `Última sincronización: ${new Date(syncStatus.lastSync).toLocaleString()}` : 'Sin sincronizar';
        }
    }

    // Upload photo to Google Drive via AppSheet
    async function uploadPhotoToGoogleDrive(photoBase64, fileName, retryCount = 0) {
        if (!APPSHEET_CONFIG.apiUrl || !APPSHEET_CONFIG.apiKey) {
            console.warn('AppSheet no configurado. Las fotos se guardarán solo localmente.');
            return { success: false, url: null, localOnly: true };
        }

        try {
            // Convert base64 to blob
            const response = await fetch(photoBase64);
            const blob = await response.blob();

            // Create FormData for upload
            const formData = new FormData();
            formData.append('file', blob, fileName);
            formData.append('folder', APPSHEET_CONFIG.driveFolder);

            // Upload to AppSheet/Google Drive
            const uploadResponse = await fetch(`${APPSHEET_CONFIG.apiUrl}/uploadPhoto`, {
                method: 'POST',
                headers: {
                    'ApplicationAccessKey': APPSHEET_CONFIG.apiKey,
                    'AppId': APPSHEET_CONFIG.appId
                },
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error(`Upload failed: ${uploadResponse.statusText}`);
            }

            const result = await uploadResponse.json();

            return {
                success: true,
                url: result.url || result.fileUrl,
                driveId: result.fileId
            };

        } catch (error) {
            console.error('Error uploading photo:', error);

            // Retry logic
            if (retryCount < APPSHEET_CONFIG.maxRetries) {
                console.log(`Retrying upload (${retryCount + 1}/${APPSHEET_CONFIG.maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, APPSHEET_CONFIG.retryDelay * (retryCount + 1)));
                return uploadPhotoToGoogleDrive(photoBase64, fileName, retryCount + 1);
            }

            return {
                success: false,
                error: error.message
            };
        }
    }

    // Upload multiple photos
    async function uploadInspectionPhotos(inspection) {
        const photoUrls = [];

        // Handle single photo (legacy)
        if (inspection.photo) {
            const fileName = `${inspection.equipmentType}_${inspection.equipmentId}_${Date.now()}.jpg`;
            const result = await uploadPhotoToGoogleDrive(inspection.photo, fileName);
            if (result.success) {
                photoUrls.push(result.url);
            }
        }

        // Handle multiple photos
        if (inspection.photos && Array.isArray(inspection.photos)) {
            for (let i = 0; i < inspection.photos.length; i++) {
                const photo = inspection.photos[i];
                const fileName = `${inspection.equipmentType}_${inspection.equipmentId}_${i + 1}_${Date.now()}.jpg`;
                const result = await uploadPhotoToGoogleDrive(photo, fileName);
                if (result.success) {
                    photoUrls.push(result.url);
                }
            }
        }

        return photoUrls;
    }

    // Sync single inspection to AppSheet
    async function syncInspection(inspection, retryCount = 0) {
        if (!APPSHEET_CONFIG.apiUrl || !APPSHEET_CONFIG.apiKey) {
            console.warn('AppSheet no configurado. Los datos se mantendrán solo localmente.');
            return { success: false, localOnly: true };
        }

        try {
            // Upload photos first
            const photoUrls = await uploadInspectionPhotos(inspection);

            // Prepare inspection data for AppSheet
            const appSheetData = {
                ID: inspection.id,
                WorkCenterId: inspection.workCenterId,
                WorkCenterName: inspection.workCenterName,
                EquipmentType: inspection.equipmentType,
                EquipmentId: inspection.equipmentId,
                Location: inspection.location,
                InspectionDate: inspection.inspectionDate,
                Technician: inspection.technician,
                TechnicianId: inspection.technicianId || '',

                // Equipment details
                Manufacturer: inspection.manufacturer || '',
                Brand: inspection.brand || '',
                Model: inspection.model || '',
                ManufacturingDate: inspection.manufacturingDate || '',
                LastRetestDate: inspection.lastRetestDate || '',

                // Checklist results
                TotalItems: inspection.checklist.length,
                CheckedItems: inspection.checklist.filter(i => i.checked).length,
                OkCount: inspection.checklist.filter(i => i.status === 'ok').length,
                WarningCount: inspection.checklist.filter(i => i.status === 'warning').length,
                ErrorCount: inspection.checklist.filter(i => i.status === 'error').length,
                CompletionPercentage: Math.round((inspection.checklist.filter(i => i.checked).length / inspection.checklist.length) * 100),

                // Checklist JSON
                ChecklistData: JSON.stringify(inspection.checklist),

                // Text fields
                Observations: inspection.observations || '',
                Recommendations: inspection.recommendations || '',

                // Photos
                PhotoUrls: photoUrls.join(','),
                PhotoCount: photoUrls.length,

                // Signatures
                TechnicianSignature: inspection.technicianSignature || '',
                ClientSignature: inspection.clientSignature || '',

                // Metadata
                Status: inspection.status,
                CreatedAt: inspection.createdAt,
                UpdatedAt: new Date().toISOString(),
                SyncedAt: new Date().toISOString()
            };

            // Send to AppSheet API
            const response = await fetch(`${APPSHEET_CONFIG.apiUrl}/tables/${APPSHEET_CONFIG.tableName}/Action`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ApplicationAccessKey': APPSHEET_CONFIG.apiKey,
                    'AppId': APPSHEET_CONFIG.appId
                },
                body: JSON.stringify({
                    Action: 'Add',
                    Properties: {},
                    Rows: [appSheetData]
                })
            });

            if (!response.ok) {
                throw new Error(`AppSheet API error: ${response.statusText}`);
            }

            const result = await response.json();

            // Mark as synced in local storage
            const inspections = JSON.parse(localStorage.getItem('inspections')) || [];
            const inspectionIndex = inspections.findIndex(i => i.id === inspection.id);
            if (inspectionIndex !== -1) {
                inspections[inspectionIndex].synced = true;
                inspections[inspectionIndex].syncedAt = new Date().toISOString();
                localStorage.setItem('inspections', JSON.stringify(inspections));
            }

            return {
                success: true,
                result: result
            };

        } catch (error) {
            console.error('Error syncing inspection:', error);

            // Retry logic
            if (retryCount < APPSHEET_CONFIG.maxRetries) {
                console.log(`Retrying sync (${retryCount + 1}/${APPSHEET_CONFIG.maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, APPSHEET_CONFIG.retryDelay * (retryCount + 1)));
                return syncInspection(inspection, retryCount + 1);
            }

            // Add to pending sync queue
            if (!syncStatus.pendingSync.find(p => p.id === inspection.id)) {
                syncStatus.pendingSync.push({
                    id: inspection.id,
                    timestamp: new Date().toISOString(),
                    error: error.message
                });
                localStorage.setItem('pendingSync', JSON.stringify(syncStatus.pendingSync));
            }

            return {
                success: false,
                error: error.message
            };
        }
    }

    // Main sync function - sync all unsynced inspections
    async function syncWithAppSheet() {
        if (syncStatus.isSyncing) {
            showToast('Ya hay una sincronización en curso', 'warning');
            return;
        }

        // Check if AppSheet is configured
        if (!APPSHEET_CONFIG.apiUrl || !APPSHEET_CONFIG.apiKey) {
            showToast('AppSheet no está configurado. Configure las credenciales en el código.', 'error');
            console.warn('Para configurar AppSheet, edite APPSHEET_CONFIG en app.js');
            return;
        }

        // Check internet connection
        if (!navigator.onLine) {
            showToast('Sin conexión a Internet. La sincronización se realizará cuando esté conectado.', 'warning');
            return;
        }

        syncStatus.isSyncing = true;
        updateSyncIndicator();

        const syncBtn = document.getElementById('syncAppSheetBtn');
        if (syncBtn) {
            syncBtn.disabled = true;
            const syncText = syncBtn.querySelector('.sync-text');
            if (syncText) syncText.textContent = 'Sincronizando...';
        }

        try {
            // Get all inspections
            const inspections = JSON.parse(localStorage.getItem('inspections')) || [];

            // Filter unsynced inspections
            const unsyncedInspections = inspections.filter(i => !i.synced);

            if (unsyncedInspections.length === 0) {
                showToast('Todas las inspecciones están sincronizadas', 'success');
                syncStatus.isSyncing = false;
                updateSyncIndicator();
                if (syncBtn) {
                    syncBtn.disabled = false;
                    const syncText = syncBtn.querySelector('.sync-text');
                    if (syncText) syncText.textContent = 'Sincronizar';
                }
                return;
            }

            showToast(`Sincronizando ${unsyncedInspections.length} inspecciones...`, 'info');

            let successCount = 0;
            let errorCount = 0;

            // Sync each inspection
            for (const inspection of unsyncedInspections) {
                const result = await syncInspection(inspection);
                if (result.success) {
                    successCount++;
                    // Remove from pending queue
                    syncStatus.pendingSync = syncStatus.pendingSync.filter(p => p.id !== inspection.id);
                } else if (!result.localOnly) {
                    errorCount++;
                }

                // Update progress
                const progress = Math.round(((successCount + errorCount) / unsyncedInspections.length) * 100);
                if (syncBtn) {
                    const syncText = syncBtn.querySelector('.sync-text');
                    if (syncText) syncText.textContent = `${progress}%`;
                }
            }

            // Update sync status
            syncStatus.lastSync = new Date().toISOString();
            syncStatus.isSyncing = false;
            localStorage.setItem('lastSyncDate', syncStatus.lastSync);
            localStorage.setItem('pendingSync', JSON.stringify(syncStatus.pendingSync));

            // Show result
            if (errorCount === 0) {
                showToast(`✅ ${successCount} inspecciones sincronizadas correctamente`, 'success');
            } else {
                showToast(`⚠️ ${successCount} sincronizadas, ${errorCount} con errores`, 'warning');
            }

        } catch (error) {
            console.error('Sync error:', error);
            showToast('Error durante la sincronización: ' + error.message, 'error');
            syncStatus.errors.push({
                timestamp: new Date().toISOString(),
                error: error.message
            });
        } finally {
            syncStatus.isSyncing = false;
            updateSyncIndicator();

            if (syncBtn) {
                syncBtn.disabled = false;
                const syncText = syncBtn.querySelector('.sync-text');
                if (syncText) syncText.textContent = 'Sincronizar';
            }
        }
    }

    // Auto-sync when completing an inspection
    const originalSaveInspection = window.saveInspection;
    if (originalSaveInspection) {
        window.saveInspection = async function(status) {
            const result = originalSaveInspection.call(this, status);

            // Auto-sync if online and configured
            if (navigator.onLine && APPSHEET_CONFIG.apiUrl && APPSHEET_CONFIG.apiKey) {
                // Get the last inspection
                const inspections = JSON.parse(localStorage.getItem('inspections')) || [];
                if (inspections.length > 0) {
                    const lastInspection = inspections[inspections.length - 1];

                    // Sync in background
                    setTimeout(async () => {
                        const syncResult = await syncInspection(lastInspection);
                        if (syncResult.success) {
                            showToast('Inspección sincronizada con AppSheet', 'success');
                            updateSyncIndicator();
                        }
                    }, 1000);
                }
            }

            return result;
        };
    }

    // Background sync via Service Worker
    if ('serviceWorker' in navigator && 'sync' in self.registration) {
        // Register background sync when going offline
        window.addEventListener('offline', () => {
            navigator.serviceWorker.ready.then((registration) => {
                return registration.sync.register('sync-inspections');
            }).catch((error) => {
                console.log('Background sync registration failed:', error);
            });
        });

        // Sync when coming back online
        window.addEventListener('online', () => {
            setTimeout(() => {
                syncWithAppSheet();
            }, 2000);
        });
    }

    // Initialize sync button
    createSyncButton();

    // Add pulse animation for sync indicator
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    `;
    document.head.appendChild(style);

    // Make sync function available globally
    window.syncWithAppSheet = syncWithAppSheet;

    console.log('AppSheet synchronization module initialized');
    console.log('Configure APPSHEET_CONFIG in app.js to enable synchronization');
});

// ===== Templates Module (Copy from previous inspections) =====
document.addEventListener('DOMContentLoaded', () => {
    let templateSelect = null;

    // Populate template selector with previous inspections
    function populateTemplateSelector() {
        templateSelect = document.getElementById('templateSelect');
        if (!templateSelect) return;

        // Get all inspections from current work center
        const inspections = JSON.parse(localStorage.getItem('inspections')) || [];
        const centerInspections = inspections.filter(i => i.workCenterId === currentWorkCenter?.id);

        // Clear existing options except first one
        templateSelect.innerHTML = '<option value="">-- Nuevo equipo (vacío) --</option>';

        // Group by equipment type
        const grouped = {};
        centerInspections.forEach(inspection => {
            const type = inspection.equipmentType || 'otros';
            if (!grouped[type]) grouped[type] = [];
            grouped[type].push(inspection);
        });

        // Add options grouped by type
        Object.keys(grouped).sort().forEach(type => {
            const typeLabel = getEquipmentTypeLabel(type);
            const optgroup = document.createElement('optgroup');
            optgroup.label = typeLabel;

            grouped[type]
                .sort((a, b) => new Date(b.inspectionDate) - new Date(a.inspectionDate))
                .slice(0, 10) // Max 10 per type
                .forEach(inspection => {
                    const option = document.createElement('option');
                    option.value = inspection.id;
                    const date = new Date(inspection.inspectionDate).toLocaleDateString();
                    option.textContent = `${inspection.equipmentId} - ${date} (${inspection.location})`;
                    optgroup.appendChild(option);
                });

            templateSelect.appendChild(optgroup);
        });

        // Show count
        const totalCount = centerInspections.length;
        if (totalCount > 0) {
            const infoOption = document.createElement('option');
            infoOption.disabled = true;
            infoOption.textContent = `─── ${totalCount} inspecciones disponibles ───`;
            templateSelect.insertBefore(infoOption, templateSelect.children[1]);
        }
    }

    // Get equipment type label
    function getEquipmentTypeLabel(type) {
        const labels = {
            'extintores': '🧯 Extintores',
            'bies': '🚰 BIEs',
            'grupos-presion': '⚙️ Grupos de Presión',
            'hidrantes': '🚿 Hidrantes',
            'gas': '💨 Extinción por Gas',
            'sprinklers': '💧 Sprinklers',
            'agua-pulverizada': '🌊 Agua Pulverizada',
            'deteccion': '🔔 Detección',
            'espuma': '🧼 Sistemas Espuma',
            'puertas-rf': '🚪 Puertas RF'
        };
        return labels[type] || '📦 Otros';
    }

    // Load template data into form
    function loadTemplate(inspectionId) {
        if (!inspectionId) return;

        const inspections = JSON.parse(localStorage.getItem('inspections')) || [];
        const template = inspections.find(i => i.id === inspectionId);

        if (!template) {
            showToast('Plantilla no encontrada', 'error');
            return;
        }

        // Pre-fill equipment data (NOT inspection-specific data)
        document.getElementById('equipmentId').value = template.equipmentId || '';
        document.getElementById('location').value = template.location || '';
        document.getElementById('manufacturer').value = template.manufacturer || '';
        document.getElementById('brand').value = template.brand || '';
        document.getElementById('model').value = template.model || '';

        if (template.manufacturingDate) {
            document.getElementById('manufacturingDate').value = template.manufacturingDate;
        }
        if (template.lastRetestDate) {
            document.getElementById('lastRetestDate').value = template.lastRetestDate;
        }

        // Pre-fill observations and recommendations as suggestions
        const observationsField = document.getElementById('observations');
        const recommendationsField = document.getElementById('recommendations');

        if (template.observations && observationsField) {
            observationsField.value = template.observations;
            observationsField.placeholder = 'Editado desde plantilla - modifica si es necesario';
        }
        if (template.recommendations && recommendationsField) {
            recommendationsField.value = template.recommendations;
            recommendationsField.placeholder = 'Editado desde plantilla - modifica si es necesario';
        }

        // Show success toast
        showToast(`✓ Plantilla cargada: ${template.equipmentId}`, 'success');

        // Scroll to top of form
        document.getElementById('inspectionScreen').scrollTop = 0;
    }

    // Template selector change event
    function setupTemplateSelector() {
        templateSelect = document.getElementById('templateSelect');
        if (!templateSelect) {
            console.warn('Template selector not found');
            return;
        }

        templateSelect.addEventListener('change', (e) => {
            const inspectionId = e.target.value;
            if (inspectionId) {
                loadTemplate(inspectionId);
            }
        });
    }

    // Hook into startInspection to populate templates
    const originalStartInspectionForTemplates = window.startInspection;
    if (originalStartInspectionForTemplates) {
        window.startInspection = function(type) {
            const result = originalStartInspectionForTemplates.call(this, type);

            // Populate templates after a short delay to ensure DOM is ready
            setTimeout(() => {
                populateTemplateSelector();
            }, 100);

            return result;
        };
    }

    // Hook into resetInspectionForm to clear template selector
    const originalResetForTemplates = window.resetInspectionForm;
    if (originalResetForTemplates) {
        window.resetInspectionForm = function() {
            if (originalResetForTemplates) originalResetForTemplates.call(this);

            // Reset template selector
            const templateSelect = document.getElementById('templateSelect');
            if (templateSelect) {
                templateSelect.value = '';
            }
        };
    }

    // Initialize template selector
    setupTemplateSelector();

    console.log('Templates module initialized');
});

// ===== Voice Dictation Module (Speech Recognition) =====
document.addEventListener('DOMContentLoaded', () => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.warn('Speech Recognition API not supported in this browser');
        // Hide voice buttons if not supported
        const voiceButtons = document.querySelectorAll('.voice-btn');
        voiceButtons.forEach(btn => {
            btn.style.display = 'none';
            btn.title = 'Reconocimiento de voz no soportado en este navegador';
        });
        return;
    }

    // Check for HTTPS requirement (except localhost)
    if (location.protocol !== 'https:' && !location.hostname.match(/^(localhost|127\.0\.0\.1)$/)) {
        console.warn('Speech Recognition requires HTTPS');
        const voiceButtons = document.querySelectorAll('.voice-btn');
        voiceButtons.forEach(btn => {
            btn.style.opacity = '0.5';
            btn.title = 'El reconocimiento de voz requiere HTTPS';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                showToast('⚠️ El reconocimiento de voz solo funciona en HTTPS o localhost', 'warning');
            });
        });
        return;
    }

    // Create recognition instance
    let recognition = null;
    let isRecording = false;
    let currentTextarea = null;
    let currentButton = null;

    // Initialize Speech Recognition
    function initRecognition() {
        recognition = new SpeechRecognition();
        recognition.lang = 'es-ES'; // Spanish
        recognition.continuous = true; // Keep listening
        recognition.interimResults = true; // Show interim results

        let finalTranscript = '';
        let interimTranscript = '';

        recognition.onstart = () => {
            isRecording = true;
            if (currentButton) {
                currentButton.classList.add('recording');
                const textSpan = currentButton.querySelector('.voice-btn-text');
                if (textSpan) textSpan.textContent = 'Grabando...';
            }
            showToast('🎤 Escuchando... Habla ahora', 'info');
        };

        recognition.onresult = (event) => {
            interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            // Update textarea with current transcription
            if (currentTextarea) {
                const existingText = currentTextarea.value;
                const cursorPos = currentTextarea.selectionStart;

                // If there's existing text, add space before
                const prefix = existingText && !existingText.endsWith(' ') && finalTranscript ? ' ' : '';

                currentTextarea.value = existingText.substring(0, cursorPos) +
                    prefix + finalTranscript + interimTranscript +
                    existingText.substring(cursorPos);

                // Show interim in placeholder
                if (interimTranscript) {
                    currentTextarea.placeholder = `Escuchando: "${interimTranscript}..."`;
                }
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error, event);

            const errorMessages = {
                'no-speech': '🔇 No se detectó ninguna voz. Habla más cerca del micrófono.',
                'audio-capture': '🎤 No se puede acceder al micrófono. Verifica los permisos del navegador.',
                'not-allowed': '🚫 Permiso de micrófono denegado. Ve a la configuración del navegador y permite el acceso.',
                'network': '📡 Error de red. Verifica tu conexión a internet.',
                'aborted': '⏹️ Reconocimiento cancelado.',
                'language-not-supported': '🌍 Idioma no soportado. Intenta con español.',
                'service-not-allowed': '⚠️ Servicio no permitido. Usa HTTPS o localhost.'
            };

            const message = errorMessages[event.error] || `⚠️ Error de reconocimiento: ${event.error}`;

            // Only stop and show error for non-recoverable errors
            if (!['no-speech', 'aborted'].includes(event.error)) {
                stopRecording();
                showToast(message, 'error');
            } else {
                // For recoverable errors, just log and continue
                console.warn(message);
                // Auto-restart for 'no-speech' after a short delay
                if (event.error === 'no-speech' && isRecording) {
                    setTimeout(() => {
                        if (isRecording) {
                            try {
                                recognition.start();
                            } catch (e) {
                                console.warn('Could not restart after no-speech:', e);
                            }
                        }
                    }, 500);
                }
            }
        };

        recognition.onend = () => {
            if (isRecording) {
                // Auto-restart if still recording (for continuous mode)
                // Add delay to prevent "recognition already started" error
                setTimeout(() => {
                    if (isRecording) {
                        try {
                            recognition.start();
                        } catch (e) {
                            console.warn('Could not restart recognition:', e);
                            stopRecording();
                        }
                    }
                }, 100); // 100ms delay prevents race condition
            }
        };
    }

    // Start recording
    function startRecording(textarea, button) {
        if (isRecording) {
            stopRecording();
            return;
        }

        currentTextarea = textarea;
        currentButton = button;

        if (!recognition) {
            initRecognition();
        }

        try {
            recognition.start();
        } catch (error) {
            console.error('Failed to start recognition:', error);
            showToast('No se pudo iniciar el micrófono', 'error');
        }
    }

    // Stop recording
    function stopRecording() {
        isRecording = false;

        if (recognition) {
            try {
                recognition.stop();
            } catch (e) {
                console.error('Error stopping recognition:', e);
            }
        }

        if (currentButton) {
            currentButton.classList.remove('recording');
            const textSpan = currentButton.querySelector('.voice-btn-text');
            if (textSpan) textSpan.textContent = 'Dictar';
        }

        if (currentTextarea) {
            currentTextarea.placeholder = currentTextarea.id === 'observations' ?
                'Añade cualquier observación relevante...' :
                'Recomendaciones para el mantenimiento...';
        }

        currentTextarea = null;
        currentButton = null;

        showToast('✓ Dictado finalizado', 'success');
    }

    // Setup voice buttons
    function setupVoiceButtons() {
        // Observations voice button
        const voiceObsBtn = document.getElementById('voiceObservationsBtn');
        const observationsTextarea = document.getElementById('observations');

        if (voiceObsBtn && observationsTextarea) {
            voiceObsBtn.addEventListener('click', () => {
                if (isRecording && currentTextarea === observationsTextarea) {
                    stopRecording();
                } else {
                    startRecording(observationsTextarea, voiceObsBtn);
                }
            });
        }

        // Recommendations voice button
        const voiceRecBtn = document.getElementById('voiceRecommendationsBtn');
        const recommendationsTextarea = document.getElementById('recommendations');

        if (voiceRecBtn && recommendationsTextarea) {
            voiceRecBtn.addEventListener('click', () => {
                if (isRecording && currentTextarea === recommendationsTextarea) {
                    stopRecording();
                } else {
                    startRecording(recommendationsTextarea, voiceRecBtn);
                }
            });
        }
    }

    // Initialize voice buttons
    setupVoiceButtons();

    // Stop recording when leaving inspection screen
    const originalShowScreen = window.showScreen;
    if (originalShowScreen) {
        window.showScreen = function(screenName) {
            if (screenName !== 'inspection' && isRecording) {
                stopRecording();
            }
            return originalShowScreen.call(this, screenName);
        };
    }

    console.log('Voice dictation module initialized (Speech Recognition API)');
});

// ===== Geolocation Module (GPS) =====
document.addEventListener('DOMContentLoaded', () => {
    let currentCoordinates = null;

    // Check if browser supports Geolocation
    if (!navigator.geolocation) {
        console.warn('Geolocation API not supported in this browser');
        const gpsButton = document.getElementById('getLocationBtn');
        if (gpsButton) {
            gpsButton.style.display = 'none';
        }
        return;
    }

    // Get current GPS location
    function getCurrentLocation() {
        const locationInput = document.getElementById('location');
        const gpsButton = document.getElementById('getLocationBtn');
        const gpsCoords = document.getElementById('gpsCoords');

        if (!locationInput || !gpsButton) return;

        // Show loading state
        gpsButton.disabled = true;
        gpsButton.innerHTML = '<span class="icon">⌛</span><span>Obteniendo...</span>';
        showToast('📍 Obteniendo ubicación GPS...', 'info');

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            // Success callback
            (position) => {
                const lat = position.coords.latitude.toFixed(6);
                const lng = position.coords.longitude.toFixed(6);
                const accuracy = Math.round(position.coords.accuracy);

                currentCoordinates = {
                    latitude: lat,
                    longitude: lng,
                    accuracy: accuracy,
                    timestamp: new Date().toISOString()
                };

                // Update location field with coordinates
                const coordsText = `GPS: ${lat}, ${lng}`;

                // If location field is empty, use coordinates
                if (!locationInput.value.trim()) {
                    locationInput.value = coordsText;
                }

                // Show coordinates below
                if (gpsCoords) {
                    gpsCoords.textContent = `📍 Coordenadas: ${lat}, ${lng} (±${accuracy}m) - Click para ver mapa`;
                    gpsCoords.style.display = 'block';
                    gpsCoords.style.cursor = 'pointer';
                    gpsCoords.style.color = 'var(--primary-color)';

                    // Click to open in Google Maps
                    gpsCoords.onclick = () => {
                        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                        window.open(mapsUrl, '_blank');
                    };
                }

                // Try to get reverse geocoding (address from coordinates)
                reverseGeocode(lat, lng, locationInput);

                // Reset button
                gpsButton.disabled = false;
                gpsButton.innerHTML = '<span class="icon">✓</span><span>GPS</span>';
                gpsButton.style.color = '#4caf50';

                showToast(`✓ Ubicación obtenida (±${accuracy}m)`, 'success');

                // Save coordinates in inspection data
                window.lastGPSCoordinates = currentCoordinates;
            },
            // Error callback
            (error) => {
                console.error('Geolocation error:', error);

                const errorMessages = {
                    1: 'Permiso de ubicación denegado. Permite el acceso.',
                    2: 'Ubicación no disponible. Verifica el GPS.',
                    3: 'Tiempo agotado. Intenta de nuevo.'
                };

                const message = errorMessages[error.code] || 'Error al obtener ubicación';
                showToast(message, 'error');

                // Reset button
                gpsButton.disabled = false;
                gpsButton.innerHTML = '<span class="icon">📍</span><span>GPS</span>';
            },
            options
        );
    }

    // Reverse geocoding: Get address from coordinates
    async function reverseGeocode(lat, lng, locationInput, retries = 2) {
        try {
            // Validate coordinates
            if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                console.error('Invalid coordinates for reverse geocoding:', { lat, lng });
                return;
            }

            // Check coordinate bounds (lat: -90 to 90, lng: -180 to 180)
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                console.error('Coordinates out of valid range:', { lat, lng });
                return;
            }

            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`;

            // Add timeout to fetch request (10 seconds)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            try {
                const response = await fetch(url, {
                    headers: { 'User-Agent': 'RETIMBRASUR-App' },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                // Handle rate limiting
                if (response.status === 429) {
                    console.warn('Nominatim rate limit exceeded. Retrying in 2 seconds...');
                    if (retries > 0) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        return reverseGeocode(lat, lng, locationInput, retries - 1);
                    }
                    throw new Error('Rate limit exceeded');
                }

                if (!response.ok) {
                    throw new Error(`Geocoding failed with status ${response.status}`);
                }

                const data = await response.json();

                // Check if geocoding returned an error
                if (data.error) {
                    console.warn('Geocoding API returned error:', data.error);
                    return;
                }

                if (data && data.address) {
                    const addr = data.address;
                    let parts = [];

                    if (addr.road) parts.push(addr.road);
                    if (addr.house_number) parts.push(addr.house_number);
                    if (addr.suburb) parts.push(addr.suburb);
                    if (addr.city || addr.town) parts.push(addr.city || addr.town);

                    const readable = parts.join(', ');

                    if (readable && !locationInput.value.includes(readable)) {
                        const current = locationInput.value;
                        locationInput.value = current.startsWith('GPS:') ?
                            `${readable} (${current})` : readable;

                        showToast('✓ Dirección obtenida', 'success');
                    }
                } else {
                    console.warn('No address data found in geocoding response');
                }
            } catch (fetchError) {
                clearTimeout(timeoutId);

                // Handle timeout
                if (fetchError.name === 'AbortError') {
                    console.warn('Reverse geocoding timeout after 10s');
                    if (retries > 0) {
                        return reverseGeocode(lat, lng, locationInput, retries - 1);
                    }
                }
                throw fetchError;
            }
        } catch (error) {
            console.warn('Reverse geocoding failed:', error.message || error);
            // Silently fail - coordinates are still saved in the input field
        }
    }

    // Setup GPS button
    function setupGPSButton() {
        const gpsButton = document.getElementById('getLocationBtn');
        if (gpsButton) {
            gpsButton.addEventListener('click', getCurrentLocation);
        }
    }

    // Hook into saveInspection to include GPS
    const originalSaveInspectionWithGPS = window.saveInspection;
    if (originalSaveInspectionWithGPS) {
        window.saveInspection = function(status) {
            const result = originalSaveInspectionWithGPS.call(this, status);

            if (window.lastGPSCoordinates && inspections.length > 0) {
                const lastInspection = inspections[inspections.length - 1];
                lastInspection.gpsCoordinates = window.lastGPSCoordinates;
                localStorage.setItem('inspections', JSON.stringify(inspections));
                window.lastGPSCoordinates = null;
            }

            return result;
        };
    }

    // Hook into reset to clear GPS
    const originalResetForGPS = window.resetInspectionForm;
    if (originalResetForGPS) {
        window.resetInspectionForm = function() {
            if (originalResetForGPS) originalResetForGPS.call(this);

            window.lastGPSCoordinates = null;
            const gpsCoords = document.getElementById('gpsCoords');
            if (gpsCoords) {
                gpsCoords.style.display = 'none';
                gpsCoords.textContent = '';
            }

            const gpsButton = document.getElementById('getLocationBtn');
            if (gpsButton) {
                gpsButton.disabled = false;
                gpsButton.innerHTML = '<span class="icon">📍</span><span>GPS</span>';
                gpsButton.style.color = '';
            }
        };
    }

    setupGPSButton();

    console.log('Geolocation module initialized (GPS API)');
});

// ===== QR Scanner Module =====
document.addEventListener('DOMContentLoaded', () => {
    let html5QrcodeScanner = null;
    let isScanning = false;

    // Check if Html5Qrcode is available
    if (typeof Html5Qrcode === 'undefined') {
        console.warn('Html5Qrcode library not loaded');
        const scanBtn = document.getElementById('scanQRBtn');
        if (scanBtn) scanBtn.style.display = 'none';
        return;
    }

    const qrScannerModal = document.getElementById('qrScannerModal');
    const scanQRBtn = document.getElementById('scanQRBtn');
    const closeQRScannerModal = document.getElementById('closeQRScannerModal');
    const stopQRScanBtn = document.getElementById('stopQRScanBtn');
    const qrResultDiv = document.getElementById('qrResult');
    const qrResultText = document.getElementById('qrResultText');

    // Start QR Scanner
    function startQRScanner() {
        if (isScanning) return;

        const qrReaderDiv = document.getElementById('qrReader');
        if (!qrReaderDiv) return;

        // Show modal
        qrScannerModal.classList.add('active');
        qrResultDiv.style.display = 'none';

        // Initialize scanner
        html5QrcodeScanner = new Html5Qrcode("qrReader");

        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };

        html5QrcodeScanner.start(
            { facingMode: "environment" }, // Use back camera
            config,
            (decodedText, decodedResult) => {
                // Success callback
                console.log(`QR Code scanned: ${decodedText}`);

                // Show result
                qrResultText.textContent = decodedText;
                qrResultDiv.style.display = 'block';

                // Auto-fill equipment ID
                const equipmentIdInput = document.getElementById('equipmentId');
                if (equipmentIdInput) {
                    equipmentIdInput.value = decodedText;
                    equipmentIdInput.focus();
                }

                // Show success toast
                showToast(`✓ QR escaneado: ${decodedText}`, 'success');

                // Stop scanner after 2 seconds
                setTimeout(() => {
                    stopQRScanner();
                }, 2000);
            },
            (errorMessage) => {
                // Error callback (camera feed, not actual error)
                // console.log(`QR scan error: ${errorMessage}`);
            }
        ).then(() => {
            isScanning = true;
            showToast('📷 Escáner activo - Apunta al código QR', 'info');
        }).catch((err) => {
            console.error('Unable to start scanner:', err);
            showToast('No se pudo iniciar la cámara. Verifica los permisos.', 'error');
            qrScannerModal.classList.remove('active');
        });
    }

    // Stop QR Scanner
    function stopQRScanner() {
        if (!isScanning || !html5QrcodeScanner) {
            qrScannerModal.classList.remove('active');
            return;
        }

        html5QrcodeScanner.stop().then(() => {
            isScanning = false;
            html5QrcodeScanner = null;
            qrScannerModal.classList.remove('active');
            showToast('Escáner detenido', 'success');
        }).catch((err) => {
            console.error('Error stopping scanner:', err);
            isScanning = false;
            html5QrcodeScanner = null;
            qrScannerModal.classList.remove('active');
        });
    }

    // Event listeners
    if (scanQRBtn) {
        scanQRBtn.addEventListener('click', () => {
            startQRScanner();
        });
    }

    if (closeQRScannerModal) {
        closeQRScannerModal.addEventListener('click', () => {
            stopQRScanner();
        });
    }

    if (stopQRScanBtn) {
        stopQRScanBtn.addEventListener('click', () => {
            stopQRScanner();
        });
    }

    // Close modal when clicking outside
    if (qrScannerModal) {
        qrScannerModal.addEventListener('click', (e) => {
            if (e.target === qrScannerModal) {
                stopQRScanner();
            }
        });
    }

    console.log('QR Scanner module initialized (Html5Qrcode)');
});
