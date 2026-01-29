// app.js - CÓDIGO FINAL Y ROBUSTO CON EDICIÓN DE MÓDULOS Y PRÓXIMOS GRUPOS

let currentEditId = null;
let allProgramas = []; 
let isDragging = false, startPos = 0, scrollLeft = 0; 
let currentModulos = []; 
let nextGroups = [];
let editingModuloIndex = -1; // -1 = Modo Creación, >= 0 = Índice a editar

// =================================================================
// LOGICA DE HORARIO Y DÍAS 
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

// FUNCIONES DECIMALES ELIMINADAS/SIMPLIFICADAS
// La lógica de hora ahora trabaja directamente con strings HH:MM

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
    setupHorarioButtons(); 
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

    allGenerators.forEach(g => g.style.display = 'none'); 

    // Resetear arrays y campos de hora
    selectedOnlineDays = [];
    selectedPresencialDays = [];
    selectedOnlineSimpleDays1 = [];
    selectedOnlineSimpleDays2 = [];
    selectedPresencialSimpleDays1 = [];
    selectedPresencialSimpleDays2 = [];
    
    // Resetear los inputs de tiempo a '00:00' (string)
    const hourInputs = ['onlineStartHour', 'onlineEndHour', 'presencialStartHour', 'presencialEndHour', 
                        'onlineSimpleStartHour1', 'onlineSimpleEndHour1', 'onlineSimpleStartHour2', 'onlineSimpleEndHour2', 
                        'presencialSimpleStartHour1', 'presencialSimpleEndHour1', 'presencialSimpleStartHour2', 'presencialSimpleEndHour2'];
    hourInputs.forEach(id => {
        const input = document.getElementById(id);
        if(input) input.value = '00:00';
    });
    
    setupHorarioButtons(); 

    if (modality === 'Semipresencial') {
        document.getElementById('horarioSemipresencialGenerator').style.display = 'block';
    } else if (modality === 'Online') {
        document.getElementById('horarioOnlineGenerator').style.display = 'block';
    } else if (modality === 'Presencial') {
        document.getElementById('horarioPresencialGenerator').style.display = 'block';
    }
    
    if (!forceModality) {
        generateHorarioString(); 
    }
}

function generateHorarioString() {
    const modality = document.getElementById('adminModalidad').value;
    const inputHorario = document.getElementById('adminHorario');
    let finalHorario = '';
    
    inputHorario.value = ""; 

    // 💡 La generación ahora usa directamente el string HH:MM
    const getHourTime = (id) => document.getElementById(id).value;

    const generateBlock = (daysArray, startId, endId, prefix = '') => {
        const startStr = getHourTime(startId);
        const endStr = getHourTime(endId);

        // Simple chequeo de validez y orden (HH:MM es comparable como string)
        if (startStr && endStr && daysArray.length > 0 && endStr > startStr) {
             const timeStr = `${startStr} - ${endStr}`;
             const daysStr = daysArray.join(', ');
             return `${prefix}${daysStr} ${timeStr}`;
        }
        return null;
    };

    if (modality === 'Semipresencial') {
        let parts = [];
        const onlinePart = generateBlock(selectedOnlineDays, 'onlineStartHour', 'onlineEndHour', 'Online: ');
        const presencialPart = generateBlock(selectedPresencialDays, 'presencialStartHour', 'presencialEndHour', 'Presencial: ');

        if (onlinePart) parts.push(onlinePart);
        if (presencialPart) parts.push(presencialPart);
        
        if (parts.length > 0) finalHorario = parts.join(' / ');
    
    } else if (modality === 'Online') {
        let parts = [];
        const block1 = generateBlock(selectedOnlineSimpleDays1, 'onlineSimpleStartHour1', 'onlineSimpleEndHour1');
        const block2 = generateBlock(selectedOnlineSimpleDays2, 'onlineSimpleStartHour2', 'onlineSimpleEndHour2');

        if (block1) parts.push(block1);
        if (block2) parts.push(block2);

        if (parts.length > 0) finalHorario = `Online: ${parts.join(' y ')}`;

    } else if (modality === 'Presencial') {
        let parts = [];
        const block1 = generateBlock(selectedPresencialSimpleDays1, 'presencialSimpleStartHour1', 'presencialSimpleEndHour1');
        const block2 = generateBlock(selectedPresencialSimpleDays2, 'presencialSimpleStartHour2', 'presencialSimpleEndHour2');

        if (block1) parts.push(block1);
        if (block2) parts.push(block2);

        if (parts.length > 0) finalHorario = `Presencial: ${parts.join(' y ')}`;
    }
    
    if (finalHorario.length > 0) {
        inputHorario.value = finalHorario;
    } else {
        inputHorario.value = "";
    }
}


