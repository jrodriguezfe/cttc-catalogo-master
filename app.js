// app.js - FINAL COMPLETO: Incluye CRUD, Módulos, Formato de Fecha, Dirigido A, Beneficios, 
//          Horario Interactivo por Modalidad, y Solución al error de carga SPA.

let currentEditId = null;
let allProgramas = []; 
let isDragging = false, startPos = 0, scrollLeft = 0; 
let currentModulos = []; 

// Variables de estado para la lógica de Horario
const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
let selectedOnlineDays = []; // Para Semipresencial
let selectedPresencialDays = []; // Para Semipresencial
let selectedOnlineSimpleDays = []; // Para Online simple
let selectedPresencialSimpleDays = []; // Para Presencial simple


// =================================================================
// UTILIDAD: PROCESAR URLS Y FECHAS/TIEMPOS
// =================================================================
function procesarUrlImagen(url) {
    if (!url) return 'https://placehold.co/300x200?text=Imagen+no+disponible';
    if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
        const regex = /\/d\/([a-zA-Z0-9_-]+)/;
        const match = url.match(regex);
        if (match && match[1]) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
        const urlObj = new URL(url);
        const idParam = urlObj.searchParams.get("id");
        if (idParam) return `https://drive.google.com/thumbnail?id=${idParam}&sz=w1000`;
    }
    return url;
}

// Formato de fecha para el catálogo ("23 de noviembre del 2026")
function formatearFechaAmigable(fechaString) {
    if (!fechaString) return 'Pronto';
    const date = new Date(fechaString + 'T00:00:00'); 
    if (isNaN(date)) return fechaString;

    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const formatter = new Intl.DateTimeFormat('es-ES', options);
    
    return formatter.format(date).replace(' de ', ' del '); 
}

