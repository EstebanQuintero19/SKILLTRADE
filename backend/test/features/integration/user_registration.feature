@integracion @registro-usuario
Característica: Registro de Usuario
  Como nuevo usuario
  Quiero registrarme en el sistema
  Para poder acceder a las funcionalidades de la plataforma

  Antecedentes:
    Dado que la base de datos está limpia

  Escenario: Registro de usuario exitoso
    Cuando envío una solicitud POST a "/api/usuarios/registro" con:
      """
      {
        "nombre": "Usuario de Prueba",
        "email": "usuario@ejemplo.com",
        "password": "ClaveSegura123!",
        "rol": "estudiante"
      }
      """
    Entonces el estado de la respuesta debe ser 201
    Y la respuesta debe contener un mensaje de éxito
    Y la respuesta debe contener un token de acceso
    Y un nuevo usuario debe crearse en la base de datos
    Y el usuario debe tener el rol "estudiante"
    Y el usuario debe estar verificado

  Escenario: Registro con correo electrónico existente
    Dado que existe un usuario con el correo "existente@ejemplo.com"
    Cuando envío una solicitud POST a "/api/usuarios/registro" con:
      """
      {
        "nombre": "Usuario Existente",
        "email": "existente@ejemplo.com",
        "password": "OtraClave123!",
        "rol": "estudiante"
      }
      """
    Entonces el estado de la respuesta debe ser 400
    Y la respuesta debe contener un mensaje de error indicando que el correo ya existe

  Escenario: Registro con contraseña inválida
    Cuando envío una solicitud POST a "/api/usuarios/registro" con:
      """
      {
        "nombre": "Usuario Nuevo",
        "email": "nuevo@ejemplo.com",
        "password": "123",
        "rol": "estudiante"
      }
      """
    Entonces el estado de la respuesta debe ser 400
    Y la respuesta debe contener un mensaje de error sobre la contraseña inválida
