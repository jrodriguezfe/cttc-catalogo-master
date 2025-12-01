// app.js - FINAL: Horario Dual para Online y Presencial + Módulos OK

let currentEditId = null;
let allProgramas = []; 
let isDragging = false, startPos = 0, scrollLeft = 0; 
let currentModulos = []; 

// =================================================================
// LOGICA DE HORARIO Y DÍAS (ACTUALIZADA PARA SOPORTAR DOBLE BLOQUE)
// =================================================================
const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
// Arrays para Semipresencial
let selectedOnlineDays = []; 
let selectedPresencialDays = [];
// Arrays para Online (Doble Bloque)
let selectedOnlineSimpleDays1 = []; 
let selectedOnlineSimpleDays2 = [];
// Arrays para Presencial (Doble Bloque)
let selectedPresencialSimpleDays1 = []; 
let selectedPresencialSimpleDays2 = [];

function decimalToTime(decimal) {
    if (isNaN(decimal)) return '';
    const totalMinutes = Math.round(decimal * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatTimeInput(input) {
    let val = parseFloat(input.value);
    if (isNaN(val) || val < 0 || val > 23.75) {
        val = Math.max(0, Math.min(23.75, val || 0));
    }
    input.value = val.toFixed(2);
    generateHorarioString();
}

function incrementHour(inputId, step) {
    const input = document.getElementById(inputId);
    let val = parseFloat(input.value);
    input.value = (isNaN(val) ? step : Math.min(23.75, val + step)).toFixed(2);
    generateHorarioString();
}

function decrementHour(inputId, step) {
    const input = document.getElementById(inputId);
    let val = parseFloat(input.value);
    input.value = (isNaN(val) ? 0 : Math.max(0, val - step)).toFixed(2);
    generateHorarioString();
}

function getTargetArray(containerId) {
    if (containerId === 'onlineDaysContainer') return selectedOnlineDays;
    if (containerId === 'presencialDaysContainer') return selectedPresencialDays;
    if (containerId === 'onlineSimpleDaysContainer1') return selectedOnlineSimpleDays1;
    if (containerId === 'onlineSimpleDaysContainer2') return selectedOnlineSimpleDays2;
    if (containerId === 'presencialSimpleDaysContainer1') return selectedPresencialSimpleDays1;
    if (containerId === 'presencialSimpleDaysContainer2') return selectedPresencialSimpleDays2;
    return [];
}

function toggleDay(day, targetArray, containerId) {
    const index = targetArray.indexOf(day);
    if (index > -1) {
        targetArray.splice(index, 1);
    } else {
        targetArray.push(day);
    }
    setupHorarioButtons(); // Vuelve a renderizar para actualizar el estado visual
}

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

    // Renderizar todos los contenedores posibles
    renderButtons('onlineDaysContainer');
    renderButtons('presencialDaysContainer');
    renderButtons('onlineSimpleDaysContainer1'); 
    renderButtons('onlineSimpleDaysContainer2'); 
    renderButtons('presencialSimpleDaysContainer1'); 
    renderButtons('presencialSimpleDaysContainer2'); 
}

function toggleHorarioFields(forceModality = null) {
    const modality = forceModality || document.getElementById('adminModalidad').value;
    const allGenerators = document.querySelectorAll('.schedule-config-container');
    const simpleInput = document.getElementById('simpleHorarioInput');

    allGenerators.forEach(g => g.style.display = 'none');
    simpleInput.style.display = 'block';

    // Resetear todos los arrays al cambiar de modalidad para evitar arrastrar días.
    selectedOnlineDays = [];
    selectedPresencialDays = [];
    selectedOnlineSimpleDays1 = [];
    selectedOnlineSimpleDays2 = [];
    selectedPresencialSimpleDays1 = [];
    selectedPresencialSimpleDays2 = [];
    
    // Inicializar o limpiar los botones de día
    setupHorarioButtons(); 

    if (modality === 'Semipresencial') {
        document.getElementById('horarioSemipresencialGenerator').style.display = 'block';
    } else if (modality === 'Online') {
        document.getElementById('horarioOnlineGenerator').style.display = 'block';
    } else if (modality === 'Presencial') {
        document.getElementById('horarioPresencialGenerator').style.display = 'block';
    }
    
    generateHorarioString();
}

function generateHorarioString() {
    const modality = document.getElementById('adminModalidad').value;
    const inputHorario = document.getElementById('adminHorario');
    const simpleInput = document.getElementById('simpleHorarioInput');
    const preview = document.getElementById('horarioPreview');
    let finalHorario = '';

    // Si hay texto en el input simple, tiene prioridad.
    if (simpleInput.value.trim().length > 0) {
        finalHorario = simpleInput.value.trim();
        preview.textContent = `Resultado Personalizado: ${finalHorario}`;
        inputHorario.value = finalHorario;
        return;
    }

    if (modality === 'Semipresencial') {
        let parts = [];
        let hasConfiguration = false;

        // Horario Online (Semipresencial)
        const startO = parseFloat(document.getElementById('onlineStartHour').value);
        const endO = parseFloat(document.getElementById('onlineEndHour').value);
        if (!isNaN(startO) && !isNaN(endO) && selectedOnlineDays.length > 0) {
            const timeStr = `${decimalToTime(startO)} - ${decimalToTime(endO)}`;
            parts.push(`Online: ${selectedOnlineDays.join(', ')} ${timeStr}`);
            hasConfiguration = true;
        }

        // Horario Presencial (Semipresencial)
        const startP = parseFloat(document.getElementById('presencialStartHour').value);
        const endP = parseFloat(document.getElementById('presencialEndHour').value);
        if (!isNaN(startP) && !isNaN(endP) && selectedPresencialDays.length > 0) {
            const timeStr = `${decimalToTime(startP)} - ${decimalToTime(endP)}`;
            parts.push(`Presencial: ${selectedPresencialDays.join(', ')} ${timeStr}`);
            hasConfiguration = true;
        }

        if (hasConfiguration) {
            finalHorario = parts.join(' / ');
        }
    
    // 2. MODALIDAD ONLINE (Doble Bloque)
    } else if (modality === 'Online') {
        let parts = [];
        let hasConfiguration = false;

        // Bloque 1
        const start1 = parseFloat(document.getElementById('onlineSimpleStartHour1').value);
        const end1 = parseFloat(document.getElementById('onlineSimpleEndHour1').value);
        if (!isNaN(start1) && !isNaN(end1) && selectedOnlineSimpleDays1.length > 0) {
            const timeStr = `${decimalToTime(start1)} - ${decimalToTime(end1)}`;
            const daysStr = selectedOnlineSimpleDays1.join(', ');
            parts.push(`${daysStr} ${timeStr}`);
            hasConfiguration = true;
        }

        // Bloque 2
        const start2 = parseFloat(document.getElementById('onlineSimpleStartHour2').value);
        const end2 = parseFloat(document.getElementById('onlineSimpleEndHour2').value);
        if (!isNaN(start2) && !isNaN(end2) && selectedOnlineSimpleDays2.length > 0) {
            const timeStr = `${decimalToTime(start2)} - ${decimalToTime(end2)}`;
            const daysStr = selectedOnlineSimpleDays2.join(', ');
            parts.push(`${daysStr} ${timeStr}`);
            hasConfiguration = true;
        }

        if (hasConfiguration) {
            finalHorario = `Online: ${parts.join(' y ')}`;
        }

    // 3. MODALIDAD PRESENCIAL (Doble Bloque)
    } else if (modality === 'Presencial') {
        let parts = [];
        let hasConfiguration = false;

        // Bloque 1
        const start1 = parseFloat(document.getElementById('presencialSimpleStartHour1').value);
        const end1 = parseFloat(document.getElementById('presencialSimpleEndHour1').value);
        if (!isNaN(start1) && !isNaN(end1) && selectedPresencialSimpleDays1.length > 0) {
            const timeStr = `${decimalToTime(start1)} - ${decimalToTime(end1)}`;
            const daysStr = selectedPresencialSimpleDays1.join(', ');
            parts.push(`${daysStr} ${timeStr}`);
            hasConfiguration = true;
        }

        // Bloque 2
        const start2 = parseFloat(document.getElementById('presencialSimpleStartHour2').value);
        const end2 = parseFloat(document.getElementById('presencialSimpleEndHour2').value);
        if (!isNaN(start2) && !isNaN(end2) && selectedPresencialSimpleDays2.length > 0) {
            const timeStr = `${decimalToTime(start2)} - ${decimalToTime(end2)}`;
            const daysStr = selectedPresencialSimpleDays2.join(', ');
            parts.push(`${daysStr} ${timeStr}`);
            hasConfiguration = true;
        }

        if (hasConfiguration) {
            finalHorario = `Presencial: ${parts.join(' y ')}`;
        }
    }
    
    if (finalHorario.length > 0) {
        preview.textContent = `Resultado: ${finalHorario}`;
        inputHorario.value = finalHorario;
    } else {
        preview.textContent = "Resultado: Configure al menos un bloque de días y horas, o use el campo de texto libre.";
        inputHorario.value = "";
    }
}


// =================================================================
// UTILIDAD: PROCESAR URLS
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

// =================================================================
// 1. MANEJO DE VISTAS (SPA)
// =================================================================
function showSection(sectionId, isNew = false) {
    document.querySelectorAll('.spa-section').forEach(s => s.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';

    if (sectionId === 'admin-form') {
        if (isNew) {
            currentEditId = null;
            currentModulos = []; 
            renderModulosUI();
            document.getElementById('adminFormTitle').innerHTML = 'Crear Nuevo Programa';
            document.getElementById('adminForm').reset();
        }
        // Llamar a toggleHorarioFields al entrar al formulario, por defecto con 'Presencial'
        toggleHorarioFields('Presencial'); 
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
// MOSTRAR DETALLE
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
                    <p class="mb-1"><i class="bi bi-calendar-event text-acento"></i> Inicio: <strong>${p.fechaInicio||'Pronto'}</strong></p>
                    <p class="mb-0"><i class="bi bi-stopwatch text-acento"></i> Horario: <strong>${p.horario||'Por definir'}</strong></p>
                </div>
            </div>
            <div class="col-md-7">
                <h4 class="text-acento">Descripción</h4>
                <p>${p.descripcionDetallada || p.descripcionCorta}</p>
                ${modulosHtml}
                ${p.componentesOpcionales ? `<div class="alert alert-dark border border-success mt-3"><strong class="text-acento">Incluye:</strong> ${p.componentesOpcionales}</div>` : ''}
                <h4 class="text-acento mt-4">Dirigido A</h4>
                <p style="white-space: pre-line;">${p.dirigidoA || 'Consultar.'}</p>
                <h4 class="text-acento mt-4">Temario</h4>
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
// 5. ADMIN CRUD
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
        
        // Mapear campos básicos
        ['Titulo','Categoria','Estado','ImagenUrl','Descripcion','DescripcionDetallada','Contenido','Duracion','Modalidad','FechaInicio','Horario','ComponentesOpcionales','DirigidoA','Tags'].forEach(f => {
            const fieldName = f.charAt(0).toLowerCase() + f.slice(1);
            const element = document.getElementById('admin' + f);
            if (element) {
                element.value = p[fieldName] || '';
            }
        });
        
        // Cargar módulos
        currentModulos = p.modulosJson || [];
        renderModulosUI();
        
        // Actualizar la interfaz de horario para la modalidad cargada
        toggleHorarioFields(p.modalidad || 'Presencial');
        document.getElementById('simpleHorarioInput').value = p.horario || '';
        generateHorarioString(); // Esto actualizará el input hidden 'adminHorario' y la vista previa

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

    const data = {
        titulo: document.getElementById('adminTitulo').value,
        categoria: document.getElementById('adminCategoria').value,
        estado: document.getElementById('adminEstado').value,
        imagenUrl: imgUrlInput,
        descripcionCorta: document.getElementById('adminDescripcion').value,
        descripcionDetallada: document.getElementById('adminDescripcionDetallada').value,
        contenido: document.getElementById('adminContenido').value,
        duracion: document.getElementById('adminDuracion').value,
        modalidad: document.getElementById('adminModalidad').value,
        fechaInicio: document.getElementById('adminFechaInicio').value,
        // Leer el valor final generado por generateHorarioString()
        horario: document.getElementById('adminHorario').value, 
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
    setupHorarioButtons(); // Inicializar botones al cargar la página
    
    const g = document.getElementById('programas-container');
    if(g) {
        g.addEventListener('mousedown', e => { isDragging=true; g.classList.add('active'); startPos=e.clientX; scrollLeft=g.scrollLeft; });
        g.addEventListener('mouseup', () => { isDragging=false; g.classList.remove('active'); });
        g.addEventListener('mouseleave', () => { isDragging=false; g.classList.remove('active'); });
        g.addEventListener('mousemove', e => { if(!isDragging)return; e.preventDefault(); g.scrollLeft = scrollLeft - (e.clientX - startPos); });
    }
});