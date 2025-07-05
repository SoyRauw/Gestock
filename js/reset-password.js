document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('resetForm');
    // Autocompletar email si viene en la URL
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    if (email) {
        form.querySelector('input[type="email"]').value = email;
    }
    form.addEventListener('submit', async function(e) {
        // ...tu código existente...
        e.preventDefault();
        const [emailInput, codeInput, passInput] = form.querySelectorAll('input');
        const email = emailInput.value;
        const codigo = codeInput.value;
        const nuevaContrasena = passInput.value;
        try {
            const res = await fetch('http://8wtfdfb8-3000.use2.devtunnels.ms/usuarios/cambiar-contrasena', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, codigo, nuevaContrasena })
            });
            const result = await res.json();
            if (result.success) {
                alert('Contraseña cambiada correctamente. Ahora puedes iniciar sesión.');
                window.location.href = '/index.html';
            } else {
                alert(result.error || 'No se pudo cambiar la contraseña.');
            }
        } catch (err) {
            alert('Error de conexión con el servidor');
        }
    });
});