// =================================================================
// UTILS Y FORMATO 
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

function formatDate(dateString) {
    if (!dateString) return 'Pronto';
    const parts = dateString.split('-'); 
    if (parts.length !== 3) return dateString; 

    const year = parseInt(parts[0]);
    const monthIndex = parseInt(parts[1]) - 1; 
    const day = parseInt(parts[2]);

    const monthNames = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    
    if (monthIndex < 0 || monthIndex > 11 || isNaN(day) || isNaN(year)) {
        return dateString;
    }

    return `${day} de ${monthNames[monthIndex]} del ${year}`;
}

function formatBlockTime(time24) {
    const [hours, minutes] = time24.split(':').map(Number);
    
    const suffix = hours >= 12 ? 'pm' : 'am';
    let hours12 = hours % 12;
    if (hours12 === 0) hours12 = 12; 
    
    return `${hours12}${minutes > 0 ? ':' + String(minutes).padStart(2, '0') : ''}${suffix}`;
}

function formatScheduleString(scheduleString) {
    if (!scheduleString) return 'Por definir';
    const regexGlobal = /(\d{2}:\d{2})\s-\s(\d{2}:\d{2})/g;
    
    const replacedString = scheduleString.replace(regexGlobal, (match, start24, end24) => {
        const start12 = formatBlockTime(start24);
        const end12 = formatBlockTime(end24);
        return `${start12} - ${end12}`; 
    });

    return replacedString;
}

function parseHorarioString(horarioStr, modality) {
    if (!horarioStr) return;
    
    const timeRegex = /(\d{2}:\d{2})\s-\s(\d{2}:\d{2})/;
    const dayRegex = /(Lun|Mar|Mié|Jue|Vie|Sáb|Dom)/g;
    
    const extractDays = (subStr) => {
        return [...subStr.matchAll(dayRegex)].map(match => match[0]);
    };
    
    const extractTime = (subStr) => {
        const match = subStr.match(timeRegex);
        if (match) {
            // Ahora devuelve el string HH:MM directamente
            return {
                start: match[1], 
                end: match[2]
            };
        }
        return null;
    };
    
    if (modality === 'Semipresencial') {
        const parts = horarioStr.split(' / ');
        
        parts.forEach(part => {
            const time = extractTime(part);
            if (time) {
                if (part.startsWith('Online:')) {
                    selectedOnlineDays.push(...extractDays(part));
                    document.getElementById('onlineStartHour').value = time.start;
                    document.getElementById('onlineEndHour').value = time.end;
                } else if (part.startsWith('Presencial:')) {
                    selectedPresencialDays.push(...extractDays(part));
                    document.getElementById('presencialStartHour').value = time.start;
                    document.getElementById('presencialEndHour').value = time.end;
                }
            }
        });

    } else if (modality === 'Online' && horarioStr.startsWith('Online:')) {
        const content = horarioStr.replace('Online: ', ''); 
        const parts = content.split(' y ');

        parts.forEach((part, index) => {
            const time = extractTime(part);
            if (time) {
                const targetDays = extractDays(part);
                if (index === 0) {
                    selectedOnlineSimpleDays1.push(...targetDays);
                    document.getElementById('onlineSimpleStartHour1').value = time.start;
                    document.getElementById('onlineSimpleEndHour1').value = time.end;
                } else if (index === 1) {
                    selectedOnlineSimpleDays2.push(...targetDays);
                    document.getElementById('onlineSimpleStartHour2').value = time.start;
                    document.getElementById('onlineSimpleEndHour2').value = time.end;
                }
            }
        });
        
    } else if (modality === 'Presencial' && horarioStr.startsWith('Presencial:')) {
        const content = horarioStr.replace('Presencial: ', ''); 
        const parts = content.split(' y ');

        parts.forEach((part, index) => {
            const time = extractTime(part);
            if (time) {
                const targetDays = extractDays(part);
                if (index === 0) {
                    selectedPresencialSimpleDays1.push(...targetDays);
                    document.getElementById('presencialSimpleStartHour1').value = time.start;
                    document.getElementById('presencialSimpleEndHour1').value = time.end;
                } else if (index === 1) {
                    selectedPresencialSimpleDays2.push(...targetDays);
                    document.getElementById('presencialSimpleStartHour2').value = time.start;
                    document.getElementById('presencialSimpleEndHour2').value = time.end;
                }
            }
        });
    }
}


