# SkillTrade-NodeJS

Plataforma de intercambio de habilidades y cursos online desarrollada con Node.js, Express y EJS.

## Tabla de Contenidos

- [Descripción](#descripción)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Configuración](#configuración)
- [Instalación](#instalación)
- [Backend API](#backend-api)
- [Frontend](#frontend)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Desarrollo](#desarrollo)

## Descripción

SkillTrade es una plataforma que permite a los usuarios intercambiar habilidades y conocimientos a través de cursos online. Los usuarios pueden comprar cursos, crear intercambios y gestionar su aprendizaje.

## Estructura del Proyecto

```
SKILLTRADE_NODEjs/
├── backend/                 # API REST con Express y MongoDB
│   ├── config/
│   ├── controller/
│   ├── model/
│   ├── routes.js
│   └── index.js
├── frontend/               # Aplicación web con EJS
│   ├── views/
│   ├── public/
│   ├── server.js
│   └── SKILLTRADE/
└── README.md
```

## Configuración

### Backend - Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/`:

```env
USER_DB=your_mongodb_username
PASS_DB=your_mongodb_password
DB_NAME=skilltrade_db
PORT=9090
NODE_ENV=development
```

### Frontend - Variables de Entorno

Crea un archivo `.env` en la carpeta `frontend/`:

```env
FRONTEND_PORT=3000
API_URL=http://localhost:9090/api/v0
NODE_ENV=development
```

## Instalación

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd SKILLTRADE_NODEjs
```

### 2. Instalar dependencias del Backend
```bash
cd backend
npm install
```

### 3. Instalar dependencias del Frontend
```bash
cd ../frontend
npm install
```

### 4. Configurar la base de datos
- Asegúrate de tener MongoDB instalado y ejecutándose
- Crea la base de datos `skilltrade_db`
- Configura las credenciales en el archivo `.env` del backend

### 5. Ejecutar la aplicación

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

La aplicación estará disponible en:
- Frontend: http://localhost:3000
- Backend API: http://localhost:9090/api/v0

## Backend API

### Base URL: `http://localhost:9090/api/v0`

### Endpoints Disponibles

#### Usuarios
- `GET /usuarios` - Obtener todos los usuarios
- `GET /usuarios/:id` - Obtener usuario por ID
- `POST /usuarios` - Crear nuevo usuario
- `PUT /usuarios/:id` - Actualizar usuario
- `DELETE /usuarios/:id` - Eliminar usuario

#### Cursos
- `GET /cursos` - Obtener todos los cursos
- `GET /cursos/:id` - Obtener curso por ID
- `POST /cursos` - Crear nuevo curso
- `PUT /cursos/:id` - Actualizar curso
- `DELETE /cursos/:id` - Eliminar curso
- `GET /cursos/categoria/:categoria` - Filtrar por categoría
- `GET /cursos/owner/:ownerId` - Cursos por propietario

#### Exchanges
- `GET /exchanges` - Obtener todos los intercambios
- `GET /exchanges/:id` - Obtener intercambio por ID
- `POST /exchanges` - Crear nuevo intercambio
- `PUT /exchanges/:id` - Actualizar intercambio
- `DELETE /exchanges/:id` - Eliminar intercambio
- `GET /exchanges/usuario/:usuarioId` - Intercambios por usuario

#### Owners
- `GET /owners` - Obtener todos los propietarios
- `GET /owners/:id` - Obtener propietario por ID
- `POST /owners` - Crear nuevo propietario
- `PUT /owners/:id` - Actualizar propietario
- `DELETE /owners/:id` - Eliminar propietario

### Modelos de Datos

El backend incluye modelos para:
- Usuarios
- Cursos
- Intercambios
- Propietarios
- Carritos
- Certificados
- Progreso
- Suscripciones

## Frontend

### Páginas Disponibles

#### Página Principal (`/`)
- Hero banner con información de la plataforma
- Estadísticas de usuarios y cursos
- Cursos destacados
- Categorías principales

#### Cursos (`/cursos`)
- Lista de todos los cursos
- Filtros por categoría y precio
- Vista de cuadrícula y lista
- Paginación

#### Curso Individual (`/curso/:id`)
- Información detallada del curso
- Panel de compra
- Sección de intercambios
- Cursos relacionados

#### Intercambios (`/intercambios`)
- Lista de intercambios disponibles
- Crear nuevo intercambio
- Buscar intercambios

#### Panel de Administración (`/admin`)
- Gestión de usuarios
- Gestión de cursos
- Gestión de intercambios
- Estadísticas

#### Comprar Curso (`/comprar/:id`)
- Formulario de compra
- Resumen de la compra
- Proceso de pago

#### Mis Cursos (`/mis-cursos`)
- Cursos del usuario
- Progreso de aprendizaje

### Características del Frontend

#### Diseño Responsivo
- Adaptable a todos los dispositivos
- Mobile-first approach
- Breakpoints optimizados

#### Interactividad
- Animaciones suaves
- Filtros dinámicos
- Carrito de compras
- Modo oscuro

#### Optimización
- Lazy loading de imágenes
- CSS y JS minificados
- Caché de navegador

### Estructura del Frontend

```
frontend/
├── views/
│   ├── partials/
│   │   ├── header.ejs
│   │   └── footer.ejs
│   ├── layout.ejs
│   ├── index.ejs
│   ├── cursos.ejs
│   ├── curso.ejs
│   ├── intercambios.ejs
│   ├── admin.ejs
│   ├── comprar.ejs
│   ├── mis-cursos.ejs
│   └── error.ejs
├── public/
│   ├── css/
│   │   ├── main.css
│   │   └── responsive.css
│   ├── js/
│   │   └── main.js
│   └── images/
├── SKILLTRADE/
│   ├── assets/
│   ├── pages/
│   └── scripts/
├── server.js
└── package.json
```

## Tecnologías Utilizadas

### Backend
- **Node.js**: Runtime de JavaScript
- **Express.js**: Framework web
- **MongoDB**: Base de datos NoSQL
- **Mongoose**: ODM para MongoDB
- **CORS**: Middleware para CORS
- **dotenv**: Variables de entorno

### Frontend
- **EJS**: Motor de plantillas
- **Express.js**: Servidor web
- **Bootstrap 5**: Framework CSS
- **Bootstrap Icons**: Iconografía
- **Vanilla JavaScript**: Interactividad
- **Axios**: Cliente HTTP

## Desarrollo

### Scripts Disponibles

**Backend:**
```bash
npm start          # Inicia el servidor en producción
npm run dev        # Inicia el servidor en desarrollo con nodemon
```

**Frontend:**
```bash
npm start          # Inicia el servidor en producción
npm run dev        # Inicia el servidor en desarrollo con nodemon
```

### Agregar Nuevas Funcionalidades

#### Backend
1. Crear el modelo en `model/`
2. Crear el controlador en `controller/`
3. Agregar las rutas en `routes.js`
4. Documentar el endpoint

#### Frontend
1. Crear el archivo EJS en `views/`
2. Agregar la ruta en `server.js`
3. Crear los estilos necesarios en `public/css/`
4. Agregar funcionalidad JavaScript si es necesario

### API Integration

El frontend se conecta con el backend a través de:
- Endpoint base: `http://localhost:9090/api/v0`
- Axios para las peticiones HTTP
- Manejo de errores integrado
