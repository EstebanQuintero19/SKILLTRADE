document.getElementById("formCrearCurso").addEventListener("submit", function (e) {
e.preventDefault();

const imagenInput = document.getElementById("imagenCurso");
const titulo = document.getElementById("tituloCurso").value;
const categoria = document.getElementById("categoriaCurso").value;
const descripcion = document.getElementById("descripcionCurso").value;

if (!imagenInput.files.length) {
    alert("Por favor sube una imagen.");
    return;
}

const reader = new FileReader();
reader.onload = function (event) {
    const imageUrl = event.target.result;

    const nuevoCurso = document.createElement("div");
    nuevoCurso.className = "col-md-4";
    nuevoCurso.innerHTML = `
    <div class="card text-dark">
        <img src="${imageUrl}" class="card-img-top" alt="${titulo}">
        <div class="card-body">
        <h5 class="card-title fw-bold">${titulo}</h5>
        <span class="badge bg-secondary mb-2">${categoria}</span>
        <p class="card-text">${descripcion}</p>
        <button class="btn btn-purple w-100 mt-2">agregar sesión</button>
        </div>
    </div>
    `;

    document.getElementById("cursosContainer").prepend(nuevoCurso);
    document.getElementById("formCrearCurso").reset();
    bootstrap.Modal.getInstance(document.getElementById("crearCursoModal")).hide();
};

reader.readAsDataURL(imagenInput.files[0]);
});
