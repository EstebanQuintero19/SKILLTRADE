document.addEventListener("DOMContentLoaded", () => {
  const tabla = document.getElementById("tablaIntercambios");
  let filaSeleccionada;

  tabla.addEventListener("click", (e) => {
    const boton = e.target.closest("button");
    if (!boton) return;
    filaSeleccionada = boton.closest("tr");

    const datos = {
      id: filaSeleccionada.cells[0].textContent,
      user1: filaSeleccionada.cells[1].textContent,
      user2: filaSeleccionada.cells[2].textContent,
      solicitado: filaSeleccionada.cells[3].textContent,
      ofrecido: filaSeleccionada.cells[4].textContent,
      estado: filaSeleccionada.cells[5].textContent.trim()
    };

    if (boton.classList.contains("ver")) {
      document.getElementById("infoVer").innerHTML = `
        <p><strong>ID:</strong> ${datos.id}</p>
        <p><strong>Usuario 1:</strong> ${datos.user1}</p>
        <p><strong>Usuario 2:</strong> ${datos.user2}</p>
        <p><strong>Curso Solicitado:</strong> ${datos.solicitado}</p>
        <p><strong>Curso Ofrecido:</strong> ${datos.ofrecido}</p>
        <p><strong>Estado:</strong> ${datos.estado}</p>
      `;
      new bootstrap.Modal(document.getElementById("modalVer")).show();
    }

    if (boton.classList.contains("editar")) {
      document.getElementById("editId").value = datos.id;
      document.getElementById("editUser1").value = datos.user1;
      document.getElementById("editUser2").value = datos.user2;
      document.getElementById("editCursoSolicitado").value = datos.solicitado;
      document.getElementById("editCursoOfrecido").value = datos.ofrecido;
      document.getElementById("editEstado").value = datos.estado;
      new bootstrap.Modal(document.getElementById("modalEditar")).show();
    }

    if (boton.classList.contains("eliminar")) {
      new bootstrap.Modal(document.getElementById("modalEliminar")).show();
    }
  });

  document.getElementById("formEditar").addEventListener("submit", (e) => {
    e.preventDefault();
    filaSeleccionada.cells[1].textContent = document.getElementById("editUser1").value;
    filaSeleccionada.cells[2].textContent = document.getElementById("editUser2").value;
    filaSeleccionada.cells[3].textContent = document.getElementById("editCursoSolicitado").value;
    filaSeleccionada.cells[4].textContent = document.getElementById("editCursoOfrecido").value;
    const estado = document.getElementById("editEstado").value;
    filaSeleccionada.cells[5].innerHTML = `<span class="badge bg-${estado === "Aceptado" ? "success" : estado === "Rechazado" ? "danger" : "warning"} text-dark">${estado}</span>`;
    bootstrap.Modal.getInstance(document.getElementById("modalEditar")).hide();
  });

  document.getElementById("confirmarEliminar").addEventListener("click", () => {
    filaSeleccionada.remove();
    bootstrap.Modal.getInstance(document.getElementById("modalEliminar")).hide();
  });

  document.getElementById("formCrear").addEventListener("submit", (e) => {
    e.preventDefault();

    const tabla = document.getElementById("tablaIntercambios");
    const nuevaFila = tabla.insertRow();
    const nuevaId = tabla.rows.length;

    const user1 = document.getElementById("crearUser1").value;
    const user2 = document.getElementById("crearUser2").value;
    const solicitado = document.getElementById("crearCursoSolicitado").value;
    const ofrecido = document.getElementById("crearCursoOfrecido").value;
    const estado = document.getElementById("crearEstado").value;

    const estadoColor = estado === "Aceptado" ? "success" : estado === "Rechazado" ? "danger" : "warning";

    nuevaFila.innerHTML = `
      <td>${nuevaId}</td>
      <td>${user1}</td>
      <td>${user2}</td>
      <td>${solicitado}</td>
      <td>${ofrecido}</td>
      <td><span class="badge bg-${estadoColor} text-dark">${estado}</span></td>
      <td class="btn-group">
        <button class="btn btn-sm btn-light ver">
          <img src="assets/images/ojo.png" alt="Ver" width="20">
        </button>
        <button class="btn btn-sm btn-light editar">
          <img src="assets/images/lapiz.jpg" alt="Editar" width="20">
        </button>
        <button class="btn btn-sm btn-light eliminar">
          <img src="assets/images/basura.jpg" alt="Eliminar" width="20">
        </button>
      </td>
    `;

    document.getElementById("formCrear").reset();
    bootstrap.Modal.getInstance(document.getElementById("modalCrear")).hide();
  });
});