// Convierte un valor decimal (e.g., 18.25) a un string de hora (e.g., 6:15 PM)
function decimalToTime(decimalHour) {
    if (decimalHour === null || isNaN(decimalHour)) return '';
    const totalMinutes = Math.round(decimalHour * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours >= 12 && hours < 24 ? 'PM' : 'AM';
    const displayMinutes = minutes < 10 ? '0' + minutes : minutes;

    return `${displayHours}:${displayMinutes} ${ampm}`;
}

// Incrementa/Decrementa el valor de hora
function incrementHour(inputId, step) {
    const input = document.getElementById(inputId);
    let value = parseFloat(input.value) || 0;
    value += step;
    
    if (value > 23.75) value = 0;
    if (value < 0) value = 23.75; 

    value = Math.round(value * 4) / 4; 
    
    input.value = value.toFixed(2);
    formatTimeInput(input); 
    generateHorarioString();
}

function decrementHour(inputId, step) {
    incrementHour(inputId, -step);
}

// Función para asegurar que el input se muestre con dos decimales (ej. 18.00)
function formatTimeInput(input) {
    let value = parseFloat(input.value);
    if (isNaN(value)) value = 0;
    
    value = Math.round(value * 4) / 4; 

    if (value > 23.75) value = 23.75;
    if (value < 0) value = 0; 
    
    input.value = value.toFixed(2);
}


// =================================================================
// 1. MANEJO DE VISTAS (SPA)
// =================================================================
function showSection(sectionId, isNew = false) {
    document.querySelectorAll('.spa-section').forEach(s => s.style.display = 'none');
    
    // NOTA: Se eliminó la lógica de carga dinámica de 'reserva-container'
    
    const targetSection = document.getElementById(sectionId);
    if(targetSection) {
        targetSection.style.display = 'block';
    }

    if (sectionId === 'admin-form') {
        if (isNew) {
            currentEditId = null;
            currentModulos = []; 
            renderModulosUI();
            document.getElementById('adminFormTitle').innerHTML = 'Crear Nuevo Programa';
            document.getElementById('adminForm').reset();
            document.getElementById('adminModalidad').value = 'Presencial'; 
            toggleHorarioFields(); 
        }
    }
    if (sectionId === 'admin-dashboard') loadAdminList();
    if (sectionId === 'catalogo') cargarProgramas();
}


// =================================================================
// 2. LOGICA DE MÓDULOS AMIGABLE
// =================================================================
function agregarModuloUI() {
    const nombre = document.getElementById('modInputNombre').value.trim();
    const horas = document.getElementById('modInputHoras').value.trim();
    const costo = document.getElementById('modInputCosto').value.trim();

    if (!nombre) {
        alert("El nombre del módulo es obligatorio.");
        return;
    }

    currentModulos.push({
        nombre: nombre,
        horas: horas || "N/A",
        costo: parseFloat(costo) || 0
    });

    document.getElementById('modInputNombre').value = "";
    document.getElementById('modInputHoras').value = "";
    document.getElementById('modInputCosto').value = "";

    renderModulosUI();
}

function eliminarModuloUI(index) {
    currentModulos.splice(index, 1);
    renderModulosUI();
}

function renderModulosUI() {
    const lista = document.getElementById('listaModulosUI');
    lista.innerHTML = "";

    if (currentModulos.length === 0) {
        lista.innerHTML = '<li class="list-group-item text-muted small text-center bg-light">Sin módulos agregados aún.</li>';
        return;
    }

    currentModulos.forEach((mod, index) => {
        const li = document.createElement('li');
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.innerHTML = `
            <div>
                <span class="fw-bold">${mod.nombre}</span>
                <span class="badge bg-secondary ms-2">${mod.horas}</span>
                <span class="badge bg-success ms-1">S/ ${mod.costo}</span>
            </div>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarModuloUI(${index})">
                <i class="bi bi-trash"></i>
            </button>
        `;
        lista.appendChild(li);
    });
}

// =================================================================
// 3. AUTENTICACIÓN
// =================================================================
function handleAdminAuth() { auth.currentUser ? showSection('admin-dashboard') : showSection('login'); }
function loginAdmin() {
    auth.signInWithEmailAndPassword(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value)
        .then(() => showSection('admin-dashboard'))
        .catch(e => { document.getElementById('authMessage').textContent = 'Error: ' + e.message; document.getElementById('authMessage').style.display = 'block'; });
}
auth.onAuthStateChanged(user => {
    const btn = document.getElementById('adminAuthButton');
    if (user) { btn.innerHTML = '<i class="bi bi-gear-fill me-1"></i> Admin CTTC'; btn.onclick = () => showSection('admin-dashboard'); }
    else { btn.innerHTML = '<i class="bi bi-person-circle me-1"></i> Admin CTTC'; btn.onclick = handleAdminAuth; }
});
function logoutAdmin() { auth.signOut().then(() => showSection('catalogo')); }

// =================================================================
// 4. CATÁLOGO PÚBLICO
// =================================================================
function scrollGallery(dir) {
    const g = document.getElementById('programas-container');
    g.scrollLeft += dir * (g.querySelector('.card-wrapper') ? g.querySelector('.card-wrapper').offsetWidth : 300);
}

function crearCardPrograma(p) {
    const imgUrl = procesarUrlImagen(p.imagenUrl);
    return `
        <div class="card-wrapper"> 
            <div class="card h-100 card-programa shadow-sm" onclick="if(!isDragging) mostrarDetalle('${p.id}')">
                <img src="${imgUrl}" class="card-img-top" loading="lazy" onerror="this.src='https://placehold.co/300x200?text=Imagen+no+disponible'">
                <div class="card-body d-flex flex-column">
                    <span class="badge bg-acento mb-2 align-self-start">${p.categoria}</span>
                    <h5 class="card-title fw-bold">${p.titulo}</h5>
                    <p class="card-text text-muted small">${p.descripcionCorta}</p>
                    <div class="mt-auto">
                        <p class="mb-1 small"><i class="bi bi-clock text-acento"></i> ${p.duracion || '-'}</p>
                        <p class="mb-2 small"><i class="bi bi-geo-alt text-acento"></i> ${p.modalidad || '-'}</p>
                        <button class="btn btn-sm btn-outline-dark w-100">Ver Detalles</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function cargarProgramas() {
    const container = document.getElementById('programas-container');
    container.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-acento"></div></div>';
    db.collection('programas').get().then(snap => {
        allProgramas = [];
        snap.forEach(doc => allProgramas.push({ id: doc.id, ...doc.data() }));
        renderizarProgramas();
    });
}
function renderizarProgramas() { filtrarProgramas(); }
function filtrarProgramas() {
    const txt = document.getElementById('buscador').value.toLowerCase();
    const cat = document.getElementById('filtroCategoria').value;
    const filtered = allProgramas.filter(p => (p.titulo.toLowerCase().includes(txt) || p.descripcionCorta.toLowerCase().includes(txt)) && (!cat || p.categoria === cat) && p.estado === 'Activo');
    const container = document.getElementById('programas-container');
    if (filtered.length === 0) container.innerHTML = '<div class="alert alert-info mx-3">No hay resultados.</div>';
    else container.innerHTML = filtered.map(crearCardPrograma).join('');
}

// -----------------------------------------------------------
// MOSTRAR DETALLE (Formato de Fecha, Dirigido A, Beneficios)
// -----------------------------------------------------------
function mostrarDetalle(id) {
    const p = allProgramas.find(x => x.id === id);
    if (!p) return;
    const imgUrl = procesarUrlImagen(p.imagenUrl);
    const esAdmin = auth.currentUser;

    let modulosHtml = '';
    let costoTotal = 0;
    if (p.modulosJson && p.modulosJson.length > 0) {
        modulosHtml += `<h4 class="text-acento mt-4 mb-2">Módulos</h4>
        <div class="table-responsive"><table class="tabla-tecnologica">
            <thead><tr><th>Módulo</th><th>Horas</th>${esAdmin ? '<th>Costo (S/)</th>' : ''}</tr></thead><tbody>`;
        p.modulosJson.forEach(m => {
            const costo = parseFloat(m.costo) || 0; costoTotal += costo;
            modulosHtml += `<tr><td>${m.nombre}</td><td>${m.horas}</td>${esAdmin ? `<td>${costo.toFixed(2)}</td>` : ''}</tr>`;
        });
        modulosHtml += `</tbody></table></div>`;
        if (esAdmin) modulosHtml += `<div class="alert alert-costo text-center">Total: S/ ${costoTotal.toFixed(2)}</div>`;
        modulosHtml += `<p class="text-success small fw-bold"><i class="bi bi-tag"></i> Pregunte por descuentos.</p>`;
    }

    document.getElementById('detalleModalLabel').textContent = p.titulo;
    document.getElementById('detalle-contenido').innerHTML = `
        <div class="row">
            <div class="col-md-5">
                <img src="${imgUrl}" class="img-fluid rounded mb-3" onerror="this.src='https://placehold.co/600x400?text=Imagen+no+disponible'">
                <div class="p-3 bg-white border rounded shadow-sm">
                    <p class="mb-1"><i class="bi bi-clock text-acento"></i> ${p.duracion||'-'}</p>
                    <p class="mb-1"><i class="bi bi-geo-alt text-acento"></i> ${p.modalidad||'-'}</p>
                    <hr>
                    <p class="mb-1"><i class="bi bi-calendar-event text-acento"></i> Inicio: <strong>${formatearFechaAmigable(p.fechaInicio)}</strong></p>
                    <p class="mb-0"><i class="bi bi-stopwatch text-acento"></i> Horario: <strong>${p.horario||'Por definir'}</strong></p>
                </div>
                ${p.dirigidoA ? `<h4 class="text-acento mt-4">Dirigido A</h4><p>${p.dirigidoA}</p>` : ''}
            </div>
            <div class="col-md-7">
                <h4 class="text-acento">Descripción</h4>
                <p>${p.descripcionDetallada || p.descripcionCorta}</p>
                ${modulosHtml}
                ${p.componentesOpcionales ? `<div class="alert alert-dark border border-success mt-3"><strong class="text-acento">Incluye:</strong> ${p.componentesOpcionales}</div>` : ''}
                
                <h4 class="text-acento mt-4">Beneficios</h4>
                <p style="white-space: pre-line;">${p.contenido || 'Ver módulos.'}</p>
            </div>
        </div>
    `;

    let btns = `<a href="https://wa.me/51954622231?text=Info ${p.titulo}" target="_blank" class="btn btn-acento"><i class="bi bi-whatsapp"></i> Inscribirse</a>`;
    if (esAdmin) btns += `<div class="ms-auto"><button class="btn btn-outline-dark me-2" onclick="cargarProgramaParaEdicion('${p.id}')" data-bs-dismiss="modal">Editar</button><button class="btn btn-outline-danger" onclick="eliminarPrograma('${p.id}')" data-bs-dismiss="modal">Eliminar</button></div>`;
    document.getElementById('detalle-footer').innerHTML = btns;
    new bootstrap.Modal(document.getElementById('detalleModal')).show();
}

// =================================================================
// 5. LÓGICA DE HORARIO INTERACTIVO
// =================================================================

// Función auxiliar para obtener el array correcto basado en el ID del contenedor
function getTargetArray(containerId) {
    if (containerId === 'onlineDaysContainer') return selectedOnlineDays;
    if (containerId === 'presencialDaysContainer') return selectedPresencialDays;
    if (containerId === 'onlineSimpleDaysContainer') return selectedOnlineSimpleDays;
    if (containerId === 'presencialSimpleDaysContainer') return selectedPresencialSimpleDays;
    return [];
}

// Inicializa los contenedores de botones al cargar la sección admin-form
function setupHorarioButtons() {
    const renderButtons = (containerId) => {
        const selectedArray = getTargetArray(containerId);
        const container = document.getElementById(containerId);
        if (!container) return; 

        container.innerHTML = '';
        days.forEach(day => {
            const isActive = selectedArray.includes(day);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.onclick = () => {
                const targetArray = getTargetArray(containerId);
                toggleDay(day, targetArray, containerId);
                generateHorarioString(); 
            };
            btn.className = `btn btn-sm me-1 mb-1 ${isActive ? 'btn-acento' : 'btn-outline-secondary'}`;
            btn.textContent = day;
            container.appendChild(btn);
        });
    };

    renderButtons('onlineDaysContainer');
    renderButtons('presencialDaysContainer');
    renderButtons('onlineSimpleDaysContainer'); 
    renderButtons('presencialSimpleDaysContainer'); 
}

// Activa/desactiva un día
function toggleDay(day, selectedArray, containerId) {
    const index = selectedArray.indexOf(day);
    if (index > -1) {
        selectedArray.splice(index, 1);
    } else {
        selectedArray.push(day);
        selectedArray.sort((a, b) => days.indexOf(a) - days.indexOf(b)); // Mantener el orden de la semana
    }
    setupHorarioButtons(); 
}

// Muestra/oculta la interfaz de botones según la modalidad
function toggleHorarioFields() {
    const modality = document.getElementById('adminModalidad').value;
    const generatorSemipresencial = document.getElementById('horarioSemipresencialGenerator');
    const generatorOnline = document.getElementById('horarioOnlineGenerator');
    const generatorPresencial = document.getElementById('horarioPresencialGenerator');
    const simpleInput = document.getElementById('simpleHorarioInput');

    // Ocultar todos los generadores y el input simple por defecto
    generatorSemipresencial.style.display = 'none';
    generatorOnline.style.display = 'none';
    generatorPresencial.style.display = 'none';
    simpleInput.style.display = 'none';

    // Limpiar arrays de días (Solo los Semipresenciales se limpian al cambiar de modo)
    selectedOnlineDays = [];
    selectedPresencialDays = [];
    
    // Función para mostrar el generador y inicializar los valores de hora
    const showGenerator = (generatorId, startId, endId) => {
        document.getElementById(generatorId).style.display = 'block';
        setupHorarioButtons();
        
        // Cargar los valores iniciales en los nuevos inputs (usando valores por defecto)
        if (startId) {
            document.getElementById(startId).value = document.getElementById(startId).value || '18.00';
            formatTimeInput(document.getElementById(startId));
        }
        if (endId) {
             document.getElementById(endId).value = document.getElementById(endId).value || '20.00';
             formatTimeInput(document.getElementById(endId));
        }
    };

    // Mostrar el contenedor correcto
    if (modality === 'Semipresencial') {
        showGenerator('horarioSemipresencialGenerator', 'onlineStartHour', 'onlineEndHour');
        // Para semipresencial, inicializar las horas de presencial también
        document.getElementById('presencialStartHour').value = document.getElementById('presencialStartHour').value || '9.00';
        document.getElementById('presencialEndHour').value = document.getElementById('presencialEndHour').value || '13.00';
        formatTimeInput(document.getElementById('presencialStartHour'));
        formatTimeInput(document.getElementById('presencialEndHour'));
        
    } else if (modality === 'Online') {
        showGenerator('horarioOnlineGenerator', 'onlineSimpleStartHour', 'onlineSimpleEndHour');
    } else if (modality === 'Presencial') {
        showGenerator('horarioPresencialGenerator', 'presencialSimpleStartHour', 'presencialSimpleEndHour');
    } else {
        simpleInput.style.display = 'block';
    }
    
    generateHorarioString();
}

// Genera el string final de horario (para guardado y preview)
function generateHorarioString() {
    const modality = document.getElementById('adminModalidad').value;
    const inputHorario = document.getElementById('adminHorario');
    const simpleInput = document.getElementById('simpleHorarioInput');
    const preview = document.getElementById('horarioPreview');
    let finalHorario = "";

    // 1. MODALIDAD SEMIPRESENCIAL (Llama a todo)
    if (modality === 'Semipresencial') {
        const onlineStart = parseFloat(document.getElementById('onlineStartHour').value);
        const onlineEnd = parseFloat(document.getElementById('onlineEndHour').value);
        const presencialStart = parseFloat(document.getElementById('presencialStartHour').value);
        const presencialEnd = parseFloat(document.getElementById('presencialEndHour').value);
        
        let parts = [];
        let hasTime = false;

        if (!isNaN(onlineStart) && !isNaN(onlineEnd)) {
            const timeStr = `${decimalToTime(onlineStart)} - ${decimalToTime(onlineEnd)}`;
            const daysStr = selectedOnlineDays.length > 0 ? selectedOnlineDays.join(', ') : 'Días no especificados';
            parts.push(`Online: ${daysStr} ${timeStr}`);
            hasTime = true;
        }

        if (!isNaN(presencialStart) && !isNaN(presencialEnd)) {
            const timeStr = `${decimalToTime(presencialStart)} - ${decimalToTime(presencialEnd)}`;
            const daysStr = selectedPresencialDays.length > 0 ? selectedPresencialDays.join(', ') : 'Días no especificados';
            parts.push(`Presencial: ${daysStr} ${timeStr}`);
            hasTime = true;
        }

        finalHorario = parts.join(' y ');

        if (finalHorario && hasTime) {
            preview.textContent = `Resultado: ${finalHorario}`;
            inputHorario.value = finalHorario;
        } else {
            preview.textContent = "Resultado: Horario Semipresencial no configurado";
            inputHorario.value = "";
        }
        simpleInput.value = ""; 
        
    // 2. MODALIDAD ONLINE SIMPLE (Llama solo a la parte Online)
    } else if (modality === 'Online') {
        const start = parseFloat(document.getElementById('onlineSimpleStartHour').value);
        const end = parseFloat(document.getElementById('onlineSimpleEndHour').value);
        
        if (!isNaN(start) && !isNaN(end) && selectedOnlineSimpleDays.length > 0) {
            const timeStr = `${decimalToTime(start)} - ${decimalToTime(end)}`;
            const daysStr = selectedOnlineSimpleDays.join(', ');
            finalHorario = `Online: ${daysStr} ${timeStr}`;
            preview.textContent = `Resultado: ${finalHorario}`;
            inputHorario.value = finalHorario;
        } else {
            preview.textContent = "Resultado: Configure días y horas.";
            inputHorario.value = "";
        }
        simpleInput.value = "";

    // 3. MODALIDAD PRESENCIAL SIMPLE (Llama solo a la parte Presencial)
    } else if (modality === 'Presencial') {
        const start = parseFloat(document.getElementById('presencialSimpleStartHour').value);
        const end = parseFloat(document.getElementById('presencialSimpleEndHour').value);
        
        if (!isNaN(start) && !isNaN(end) && selectedPresencialSimpleDays.length > 0) {
            const timeStr = `${decimalToTime(start)} - ${decimalToTime(end)}`;
            const daysStr = selectedPresencialSimpleDays.join(', ');
            finalHorario = `Presencial: ${daysStr} ${timeStr}`;
            preview.textContent = `Resultado: ${finalHorario}`;
            inputHorario.value = finalHorario;
        } else {
            preview.textContent = "Resultado: Configure días y horas.";
            inputHorario.value = "";
        }
        simpleInput.value = "";

    // 4. MODO FALLBACK (input de texto simple)
    } else {
        finalHorario = simpleInput.value;
        inputHorario.value = finalHorario;
        preview.textContent = "";
    }
}


// =================================================================
// 6. ADMIN CRUD
// =================================================================
function loadAdminList() {
    db.collection('programas').get().then(snap => {
        let html = `<table class="table table-hover"><thead><tr><th>Curso</th><th>Inicio</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>`;
        snap.forEach(d => {
            const p = {id:d.id, ...d.data()};
            html += `<tr><td>${p.titulo}</td><td>${p.fechaInicio||'-'}</td><td class="${p.estado==='Activo'?'text-success':'text-danger'} fw-bold">${p.estado}</td>
            <td><button class="btn btn-sm btn-outline-dark me-1" onclick="cargarProgramaParaEdicion('${p.id}')"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-outline-danger" onclick="eliminarPrograma('${p.id}')"><i class="bi bi-trash"></i></button></td></tr>`;
        });
        document.getElementById('admin-list-container').innerHTML = html + `</tbody></table><button class="btn btn-danger btn-sm" onclick="logoutAdmin()">Cerrar Sesión</button>`;
    });
}

