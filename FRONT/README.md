# SkillTrade Frontend



##  Estructura del Proyecto

```
FRONT/
├── public/
│   ├── css/
│   │   └── main.css          # Estilos principales
│   └── js/
│       └── main.js           # JavaScript principal
├── views/
│   ├── auth/
│   │   ├── login.ejs         # Página de login
│   │   └── register.ejs      # Página de registro
│   ├── cursos/
│   │   ├── index.ejs         # Lista de cursos
│   │   └── detalle.ejs       # Detalle de curso
│   ├── dashboard/
│   │   └── index.ejs         # Panel de usuario
│   ├── intercambios/
│   │   └── index.ejs         # Lista de intercambios
│   ├── admin/
│   │   └── index.ejs         # Panel de administración
│   ├── partials/
│   │   ├── header.ejs        # Header compartido
│   │   └── footer.ejs        # Footer compartido
│   ├── layout.ejs            # Layout base
│   ├── index.ejs             # Página principal
│   └── error.ejs             # Página de error
├── server.js                 # Servidor principal
├── package.json              # Dependencias
├── .env.example              # Variables de entorno ejemplo
└── README.md                 # Este archivo
```


   
   Editar `.env` con tus configuraciones:
   ```env
   PORT=3000
   API_BASE_URL=http://localhost:9090/api/v0
   SESSION_SECRET=tu_secret_super_seguro
   UPLOAD_DIR=uploads
   APP_NAME=SkillTrade
   APP_URL=http://localhost:3000
   ```

4. **Iniciar el servidor:**
   ```bash
   npm start
   ```
   
   Para desarrollo con auto-recarga:
   ```bash
   npm run dev
   ```

##  Configuración

### Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `PORT` | Puerto del servidor frontend | `3000` |
| `API_BASE_URL` | URL base del backend API | `http://localhost:9090/api/v0` |
| `SESSION_SECRET` | Secreto para sesiones | `required` |
| `UPLOAD_DIR` | Directorio de uploads | `uploads` |
| `APP_NAME` | Nombre de la aplicación | `SkillTrade` |
| `APP_URL` | URL base de la aplicación | `http://localhost:3000` |

### Dependencias

- **express**: Servidor web
- **ejs**: Motor de plantillas
- **axios**: Cliente HTTP para API
- **cookie-parser**: Manejo de cookies
- **express-session**: Manejo de sesiones
- **multer**: Manejo de archivos
- **dotenv**: Variables de entorno

##  Diseño

### Tema Oscuro
- Colores principales: Grises oscuros (#111827, #1f2937, #374151)
- Acentos: Azul (#2563eb), Púrpura (#9333ea), Verde (#10b981)
- Tipografía: Sistema de fuentes nativo

### Responsive
- Mobile First approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Grid system flexible
- Menú móvil colapsible

##  Autenticación

El frontend maneja la autenticación mediante:

1. **Sesiones**: Almacena tokens JWT en sesiones del servidor
2. **Middleware**: Protege rutas que requieren autenticación
3. **Roles**: Diferencia entre usuarios normales y administradores
4. **Integración**: Comunica con backend para validar credenciales

### Rutas Protegidas

- `/dashboard/*` - Requiere autenticación
- `/admin/*` - Requiere rol de administrador

##  Páginas Principales

### Página Principal (`/`)
- Hero section con estadísticas
- Cursos destacados
- Call-to-action para registro

### Cursos (`/cursos`)
- Lista de cursos con filtros
- Búsqueda por título y categoría
- Paginación y ordenamiento

### Intercambios (`/intercambios`)
- Lista de intercambios activos
- Filtros por estado y habilidades
- Sistema de contacto

### Dashboard (`/dashboard`)
- Panel personal del usuario
- Gestión de cursos propios
- Estadísticas personales

### Admin (`/admin`)
- Panel de administración
- Gestión de usuarios, cursos e intercambios
- Estadísticas de la plataforma

##  Desarrollo

### Scripts Disponibles

```bash
npm start          # Iniciar servidor
npm run dev        # Desarrollo con nodemon
npm test           # Ejecutar tests (pendiente)
```

### Estructura de Código

- **server.js**: Configuración principal del servidor
- **public/**: Archivos estáticos (CSS, JS, imágenes)
- **views/**: Plantillas EJS organizadas por funcionalidad
- **partials/**: Componentes reutilizables


##  Integración con Backend

El frontend se comunica con el backend mediante:

- **Axios**: Cliente HTTP configurado
- **Interceptores**: Manejo automático de tokens
- **Error Handling**: Gestión centralizada de errores de API


---

**SkillTrade Frontend** - Plataforma de intercambio de habilidades y conocimientos