// =================================================================
// 2. LOGICA DE MÓDULOS AMIGABLE (Añadiendo Edición y formato de vista)
// =================================================================
function setModuloInputs(nombre = '', descripcion = '', horas = '', costo = '') {
    document.getElementById('modInputNombre').value = nombre;
    document.getElementById('modInputDescripcion').value = descripcion;
    document.getElementById('modInputHoras').value = horas;
    document.getElementById('modInputCosto').value = costo;
}

function agregarModuloUI() {
    const nombre = document.getElementById('modInputNombre').value.trim();
    const descripcion = document.getElementById('modInputDescripcion').value.trim();
    const horas = document.getElementById('modInputHoras').value.trim();
    const costo = document.getElementById('modInputCosto').value.trim();

    if (!nombre) {
        alert("El nombre del módulo es obligatorio.");
        return;
    }
    
    const nuevoModulo = {
        nombre: nombre,
        descripcion: descripcion || "Sin descripción.", 
        horas: horas || "N/A",
        costo: parseFloat(costo) || 0
    };

    if (editingModuloIndex > -1) {
        // MODO EDICIÓN: Actualizar el módulo existente
        currentModulos[editingModuloIndex] = nuevoModulo;
        editingModuloIndex = -1; // Volver al modo creación
        document.getElementById('addModuloButton').textContent = 'Agregar Módulo';
        document.getElementById('addModuloButton').classList.remove('btn-warning');
        document.getElementById('addModuloButton').classList.add('btn-success');
    } else {
        // MODO CREACIÓN: Añadir nuevo módulo
        currentModulos.push(nuevoModulo);
    }

    setModuloInputs(); // Limpiar inputs
    renderModulosUI();
}

function editarModuloUI(index) {
    const modulo = currentModulos[index];
    setModuloInputs(modulo.nombre, modulo.descripcion, modulo.horas, modulo.costo);
    
    editingModuloIndex = index; // Establecer índice para editar
    
    // Cambiar la UI del botón para reflejar el modo edición
    document.getElementById('addModuloButton').textContent = 'Guardar Edición';
    document.getElementById('addModuloButton').classList.remove('btn-success');
    document.getElementById('addModuloButton').classList.add('btn-warning');
    
    // Opcional: desplazar la vista a los campos de input si el usuario está muy abajo
    document.getElementById('modInputNombre').focus(); 
}

