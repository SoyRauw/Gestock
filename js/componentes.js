document.addEventListener('DOMContentLoaded', function() {

// Control de acceso por tipo de usuario
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario) {
        window.location.href = 'index.html';
    }

    document.addEventListener('DOMContentLoaded', function() {
        if (usuario.Tipo_usuario !== 'A' && usuario.Tipo_usuario !== 'C') {
            const addBtn = document.querySelector('.add-button');
            if (addBtn) {
                addBtn.disabled = true;
                addBtn.classList.add('disabled-btn');
            }
            // Deshabilita todos los botones de editar y borrar componente
            setTimeout(() => {
                document.querySelectorAll('.edit, .delete').forEach(btn => {
                    btn.disabled = true;
                    btn.classList.add('disabled-btn');
                });
            }, 0);
        }
    });

    let componentesData = [];
    let equiposData = [];
    let usuariosData = [];
    let componenteSeleccionado = null;

    // Inicializar la aplicación
    init();

    function init() {
        cargarComponentes();
        configurarEventos();
    }

    function configurarEventos() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const puedeModificar = usuario && (usuario.Tipo_usuario === 'A' || usuario.Tipo_usuario === 'C');
    const addBtn = document.querySelector('.add-button');
    if (addBtn) {
        if (puedeModificar) {
            addBtn.addEventListener('click', mostrarModalAgregar);
        } else {
            addBtn.disabled = true;
            addBtn.classList.add('disabled-btn'); // Oculta el botón para quienes no pueden modificar
        }
    }
    document.getElementById('search-input').addEventListener('input', buscarComponentes);
    
    const exportBtn = document.querySelector('.export-button');
        if (exportBtn) {
        exportBtn.addEventListener('click', exportarTablaPDF);
    }
}

    // Cargar componentes desde la API
    async function cargarComponentes() {
    try {
        const [componentesRes, equiposRes, usuariosRes] = await Promise.all([
            fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/componentes'),
            fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/computadoras'),
            fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/usuarios')
        ]);
        if (!componentesRes.ok || !equiposRes.ok || !usuariosRes.ok) throw new Error('Error al cargar datos');
        componentesData = await componentesRes.json();
        equiposData = await equiposRes.json();
        usuariosData = await usuariosRes.json();

        // Ordena para que los más nuevos (mayor Id_componente) estén arriba
        componentesData.sort((a, b) => b.Id_componente - a.Id_componente);

        renderizarTabla(componentesData, equiposData, usuariosData);
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar componentes', 'error');
    }
}

