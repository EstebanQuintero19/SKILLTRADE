Feature: Integración Usuario-Biblioteca
  Como desarrollador
  Quiero probar la integración entre los módulos Usuario y Biblioteca
  Para asegurarme de que cuando se crea un usuario, se crea automáticamente su biblioteca

  @integration
  Scenario: Crear usuario y biblioteca automáticamente
    Given que no existe ningún usuario en el sistema
    When registro un nuevo usuario con email "test@example.com" y nombre "Usuario Test"
    Then el usuario debe ser creado exitosamente
    And debe existir una biblioteca asociada al usuario
    And la biblioteca debe estar inicializada con arrays vacíos

  @integration
  Scenario: Verificar datos de biblioteca después del registro
    Given que no existe ningún usuario en el sistema
    When registro un nuevo usuario con email "biblioteca@test.com" y nombre "Test Biblioteca"
    Then el usuario debe tener un ID válido
    And la biblioteca debe tener el mismo ID de usuario
    And la biblioteca debe tener cursos vacío
    And la biblioteca debe tener favoritos vacío
    And la biblioteca debe tener logros vacío
    And la biblioteca debe tener fecha de última actividad
