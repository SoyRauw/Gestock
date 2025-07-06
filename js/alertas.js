document.addEventListener('DOMContentLoaded', function() {

    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario) {
        window.location.href = 'index.html';
    }

    // Control de acceso: solo admin y coordinador pueden modificar
    const puedeModificar = usuario.Tipo_usuario === 'A' || usuario.Tipo_usuario === 'C';

    document.addEventListener('DOMContentLoaded', function() {
        const addBtn = document.querySelector('.add-button');
        if (addBtn && !puedeModificar) addBtn.style.display = 'none';
        setTimeout(() => {
            document.querySelectorAll('.edit, .delete').forEach(btn => {
                if (!puedeModificar) btn.style.display = 'none';
            });
        }, 0);
    });
    let alertasData = [];
    let alertaSeleccionada = null;

    // Inicializar la aplicación
    init();

    function init() {
        cargarAlertas();
        configurarEventos();
    }

    function configurarEventos() {
        const addBtn = document.querySelector('.add-button');
        if (addBtn && puedeModificar) {
            addBtn.addEventListener('click', mostrarModalAgregarAlerta);
        }else {
            addBtn.disabled = true;
            addBtn.classList.add('disabled-btn');
        }
        document.getElementById('search-input').addEventListener('input', buscarAlertas);
        const exportBtn = document.querySelector('.export-button');
            if (exportBtn) {
            exportBtn.addEventListener('click', exportarTablaPDF);
        }
    }

    // Cargar alertas desde la API
    async function cargarAlertas() {
    try {
        const response = await fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/alertas');
        if (!response.ok) throw new Error('Error al cargar alertas');
        alertasData = await response.json();
        // Ordena para que las más nuevas estén arriba
        alertasData.sort((a, b) => b.Id_alerta - a.Id_alerta);
        renderizarTablaAlertas(alertasData);
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar alertas', 'error');
    }
}

    // Renderizar tabla de alertas
    function renderizarTablaAlertas(data) {
    const tbody = document.querySelector('#tabla tbody');
    tbody.innerHTML = '';
    data.forEach(alerta => {
        const tr = document.createElement('tr');
        tr.dataset.id = alerta.Id_alerta;
        const estadoClass = alerta.Estado ? alerta.Estado.toLowerCase().replace(/\s+/g, '-') : '';
        const prioridadClass = alerta.Prioridad ? alerta.Prioridad.toLowerCase() : '';
        tr.innerHTML = `
            <td>
                <button class="edit${!puedeModificar ? ' disabled-btn' : ''}" data-id="${alerta.Id_alerta}" ${!puedeModificar ? 'disabled' : ''}>Editar</button>
            </td>
            <td>${formatearFechaHora(alerta.Fecha)}</td>
            <td>${alerta.Mensaje || ''}</td>
            <td>${alerta.UsuarioNombre || ''}</td>
            <td>${alerta.EquipoSerial || ''}</td>
            <td>${alerta.UbicacionNombre || ''}</td>
            <td><span class="estado-badge ${estadoClass}">${alerta.Estado || ''}</span></td>
            <td><span class="prioridad-badge ${prioridadClass}">${alerta.Prioridad || ''}</span></td>
            <td>
                <button class="delete${!puedeModificar ? ' disabled-btn' : ''}" data-id="${alerta.Id_alerta}" ${!puedeModificar ? 'disabled' : ''}>Borrar</button>
            </td>
        `;
        tbody.appendChild(tr);

        // Selección visual
        tr.addEventListener('click', function() {
            document.querySelectorAll('#tabla tr').forEach(row => row.classList.remove('seleccionado'));
            this.classList.add('seleccionado');
            alertaSeleccionada = alerta;
        });

        // Editar
        const editBtn = tr.querySelector('.edit');
        if (editBtn && puedeModificar) {
            editBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                mostrarModalEditarAlerta(alerta);
            });
        }

        // Borrar
        const deleteBtn = tr.querySelector('.delete');
        if (deleteBtn && puedeModificar) {
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                eliminarAlerta(alerta.Id_alerta);
            });
        }
    });
}

    // Buscar alertas
    function buscarAlertas(event) {
        const termino = event.target.value.toLowerCase();
        const resultados = alertasData.filter(a =>
            (a.Mensaje && a.Mensaje.toLowerCase().includes(termino)) ||
            (a.UsuarioNombre && a.UsuarioNombre.toLowerCase().includes(termino)) ||
            (a.EquipoSerial && a.EquipoSerial.toLowerCase().includes(termino)) ||
            (a.UbicacionNombre && a.UbicacionNombre.toLowerCase().includes(termino)) ||
            (a.Estado && a.Estado.toLowerCase().includes(termino)) ||
            (a.Prioridad && a.Prioridad.toLowerCase().includes(termino))
        );
        renderizarTablaAlertas(resultados);
    }

    // Modal para agregar alerta
    async function mostrarModalAgregarAlerta() {
        // Cargar usuarios, equipos y ubicaciones para los selects
        const [usuarios, equipos, ubicaciones] = await Promise.all([
            fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/usuarios').then(res => res.json()),
            fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/computadoras').then(res => res.json()),
            fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/ubicacion').then(res => res.json())
        ]);
        const modalHTML = `
            <div class="modal" id="modal-agregar-alerta">
                <div class="modal-content">
                    <h2>Añadir Alerta</h2>
                    <form id="form-agregar-alerta">
                        <div class="form-group">
                            <label for="mensaje">Mensaje:</label>
                            <input type="text" id="mensaje" name="mensaje" required>
                        </div>
                        <div class="form-group">
                            <label for="equipo">Equipo:</label>
                            <select id="equipo" name="equipo">
                                <option value="">Sin equipo</option>
                                ${equipos.map(e => `<option value="${e.Id_equipo}">${e.Serial} (${e.Modelo})</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="ubicacion">Ubicación:</label>
                            <select id="ubicacion" name="ubicacion">
                                <option value="">Sin ubicación</option>
                                ${ubicaciones.map(u => `<option value="${u.Id_ubicacion}">${u.Nombre}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="prioridad">Prioridad:</label>
                            <select id="prioridad" name="prioridad" required>
                                <option value="Alta">Alta</option>
                                <option value="Media" selected>Media</option>
                                <option value="Baja">Baja</option>
                            </select>
                        </div>
                        <div class="modal-buttons">
                            <button type="submit" class="btn-guardar">Guardar</button>
                            <button type="button" class="btn-cancelar">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('form-agregar-alerta').addEventListener('submit', async function(e) {
            e.preventDefault();
            await agregarAlerta();
        });

        document.querySelector('#modal-agregar-alerta .btn-cancelar').addEventListener('click', () => {
            document.getElementById('modal-agregar-alerta').remove();
        });
    }

    // Agregar alerta
    async function agregarAlerta() {
        const form = document.getElementById('form-agregar-alerta');
        const formData = new FormData(form);
        const usuario = JSON.parse(localStorage.getItem('usuario'));

        const nuevaAlerta = {
            Mensaje: formData.get('mensaje'),
            Id_usuario: usuario ? usuario.Id_usuario : null,
            Id_equipo: formData.get('equipo') || null,
            Id_ubicacion: formData.get('ubicacion') || null,
            Prioridad: formData.get('prioridad') || 'Media'
        };
        try {
            const response = await fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/alertas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevaAlerta)
            });
            if (!response.ok) throw new Error('Error al agregar alerta');
            mostrarNotificacion('Alerta agregada correctamente', 'success');
            document.getElementById('modal-agregar-alerta').remove();
            await cargarAlertas();
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al agregar alerta', 'error');
        }
    }

    // Modal para editar alerta
    async function mostrarModalEditarAlerta(alerta) {
        // Cargar usuarios, equipos y ubicaciones para los selects
        const [usuarios, equipos, ubicaciones] = await Promise.all([
            fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/usuarios').then(res => res.json()),
            fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/computadoras').then(res => res.json()),
            fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/ubicacion').then(res => res.json())
        ]);
        const modalHTML = `
            <div class="modal" id="modal-editar-alerta">
                <div class="modal-content">
                    <h2>Editar Alerta</h2>
                    <form id="form-editar-alerta">
                        <div class="form-group">
                            <label for="edit-mensaje">Mensaje:</label>
                            <input type="text" id="edit-mensaje" name="mensaje" value="${alerta.Mensaje || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-usuario">Usuario:</label>
                            <select id="edit-usuario" name="usuario">
                                <option value="">Sin usuario</option>
                                ${usuarios.map(u => `<option value="${u.Id_usuario}" ${u.Id_usuario == alerta.Id_usuario ? 'selected' : ''}>${u.Nombre}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-equipo">Equipo:</label>
                            <select id="edit-equipo" name="equipo">
                                <option value="">Sin equipo</option>
                                ${equipos.map(e => `<option value="${e.Id_equipo}" ${e.Id_equipo == alerta.Id_equipo ? 'selected' : ''}>${e.Serial} (${e.Modelo})</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-ubicacion">Ubicación:</label>
                            <select id="edit-ubicacion" name="ubicacion">
                                <option value="">Sin ubicación</option>
                                ${ubicaciones.map(u => `<option value="${u.Id_ubicacion}" ${u.Id_ubicacion == alerta.Id_ubicacion ? 'selected' : ''}>${u.Nombre}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-prioridad">Prioridad:</label>
                            <select id="edit-prioridad" name="prioridad" required>
                                <option value="Alta" ${alerta.Prioridad === 'Alta' ? 'selected' : ''}>Alta</option>
                                <option value="Media" ${alerta.Prioridad === 'Media' ? 'selected' : ''}>Media</option>
                                <option value="Baja" ${alerta.Prioridad === 'Baja' ? 'selected' : ''}>Baja</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-estado">Estado:</label>
                            <select id="edit-estado" name="estado" required>
                                <option value="No leído" ${alerta.Estado === 'No leído' ? 'selected' : ''}>No leído</option>
                                <option value="Leído" ${alerta.Estado === 'Leído' ? 'selected' : ''}>Leído</option>
                            </select>
                        </div>
                        <div class="modal-buttons">
                            <button type="submit" class="btn-guardar">Guardar</button>
                            <button type="button" class="btn-cancelar">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        // Elimina cualquier modal anterior y agrega el nuevo
        const modalExistente = document.getElementById('modal-editar-alerta');
        if (modalExistente) modalExistente.remove();
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('form-editar-alerta').addEventListener('submit', async function(e) {
            e.preventDefault();
            await editarAlerta(alerta.Id_alerta);
        });

        document.querySelector('#modal-editar-alerta .btn-cancelar').addEventListener('click', () => {
            document.getElementById('modal-editar-alerta').remove();
        });
    }

    // Editar alerta
    async function editarAlerta(id) {
        const form = document.getElementById('form-editar-alerta');
        const formData = new FormData(form);
        const alertaActualizada = {
            Mensaje: formData.get('mensaje'),
            Id_usuario: formData.get('usuario') || null,
            Id_equipo: formData.get('equipo') || null,
            Id_ubicacion: formData.get('ubicacion') || null,
            Prioridad: formData.get('prioridad') || 'Media',
            Estado: formData.get('estado') || 'No leído'
        };
        try {
            const response = await fetch(`https://8wtfdfb8-3000.use2.devtunnels.ms/alertas/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alertaActualizada)
            });
            if (!response.ok) throw new Error('Error al editar alerta');
            mostrarNotificacion('Alerta editada correctamente', 'success');
            document.getElementById('modal-editar-alerta').remove();
            await cargarAlertas();
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al editar alerta', 'error');
        }
    }

    // Eliminar alerta
    async function eliminarAlerta(id) {
        if (!confirm('¿Está seguro que desea eliminar esta alerta?')) return;
        try {
            const response = await fetch(`https://8wtfdfb8-3000.use2.devtunnels.ms/alertas/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Error al eliminar alerta');
            mostrarNotificacion('Alerta eliminada correctamente', 'success');
            await cargarAlertas();
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al eliminar alerta', 'error');
        }
    }

    // Función auxiliar para formatear fecha y hora
    function formatearFechaHora(fechaString) {
        if (!fechaString) return 'N/A';
        const fecha = new Date(fechaString);
        return fecha.toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function exportarTablaPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });

    // Título personalizado
    doc.setFontSize(16);
    doc.text('Reporte de Alertas GESTOCK', 14, 15);

    // Fecha de generación
    const fecha = new Date().toLocaleString('es-ES');
    doc.setFontSize(10);
    doc.text(`Fecha de generación: ${fecha}`, 14, 22);

    // Encabezados (sin columnas de editar/borrar)
    const headers = [];
    document.querySelectorAll('#tabla thead th').forEach((th, i, arr) => {
        if (i !== 0 && i !== arr.length - 1) {
            headers.push(th.textContent.trim());
        }
    });

    // Datos (sin columnas de editar/borrar)
    const data = [];
    document.querySelectorAll('#tabla tbody tr').forEach(tr => {
        const row = [];
        const tds = tr.querySelectorAll('td');
        tds.forEach((td, i) => {
            if (i !== 0 && i !== tds.length - 1) {
                row.push(td.textContent.trim());
            }
        });
        data.push(row);
    });

    // Tabla con estilos personalizados
    doc.autoTable({
        startY: 28,
        head: [headers],
        body: data,
        styles: { fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [9, 132, 227], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 248, 255] }
    });

    // Pie de página
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
    }

    doc.save('alertas.pdf');
}

    // Notificaciones toast
    function mostrarNotificacion(mensaje, tipo = 'info') {
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion-toast ${tipo}`;
        notificacion.textContent = mensaje;
        document.body.appendChild(notificacion);

        setTimeout(() => {
            notificacion.classList.add('fade-out');
            setTimeout(() => notificacion.remove(), 500);
        }, 3000);
    }

    const logoutBtn = document.getElementById('logout-button');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault(); // Evita que el <a> recargue la página antes de limpiar
        localStorage.removeItem('usuario');
        window.location.href = 'index.html';
    });
}

});
