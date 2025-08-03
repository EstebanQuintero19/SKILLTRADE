# SKILLTRADE Frontend

## Configuración

### Variables de Entorno
Crea un archivo `.env` en la carpeta `frontend/`:

```env
FRONTEND_PORT=3000
API_URL=http://localhost:9090/api/v0
NODE_ENV=development
```

### Instalación
```bash
npm install
npm run dev
```

## Estructura del Proyecto

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
├── server.js
├── package.json
└── README.md
```

## Páginas Disponibles

### Página Principal (`/`)
- Hero banner con información de la plataforma
- Estadísticas de usuarios y cursos
- Cursos destacados
- Categorías principales

### Cursos (`/cursos`)
- Lista de todos los cursos
- Filtros por categoría y precio
- Vista de cuadrícula y lista
- Paginación

### Curso Individual (`/curso/:id`)
- Información detallada del curso
- Panel de compra
- Sección de intercambios
- Cursos relacionados

### Intercambios (`/intercambios`)
- Lista de intercambios disponibles
- Crear nuevo intercambio
- Buscar intercambios

### Panel de Administración (`/admin`)
- Gestión de usuarios
- Gestión de cursos
- Gestión de intercambios
- Estadísticas

### Comprar Curso (`/comprar/:id`)
- Formulario de compra
- Resumen de la compra
- Proceso de pago

### Mis Cursos (`/mis-cursos`)
- Cursos del usuario
- Progreso de aprendizaje

## Características

### Diseño Responsivo
- Adaptable a todos los dispositivos
- Mobile-first approach
- Breakpoints optimizados

### Interactividad
- Animaciones suaves
- Filtros dinámicos
- Carrito de compras
- Modo oscuro

### Optimización
- Lazy loading de imágenes
- CSS y JS minificados
- Caché de navegador

## Tecnologías Utilizadas

- **EJS**: Motor de plantillas
- **Express.js**: Servidor web
- **Bootstrap 5**: Framework CSS
- **Bootstrap Icons**: Iconografía
- **Vanilla JavaScript**: Interactividad

## Scripts Disponibles

- `npm start`: Inicia el servidor en producción
- `npm run dev`: Inicia el servidor en desarrollo con nodemon

## API Integration

El frontend se conecta con el backend a través de:
- Endpoint base: `http://localhost:9090/api/v0`
- Axios para las peticiones HTTP
- Manejo de errores integrado

## Desarrollo

Para agregar nuevas páginas:
1. Crear el archivo EJS en `views/`
2. Agregar la ruta en `server.js`
3. Crear los estilos necesarios en `public/css/`
4. Agregar funcionalidad JavaScript si es necesario 