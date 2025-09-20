@unidad @validacion
Característica: Validación de Contraseña
  Como usuario
  Quiero que mi contraseña sea validada
  Para asegurar que cumpla con los requisitos de seguridad

  Escenario: Validar una contraseña segura
    Dado una contraseña válida
    Cuando valido la contraseña
    Entonces la validación debe ser "true"

  Escenario: Rechazar contraseña con menos de 8 caracteres
    Dado una contraseña con menos de 8 caracteres
    Cuando valido la contraseña
    Entonces la validación debe ser "false"
    Y debo ver el mensaje de error "al menos 8 caracteres"

  Escenario: Rechazar contraseña sin mayúsculas
    Dado una contraseña sin mayúsculas
    Cuando valido la contraseña
    Entonces la validación debe ser "false"
    Y debo ver el mensaje de error "mayúscula"

  Escenario: Rechazar contraseña sin minúsculas
    Dado una contraseña sin minúsculas
    Cuando valido la contraseña
    Entonces la validación debe ser "false"
    Y debo ver el mensaje de error "minúscula"

  Escenario: Rechazar contraseña sin números
    Dado una contraseña sin números
    Cuando valido la contraseña
    Entonces la validación debe ser "false"
    Y debo ver el mensaje de error "número"

  Escenario: Rechazar contraseña sin caracteres especiales
    Dado una contraseña sin caracteres especiales
    Cuando valido la contraseña
    Entonces la validación debe ser "false"
    Y debo ver el mensaje de error "carácter especial"

  Ejemplos: Pruebas adicionales de validación
    | contraseña      | resultado | mensaje_esperado                     |
    | "A1b2!c3"       | "false"   | "al menos 8 caracteres"              |
    | "contraseña123" | "false"   | "mayúscula"                         |
    | "CONTRASEÑA123" | "false"   | "minúscula"                         |
    | "Contraseña!"   | "false"   | "número"                            |
    | "Contraseña123" | "false"   | "carácter especial"                 |
    | "Contraseña123!"| "true"    | ""                                  |

  Escenario Outline: Validación de múltiples casos de prueba
    Dado una instancia del validador de contraseñas
    Cuando valido la contraseña "<contraseña>"
    Entonces la validación debe ser "<resultado>"
    Y si el resultado es falso, debo ver un mensaje de error que contenga "<mensaje_esperado>"

    Ejemplos:
      | contraseña      | resultado | mensaje_esperado     |
      | "A1b2!c3"       | "false"   | "al menos 8"         |
      | "contraseña123" | "false"   | "mayúscula"          |
      | "CONTRASEÑA123" | "false"   | "minúscula"          |
      | "Contraseña!"   | "false"   | "número"             |
      | "Contraseña123" | "false"   | "carácter especial"  |
      | "Contraseña123!"| "true"    | ""                   |
    Entonces la validación debe ser "false"
