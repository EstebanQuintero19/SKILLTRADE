// Preview de imagen
document.getElementById('imagen').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('previewImg').src = e.target.result;
      document.getElementById('fileName').textContent = file.name;
      document.getElementById('imagePreview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }
});

// Manejo del formulario
document.getElementById('crearCursoForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const submitBtn = this.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creando curso...';
  submitBtn.disabled = true;
  
  try {
    const response = await fetch('/api/cursos', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      alert('¡Curso creado exitosamente!');
      window.location.href = '/cursos';
    } else {
      console.error('Error response:', response.status, result);
      throw new Error(result.message || result.error || `Error ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error completo:', error);
    alert('Error al crear el curso: ' + error.message);
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
});

// Validación en tiempo real
document.getElementById('titulo').addEventListener('input', function() {
  if (this.value.length > 100) {
    this.setCustomValidity('El título no puede exceder 100 caracteres');
  } else {
    this.setCustomValidity('');
  }
});

document.getElementById('descripcion').addEventListener('input', function() {
  if (this.value.length > 1000) {
    this.setCustomValidity('La descripción no puede exceder 1000 caracteres');
  } else {
    this.setCustomValidity('');
  }
});

// Validación del precio
document.getElementById('precio').addEventListener('input', function() {
  const precio = parseFloat(this.value);
  if (precio > 100000) {
    this.setCustomValidity('El precio máximo es $100,000');
  } else if (precio < 0) {
    this.setCustomValidity('El precio no puede ser negativo');
  } else {
    this.setCustomValidity('');
  }
});
