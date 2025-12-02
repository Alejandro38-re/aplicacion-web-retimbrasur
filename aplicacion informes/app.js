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
    const equipment = getEquipmentByCenter(centerId);
    return equipment.find(e => e.id === equipmentId);
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

document.querySelector('.modal-close').addEventListener('click', () => {
    document.getElementById('reportModal').classList.remove('active');
    showScreen('welcome');
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

// ===== Export to Excel =====
document.getElementById('exportBtn').addEventListener('click', exportToExcel);

function exportToExcel() {
    if (inspections.length === 0) {
        showToast('No hay inspecciones para exportar', 'error');
        return;
    }

    let csv = 'ID,Cliente,Centro de Trabajo,Tipo de Equipo,ID del Equipo,Ubicación,Fabricante,Marca,Modelo,Fecha Fabricación,Último Retimbrado,Fecha de Inspección,Técnico,Estado,Conformes,Observaciones,No Conformes,% Completado,Observaciones Generales,Recomendaciones,Fecha de Creación,Caudal Nominal,Presión Nominal,RPM,Presión 0%,Presión 50%,Presión 100%,Presión 140%\n';

    inspections.forEach(inspection => {
        const conformeCount = inspection.checklist.filter(i => i.status === 'ok').length;
        const warningCount = inspection.checklist.filter(i => i.status === 'warning').length;
        const errorCount = inspection.checklist.filter(i => i.status === 'error').length;
        const totalItems = inspection.checklist.length;
        const completedItems = inspection.checklist.filter(i => i.checked).length;
        const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        const row = [
            inspection.id,
            `"${(inspection.clientName || '').replace(/"/g, '""')}"`,
            `"${(inspection.workCenterName || '').replace(/"/g, '""')}"`,
            equipmentTypes[inspection.equipmentType].name,
            `"${(inspection.equipmentId || '').replace(/"/g, '""')}"`,
            `"${(inspection.location || '').replace(/"/g, '""')}"`,
            `"${(inspection.manufacturer || '').replace(/"/g, '""')}"`,
            `"${(inspection.brand || '').replace(/"/g, '""')}"`,
            `"${(inspection.model || '').replace(/"/g, '""')}"`,
            inspection.manufacturingDate || '',
            inspection.lastRetestDate || '',
            inspection.inspectionDate || '',
            `"${(inspection.technician || '').replace(/"/g, '""')}"`,
            inspection.status === 'completed' ? 'Completada' : 'Borrador',
            conformeCount,
            warningCount,
            errorCount,
            `${percentage}%`,
            `"${(inspection.observations || '').replace(/"/g, '""')}"`,
            `"${(inspection.recommendations || '').replace(/"/g, '""')}"`,
            new Date(inspection.createdAt).toLocaleDateString('es-ES'),
            inspection.nominalFlow || '',
            inspection.nominalPressure || '',
            inspection.rpm || '',
            inspection.pressureZero || '',
            inspection.pressure50 || '',
            inspection.pressureNominal || '',
            inspection.pressureOverload || ''
        ];

        csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `inspecciones_pci_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Datos exportados correctamente', 'success');
}

// ===== Chart Rendering =====
function renderPressureChart(inspection) {
    const ctx = document.getElementById('curveChart').getContext('2d');

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

                    // Optional: Fill background with white for transparent images
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);

                    // Draw image on canvas
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to JPEG with specified quality
                    canvas.toBlob(
                        (blob) => {
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
    if (originalSubmitBtn) {
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

            // Remove previous listener if exists
            const newSearchInput = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newSearchInput, searchInput);

            newSearchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value;
                const typeValue = typeFilter ? typeFilter.value : 'all';
                filterEquipmentWithPhotos(searchTerm, typeValue, centerId);
            });
        }

        if (typeFilter) {
            // Reset filter
            typeFilter.value = 'all';

            // Remove previous listener if exists
            const newTypeFilter = typeFilter.cloneNode(true);
            typeFilter.parentNode.replaceChild(newTypeFilter, typeFilter);

            newTypeFilter.addEventListener('change', (e) => {
                const typeValue = e.target.value;
                const searchTerm = searchInput ? searchInput.value : '';
                filterEquipmentWithPhotos(searchTerm, typeValue, centerId);
            });
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
        Object.keys(equipmentGroups).forEach(equipmentId => {
            const inspList = equipmentGroups[equipmentId];
            const latestInsp = inspList.sort((a, b) => new Date(b.inspectionDate) - new Date(a.inspectionDate))[0];
            const equipment = getEquipmentById(currentWorkCenter.id, equipmentId);
            const typeInfo = equipmentTypes[latestInsp.equipmentType];

            reportHTML += `
                <div style="margin-bottom: 40px; page-break-inside: avoid;">
                    <h3 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
                        ${typeInfo ? typeInfo.icon : '🔧'} ${typeInfo ? typeInfo.name : latestInsp.equipmentType} - ${equipmentId}
                    </h3>
                    
                    <div style="margin: 15px 0;">
                        <p><strong>Ubicación:</strong> ${latestInsp.location || 'No especificada'}</p>
                        <p><strong>Última inspección:</strong> ${new Date(latestInsp.inspectionDate).toLocaleDateString()}</p>
                        <p><strong>Técnico:</strong> ${latestInsp.technician || 'No especificado'}</p>
                    </div>

                    ${equipment && equipment.photo ? `
                        <div style="margin: 15px 0;">
                            <img src="${equipment.photo}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" alt="Foto del equipo">
                        </div>
                    ` : ''}
                    
                    ${latestInsp.photo && (!equipment || !equipment.photo) ? `
                        <div style="margin: 15px 0;">
                            <img src="${latestInsp.photo}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" alt="Foto de la inspección">
                        </div>
                    ` : ''}

                    ${latestInsp.observations ? `
                        <div style="margin: 15px 0; padding: 10px; background: #fef3c7; border-left: 3px solid #f59e0b;">
                            <strong>Observaciones:</strong>
                            <p style="margin: 5px 0 0 0;">${latestInsp.observations}</p>
                        </div>
                    ` : ''}

                    <p style="margin-top: 10px;"><em>Historial: ${inspList.length} inspección(es)</em></p>
                </div>
            `;
        });

        reportHTML += '</div>';

        // Show in modal
        document.getElementById('reportContent').innerHTML = reportHTML;
        document.getElementById('reportModal').classList.add('active');
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
        const ctx = document.getElementById('equipmentTypeChart');
        if (!ctx) return;

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
        const ctx = document.getElementById('inspectionStatusChart');
        if (!ctx) return;

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
