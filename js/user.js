document.addEventListener('DOMContentLoaded', function() {

    // Control de acceso por tipo de usuario
const usuario = JSON.parse(localStorage.getItem('usuario'));
if (!usuario) {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', function() {
    if (usuario.Tipo_usuario !== 'A') {
        const addBtn = document.querySelector('.add-button');
        if (addBtn) {
            addBtn.disabled = true;
            addBtn.classList.add('disabled-btn');
        }
        // Deshabilita todos los botones de editar y borrar usuario
        setTimeout(() => {
            document.querySelectorAll('.edit-user, .delete-user').forEach(btn => {
                btn.disabled = true;
                btn.classList.add('disabled-btn');
            });
        }, 0);
    }
});

    let usuariosData = [];
    let usuarioSeleccionado = null;

    init();

    function init() {
        cargarUsuarios();
        configurarEventos();
    }

    function configurarEventos() {
    if (usuario.Tipo_usuario === 'A') {
        document.querySelector('.add-button').addEventListener('click', mostrarModalAgregarUsuario);
    }
    document.getElementById('search-input').addEventListener('input', buscarUsuarios);
}

    // Cargar usuarios desde la API
    async function cargarUsuarios() {
        try {
            const response = await fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/usuarios');
            if (!response.ok) throw new Error('Error al cargar usuarios');
            usuariosData = await response.json();
            renderizarTablaUsuarios(usuariosData);
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al cargar usuarios', 'error');
        }
    }

// Renderizar tabla de usuarios
function renderizarTablaUsuarios(data) {
    const tbody = document.querySelector('#tabla tbody');
    tbody.innerHTML = '';
    data.forEach(usuarioFila => {
        const tr = document.createElement('tr');
        tr.dataset.id = usuarioFila.Id_usuario;
        tr.innerHTML = `
            <td>
                <button class="edit-user${usuario.Tipo_usuario !== 'A' ? ' disabled-btn' : ''}" data-id="${usuarioFila.Id_usuario}" ${usuario.Tipo_usuario !== 'A' ? 'disabled' : ''}>Editar</button>
            </td>
            <td>${usuarioFila.Cedula || ''}</td>
            <td>${usuarioFila.Nacionalidad || ''}</td>
            <td>${usuarioFila.Username || ''}</td>
            <td>${usuarioFila.Nombre || ''}</td>
            <td>${usuarioFila.Correo || ''}</td>
            <td>${usuarioFila.Tipo_usuario || ''}</td>
            <td>
                <button class="delete-user${usuario.Tipo_usuario !== 'A' ? ' disabled-btn' : ''}" data-id="${usuarioFila.Id_usuario}" ${usuario.Tipo_usuario !== 'A' ? 'disabled' : ''}>Borrar</button>
            </td>
        `;
        tbody.appendChild(tr);

        // Botón editar solo para admin
        if (usuario.Tipo_usuario === 'A') {
            const editBtn = tr.querySelector('.edit-user');
            if (editBtn) {
                editBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    mostrarModalEditarUsuario(usuarioFila);
                });
            }
        }

        // Solo agrega el evento de borrar si es admin y el botón existe
        if (usuario.Tipo_usuario === 'A') {
            const deleteBtn = tr.querySelector('.delete-user');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    eliminarUsuario(usuarioFila.Id_usuario);
                });
            }
        }
    });
}

    // Mostrar modal para agregar usuario