function cargarProgramaParaEdicion(id) {
    db.collection('programas').doc(id).get().then(doc => {
        if(!doc.exists) return;
        const p = doc.data();
        currentEditId = id;
        document.getElementById('adminFormTitle').innerHTML = `Editar: ${p.titulo}`;
        
        // Mapeo explícito de campos 
        const campos = [
            ['adminTitulo', 'titulo'],
            ['adminCategoria', 'categoria'],
            ['adminEstado', 'estado'],
            ['adminImagenUrl', 'imagenUrl'],
            ['adminDescripcion', 'descripcionCorta'],
            ['adminDescripcionDetallada', 'descripcionDetallada'],
            ['adminContenido', 'contenido'], 
            ['adminComponentesOpcionales', 'componentesOpcionales'],
            ['adminFechaInicio', 'fechaInicio'],
            ['adminDuracion', 'duracion'],
            ['adminDirigidoA', 'dirigidoA'],
            ['adminTags', 'tags']
        ];
        
        // Aplica los valores
        campos.forEach(([idHtml, claveDb]) => {
            const element = document.getElementById(idHtml);
            if (element) {
                element.value = p[claveDb] || '';
            }
        });
        
        // --- LÓGICA DE HORARIO ---
        const modalidadSelect = document.getElementById('adminModalidad');
        modalidadSelect.value = p.modalidad || 'Presencial'; 
        
        document.getElementById('simpleHorarioInput').value = p.horario || '';
        document.getElementById('adminHorario').value = p.horario || ''; 
        
        // Inicializar la interfaz de horario (Esto muestra el contenedor correcto)
        toggleHorarioFields(); 

        // CARGAR MÓDULOS A LA LISTA VISUAL
        currentModulos = p.modulosJson || [];
        renderModulosUI();

        showSection('admin-form');
    });
}

