document.addEventListener('DOMContentLoaded', function() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario) {
        window.location.href = '/index.html';
        return;
    }

    document.querySelector('input[placeholder="Ingrese su cédula"]').value = usuario.Cedula || '';
    const selects = document.querySelectorAll('select.form-select');
    if (selects[0]) selects[0].value = usuario.Nacionalidad || '';
    if (selects[1]) selects[1].value = usuario.Tipo_usuario || '';
    document.querySelector('input[placeholder="Ingrese su correo"][type="full-name"]').value = usuario.Nombre || '';
    document.querySelector('input[placeholder="Ingrese su correo"][type="username"]').value = usuario.Username || '';
    document.querySelector('input[placeholder="Ingrese su correo"][type="email"]').value = usuario.Correo || '';

    // Evento para el botón Editar Perfil
    document.querySelector('.edit-button').addEventListener('click', async function(e) {
        e.preventDefault();

        const password = document.querySelector('input[placeholder="Ingrese su contraseña"]').value;
        const confirmPassword = document.querySelector('input[placeholder="Confirme su contraseña"]').value;

        if (!password || !confirmPassword) {
            alert('Debes ingresar y confirmar tu contraseña para guardar los cambios.');
            return;
        }
        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        // Recolecta los demás datos del formulario
        const cedula = document.querySelector('input[placeholder="Ingrese su cédula"]').value;
        const nacionalidad = selects[0].value;
        const nombre = document.querySelector('input[placeholder="Ingrese su correo"][type="full-name"]').value;
        const username = document.querySelector('input[placeholder="Ingrese su correo"][type="username"]').value;
        const correo = document.querySelector('input[placeholder="Ingrese su correo"][type="email"]').value;

        // Envía los datos al backend para validar la contraseña y actualizar el perfil
        try {
            const res = await fetch('http://8wtfdfb8-3000.use2.devtunnels.ms/usuarios/actualizar-perfil', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: usuario.Id_usuario,
                    cedula,
                    nacionalidad,
                    nombre,
                    username,
                    correo,
                    password // La contraseña para validar
                })
            });
            const result = await res.json();
            if (result.success) {
                alert('Perfil actualizado correctamente.');
                // Actualiza localStorage si es necesario
            } else {
                alert(result.error || 'No se pudo actualizar el perfil.');
            }
        } catch (err) {
            alert('Error de conexión con el servidor');
        }
    });

    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Evita que el <a> recargue la página antes de limpiar
            localStorage.removeItem('usuario');
            window.location.href = '/index.html';
        });
    }

});