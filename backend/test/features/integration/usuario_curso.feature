@integracion @usuario-curso
Característica: Integración Usuario y Curso
  Como usuario registrado
  Quiero crear un curso
  Para compartir mis conocimientos

  Escenario: Usuario crea un curso exitosamente
    Dado que existe un usuario con el correo "instructor@ejemplo.com"
    Y el usuario ha iniciado sesión
    Cuando envía una solicitud POST a "/api/cursos" con:
      """
      {
        "titulo": "Introducción a Node.js",
        "descripcion": "Aprende Node.js desde cero",
        "precio": 29.99,
        "categoria": "Programación"
      }
      """
    Entonces el estado de la respuesta debe ser 201
    Y la respuesta debe contener un mensaje de éxito
    Y el curso debe estar asociado al usuario en la base de datos