function renderizarTabla(data, equipos = [], usuarios = []) {
    const usuarioActual = JSON.parse(localStorage.getItem('usuario'));
    const puedeModificar = usuarioActual && (usuarioActual.Tipo_usuario === 'A' || usuarioActual.Tipo_usuario === 'C');

    const tbody = document.querySelector('#tabla tbody');
    tbody.innerHTML = '';
    data.forEach(componente => {
        const equipo = equipos.find(eq => eq.Id_equipo == componente.Id_equipo);
        const usuario = usuarios.find(u => u.Id_usuario == componente.Id_usuario);

        const estadoClass = componente.Estado ? componente.Estado.toLowerCase().replace(/\s+/g, '-') : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <button class="edit${!puedeModificar ? ' disabled-btn' : ''}" onclick="modificarComponente(${componente.Id_componente})" ${!puedeModificar ? 'disabled' : ''}>Editar</button>
            </td>
            <td>${componente.Tipo || ''}</td>
            <td>${componente.Marca || ''}</td>
            <td>${componente.Modelo || ''}</td>
            <td>${componente.Serial || ''}</td>
            <td>${componente.Capacidad || ''}</td>
            <td><span class="estado-badge ${estadoClass}">${componente.Estado || ''}</span></td>
            <td>${formatearFecha(componente.Fecha_ingreso)}</td>
            <td>${equipo ? equipo.Serial + ' - ' + equipo.Modelo : 'Sin equipo'}</td>
            <td>${usuario ? usuario.Nombre : 'Sin usuario'}</td>
            <td>
                <button class="delete${!puedeModificar ? ' disabled-btn' : ''}" onclick="eliminarComponente(${componente.Id_componente})" ${!puedeModificar ? 'disabled' : ''}>Borrar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

    // Modal para agregar componente
    async function mostrarModalAgregar() {
        try {
            // Cargar equipos y usuarios
            const [equipos, usuarios] = await Promise.all([
                fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/computadoras').then(res => res.json()),
                fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/usuarios').then(res => res.json())
            ]);

            const modalHTML = `
                <div class="modal" id="modal-agregar">
                    <div class="modal-content">
                        <h2>Añadir Componente</h2>
                        <form id="form-agregar">
                            <div class="form-group">
                                <label for="tipo">Tipo:</label>
                                <select id="tipo" name="tipo" required>
                                    <option value="Placa madre">Placa madre</option>
                                    <option value="Procesador">Procesador</option>
                                    <option value="Memoria RAM">Memoria RAM</option>
                                    <option value="Disco duro (HDD)">Disco duro (HDD)</option>
                                    <option value="Unidad de estado sólido (SSD)">Unidad de estado sólido (SSD)</option>
                                    <option value="Fuente de alimentación">Fuente de alimentación</option>
                                    <option value="Tarjeta gráfica (GPU)">Tarjeta gráfica (GPU)</option>
                                    <option value="Teclado">Teclado</option>
                                    <option value="Mouse (ratón)">Mouse (ratón)</option>
                                    <option value="Monitor">Monitor</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="marca">Marca:</label>
                                <input type="text" id="marca" name="marca" required>
                            </div>
                            <div class="form-group">
                                <label for="modelo">Modelo:</label>
                                <input type="text" id="modelo" name="modelo" required>
                            </div>
                            <div class="form-group">
                                <label for="serial">Serial:</label>
                                <input type="text" id="serial" name="serial" required>
                            </div>
                            <div class="form-group">
                                <label for="capacidad">Capacidad:</label>
                                <input type="text" id="capacidad" name="capacidad">
                            </div>
                            <div class="form-group">
                                <label for="estado">Estado:</label>
                                <select id="estado" name="estado" required>
                                    <option value="En uso">En uso</option>
                                    <option value="Disponible">Disponible</option>
                                    <option value="Averiado">Averiado</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="equipo">Equipo:</label>
                                <select id="equipo" name="equipo">
                                    <option value="">Sin equipo</option>
                                    ${equipos.map(eq => `<option value="${eq.Id_equipo}">${eq.Serial} - ${eq.Modelo}</option>`).join('')}
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

            // Actualizar estado según equipo seleccionado
const equipoSelect = document.getElementById('equipo');
const estadoSelect = document.getElementById('estado');

function actualizarEstadoPorEquipo() {
    if (estadoSelect.value === 'Averiado') {
        estadoSelect.querySelectorAll('option').forEach(opt => opt.disabled = false);
        return;
    }
    if (equipoSelect.value) {
        estadoSelect.value = 'En uso';
        estadoSelect.querySelectorAll('option').forEach(opt => {
            opt.disabled = opt.value === 'Disponible';
        });
    } else {
        estadoSelect.value = 'Disponible';
        estadoSelect.querySelectorAll('option').forEach(opt => {
            opt.disabled = opt.value === 'En uso';
        });
    }
}

equipoSelect.addEventListener('change', actualizarEstadoPorEquipo);
estadoSelect.addEventListener('change', actualizarEstadoPorEquipo);
actualizarEstadoPorEquipo();

            document.getElementById('form-agregar').addEventListener('submit', async function(e) {
                e.preventDefault();
                await agregarComponente();
            });
            document.querySelector('#modal-agregar .btn-cancelar').addEventListener('click', () => {
                document.getElementById('modal-agregar').remove();
            });
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al cargar datos necesarios', 'error');
        }
    }

    // Agregar componente
    async function agregarComponente() {
        const form = document.getElementById('form-agregar');
        const formData = new FormData(form);

        const nuevoComponente = {
            Tipo: formData.get('tipo'),
            Marca: formData.get('marca'),
            Modelo: formData.get('modelo'),
            Serial: formData.get('serial'),
            Capacidad: formData.get('capacidad'),
            Estado: formData.get('estado'),
            Id_equipo: formData.get('equipo') || null,
             Id_usuario: usuario ? usuario.Id_usuario : null,
            Fecha_ingreso: new Date().toISOString().split('T')[0]
        };

        try {
            const response = await fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/componentes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoComponente)
            });
            if (!response.ok) throw new Error('Error al agregar componente');
            mostrarNotificacion('Componente agregado correctamente', 'success');
            document.getElementById('modal-agregar').remove();
            await cargarComponentes();
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al agregar componente', 'error');
        }
    }

    // Buscar componentes
    function buscarComponentes(event) {
    const termino = event.target.value.toLowerCase();
    const resultados = componentesData.filter(comp =>
        (comp.Tipo && comp.Tipo.toLowerCase().includes(termino)) ||
        (comp.Marca && comp.Marca.toLowerCase().includes(termino)) ||
        (comp.Modelo && comp.Modelo.toLowerCase().includes(termino)) ||
        (comp.Serial && comp.Serial.toLowerCase().includes(termino))
    );
    renderizarTabla(resultados, equiposData, usuariosData);
}

    // Formatear fecha
    function formatearFecha(fechaString) {
        if (!fechaString) return 'N/A';
        const opciones = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(fechaString).toLocaleDateString('es-ES', opciones);
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

    window.eliminarComponente = async function(id) {
    if (!confirm('¿Está seguro que desea eliminar este componente?')) return;
    try {
        const response = await fetch(`https://8wtfdfb8-3000.use2.devtunnels.ms/componentes/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Error al eliminar componente');
        mostrarNotificacion('Componente eliminado correctamente', 'success');
        await cargarComponentes();
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al eliminar componente', 'error');
    }
};

window.modificarComponente = async function(id) {
    // Busca el componente original
    const componente = componentesData.find(c => String(c.Id_componente) === String(id));
    if (!componente) return mostrarNotificacion('Componente no encontrado', 'error');

    // Carga equipos y usuarios
    const [equipos, usuarios] = await Promise.all([
        fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/computadoras').then(res => res.json()),
        fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/usuarios').then(res => res.json())
    ]);

    // Modal de edición
    const modalHTML = `
        <div class="modal" id="modal-editar">
            <div class="modal-content">
                <h2>Modificar Componente</h2>
                <form id="form-editar-componente">
                    <div class="form-group">
                        <label for="edit-tipo">Tipo:</label>
                        <select id="edit-tipo" name="tipo" required>
                            <option value="Placa madre" ${componente.Tipo === 'Placa madre' ? 'selected' : ''}>Placa madre</option>
                            <option value="Procesador" ${componente.Tipo === 'Procesador' ? 'selected' : ''}>Procesador</option>
                            <option value="Memoria RAM" ${componente.Tipo === 'Memoria RAM' ? 'selected' : ''}>Memoria RAM</option>
                            <option value="Disco duro (HDD)" ${componente.Tipo === 'Disco duro (HDD)' ? 'selected' : ''}>Disco duro (HDD)</option>
                            <option value="Unidad de estado sólido (SSD)" ${componente.Tipo === 'Unidad de estado sólido (SSD)' ? 'selected' : ''}>Unidad de estado sólido (SSD)</option>
                            <option value="Fuente de alimentación" ${componente.Tipo === 'Fuente de alimentación' ? 'selected' : ''}>Fuente de alimentación</option>
                            <option value="Tarjeta gráfica (GPU)" ${componente.Tipo === 'Tarjeta gráfica (GPU)' ? 'selected' : ''}>Tarjeta gráfica (GPU)</option>
                            <option value="Teclado" ${componente.Tipo === 'Teclado' ? 'selected' : ''}>Teclado</option>
                            <option value="Mouse (ratón)" ${componente.Tipo === 'Mouse (ratón)' ? 'selected' : ''}>Mouse (ratón)</option>
                            <option value="Monitor" ${componente.Tipo === 'Monitor' ? 'selected' : ''}>Monitor</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-marca">Marca:</label>
                        <input type="text" id="edit-marca" name="marca" value="${componente.Marca || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-modelo">Modelo:</label>
                        <input type="text" id="edit-modelo" name="modelo" value="${componente.Modelo || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-serial">Serial:</label>
                        <input type="text" id="edit-serial" name="serial" value="${componente.Serial || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-capacidad">Capacidad:</label>
                        <input type="text" id="edit-capacidad" name="capacidad" value="${componente.Capacidad || ''}">
                    </div>
                    <div class="form-group">
                        <label for="edit-estado">Estado:</label>
                        <select id="edit-estado" name="estado" required>
                            <option value="En uso" ${componente.Estado === 'En uso' ? 'selected' : ''}>En uso</option>
                            <option value="Disponible" ${componente.Estado === 'Disponible' ? 'selected' : ''}>Disponible</option>
                            <option value="Averiado" ${componente.Estado === 'Averiado' ? 'selected' : ''}>Averiado</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-equipo">Equipo:</label>
                        <select id="edit-equipo" name="equipo">
                            <option value="">Sin equipo</option>
                            ${equipos.map(eq => 
                                `<option value="${eq.Id_equipo}" ${String(eq.Id_equipo) === String(componente.Id_equipo) ? 'selected' : ''}>${eq.Serial} - ${eq.Modelo}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-usuario">Usuario:</label>
                        <select id="edit-usuario" name="usuario">
                            <option value="">Sin usuario</option>
                            ${usuarios.map(u => 
                                `<option value="${u.Id_usuario}" ${String(u.Id_usuario) === String(componente.Id_usuario) ? 'selected' : ''}>${u.Nombre}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-fecha">Fecha de Ingreso:</label>
                        <input type="text" id="edit-fecha" value="${formatearFecha(componente.Fecha_ingreso)}" readonly>
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

    // Actualizar estado según equipo seleccionado en el modal de edición
    const equipoEdit = document.getElementById('edit-equipo');
const estadoEdit = document.getElementById('edit-estado');

function actualizarEstadoPorEquipoEditar() {
    if (estadoEdit.value === 'Averiado') {
        estadoEdit.querySelectorAll('option').forEach(opt => opt.disabled = false);
        return;
    }
    if (equipoEdit.value) {
        estadoEdit.value = 'En uso';
        estadoEdit.querySelectorAll('option').forEach(opt => {
            opt.disabled = opt.value === 'Disponible';
        });
    } else {
        estadoEdit.value = 'Disponible';
        estadoEdit.querySelectorAll('option').forEach(opt => {
            opt.disabled = opt.value === 'En uso';
        });
    }
}

equipoEdit.addEventListener('change', actualizarEstadoPorEquipoEditar);
estadoEdit.addEventListener('change', actualizarEstadoPorEquipoEditar);
actualizarEstadoPorEquipoEditar();

    // Evento guardar
    document.getElementById('form-editar-componente').addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const componenteActualizado = {
            Tipo: formData.get('tipo'),
            Marca: formData.get('marca'),
            Modelo: formData.get('modelo'),
            Serial: formData.get('serial'),
            Capacidad: formData.get('capacidad'),
            Estado: formData.get('estado'),
            Id_equipo: formData.get('equipo') || null,
            Id_usuario: formData.get('usuario') || null
            // No se modifica Fecha_ingreso
        };

        try {
            const response = await fetch(`https://8wtfdfb8-3000.use2.devtunnels.ms/componentes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(componenteActualizado)
            });
            if (!response.ok) throw new Error('Error al modificar componente');
            mostrarNotificacion('Componente modificado correctamente', 'success');
            document.getElementById('modal-editar').remove();
            await cargarComponentes();
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al modificar componente', 'error');
        }
    });

    // Evento cancelar
    document.querySelector('#modal-editar .btn-cancelar').addEventListener('click', () => {
        document.getElementById('modal-editar').remove();
    });
};

function exportarTablaPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(16);
    doc.text('Reporte de Componentes GESTOCK', 14, 15);

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

    // Ajusta el ancho de la columna "Usuario" (ajusta el índice según tu tabla)
    doc.autoTable({
        startY: 28,
        head: [headers],
        body: data,
        styles: { fontSize: 10, cellPadding: 2, cellWidth: 'auto' },
        headStyles: { fillColor: [9, 132, 227], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 248, 255] }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
    }

    doc.save('Componentes.pdf');
}

// Cerrar sesión: limpia el usuario y redirige al login
const logoutBtn = document.getElementById('logout-button');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault(); // Evita que el <a> recargue la página antes de limpiar
        localStorage.removeItem('usuario');
        window.location.href = 'index.html';
    });
}
});
