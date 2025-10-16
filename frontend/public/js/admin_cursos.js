function eliminarCurso(cursoId, cursoTitulo) {
  if (confirm(`¿Estás seguro de que deseas eliminar el curso "${cursoTitulo}"? Esta acción no se puede deshacer.`)) {
    const token = window.sessionData && window.sessionData.token ? window.sessionData.token : '';
    
    fetch(`/api/admin/cursos/${cursoId}`, {
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
        alert('Curso eliminado exitosamente');
        window.location.reload();
      } else {
        alert('Error al eliminar curso: ' + (data.message || 'Error desconocido'));
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error al eliminar curso');
    });
  }
}
