# SKILLTRADE Backend API

## Configuración

### Variables de Entorno
Crea un archivo `.env` con:
```
USER_DB=your_mongodb_username
PASS_DB=your_mongodb_password
DB_NAME=skilltrade_db
PORT=9090
NODE_ENV=development
```

### Instalación
```bash
npm install
npm run dev
```

## Endpoints

### Base URL: http://localhost:9090/api/v0

#### Usuarios
- GET /usuarios
- GET /usuarios/:id
- POST /usuarios
- PUT /usuarios/:id
- DELETE /usuarios/:id

#### Cursos
- GET /cursos
- GET /cursos/:id
- POST /cursos
- PUT /cursos/:id
- DELETE /cursos/:id
- GET /cursos/categoria/:categoria
- GET /cursos/owner/:ownerId

#### Exchanges
- GET /exchanges
- GET /exchanges/:id
- POST /exchanges
- PUT /exchanges/:id
- DELETE /exchanges/:id
- GET /exchanges/usuario/:usuarioId

#### Owners
- GET /owners
- GET /owners/:id
- POST /owners
- PUT /owners/:id
- DELETE /owners/:id 