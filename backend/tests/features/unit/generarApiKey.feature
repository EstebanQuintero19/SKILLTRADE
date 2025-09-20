Feature: Generación de API Key
  Como desarrollador
  Quiero probar la función generarApiKey
  Para asegurarme de que genera claves únicas y seguras

  @unit
  Scenario: Generar una API Key válida
    Given que tengo acceso a la función generarApiKey
    When genero una nueva API Key
    Then la API Key debe tener 64 caracteres hexadecimales
    And la API Key debe ser única

  @unit
  Scenario: Generar múltiples API Keys únicas
    Given que tengo acceso a la función generarApiKey
    When genero 10 API Keys diferentes
    Then todas las API Keys deben ser únicas
    And todas deben tener 64 caracteres hexadecimales