function eliminarModuloUI(index) {
    currentModulos.splice(index, 1);
    // Si el módulo eliminado era el que estábamos editando, salir del modo edición.
    if (editingModuloIndex === index) {
        editingModuloIndex = -1;
        document.getElementById('addModuloButton').textContent = 'Agregar Módulo';
        document.getElementById('addModuloButton').classList.remove('btn-warning');
        document.getElementById('addModuloButton').classList.add('btn-success');
        setModuloInputs();
    }
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
        
        // 💡 Nuevo formato de visualización (Duración: X horas Costo: S/ Y)
        const duracion = mod.horas.trim();
        const duracionTexto = duracion ? `${duracion} horas` : 'N/A';
        const costo = parseFloat(mod.costo).toFixed(2);
        
        li.innerHTML = `
            <div>
                <span class="fw-bold">${mod.nombre}</span>
                <span class="badge bg-light text-dark ms-2 border border-secondary">Duración: ${duracionTexto}</span>
                <span class="badge bg-light text-dark ms-1 border border-success">Costo: S/ ${costo}</span>
                ${mod.descripcion && mod.descripcion !== 'Sin descripción.' ? `<i class="bi bi-info-circle text-muted ms-2" title="${mod.descripcion}"></i>` : ''}
            </div>
            <div>
                <button type="button" class="btn btn-sm btn-outline-warning me-1" onclick="editarModuloUI(${index})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarModuloUI(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        lista.appendChild(li);
    });
}

// =================================================================
// 6. LOGICA DE PRÓXIMOS GRUPOS
// =================================================================
function agregarProximoGrupoUI() {
    const fecha = document.getElementById('nextGroupFecha').value;
    const horario = document.getElementById('nextGroupHorario').value.trim();

    if (!fecha || !horario) {
        alert("Ambos campos (Fecha y Horario) son obligatorios.");
        return;
    }
    
    if (nextGroups.length >= 4) {
        alert("Solo se pueden agregar hasta 4 próximos grupos.");
        return;
    }

    nextGroups.push({ fecha: fecha, horario: horario });

    document.getElementById('nextGroupFecha').value = "";
    document.getElementById('nextGroupHorario').value = "";

    renderProximosGruposUI();
}

function eliminarProximoGrupoUI(index) {
    nextGroups.splice(index, 1);
    renderProximosGruposUI();
}

function renderProximosGruposUI() {
    const lista = document.getElementById('listaProximosGruposUI');
    lista.innerHTML = "";

    if (nextGroups.length === 0) {
        lista.innerHTML = '<li class="list-group-item text-muted small text-center bg-light">Sin grupos futuros agregados.</li>';
        return;
    }

    nextGroups.forEach((group, index) => {
        const fechaFormateada = formatDate(group.fecha); 
        const li = document.createElement('li');
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.innerHTML = `
            <div>
                <span class="fw-bold">${fechaFormateada}</span>
                <span class="badge bg-secondary ms-2">${group.horario}</span>
            </div>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarProximoGrupoUI(${index})">
                <i class="bi bi-trash"></i>
            </button>
        `;
        lista.appendChild(li);
    });
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
            nextGroups = []; 
            editingModuloIndex = -1; // Resetear modo edición
            document.getElementById('addModuloButton').textContent = 'Agregar Módulo';
            document.getElementById('addModuloButton').classList.remove('btn-warning');
            document.getElementById('addModuloButton').classList.add('btn-success');
            setModuloInputs();

            renderModulosUI();
            renderProximosGruposUI(); 
            document.getElementById('adminFormTitle').innerHTML = 'Crear Nuevo Programa';
            document.getElementById('adminForm').reset();
            document.getElementById('adminModalidad').value = 'Presencial'; 
            toggleHorarioFields('Presencial'); 
        }
    }
    if (sectionId === 'admin-dashboard') loadAdminList();
    if (sectionId === 'catalogo') cargarProgramas();
}


// =================================================================
// 3. AUTENTICACIÓN & 4. CATÁLOGO PÚBLICO
// =================================================================
function handleAdminAuth() { auth.currentUser ? showSection('admin-dashboard') : showSection('login'); }
function loginAdmin() {
    auth.signInWithEmailAndPassword(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value)
        .then(() => showSection('admin-dashboard'))
        .catch(e => { document.getElementById('authMessage').textContent = 'Error: ' + e.message; document.getElementById('authMessage').style.display = 'block'; });
}
auth.onAuthStateChanged(user => {
    const btn = document.getElementById('adminAuthButton');
    const progBtn = document.getElementById('programacionButton');
    const progAdminBtn = document.getElementById('programacionAdminButton');
    if (user) {
        btn.innerHTML = '<i class="bi bi-gear-fill me-1"></i> Admin CTTC';
        btn.onclick = () => showSection('admin-dashboard');
        if (progBtn) { progBtn.style.display = 'inline-block'; progBtn.href = 'https://jrodriguezfe.github.io/programacion_cttc/'; progBtn.target = '_blank'; }
        if (progAdminBtn) { progAdminBtn.style.display = 'inline-block'; progAdminBtn.href = 'https://jrodriguezfe.github.io/programacion_cttc/'; progAdminBtn.target = '_blank'; }
    } else {
        btn.innerHTML = '<i class="bi bi-person-circle me-1"></i> Admin CTTC';
        btn.onclick = handleAdminAuth;
        if (progBtn) progBtn.style.display = 'none';
        if (progAdminBtn) progAdminBtn.style.display = 'none';
    }
});
function logoutAdmin() { auth.signOut().then(() => { showSection('catalogo'); const progBtn = document.getElementById('programacionButton'); const progAdminBtn = document.getElementById('programacionAdminButton'); if (progBtn) progBtn.style.display = 'none'; if (progAdminBtn) progAdminBtn.style.display = 'none'; }); }

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


// =================================================================
// LÓGICA DE DETALLES DEL CURSO (Modal)
// =================================================================
function mostrarDetalle(id) {
    const p = allProgramas.find(x => x.id === id);
    if (!p) return;
    const imgUrl = procesarUrlImagen(p.imagenUrl);
    const esAdmin = auth.currentUser;
    const fechaFormateada = formatDate(p.fechaInicio); 
    const horarioFormateado = formatScheduleString(p.horario); 
    
    // --- MÓDULOS CON BOTÓN DE DETALLE (Lista Expandible) ---
    let modulosHtml = '';
    let costoTotal = 0;
    if (p.modulosJson && p.modulosJson.length > 0) {
        modulosHtml += `<h4 class="text-acento mt-4 mb-2">Módulos</h4>
        <div class="list-group">`;
        p.modulosJson.forEach((m, index) => {
            const costo = parseFloat(m.costo) || 0; 
            costoTotal += costo;
            
            // 💡 Nuevo formato de Duración con "horas"
            const duracion = m.horas.trim();
            const duracionTexto = duracion ? `${duracion} horas` : 'N/A';
            
            // Estructura de visualización en el modal
            const duracionHtml = `<span class="badge bg-secondary ms-2">${duracionTexto}</span>`;
            // El costo solo se muestra si es Admin.
            const costoPublicoHtml = !esAdmin ? '' : `<span class="badge bg-success ms-1">S/ ${costo.toFixed(2)}</span>`;

            // Usamos un botón para mostrar la descripción
            modulosHtml += `
            <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
               data-bs-toggle="collapse" data-bs-target="#moduloDetail${index}" aria-expanded="false">
                <div>
                    <span class="fw-bold">${m.nombre}</span>
                    ${duracionHtml}
                    ${costoPublicoHtml}
                </div>
                <i class="bi bi-chevron-down"></i>
            </a>
            <div class="collapse p-3 bg-light border-start border-acento" id="moduloDetail${index}">
                <p class="small mb-0">${m.descripcion || 'Sin descripción detallada.'}</p>
            </div>
            `;
        });
        modulosHtml += `</div>`;
        if (esAdmin) modulosHtml += `<div class="alert alert-costo text-center mt-3">Total: S/ ${costoTotal.toFixed(2)}</div>`;
        modulosHtml += `<p class="text-success small fw-bold"><i class="bi bi-tag"></i> Pregunte por descuentos.</p>`;
        modulosHtml += `<p class="text-success small fw-bold"><i class="bi bi-tag"></i> Todos los pagos son a nombre de SENATI en sus cuentas autorizadas.</p>`;
    }


    // --- GRUPOS FUTUROS ---
    let gruposFuturosHtml = '';
    if (p.proximosGrupos && p.proximosGrupos.length > 0) {
        gruposFuturosHtml = `
            <hr class="my-2">
            <p class="mb-1 small fw-bold text-acento"><i class="bi bi-calendar-range"></i> Próximos Inicios:</p>
            <ul class="list-unstyled small mb-0">
        `;
        p.proximosGrupos.forEach(group => {
            const fechaF = formatDate(group.fecha);
            if (group.fecha !== p.fechaInicio) {
                gruposFuturosHtml += `<li>• ${fechaF}: <strong>${group.horario}</strong></li>`;
            }
        });
        gruposFuturosHtml += `</ul>`;
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
                    <p class="mb-1"><i class="bi bi-calendar-event text-acento"></i> Inicio: <strong>${fechaFormateada}</strong></p>
                    <p class="mb-0"><i class="bi bi-stopwatch text-acento"></i> Horario: <strong>${horarioFormateado || 'Por definir'}</strong></p>
                    ${gruposFuturosHtml} 
                </div>
            </div>
            <div class="col-md-7">
                <h4 class="text-acento">Descripción</h4>
                <p>${p.descripcionDetallada || p.descripcionCorta}</p>
                ${modulosHtml}
                ${p.componentesOpcionales ? `<div class="alert alert-dark border border-success mt-3"><strong class="text-acento">Incluye:</strong> ${p.componentesOpcionales}</div>` : ''}
                <h4 class="text-acento mt-4">Dirigido a</h4>
                <p style="white-space: pre-line;">${p.dirigidoA || 'Consultar.'}</p>
                <h4 class="text-acento mt-4">Consideraciones</h4>
                <p style="white-space: pre-line;">${p.contenido || 'Ver módulos.'}</p>
            </div>
        </div>
    `;

    let btns = `<a href="https://wa.me/51954622231?text=Info ${p.titulo}" target="_blank" class="btn btn-acento"><i class="bi bi-whatsapp"></i> Inscribirse</a>`;
    if (esAdmin) btns += `<div class="ms-auto"><button class="btn btn-outline-dark me-2" onclick="cargarProgramaParaEdicion('${p.id}')" data-bs-dismiss="modal">Editar</button><button class="btn btn-outline-danger" onclick="eliminarPrograma('${p.id}')" data-bs-dismiss="modal">Eliminar</button></div>`;
    document.getElementById('detalle-footer').innerHTML = btns;
    new bootstrap.Modal(document.getElementById('detalleModal')).show();
}

