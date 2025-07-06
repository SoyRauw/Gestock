document.addEventListener('DOMContentLoaded', function() {

    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario) {
        window.location.href = 'index.html';
    }
    const puedeModificar = usuario.Tipo_usuario === 'A' || usuario.Tipo_usuario === 'C';

    let ubicacionesData = [];
    let ubicacionSeleccionada = null;

    // Inicializar la aplicación
    init();

    function init() {
        cargarUbicaciones();
        configurarEventos();
    }

    function configurarEventos() {
    const addBtn = document.querySelector('.add-button');
    if (addBtn) {
        if (puedeModificar) {
            addBtn.addEventListener('click', mostrarModalAgregarUbicacion);
        } else {
            addBtn.disabled = true;
            addBtn.classList.add('disabled-btn');
        }
    }
    document.getElementById('search-input').addEventListener('input', buscarUbicaciones);
    const exportBtn = document.querySelector('.export-button');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportarTablaPDF);
        }
}

    // Cargar ubicaciones desde la API
    async function cargarUbicaciones() {
    try {
        const response = await fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/ubicacion');
        if (!response.ok) throw new Error('Error al cargar ubicaciones');
        ubicacionesData = await response.json();
        // Ordena para que los más nuevos estén arriba
        ubicacionesData.sort((a, b) => b.Id_ubicacion - a.Id_ubicacion);
        renderizarTablaUbicaciones(ubicacionesData);
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar ubicaciones', 'error');
    }
}

    // Renderizar tabla de ubicaciones
    function renderizarTablaUbicaciones(data) {
    const tbody = document.querySelector('#tabla tbody');
    tbody.innerHTML = '';
    data.forEach(ubicacion => {
        const tr = document.createElement('tr');
        tr.dataset.id = ubicacion.Id_ubicacion;
        tr.innerHTML = `
            <td>
                <button class="edit${!puedeModificar ? ' disabled-btn' : ''}" data-id="${ubicacion.Id_ubicacion}" ${!puedeModificar ? 'disabled' : ''}>Editar</button>
            </td>
            <td>${ubicacion.Nombre || ''}</td>
            <td>${ubicacion.Descripcion || ''}</td>
            <td>${ubicacion.Tipo || ''}</td>
            <td>${ubicacion.Capacidad || ''}</td>
            <td>
                <button class="delete${!puedeModificar ? ' disabled-btn' : ''}" data-id="${ubicacion.Id_ubicacion}" ${!puedeModificar ? 'disabled' : ''}>Borrar</button>
            </td>
        `;
        tbody.appendChild(tr);

        // Selección visual
        tr.addEventListener('click', function() {
            document.querySelectorAll('#tabla tr').forEach(row => row.classList.remove('seleccionado'));
            this.classList.add('seleccionado');
            ubicacionSeleccionada = ubicacion;
        });

        // Editar
        const editBtn = tr.querySelector('.edit');
        if (editBtn && puedeModificar) {
            editBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                mostrarModalEditarUbicacion(ubicacion);
            });
        }

        // Borrar
        const deleteBtn = tr.querySelector('.delete');
        if (deleteBtn && puedeModificar) {
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                eliminarUbicacion(ubicacion.Id_ubicacion);
            });
        }
    });
}

    // Buscar ubicaciones
    function buscarUbicaciones(event) {
        const termino = event.target.value.toLowerCase();
        const resultados = ubicacionesData.filter(u =>
            (u.Nombre && u.Nombre.toLowerCase().includes(termino)) ||
            (u.Descripcion && u.Descripcion.toLowerCase().includes(termino)) ||
            (u.Tipo && u.Tipo.toLowerCase().includes(termino))
        );
        renderizarTablaUbicaciones(resultados);
    }

    // Modal para agregar ubicación
    function mostrarModalAgregarUbicacion() {
        const modalHTML = `
            <div class="modal" id="modal-agregar-ubicacion">
                <div class="modal-content">
                    <h2>Añadir Ubicación</h2>
                    <form id="form-agregar-ubicacion">
                        <div class="form-group">
                            <label for="nombre">Nombre:</label>
                            <input type="text" id="nombre" name="nombre" required>
                        </div>
                        <div class="form-group">
                            <label for="descripcion">Descripción:</label>
                            <input type="text" id="descripcion" name="descripcion">
                        </div>
                        <div class="form-group">
                            <label for="tipo">Tipo:</label>
                            <select id="tipo" name="tipo" required>
                                <option value="">Seleccione tipo</option>
                                <option value="Laboratorio">Laboratorio</option>
                                <option value="Taller">Taller</option>
                                <option value="Deposito">Deposito</option>
                                <option value="Oficina">Oficina</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="capacidad">Capacidad:</label>
                            <input type="number" id="capacidad" name="capacidad" min="0">
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

        document.getElementById('form-agregar-ubicacion').addEventListener('submit', async function(e) {
            e.preventDefault();
            await agregarUbicacion();
        });

        document.querySelector('#modal-agregar-ubicacion .btn-cancelar').addEventListener('click', () => {
            document.getElementById('modal-agregar-ubicacion').remove();
        });
    }

    // Agregar ubicación
    async function agregarUbicacion() {
        const form = document.getElementById('form-agregar-ubicacion');
        const formData = new FormData(form);
        const nuevaUbicacion = {
            Nombre: formData.get('nombre'),
            Descripcion: formData.get('descripcion') || null,
            Tipo: formData.get('tipo') || null,
            Capacidad: formData.get('capacidad') || null
        };
        try {
            const response = await fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/ubicacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevaUbicacion)
            });
            if (!response.ok) throw new Error('Error al agregar ubicación');
            mostrarNotificacion('Ubicación agregada correctamente', 'success');
            document.getElementById('modal-agregar-ubicacion').remove();
            await cargarUbicaciones();
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al agregar ubicación', 'error');
        }
    }

    // Modal para editar ubicación
    function mostrarModalEditarUbicacion(ubicacion) {
        const modalHTML = `
            <div class="modal" id="modal-editar-ubicacion">
                <div class="modal-content">
                    <h2>Editar Ubicación</h2>
                    <form id="form-editar-ubicacion">
                        <div class="form-group">
                            <label for="edit-nombre">Nombre:</label>
                            <input type="text" id="edit-nombre" name="nombre" value="${ubicacion.Nombre || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-descripcion">Descripción:</label>
                            <input type="text" id="edit-descripcion" name="descripcion" value="${ubicacion.Descripcion || ''}">
                        </div>
                        <div class="form-group">
                            <label for="edit-tipo">Tipo:</label>
                            <select id="edit-tipo" name="tipo" required>
                                <option value="">Seleccione tipo</option>
                                <option value="Laboratorio" ${ubicacion.Tipo === 'Laboratorio' ? 'selected' : ''}>Laboratorio</option>
                                <option value="Taller" ${ubicacion.Tipo === 'Taller' ? 'selected' : ''}>Taller</option>
                                <option value="Deposito" ${ubicacion.Tipo === 'Deposito' ? 'selected' : ''}>Deposito</option>
                                <option value="Oficina" ${ubicacion.Tipo === 'Oficina' ? 'selected' : ''}>Oficina</option>
                                <option value="Otro" ${ubicacion.Tipo === 'Otro' ? 'selected' : ''}>Otro</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-capacidad">Capacidad:</label>
                            <input type="number" id="edit-capacidad" name="capacidad" min="0" value="${ubicacion.Capacidad || ''}">
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
        const modalExistente = document.getElementById('modal-editar-ubicacion');
        if (modalExistente) modalExistente.remove();
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('form-editar-ubicacion').addEventListener('submit', async function(e) {
            e.preventDefault();
            await editarUbicacion(ubicacion.Id_ubicacion);
        });

        document.querySelector('#modal-editar-ubicacion .btn-cancelar').addEventListener('click', () => {
            document.getElementById('modal-editar-ubicacion').remove();
        });
    }

    // Editar ubicación
    async function editarUbicacion(id) {
        const form = document.getElementById('form-editar-ubicacion');
        const formData = new FormData(form);
        const ubicacionActualizada = {
            Nombre: formData.get('nombre'),
            Descripcion: formData.get('descripcion') || null,
            Tipo: formData.get('tipo') || null,
            Capacidad: formData.get('capacidad') || null
        };
        try {
            const response = await fetch(`https://8wtfdfb8-3000.use2.devtunnels.ms/ubicacion/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ubicacionActualizada)
            });
            if (!response.ok) throw new Error('Error al editar ubicación');
            mostrarNotificacion('Ubicación editada correctamente', 'success');
            document.getElementById('modal-editar-ubicacion').remove();
            await cargarUbicaciones();
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al editar ubicación', 'error');
        }
    }

    // Eliminar ubicación
    async function eliminarUbicacion(id) {
        if (!confirm('¿Está seguro que desea eliminar esta ubicación?')) return;
        try {
            const response = await fetch(`https://8wtfdfb8-3000.use2.devtunnels.ms/ubicacion/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Error al eliminar ubicación');
            mostrarNotificacion('Ubicación eliminada correctamente', 'success');
            await cargarUbicaciones();
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al eliminar ubicación', 'error');
        }
    }

    function exportarTablaPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });

    // Título personalizado
    doc.setFontSize(16);
    doc.text('Reporte de Ubicaciones GESTOCK', 14, 15);

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

    doc.save('Ubicaciones.pdf');
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
