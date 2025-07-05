export async function cargarNotificaciones() {
    try {
        const response = await fetch('http://8wtfdfb8-3000.use2.devtunnels.ms/notificacion');
        if (!response.ok) throw new Error('Error al cargar notificaciones');
        const notificaciones = await response.json();
        renderizarNotificaciones(notificaciones);
    } catch (error) {
        console.error('Error:', error);
    }
}

export function renderizarNotificaciones(notificaciones) {
    const lista = document.querySelector('.notificaciones-lista');
    if (!lista) return;
    lista.innerHTML = '';

    // Ordena: no leídas primero, luego por fecha descendente
    notificaciones.sort((a, b) => {
        const aNoLeida = a.Estado === 'No leído' || a.Estado === 'No leido';
        const bNoLeida = b.Estado === 'No leído' || b.Estado === 'No leido';
        if (aNoLeida !== bNoLeida) {
            return bNoLeida - aNoLeida; // No leídas primero
        }
        // Más recientes primero
        const fechaA = a.Fecha_envio ? new Date(a.Fecha_envio) : new Date(0);
        const fechaB = b.Fecha_envio ? new Date(b.Fecha_envio) : new Date(0);
        return fechaB - fechaA;
    });

    notificaciones.forEach(n => {
        const fecha = n.Fecha_envio ? new Date(n.Fecha_envio).toLocaleString('es-ES') : '';
        const mantenimiento = n.MantenimientoDescripcion ? `Mantenimiento: ${n.MantenimientoDescripcion}` : '';
        const equipo = n.EquipoSerial ? `Equipo: ${n.EquipoSerial}${n.EquipoModelo ? ' (' + n.EquipoModelo + ')' : ''}` : '';
        const usuario = n.UsuarioNombre ? `Usuario: ${n.UsuarioNombre}` : '';
        const estadoClass = (n.Estado || '').toLowerCase().replace(/\s+/g, '-');
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <strong>${n.Mensaje || 'Notificación'}</strong>
                <span class="estado-badge ${estadoClass}">${n.Estado || ''}</span>
            </div>
            <small>${fecha}</small>
            <small>${mantenimiento}</small>
            <small>${equipo}</small>
            <small>${usuario}</small>
        `;
        if (n.Estado === 'No leido' || n.Estado === 'No leído') {
            li.style.fontWeight = 'bold';
        }
        li.style.cursor = 'pointer';
        li.addEventListener('click', async () => {
            if (n.Estado === 'Leído' || n.Estado === 'Leido') return;
            try {
                await fetch(`http://8wtfdfb8-3000.use2.devtunnels.ms/notificacion/${n.Id_notificacion}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ Estado: 'Leído' })
                });
                cargarNotificaciones();
            } catch (error) {
                console.error('Error al marcar como leída:', error);
            }
        });
        lista.appendChild(li);
    });
}