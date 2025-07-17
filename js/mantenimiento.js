document.addEventListener('DOMContentLoaded', function() {

    let mantenimientoData = [];
    let mantenimientoSeleccionado = null;

    // Inicializar la aplicación
    init();

    function init() {
        cargarMantenimientos();
        configurarEventos();
    }

    function configurarEventos() {
        document.querySelector('.add-button').addEventListener('click', mostrarModalAgregarMantenimiento);
        document.getElementById('search-input').addEventListener('input', buscarMantenimientos);
        const exportBtn = document.querySelector('.export-button');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportarTablaPDF);
        }
    }

    // Cargar mantenimientos desde la API
    async function cargarMantenimientos() {
    try {
        const response = await fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/mantenimiento');
        if (!response.ok) throw new Error('Error al cargar mantenimientos');
        mantenimientoData = await response.json();
        // Ordena para que los más nuevos estén arriba
        mantenimientoData.sort((a, b) => b.Id_mantenimiento - a.Id_mantenimiento);
        renderizarTablaMantenimiento(mantenimientoData);
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar mantenimientos', 'error');
    }
}

    // Renderizar tabla de mantenimientos
    function formatearFechaHora(fechaString) {
    if (!fechaString) return 'No ha finalizado';
    const fecha = new Date(fechaString);
    return fecha.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Renderizar tabla de mantenimientos
function renderizarTablaMantenimiento(data) {
    const tbody = document.querySelector('#tabla tbody');
    tbody.innerHTML = '';
    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.dataset.id = item.Id_mantenimiento;

        let estadoClass = '';
        if (item.Estado) {
            const estado = item.Estado.toLowerCase().replace(/\s+/g, '-');
            if (estado === 'pendiente') estadoClass = 'pendiente';
            else if (estado === 'en-proceso') estadoClass = 'en-proceso';
            else if (estado === 'listo') estadoClass = 'listo';
            else estadoClass = '';
        }

        // Botón finalizar solo si no está listo
        const finalizarBtn = (item.Estado !== 'Listo')
            ? `<button class="finalizar-mant" data-id="${item.Id_mantenimiento}">Finalizar</button>`
            : '';

        tr.innerHTML = `
            <td><button class="edit-mant">Editar</button></td>
            <td>${item.Descripcion_mantenimiento || ''}</td>
            <td>${formatearFechaHora(item.Fecha_inicio)}</td>
            <td>${formatearFechaHora(item.Fecha_fin)}</td>
            <td><span class="estado-badge ${estadoClass}">${item.Estado || ''}</span></td>
            <td>${item.EquipoSerial || ''} ${item.EquipoModelo ? '(' + item.EquipoModelo + ')' : ''}</td>
            <td>${item.UbicacionNombre || ''}</td>
            <td>${item.UsuarioNombre || ''}</td>
            <td>${item.AlertaMensaje || ''}</td>
            <td>
                <button class="delete-mant" data-id="${item.Id_mantenimiento}">Borrar</button>
                ${finalizarBtn}
            </td>
        `;
        tbody.appendChild(tr);

        // Botón editar
        tr.querySelector('.edit-mant').addEventListener('click', async function(e) {
            e.stopPropagation();
            await mostrarModalEditarMantenimiento(item.Id_mantenimiento);
        });

        // Botón borrar
        tr.querySelector('.delete-mant').addEventListener('click', function(e) {
            e.stopPropagation();
            eliminarMantenimiento(item.Id_mantenimiento);
        });

        // Botón finalizar
        if (item.Estado !== 'Listo') {
            const btnFinalizar = tr.querySelector('.finalizar-mant');
            if (btnFinalizar) {
                btnFinalizar.addEventListener('click', function(e) {
                    e.stopPropagation();
                    finalizarMantenimiento(item.Id_mantenimiento, item);
                });
            }
        }
    });
}

    // Mostrar modal para agregar mantenimiento
    async function mostrarModalAgregarMantenimiento() {
    // Carga los datos para los selects
    const [equipos, usuarios, ubicaciones, alertas] = await Promise.all([
        fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/computadoras').then(res => res.json()),
        fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/usuarios').then(res => res.json()),
        fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/ubicacion').then(res => res.json()),
        fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/alertas').then(res => res.json())
    ]);

    const modalHTML = `
        <div class="modal" id="modal-agregar-mant">
            <div class="modal-content">
                <h2>Añadir Mantenimiento</h2>
                <form id="form-agregar-mant">
                    <div class="form-group">
                        <label for="descripcion">Descripción:</label>
                        <input type="text" id="descripcion" name="descripcion" required>
                    </div>
                    <div class="form-group">
                        <label for="fecha_inicio">Fecha de inicio:</label>
                        <input type="date" id="fecha_inicio" name="fecha_inicio" required>
                    </div>
                    <div class="form-group">
                        <label for="fecha_fin">Fecha fin:</label>
                        <input type="date" id="fecha_fin" name="fecha_fin">
                    </div>
                    <div class="form-group">
                        <label for="estado">Estado:</label>
                        <select id="estado" name="estado" required>
                            <option value="Pendiente">Pendiente</option>
                            <option value="En Proceso">En Proceso</option>
                            <option value="Listo">Listo</option>
                        </select>
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
                        <label for="alerta">Alerta:</label>
                        <select id="alerta" name="alerta">
                            <option value="">Sin alerta</option>
                            ${alertas.filter(a => a.Estado === 'No leído').map(a => `<option value="${a.Id_alerta}">${a.Mensaje}</option>`).join('')}
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

const alertaSelect = document.getElementById('alerta');
if (alertaSelect) {
    alertaSelect.addEventListener('change', function() {
        const alertaId = this.value;
        if (!alertaId) return;
        // Busca la alerta seleccionada en el array alertas
        const alerta = alertas.find(a => a.Id_alerta == alertaId);
        if (!alerta) return;
        // Autocompleta los campos relacionados
        if (alerta.Id_equipo) {
            document.getElementById('equipo').value = alerta.Id_equipo;
        }
        if (alerta.Id_ubicacion) {
            document.getElementById('ubicacion').value = alerta.Id_ubicacion;
        }
        if (alerta.Id_usuario) {
            document.getElementById('usuario').value = alerta.Id_usuario;
        }
        if (alerta.Mensaje) {
            document.getElementById('descripcion').value = alerta.Mensaje;
        }
    });
}

const equipoSelect = document.getElementById('equipo');
if (equipoSelect) {
    equipoSelect.addEventListener('change', function() {
        const equipoId = this.value;
        if (!equipoId) return;
        // Busca el equipo seleccionado en el array equipos
        const equipo = equipos.find(e => e.Id_equipo == equipoId);
        if (!equipo) return;
        // Autocompleta la ubicación si el equipo tiene Id_ubicacion
        if (equipo.Id_ubicacion) {
            document.getElementById('ubicacion').value = equipo.Id_ubicacion;
        }
    });
}


    document.getElementById('form-agregar-mant').addEventListener('submit', async function(e) {
        e.preventDefault();
        await agregarMantenimiento();
    });

    document.querySelector('#modal-agregar-mant .btn-cancelar').addEventListener('click', () => {
        document.getElementById('modal-agregar-mant').remove();
    });
}

    // Agregar mantenimiento
    async function agregarMantenimiento() {
    const form = document.getElementById('form-agregar-mant');
    const formData = new FormData(form);

    const usuario = JSON.parse(localStorage.getItem('usuario'));

    const nuevoMantenimiento = {
        Descripcion_mantenimiento: formData.get('descripcion'),
        Fecha_inicio: formData.get('fecha_inicio'),
        Fecha_fin: formData.get('fecha_fin') || null,
        Estado: formData.get('estado'),
        Id_equipo: formData.get('equipo') || null,
        Id_ubicacion: formData.get('ubicacion') || null,
        Id_usuario: usuario ? usuario.Id_usuario : null,
        Id_alerta: formData.get('alerta') || null
    };

    try {
        const response = await fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/mantenimiento', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoMantenimiento)
        });

        if (!response.ok) throw new Error('Error al agregar mantenimiento');
        mostrarNotificacion('Mantenimiento agregado correctamente', 'success');
        document.getElementById('modal-agregar-mant').remove();
        await cargarMantenimientos();

        // Marcar alerta como leída si corresponde
        if (nuevoMantenimiento.Id_alerta) {
            try {
                await fetch(`https://8wtfdfb8-3000.use2.devtunnels.ms/alertas/${nuevoMantenimiento.Id_alerta}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ Estado: 'Leído' })
                });
            } catch (error) {
                console.error('No se pudo marcar la alerta como leída:', error);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al agregar mantenimiento', 'error');
    }
}


