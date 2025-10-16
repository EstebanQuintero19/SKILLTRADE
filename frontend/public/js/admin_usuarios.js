function editarUsuario(userId) {
  window.location.href = `/admin/usuario/${userId}/editar`;
}

function eliminarUsuario(userId, userName) {
  if (confirm(`¿Estás seguro de que deseas eliminar al usuario "${userName}"? Esta acción no se puede deshacer.`)) {
    const token = window.sessionData && window.sessionData.token ? window.sessionData.token : '';
    
    fetch(`/api/admin/usuarios/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': token,
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Usuario eliminado exitosamente');
        window.location.reload();
      } else {
        alert('Error al eliminar usuario: ' + (data.message || 'Error desconocido'));
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error al eliminar usuario');
    });
  }
}
