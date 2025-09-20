# Pruebas con Cucumber - SkillTrade

Este directorio contiene las pruebas automatizadas usando Cucumber para la aplicación SkillTrade.

## Estructura de Pruebas

```
tests/
├── features/
│   ├── unit/                    # Pruebas unitarias
│   │   └── generarApiKey.feature
│   ├── integration/              # Pruebas de integración
│   │   └── usuario-biblioteca.feature
│   └── user-registration/       # Pruebas de registro de usuario
│       └── registro-usuario.feature
├── step_definitions/            # Definiciones de pasos
│   ├── generarApiKey.steps.js
│   ├── usuario-biblioteca.steps.js
│   └── registro-usuario.steps.js
└── support/                     # Configuración y hooks
    └── hooks.js
```

## Tipos de Pruebas Implementadas

### 1. Prueba Unitaria (@unit)
**Archivo:** `tests/features/unit/generarApiKey.feature`

Prueba la función `generarApiKey()` que genera claves API únicas:
- Verifica que genera claves de 64 caracteres hexadecimales
- Confirma que cada clave es única
- Valida el formato hexadecimal

### 2. Prueba de Integración (@integration)
**Archivo:** `tests/features/integration/usuario-biblioteca.feature`

Prueba la integración entre los módulos Usuario y Biblioteca:
- Verifica que al crear un usuario se crea automáticamente su biblioteca
- Confirma que la biblioteca se inicializa correctamente
- Valida la asociación entre usuario y biblioteca

### 3. Prueba de Registro de Usuario (@user-registration)
**Archivo:** `tests/features/user-registration/registro-usuario.feature`

Prueba el flujo completo de registro de usuario:
- Registro exitoso con datos válidos
- Manejo de errores por email duplicado
- Validación de campos requeridos
- Validación de formato de email

## Comandos para Ejecutar Pruebas

### Instalar dependencias
```bash
npm install
```

### Ejecutar todas las pruebas
```bash
npm test
```

### Ejecutar pruebas específicas
```bash
# Solo pruebas unitarias
npm run test:unit

# Solo pruebas de integración
npm run test:integration

# Solo pruebas de registro de usuario
npm run test:user-registration
```

## Configuración

Las pruebas utilizan:
- **MongoDB Memory Server**: Base de datos en memoria para pruebas
- **Supertest**: Para probar endpoints HTTP
- **Chai**: Para aserciones
- **Cucumber**: Para BDD (Behavior Driven Development)

## Tags Disponibles

- `@unit`: Pruebas unitarias
- `@integration`: Pruebas de integración
- `@user-registration`: Pruebas de registro de usuario
- `@skip`: Pruebas que se saltan temporalmente

## Reportes

Los reportes se generan en:
- `reports/cucumber_report.json`: Reporte en formato JSON
- `reports/cucumber_report.html`: Reporte en formato HTML

## Ejemplos de Uso

### Ejecutar una prueba específica por tag
```bash
npx cucumber-js --grep "@unit"
```

### Ejecutar con formato específico
```bash
npx cucumber-js --format progress
```

### Ejecutar con configuración personalizada
```bash
npx cucumber-js --config cucumber.js
```