function loadAdminList() {
    db.collection('programas').get().then(snap => {
        let html = `<table class="table table-hover"><thead><tr><th>Curso</th><th>Inicio</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>`;
        snap.forEach(d => {
            const p = {id:d.id, ...d.data()};
            const inicioFormateado = formatDate(p.fechaInicio); 
            
            html += `<tr><td>${p.titulo}</td><td>${inicioFormateado || '-'}</td><td class="${p.estado==='Activo'?'text-success':'text-danger'} fw-bold">${p.estado}</td>
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
        
        ['Titulo','Categoria','Estado','ImagenUrl','Descripcion','DescripcionDetallada','Contenido','Duracion','Modalidad','FechaInicio','Horario','ComponentesOpcionales','DirigidoA','Tags'].forEach(f => {
            let fieldName = f.charAt(0).toLowerCase() + f.slice(1);
            if (fieldName === 'descripcion') {
                fieldName = 'descripcionCorta'; 
            }
            
            const element = document.getElementById('admin' + f);
            if (element) {
                element.value = p[fieldName] || '';
            }
        });
        
        // 1. Cargar módulos
        currentModulos = p.modulosJson || [];
        renderModulosUI();
        
        // 2. Cargar Próximos Grupos
        nextGroups = p.proximosGrupos || [];
        renderProximosGruposUI();

        // 3. Cargar la modalidad en el select
        const modalidadSelect = document.getElementById('adminModalidad');
        modalidadSelect.value = p.modalidad || 'Presencial';

        // 4. Resetear la vista y mostrar el generador correcto con la modalidad cargada.
        toggleHorarioFields(modalidadSelect.value);
        
        // 5. Si el horario NO es vacío, lo parseamos para poblar la interfaz gráfica.
        if (p.horario && p.horario.length > 0) {
            parseHorarioString(p.horario, modalidadSelect.value);
        }

        // 6. Re-renderizar los botones de día y regenerar la cadena final.
        setupHorarioButtons(); 
        generateHorarioString(); 
        
        // 7. Resetear el modo edición de módulos
        editingModuloIndex = -1;
        document.getElementById('addModuloButton').textContent = 'Agregar Módulo';
        document.getElementById('addModuloButton').classList.remove('btn-warning');
        document.getElementById('addModuloButton').classList.add('btn-success');
        setModuloInputs();

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
        horario: document.getElementById('adminHorario').value, 
        componentesOpcionales: document.getElementById('adminComponentesOpcionales').value,
        dirigidoA: document.getElementById('adminDirigidoA').value,
        tags: document.getElementById('adminTags').value.toLowerCase(),
        modulosJson: currentModulos, 
        proximosGrupos: nextGroups,
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

// =================================================================
// INICIALIZACIÓN
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    cargarProgramas();
    setupHorarioButtons(); 
    
    // Lógica de arrastrar para la galería horizontal
    const g = document.getElementById('programas-container');
    if(g) {
        g.addEventListener('mousedown', e => { isDragging=true; g.classList.add('active'); startPos=e.clientX; scrollLeft=g.scrollLeft; });
        g.addEventListener('mouseup', () => { isDragging=false; g.classList.remove('active'); });
        g.addEventListener('mouseleave', () => { isDragging=false; g.classList.remove('active'); });
        g.addEventListener('mousemove', e => { if(!isDragging)return; e.preventDefault(); g.scrollLeft = scrollLeft - (e.clientX - startPos); });
    }
});