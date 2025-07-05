
document.addEventListener('DOMContentLoaded', function() {

    const usuario = JSON.parse(localStorage.getItem('usuario'));
if (!usuario) {
    window.location.href = '/index.html';
}
const puedeModificar = usuario.Tipo_usuario === 'A' || usuario.Tipo_usuario === 'C';

    let equiposData = [];
    let equipoSeleccionado = null;

    // Inicializar la aplicación
    init();

    function init() {
        cargarEquipos();
        configurarEventos();
    }

    function configurarEventos() {
    const addBtn = document.querySelector('.add-button');
    if (addBtn) {
        if (puedeModificar) {
            addBtn.addEventListener('click', mostrarModalAgregar);
        } else {
            addBtn.disabled = true;
            addBtn.classList.add('disabled-btn');
        }
    }
    document.getElementById('search-input').addEventListener('input', buscarEquipos);

    const exportBtn = document.querySelector('.export-button');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportarTablaPDF);
    }
}

    // Función para cargar los equipos desde la API
    async function cargarEquipos() {
    try {
        const response = await fetch('http://8wtfdfb8-3000.use2.devtunnels.ms/computadoras');
        if (!response.ok) throw new Error('Error al cargar equipos');
        
        equiposData = await response.json();
        // Ordena para que los más nuevos (mayor Id_equipo) estén arriba
        equiposData.sort((a, b) => b.Id_equipo - a.Id_equipo);
        renderizarTabla(equiposData);
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar equipos', 'error');
    }
}


    // Función para renderizar la tabla con los datos
    function renderizarTabla(data) {
    const tbody = document.querySelector('#tabla tbody');
    tbody.innerHTML = '';
    
    data.forEach(equipo => {
        const tr = document.createElement('tr');
        tr.dataset.id = equipo.Id_equipo;
        const estadoClass = equipo.Estado.toLowerCase().replace(/\s+/g, '-');
        tr.innerHTML = `
            <td>
                <button class="edit${!puedeModificar ? ' disabled-btn' : ''}" onclick="modificarEquipo(this)" ${!puedeModificar ? 'disabled' : ''}>Editar</button>
            </td>
            <td>${equipo.Id_equipo}</td>
            <td>${equipo.UbicacionNombre || 'Sin ubicación'}</td>
            <td>${equipo.Serial}</td>
            <td>${equipo.Modelo}</td>
            <td>${formatearFecha(equipo.Fecha_ingreso)}</td>
            <td><span class="estado-badge ${estadoClass}">${equipo.Estado}</span></td>
            <td>${equipo.UsuarioNombre || 'Sin usuario'}</td>
            <td>
                <img src="">
                <button class="delete${!puedeModificar ? ' disabled-btn' : ''}" data-id="${equipo.Id_equipo}" ${!puedeModificar ? 'disabled' : ''}>Borrar</button>
            </td>
        `;
        tbody.appendChild(tr);

        // Selección visual
        tr.addEventListener('click', function() {
            document.querySelectorAll('#tabla tr').forEach(row => row.classList.remove('seleccionado'));
            this.classList.add('seleccionado');
            equipoSeleccionado = equipo;
        });

        // Evento borrar solo si puede modificar
        const deleteBtn = tr.querySelector('.delete');
        if (deleteBtn && puedeModificar) {
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                eliminarEquipo(equipo.Id_equipo);
            });
        }
    });
}

    // Función para mostrar modal de agregar equipo
    async function mostrarModalAgregar() {
        try {
            // Cargar usuarios y ubicaciones primero
            const [ubicaciones, usuarios] = await Promise.all([
                fetch('http://8wtfdfb8-3000.use2.devtunnels.ms/ubicacion').then(res => res.json()),
                fetch('http://8wtfdfb8-3000.use2.devtunnels.ms/usuarios').then(res => res.json())
            ]);

            const modalHTML = `
                <div class="modal" id="modal-agregar">
                    <div class="modal-content">
                        <h2>Añadir Nuevo Equipo</h2>
                        <form id="form-agregar">
                            <div class="form-group">
                                <label for="serial">Serial:</label>
                                <input type="text" id="serial" name="serial" required>
                            </div>
                            <div class="form-group">
                                <label for="modelo">Modelo:</label>
                                <input type="text" id="modelo" name="modelo" required>
                            </div>
                            <div class="form-group">
                                <label for="estado">Estado:</label>
                                <select id="estado" name="estado" required>
                                    <option value="Buen Estado">Buen Estado</option>
                                    <option value="Mal Estado">Mal Estado</option>
                                    <option value="Mantenimiento">Mantenimiento</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="ubicacion">Ubicación:</label>
                                <select id="ubicacion" name="ubicacion">
                                    <option value="">Sin ubicación</option>
                                    ${ubicaciones.map(u => `<option value="${u.Id_ubicacion}">${u.Nombre}</option>`).join('')}
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
            
            // Configurar eventos del modal
            document.getElementById('form-agregar').addEventListener('submit', async function(e) {
                e.preventDefault();
                await agregarEquipo();
            });
            
            document.querySelector('#modal-agregar .btn-cancelar').addEventListener('click', () => {
                document.getElementById('modal-agregar').remove();
            });
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al cargar datos necesarios', 'error');
        }
    }

    // Función para agregar un nuevo equipo
    async function agregarEquipo() {
        const form = document.getElementById('form-agregar');
        const formData = new FormData(form);
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        
        const nuevoEquipo = {
            Serial: formData.get('serial'),
            Modelo: formData.get('modelo'),
            Estado: formData.get('estado'),
            Id_ubicacion: formData.get('ubicacion') || null,
             Id_usuario: usuario ? usuario.Id_usuario : null,
            Fecha_ingreso: new Date().toISOString().split('T')[0]
        };
        
        try {
            const response = await fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/computadoras', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(nuevoEquipo)
            });
            
            if (!response.ok) throw new Error('Error al agregar equipo');
            
            mostrarNotificacion('Equipo agregado correctamente', 'success');
            document.getElementById('modal-agregar').remove();
            await cargarEquipos();
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al agregar equipo', 'error');
        }
    }

    // Función para eliminar equipo
    async function eliminarEquipo(id) {
        if (!confirm('¿Está seguro que desea eliminar este equipo?')) {
            return;
        }
        
        try {
            const response = await fetch(`https://8wtfdfb8-3000.use2.devtunnels.ms/computadoras/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Error al eliminar equipo');
            
            mostrarNotificacion('Equipo eliminado correctamente', 'success');
            await cargarEquipos();
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al eliminar equipo', 'error');
        }
    }

    let filaEditando = null;

