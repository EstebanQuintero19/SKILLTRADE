# 🚀 SKILLTRADE Backend API

Backend de la aplicación SkillTrade, una plataforma de intercambio de habilidades y cursos online construida con Node.js, Express y MongoDB.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Modelos de Datos](#-modelos-de-datos)
- [Autenticación](#-autenticación)
- [Validaciones](#-validaciones)
- [Middleware](#-middleware)
- [Base de Datos](#-base-de-datos)
- [Variables de Entorno](#-variables-de-entorno)
- [Scripts](#-scripts)
- [Despliegue](#-despliegue)
- [Contribución](#-contribución)

## ✨ Características

- **API RESTful** completa con Express.js
- **Autenticación JWT** segura
- **Base de datos MongoDB** con Mongoose ODM
- **Validaciones robustas** en todos los modelos
- **Middleware de seguridad** (CORS, Helmet, Rate Limiting)
- **Sistema de roles** (admin, usuario)
- **Manejo de archivos** y multimedia
- **Logging** con Morgan
- **Validación de datos** con express-validator
- **Encriptación** de contraseñas con bcryptjs

## 🛠️ Tecnologías

- **Runtime**: Node.js
- **Framework**: Express.js 5.1.0
- **Base de Datos**: MongoDB con Mongoose 8.0.0
- **Autenticación**: JWT (jsonwebtoken)
- **Seguridad**: bcryptjs, helmet, cors
- **Validación**: express-validator
- **Logging**: Morgan
- **Email**: Nodemailer
- **Rate Limiting**: express-rate-limit

## 🚀 Instalación

### Prerrequisitos

- Node.js (versión 16 o superior)
- MongoDB (local o Atlas)
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd SKILLTRADE_NODEjs/backend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus credenciales
   ```

4. **Ejecutar la aplicación**
   ```bash
   # Desarrollo
   npm run dev
   
   # Producción
   npm start
   ```

## ⚙️ Configuración

### Variables de Entorno

Crear un archivo `.env` en la raíz del backend:

```env
# Servidor
PORT=9090
NODE_ENV=development

# Base de Datos MongoDB
USER_DB=tu_usuario
PASS_DB=tu_password
DB_NAME=skilltrade_db

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_password_app
```

## 📁 Estructura del Proyecto

```
backend/
├── config/                 # Configuración de la base de datos
│   └── db.js             # Conexión a MongoDB
├── controller/            # Controladores de la API
│   ├── usuario.controller.js
│   ├── curso.controller.js
│   ├── exchange.controller.js
│   └── owner.controller.js
├── middleware/            # Middleware personalizado
│   ├── auth.js           # Autenticación y autorización
│   └── validation.js     # Validaciones de datos
├── model/                 # Modelos de Mongoose
│   ├── usuario.model.js
│   ├── curso.model.js
│   ├── exchange.model.js
│   ├── carrito.model.js
│   ├── venta.model.js
│   ├── biblioteca.model.js
│   ├── notificacion.model.js
│   ├── suscripcion.model.js
│   └── owner.model.js
├── index.js               # Punto de entrada de la aplicación
├── routes.js              # Definición de rutas
├── package.json           # Dependencias y scripts
└── README.md              # Este archivo
```

## 🔌 API Endpoints

### Base URL
```
http://localhost:9090/api/v0
```

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/auth/register` | Registro de usuario |
| `POST` | `/auth/login` | Inicio de sesión |
| `POST` | `/auth/logout` | Cerrar sesión |

### Usuarios
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/usuarios` | Obtener todos los usuarios | ✅ |
| `GET` | `/usuarios/:id` | Obtener usuario por ID | ✅ |
| `POST` | `/usuarios` | Crear usuario | ❌ |
| `PUT` | `/usuarios/:id` | Actualizar usuario | ✅ |
| `DELETE` | `/usuarios/:id` | Eliminar usuario | ✅ |

### Perfil
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/perfil` | Obtener perfil propio | ✅ |
| `PUT` | `/perfil` | Editar perfil propio | ✅ |
| `POST` | `/perfil/foto` | Subir foto de perfil | ✅ |
| `PUT` | `/perfil/password` | Cambiar contraseña | ✅ |
| `GET` | `/perfil/estadisticas` | Estadísticas personales | ✅ |

### Cursos
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/cursos` | Obtener todos los cursos | ❌ |
| `GET` | `/cursos/:id` | Obtener curso por ID | ❌ |
| `POST` | `/cursos` | Crear curso | ❌ |
| `PUT` | `/cursos/:id` | Actualizar curso | ❌ |
| `DELETE` | `/cursos/:id` | Eliminar curso | ❌ |
| `GET` | `/cursos/categoria/:categoria` | Cursos por categoría | ❌ |
| `GET` | `/cursos/owner/:ownerId` | Cursos por propietario | ❌ |

### Exchanges (Intercambios)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/exchanges` | Obtener todos los exchanges | ❌ |
| `GET` | `/exchanges/:id` | Obtener exchange por ID | ❌ |
| `POST` | `/exchanges` | Crear exchange | ❌ |
| `PUT` | `/exchanges/:id` | Actualizar exchange | ❌ |
| `DELETE` | `/exchanges/:id` | Eliminar exchange | ❌ |
| `GET` | `/exchanges/usuario/:usuarioId` | Exchanges por usuario | ❌ |

### Owners (Propietarios)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/owners` | Obtener todos los owners | ❌ |
| `GET` | `/owners/:id` | Obtener owner por ID | ❌ |
| `POST` | `/owners` | Crear owner | ❌ |
| `PUT` | `/owners/:id` | Actualizar owner | ❌ |
| `DELETE` | `/owners/:id` | Eliminar owner | ❌ |

### Health Check
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/health` | Estado de la API |

## 🗄️ Modelos de Datos

### Usuario
- Información personal (nombre, email, contraseña)
- Perfil (foto, biografía, datos de contacto)
- Roles (admin, usuario)
- Estadísticas (cursos creados, intercambios, suscripciones)

### Curso
- Información básica (título, descripción, categoría)
- Contenido (archivos, video introductorio, lecciones)
- Metadatos (nivel, etiquetas, precio, visibilidad)
- Estadísticas (visualizaciones, calificaciones, ventas)

### Exchange
- Usuarios involucrados (emisor, receptor)
- Cursos intercambiados
- Estado del intercambio
- Calificaciones y comentarios

### Carrito
- Items del carrito (curso, precio, cantidad)
- Total y estado
- Expiración automática

### Venta
- Información de compra y facturación
- Tracking de envío
- Calificaciones y reembolsos

### Biblioteca
- Cursos adquiridos por el usuario
- Progreso y recordatorios
- Colecciones personalizadas

## 🔐 Autenticación

### JWT Token
- **Duración**: 7 días
- **Payload**: `{ _id, email, rol }`
- **Header**: `Authorization: Bearer <token>`

### Roles
- **usuario**: Acceso básico a la plataforma
- **admin**: Acceso completo y gestión de usuarios

### Middleware de Autenticación
```javascript
const { verificarToken, verificarRol } = require('./middleware/auth');

// Ruta protegida
router.get('/ruta-protegida', verificarToken, controller.metodo);

// Ruta solo para admin
router.get('/admin', verificarToken, verificarRol('admin'), controller.metodo);
```

## ✅ Validaciones

### Características de las Validaciones
- **Null-safety**: Todas las validaciones verifican valores null antes de comparar
- **Validaciones de tipo**: Números enteros vs decimales según el campo
- **Validaciones condicionales**: Campos opcionales con validación cuando existen
- **Mensajes de error descriptivos** en español
- **Validaciones personalizadas** para lógica de negocio

### Ejemplos de Validaciones
```javascript
// Validación de entero
validate: {
    validator: function(v) {
        return Number.isInteger(v) && v >= 0;
    },
    message: 'Debe ser un número entero no negativo'
}

// Validación condicional
validate: {
    validator: function(v) {
        if (!v) return true; // Opcional
        return v.length > 0;
    },
    message: 'No puede estar vacío si se proporciona'
}
```

## 🛡️ Middleware

### Middleware de Seguridad
- **CORS**: Configuración de origen cruzado
- **Helmet**: Headers de seguridad HTTP
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **Morgan**: Logging de requests HTTP

### Middleware Personalizado
- **Auth**: Verificación de JWT y roles
- **Validation**: Validación de datos de entrada
- **Error Handling**: Manejo centralizado de errores

## 🗃️ Base de Datos

### MongoDB Atlas
- **Host**: `adso2873441.ex6dvxq.mongodb.net`
- **Base de datos**: Configurable via `DB_NAME`
- **Autenticación**: Usuario y contraseña

### Conexión
```javascript
const URI = `mongodb+srv://${process.env.USER_DB}:${process.env.PASS_DB}@adso2873441.ex6dvxq.mongodb.net/${process.env.DB_NAME}`;
```

### Índices
- **Texto**: Búsquedas en títulos y descripciones
- **Compuestos**: Usuario + estado, categoría + nivel
- **Únicos**: Email de usuario, usuario en carrito

## 📝 Scripts

```json
{
  "start": "node index.js",        // Producción
  "dev": "nodemon index.js"        // Desarrollo con auto-reload
}
```

## 🚀 Despliegue

### Producción
1. Configurar variables de entorno de producción
2. Configurar base de datos de producción
3. Ejecutar `npm start`
4. Configurar proxy reverso (nginx/apache)
5. Configurar SSL/TLS

### Docker (Recomendado)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 9090
CMD ["npm", "start"]
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de Código
- **ESLint**: Configuración estándar
- **Prettier**: Formateo automático
- **Commits**: Mensajes descriptivos en español
- **Documentación**: Comentarios en español

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

## 📞 Soporte

- **Issues**: [GitHub Issues](link-to-issues)
- **Documentación**: [Wiki del proyecto](link-to-wiki)
- **Email**: soporte@skilltrade.com

## 🔄 Changelog

### v1.0.0
- ✅ API REST completa
- ✅ Sistema de autenticación JWT
- ✅ Validaciones robustas en todos los modelos
- ✅ Middleware de seguridad
- ✅ Base de datos MongoDB con Mongoose
- ✅ Sistema de roles y permisos

---

**Desarrollado con ❤️ por el equipo SkillTrade**
