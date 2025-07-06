document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = form.querySelector('input[type="email"]').value;
        try {
            const res = await fetch('https://8wtfdfb8-3000.use2.devtunnels.ms/usuarios/recuperar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const result = await res.json();
            if (result.success) {
                alert('Se ha enviado un código de recuperación a tu correo.');
                // Redirige a reset-password.html y pasa el email por querystring
                window.location.href = `reset-password.html?email=${encodeURIComponent(email)}`;
            } else {
                alert(result.error || 'No se pudo enviar el correo.');
            }
        } catch (err) {
            alert('Error de conexión con el servidor');
        }
    });
});
