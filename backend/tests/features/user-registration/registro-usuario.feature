Feature: Registro de Usuario Nuevo
  Como usuario de SkillTrade
  Quiero poder registrarme en la plataforma
  Para acceder a los cursos y funcionalidades del sistema

  @user-registration
  Scenario: Registro exitoso de usuario nuevo
    Given que estoy en la página de registro
    And no existe un usuario con email "nuevo@usuario.com"
    When envío una solicitud de registro con:
      | campo     | valor           |
      | email     | nuevo@usuario.com |
      | nombre    | Usuario Nuevo   |
      | password  | password123     |
      | biografia | Soy nuevo aquí  |
      | telefono  | +1234567890     |
    Then debo recibir una respuesta exitosa con código 201
    And la respuesta debe contener el mensaje "Usuario registrado exitosamente"
    And debo recibir los datos del usuario creado
    And el usuario debe tener un API Key generado
    And debe existir una biblioteca asociada al usuario

  @user-registration
  Scenario: Error al registrar usuario con email duplicado
    Given que ya existe un usuario con email "existente@test.com"
    When envío una solicitud de registro con:
      | campo     | valor              |
      | email     | existente@test.com |
      | nombre    | Usuario Duplicado  |
      | password  | password123        |
    Then debo recibir un error con código 400
    And la respuesta debe contener el mensaje "El email ya está registrado"

  @user-registration
  Scenario: Error al registrar usuario con datos faltantes
    Given que estoy en la página de registro
    When envío una solicitud de registro con:
      | campo     | valor |
      | email     |       |
      | nombre    |       |
      | password  |       |
    Then debo recibir un error con código 400
    And la respuesta debe contener el mensaje "Email, nombre y password son requeridos"

  @user-registration
  Scenario: Validación de formato de email
    Given que estoy en la página de registro
    When envío una solicitud de registro con:
      | campo     | valor              |
      | email     | email-invalido     |
      | nombre    | Usuario Test       |
      | password  | password123        |
    Then debo recibir un error con código 400
    And la respuesta debe indicar formato de email inválido