function mostrarModalAgregarUsuario() {
    const modalHTML = `
        <div class="modal" id="modal-agregar-usuario">
            <div class="modal-content">
                <h2>Añadir Nuevo Usuario</h2>
                <form id="form-agregar-usuario">
                    <div class="form-group">
                        <label for="cedula">Cédula:</label>
                        <input type="text" id="cedula" name="Cedula" required>
                    </div>
                    <div class="form-group">
                        <label for="nacionalidad">Nacionalidad:</label>
                        <select id="nacionalidad" name="Nacionalidad" required>
                            <option value="V">Venezolano</option>
                            <option value="E">Extranjero</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="username">Username:</label>
                        <input type="text" id="username" name="Username">
                    </div>
                    <div class="form-group">
                        <label for="nombre">Nombre completo:</label>
                        <input type="text" id="nombre" name="Nombre" required>
                    </div>
                    <div class="form-group">
                        <label for="correo">Correo:</label>
                        <input type="email" id="correo" name="Correo">
                    </div>
                    <div class="form-group">
                        <label for="contrasena">Contraseña:</label>
                        <input type="password" id="contrasena" name="Contrasena" required>
                    </div>
                    <div class="form-group">
                        <label for="tipo_usuario">Rol:</label>
                        <select id="tipo_usuario" name="Tipo_usuario" required>
                            <option value="A">Administrador</option>
                            <option value="C">Coordinador</option>
                            <option value="M">Personal de mantenimiento</option>
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

    document.getElementById('form-agregar-usuario').addEventListener('submit', async function(e) {
        e.preventDefault();
        await agregarUsuario();
    });

    document.querySelector('#modal-agregar-usuario .btn-cancelar').addEventListener('click', () => {
        document.getElementById('modal-agregar-usuario').remove();
    });
}


async function agregarUsuario() {
    const form = document.getElementById('form-agregar-usuario');
    const formData = new FormData(form);
    const nuevoUsuario = {
        Cedula: formData.get('Cedula'),
        Nacionalidad: formData.get('Nacionalidad'),
        Username: formData.get('Username'),
        Nombre: formData.get('Nombre'),
        Correo: formData.get('Correo'),
        "Contraseña": formData.get('Contrasena'), // <-- clave con ñ, valor del input sin ñ
        Tipo_usuario: formData.get('Tipo_usuario')
};
    try {
        const response = await fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoUsuario)
        });
        if (!response.ok) throw new Error('Error al agregar usuario');
        mostrarNotificacion('Usuario agregado correctamente', 'success');
        document.getElementById('modal-agregar-usuario').remove();
        await cargarUsuarios();
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al agregar usuario', 'error');
    }
}

    // Eliminar usuario
    async function eliminarUsuario(id) {
        if (!confirm('¿Está seguro que desea eliminar este usuario?')) return;
        try {
            const response = await fetch(`https://8wtfdfb8-3000.use2.devtunnels.ms/usuarios/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Error al eliminar usuario');
            mostrarNotificacion('Usuario eliminado correctamente', 'success');
            await cargarUsuarios();
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al eliminar usuario', 'error');
        }
    }

    // Buscar usuarios
    function buscarUsuarios(event) {
    const termino = event.target.value.toLowerCase();
    const resultados = usuariosData.filter(usuario =>
        (usuario.Cedula && usuario.Cedula.toLowerCase().includes(termino)) ||
        (usuario.Nombre && usuario.Nombre.toLowerCase().includes(termino)) ||
        (usuario.Username && usuario.Username.toLowerCase().includes(termino)) ||
        (usuario.Correo && usuario.Correo.toLowerCase().includes(termino)) ||
        (usuario.Tipo_usuario && usuario.Tipo_usuario.toLowerCase().includes(termino))
    );
    renderizarTablaUsuarios(resultados);
}

// Mostrar modal para editar usuario (solo admin)
function mostrarModalEditarUsuario(usuarioFila) {
    const modalHTML = `
        <div class="modal" id="modal-editar-usuario">
            <div class="modal-content">
                <h2>Editar Usuario</h2>
                <form id="form-editar-usuario">
                    <div class="form-group">
                        <label for="edit-cedula">Cédula:</label>
                        <input type="text" id="edit-cedula" name="Cedula" value="${usuarioFila.Cedula || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-nacionalidad">Nacionalidad:</label>
                        <select id="edit-nacionalidad" name="Nacionalidad" required>
                            <option value="V" ${usuarioFila.Nacionalidad === 'V' ? 'selected' : ''}>Venezolano</option>
                            <option value="E" ${usuarioFila.Nacionalidad === 'E' ? 'selected' : ''}>Extranjero</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-username">Username:</label>
                        <input type="text" id="edit-username" name="Username" value="${usuarioFila.Username || ''}">
                    </div>
                    <div class="form-group">
                        <label for="edit-nombre">Nombre completo:</label>
                        <input type="text" id="edit-nombre" name="Nombre" value="${usuarioFila.Nombre || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-correo">Correo:</label>
                        <input type="email" id="edit-correo" name="Correo" value="${usuarioFila.Correo || ''}">
                    </div>
                    <div class="form-group">
                        <label for="edit-tipo_usuario">Rol:</label>
                        <select id="edit-tipo_usuario" name="Tipo_usuario" required>
                            <option value="A" ${usuarioFila.Tipo_usuario === 'A' ? 'selected' : ''}>Administrador</option>
                            <option value="C" ${usuarioFila.Tipo_usuario === 'C' ? 'selected' : ''}>Coordinador</option>
                            <option value="M" ${usuarioFila.Tipo_usuario === 'M' ? 'selected' : ''}>Personal de mantenimiento</option>
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

    document.getElementById('form-editar-usuario').addEventListener('submit', async function(e) {
        e.preventDefault();
        await editarUsuario(usuarioFila.Id_usuario);
    });

    document.querySelector('#modal-editar-usuario .btn-cancelar').addEventListener('click', () => {
        document.getElementById('modal-editar-usuario').remove();
    });
}

// Editar usuario (solo admin)
async function editarUsuario(id) {
    const form = document.getElementById('form-editar-usuario');
    const formData = new FormData(form);
    const usuarioActualizado = {
        Cedula: formData.get('Cedula'),
        Nacionalidad: formData.get('Nacionalidad'),
        Username: formData.get('Username'),
        Nombre: formData.get('Nombre'),
        Correo: formData.get('Correo'),
        Tipo_usuario: formData.get('Tipo_usuario')
    };
    try {
        const response = await fetch(`https://8wtfdfb8-3000.use2.devtunnels.ms/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(usuarioActualizado)
        });
        if (!response.ok) throw new Error('Error al editar usuario');
        mostrarNotificacion('Usuario editado correctamente', 'success');
        document.getElementById('modal-editar-usuario').remove();
        await cargarUsuarios();
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al editar usuario', 'error');
    }
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
    // Cerrar sesión
    const logoutBtn = document.getElementById('logout-button'); 
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Evita que el <a> recargue la página antes de limpiar
            localStorage.removeItem('usuario');
            window.location.href = 'index.html';
        });
    }
    
});
