document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const data = {
            usuario: form.usuario.value,
            contrasena: form.contrasena.value
        };
        try {
            const res = await fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/usuarios/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                // Puedes guardar el usuario en localStorage/sessionStorage si quieres
                localStorage.setItem('usuario', JSON.stringify(result.usuario));
                window.location.href = 'equipos.html';
            } else {
                alert(result.error || 'Usuario o contraseña incorrectos');
            }
        } catch (err) {
            alert('Error de conexión con el servidor');
        }
    });
});