async function guardarCambiosEdicion() {
    const form = document.getElementById('adminForm');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const imgUrlInput = document.getElementById('adminImagenUrl').value.trim();
    if (imgUrlInput.startsWith('file:') || imgUrlInput.match(/^[a-zA-Z]:\\/)) {
        alert("⛔ ERROR: No uses rutas locales. Sube la imagen a internet.");
        return; 
    }
    
    // Asegurarse de que el Horario refleje el valor actual antes de guardar
    generateHorarioString(); 

    const finalModalidad = document.getElementById('adminModalidad').value;
    const finalHorario = document.getElementById('adminHorario').value;

    const data = {
        titulo: document.getElementById('adminTitulo').value,
        categoria: document.getElementById('adminCategoria').value,
        estado: document.getElementById('adminEstado').value,
        imagenUrl: imgUrlInput,
        descripcionCorta: document.getElementById('adminDescripcion').value,
        descripcionDetallada: document.getElementById('adminDescripcionDetallada').value,
        contenido: document.getElementById('adminContenido').value,
        duracion: document.getElementById('adminDuracion').value,
        modalidad: finalModalidad,
        fechaInicio: document.getElementById('adminFechaInicio').value,
        horario: finalHorario,
        componentesOpcionales: document.getElementById('adminComponentesOpcionales').value,
        dirigidoA: document.getElementById('adminDirigidoA').value, 
        tags: document.getElementById('adminTags').value.toLowerCase(),
        modulosJson: currentModulos, 
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (currentEditId) await db.collection('programas').doc(currentEditId).update(data);
        else await db.collection('programas').add(data);
        alert("Programa guardado."); showSection('admin-dashboard');
    } catch(e) { alert("Error: " + e.message); }
}

function eliminarPrograma(id) {
    if(confirm("¿Seguro de eliminar?")) {
        db.collection('programas').doc(id).delete().then(() => { loadAdminList(); cargarProgramas(); });
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarProgramas();
    const g = document.getElementById('programas-container');
    if(g) {
        g.addEventListener('mousedown', e => { isDragging=true; g.classList.add('active'); startPos=e.clientX; scrollLeft=g.scrollLeft; });
        g.addEventListener('mouseup', () => { isDragging=false; g.classList.remove('active'); });
        g.addEventListener('mouseleave', () => { isDragging=false; g.classList.remove('active'); });
        g.addEventListener('mousemove', e => { if(!isDragging)return; e.preventDefault(); g.scrollLeft = scrollLeft - (e.clientX - startPos); });
    }
    
    toggleHorarioFields(); 
});