// Evento para abrir el modal de edición al hacer clic en una fila
tr.querySelector('.edit-mant').addEventListener('click', async function(e) {
    e.stopPropagation();
    await mostrarModalEditarMantenimiento(item.Id_mantenimiento);
});

async function mostrarModalEditarMantenimiento(id) {
    // Busca el mantenimiento seleccionado
    const mantenimiento = mantenimientoData.find(m => m.Id_mantenimiento == id);
    if (!mantenimiento) return;

    // Carga los datos para los selects
    const [equipos, usuarios, ubicaciones, alertas] = await Promise.all([
        fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/computadoras').then(res => res.json()),
        fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/usuarios').then(res => res.json()),
        fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/ubicacion').then(res => res.json()),
        fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/alertas').then(res => res.json())
    ]);

    const alertasNoLeidas = alertas.filter(a =>
        a.Estado === 'No leído' ||
        (mantenimiento.Id_alerta && a.Id_alerta == mantenimiento.Id_alerta)
    );

    // Convierte la fecha al formato yyyy-mm-dd
    function toInputDate(fecha) {
        if (!fecha) return '';
        const d = new Date(fecha);
        return d.toISOString().split('T')[0];
    }

    const modalHTML = `
        <div class="modal" id="modal-editar-mant">
            <div class="modal-content">
                <h2>Modificar Mantenimiento</h2>
                <form id="form-editar-mant">
                    <div class="form-group">
                        <label for="edit-descripcion">Descripción:</label>
                        <input type="text" id="edit-descripcion" name="descripcion" value="${mantenimiento.Descripcion_mantenimiento || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-fecha-inicio">Fecha de inicio:</label>
                        <input type="date" id="edit-fecha-inicio" name="fecha_inicio" value="${toInputDate(mantenimiento.Fecha_inicio)}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-fecha-fin">Fecha fin:</label>
                        <input type="date" id="edit-fecha-fin" name="fecha_fin" value="${toInputDate(mantenimiento.Fecha_fin)}">
                    </div>
                    <div class="form-group">
                        <label for="edit-estado">Estado:</label>
                        <select id="edit-estado" name="estado" required>
                            <option value="Pendiente" ${mantenimiento.Estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="En Proceso" ${mantenimiento.Estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                            <option value="Listo" ${mantenimiento.Estado === 'Listo' ? 'selected' : ''}>Listo</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-equipo">Equipo:</label>
                        <select id="edit-equipo" name="equipo">
                            <option value="">Sin equipo</option>
                            ${equipos.map(e => 
                                `<option value="${e.Id_equipo}" ${e.Id_equipo == mantenimiento.Id_equipo ? 'selected' : ''}>${e.Serial} (${e.Modelo})</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-ubicacion">Ubicación:</label>
                        <select id="edit-ubicacion" name="ubicacion">
                            <option value="">Sin ubicación</option>
                            ${ubicaciones.map(u => 
                                `<option value="${u.Id_ubicacion}" ${u.Id_ubicacion == mantenimiento.Id_ubicacion ? 'selected' : ''}>${u.Nombre}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-alerta">Alerta:</label>
                        <select id="edit-alerta" name="alerta">
                            <option value="">Sin alerta</option>
                            ${alertasNoLeidas.map(a => `
                                <option value="${a.Id_alerta}" ${a.Id_alerta == mantenimiento.Id_alerta ? 'selected' : ''}>
                                    ${a.Mensaje}
                                </option>
                            `).join('')}
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
    const modalExistente = document.getElementById('modal-editar-mant');
    if (modalExistente) modalExistente.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Evento guardar
    document.getElementById('form-editar-mant').addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const usuario = JSON.parse(localStorage.getItem('usuario'));

        const mantenimientoActualizado = {
            Descripcion_mantenimiento: formData.get('descripcion'),
            Fecha_inicio: formData.get('fecha_inicio'),
            Fecha_fin: formData.get('fecha_fin') || null,
            Estado: formData.get('estado'),
            Id_equipo: formData.get('equipo') || null,
            Id_ubicacion: formData.get('ubicacion') || null,
            Id_usuario: usuario ? usuario.Id_usuario : null,
            Id_alerta: formData.get('alerta') || null
        };

        try {
            const response = await fetch(`https://8wtfdfb8-3000.use2.devtunnels.ms/mantenimiento/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mantenimientoActualizado)
            });
            if (!response.ok) throw new Error('Error al modificar mantenimiento');
            mostrarNotificacion('Mantenimiento modificado correctamente', 'success');
            document.getElementById('modal-editar-mant').remove();
            await cargarMantenimientos();
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al modificar mantenimiento', 'error');
        }
    });

    // Evento cancelar
    document.querySelector('#modal-editar-mant .btn-cancelar').addEventListener('click', () => {
        document.getElementById('modal-editar-mant').remove();
    });
}


    // Eliminar mantenimiento
    async function eliminarMantenimiento(id) {
        if (!confirm('¿Está seguro que desea eliminar este mantenimiento?')) {
            return;
        }
        try {
            const response = await fetch(`httpss://8wtfdfb8-3000.use2.devtunnels.ms/mantenimiento/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Error al eliminar mantenimiento');
            mostrarNotificacion('Mantenimiento eliminado correctamente', 'success');
            await cargarMantenimientos();
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al eliminar mantenimiento', 'error');
        }
    }

    // Buscar mantenimientos
    function buscarMantenimientos(event) {
        const termino = event.target.value.toLowerCase();
        const resultados = mantenimientoData.filter(item =>
            (item.Descripcion && item.Descripcion.toLowerCase().includes(termino)) ||
            (item.Estado && item.Estado.toLowerCase().includes(termino)) ||
            (item.Equipo && item.Equipo.toLowerCase().includes(termino)) ||
            (item.Ubicacion && item.Ubicacion.toLowerCase().includes(termino)) ||
            (item.Usuario && item.Usuario.toLowerCase().includes(termino))
        );
        renderizarTablaMantenimiento(resultados);
    }

    // Notificaciones
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

    async function finalizarMantenimiento(id, item) {
    if (!confirm('¿Desea finalizar este mantenimiento?')) return;
    const fechaFin = new Date().toISOString().split('T')[0];
    try {
        // Actualiza el mantenimiento a "Listo"
        const response = await fetch(`https://8wtfdfb8-3000.use2.devtunnels.ms/mantenimiento/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                Estado: 'Listo',
                Fecha_fin: fechaFin
            })
        });
        if (!response.ok) throw new Error('Error al finalizar mantenimiento');

        // Crea la notificación
        await fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/notificacion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                Mensaje: `Mantenimiento finalizado: ${item.Descripcion_mantenimiento}`,
                Estado: 'No leído',
                Id_mantenimiento: id,
                Id_equipo: item.Id_equipo || null,
                Id_usuario: item.Id_usuario || null
            })
        });

        // Marcar alerta como "Resuelta" si corresponde
        if (item.Id_alerta) {
            try {
                await fetch(`httpss://8wtfdfb8-3000.use2.devtunnels.ms/alertas/${item.Id_alerta}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ Estado: 'Resuelta' })
                });
            } catch (error) {
        console.error('No se pudo marcar la alerta como resuelta:', error);
            }
        }

        mostrarNotificacion('Mantenimiento finalizado y notificación generada', 'success');
        await cargarMantenimientos();
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al finalizar mantenimiento', 'error');
    }
}

function exportarTablaPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });

    // Título personalizado
    doc.setFontSize(16);
    doc.text('Reporte de Mantenimientos GESTOCK', 14, 15);

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

    doc.save('mantenimientos.pdf');
}

    // Cerrar sesión
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('usuario');
            window.location.href = 'index.html';
        });
    }
});