window.modificarEquipo = async function(boton) {
    filaEditando = boton.closest('tr');
    const celdas = filaEditando.querySelectorAll('td');
    const idEquipo = celdas[1].innerText;

    const equipo = equiposData.find(eq => eq.Id_equipo == idEquipo);
    const fechaFormateada = equipo && equipo.Fecha_ingreso ? formatearFecha(equipo.Fecha_ingreso) : 'N/A';

    // Carga ubicaciones y usuarios igual que en agregar
    const [ubicaciones, usuarios] = await Promise.all([
        fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/ubicacion').then(res => res.json()),
        fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/usuarios').then(res => res.json())
    ]);

    // Busca los valores actuales
    const ubicacionActual = celdas[2].innerText;
    const serialActual = celdas[3].innerText;
    const modeloActual = celdas[4].innerText;
    const fechaActual = celdas[5].innerText;
    const estadoActual = celdas[6].innerText.trim();
    const usuarioActual = celdas[7].innerText;


    // Convierte la fecha al formato yyyy-mm-dd
    let fechaInput = '';
    if (fechaActual && fechaActual !== 'N/A') {
        const partes = fechaActual.split('/');
        if (partes.length === 3) {
            fechaInput = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
        } else {
            fechaInput = fechaActual;
        }
    }

    // Construye el modal igual que en agregar
    const modalHTML = `
        <div class="modal" id="modal-editar">
            <div class="modal-content">
                <h2>Modificar Equipo</h2>
                <form id="form-editar-equipo">
                    <div class="form-group">
                        <label for="edit-serial">Serial:</label>
                        <input type="text" id="edit-serial" name="serial" value="${serialActual}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-modelo">Modelo:</label>
                        <input type="text" id="edit-modelo" name="modelo" value="${modeloActual}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-estado">Estado:</label>
                        <select id="edit-estado" name="estado" required>
                            <option value="Buen Estado" ${estadoActual === 'Buen Estado' ? 'selected' : ''}>Buen Estado</option>
                            <option value="Mal Estado" ${estadoActual === 'Mal Estado' ? 'selected' : ''}>Mal Estado</option>
                            <option value="Mantenimiento" ${estadoActual === 'Mantenimiento' ? 'selected' : ''}>Mantenimiento</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-ubicacion">Ubicación:</label>
                        <select id="edit-ubicacion" name="ubicacion">
                            <option value="">Sin ubicación</option>
                            ${ubicaciones.map(u => 
                                `<option value="${u.Id_ubicacion}" ${u.Nombre === ubicacionActual ? 'selected' : ''}>${u.Nombre}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-usuario">Usuario:</label>
                        <select id="edit-usuario" name="usuario">
                            <option value="">Sin usuario</option>
                            ${usuarios.map(u => 
                                `<option value="${u.Id_usuario}" ${u.Nombre === usuarioActual ? 'selected' : ''}>${u.Nombre}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-fecha">Fecha de Ingreso:</label>
                        <input type="text" id="edit-fecha" name="fechaIngreso" value="${fechaFormateada}" readonly>
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
    const modalExistente = document.getElementById('modal-editar');
    if (modalExistente) modalExistente.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Evento guardar
    document.getElementById('form-editar-equipo').addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const equipoActualizado = {
            Serial: formData.get('serial'),
            Modelo: formData.get('modelo'),
            Estado: formData.get('estado'),
            Id_ubicacion: formData.get('ubicacion') || null,
            Id_usuario: formData.get('usuario') || null
        };

        try {
            const response = await fetch(`http://8wtfdfb8-3000.use2.devtunnels.ms/computadoras/${idEquipo}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(equipoActualizado)
            });
            if (!response.ok) throw new Error('Error al modificar equipo');
            mostrarNotificacion('Equipo modificado correctamente', 'success');
            document.getElementById('modal-editar').remove();
            await cargarEquipos();
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al modificar equipo', 'error');
        }
    });

    // Evento cancelar
    document.querySelector('#modal-editar .btn-cancelar').addEventListener('click', () => {
        document.getElementById('modal-editar').remove();
    });
};

    // Función para buscar equipos
    function buscarEquipos(event) {
        const termino = event.target.value.toLowerCase();
        const resultados = equiposData.filter(equipo => 
            (equipo.Serial && equipo.Serial.toLowerCase().includes(termino)) || 
            (equipo.Modelo && equipo.Modelo.toLowerCase().includes(termino)) ||
            (equipo.UbicacionNombre && equipo.UbicacionNombre.toLowerCase().includes(termino))
        );
        renderizarTabla(resultados);
    }

    // Función auxiliar para formatear fecha
    function formatearFecha(fechaString) {
        if (!fechaString) return 'N/A';
        const opciones = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(fechaString).toLocaleDateString('es-ES', opciones);
    }

    // Función para mostrar notificaciones
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

    function exportarTablaPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });

    // Título personalizado
    doc.setFontSize(16);
    doc.text('Reporte de Equipos GESTOCK', 14, 15);

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

    doc.save('equipos.pdf');
}


    // Cerrar sesión: limpia el usuario y redirige al login
const logoutBtn = document.getElementById('logout-button');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault(); // Evita que el <a> recargue la página antes de limpiar
        localStorage.removeItem('usuario');
        window.location.href = '/index.html';
    });
}
});