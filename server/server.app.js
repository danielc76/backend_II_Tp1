// Dependencias que instalé: npm install express mongoose passport passport-local passport-jwt bcrypt dotenv cookie-parser express-session connect-mongo jsonwebtoken

/*
Tp1/
│
├── config/
│   ├── auth/
│   │   └── passport.config.js
│   │       # Inicializa Passport y define estrategias:
│   │       # - local ("login"): login con email + password
│   │       # - jwt ("current"): autentica usuario con token JWT
│   ├── db/
│   │   └── connect.config.js
│   │       # Conexión a MongoDB (local o Atlas)
│   ├── env.config.js
│   │       # Carga y valida variables de entorno (PORT, SECRET_SESSION, JWT_SECRET..)
│   └── models/
│       ├── student.model.js
│       │       # Modelo de Mongoose para estudiantes
│       │       # Campos: name, email, age
│       │       # CRUD realizado en student.router.js
│       └── user.model.js
│               # Modelo de Mongoose para usuarios
│               # Campos: first_name, last_name, email, password, age, role
│               # CRUD realizado en user.router.js
│
├── middleware/
│   ├── auth.middleware.js
│   │       # Middlewares de autenticación:
│   │       # - requireLogin: protege rutas que requieren sesión activa
│   │       # - alreadyLogin: evita que usuarios logueados vuelvan a /login o /register
│   │       # - requiereJWT: protege rutas con token JWT
│   ├── logger.middleware.js
│   │       # Middleware que loguea todas las requests con método, ruta y tiempo
│   └── polices.middleware.js
│           # Middleware para control de roles (ej: admin, user)
│
├── routes/
│   ├── auth.router.js
│   │       # Endpoints de autenticación:
│   │       # - POST /register → registro usuario local
│   │       # - POST /login → login con sesión Passport local
│   │       # - POST /logout → cerrar sesión
│   │       # - GET /current → devuelve usuario logueado en sesión
│   │       # - GET /github, /github/callback, /github/fail → login OAuth GitHub
│   │       # - POST /jwt/login → login con JWT
│   │       # - GET /jwt/current → usuario autenticado por JWT
│   ├── home.router.js
│   │       # Endpoint de prueba / home
│   │       # - GET / → devuelve mensaje de bienvenida
│   ├── jwt.router.js
│   │       # Endpoints específicos de JWT si se separan de auth
│   │       # - GET /current → devuelve usuario autenticado vía token
│   ├── router.js
│   │       # Inicializa todos los routers y los monta en Express:
│   │       # Ej: app.use("/api/auth", authRouter)
│   │       #     app.use("/api/students", studentRouter)
│   │       #     app.use("/", homeRouter)
│   ├── student.router.js
│   │       # CRUD de estudiantes:
│   │       # - GET /students → todos los estudiantes
│   │       # - POST /students → crear estudiante
│   │       # - GET /students/:id → obtener estudiante por id
│   │       # - PUT /students/:id → actualizar estudiante
│   │       # - DELETE /students/:id → eliminar estudiante
│   └── user.router.js
│           # CRUD de usuarios:
│           # - GET /users → todos los usuarios (requiere login + rol)
│           # - POST /users/register → registro (ya visto en auth.router.js)
│           # - PUT /users/:uid → actualizar usuario (solo admin)
│           # - DELETE /users/:uid → eliminar usuario (solo admin)
│
├── server/
│   └── server.app.js
│           # Punto de entrada de la app
│           # - Carga middlewares globales (JSON, logger, cookies)
│           # - Conecta DB
│           # - Configura sesión con MongoStore
│           # - Inicializa Passport y sesiones
│           # - Inicializa routers
│           # - Arranca servidor
│
└── .env
        # Variables de entorno
*/


import express from 'express';
import passport from 'passport';

import session from 'express-session';
import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';

import environment, { validateEnv } from '../config/env.config.js';
import { initRouters } from '../routes/router.js';
import logger from './../middleware/logger.middleware.js';
import { connectAuto } from './../config/db/connect.config.js';
import { initPassport } from './../config/auth/passport.config.js';

const app = express();
const PORT = environment.PORT || 8000;
const SECRET_SESSION = environment.SECRET_SESSION || 'clave_secreta';

/* =========================
   Middlewares globales
   ========================= */

// Parseo de JSON para leer bodies en requests
app.use(express.json());

// Middleware de logging: muestra cada request y cuánto tarda en responder
app.use(logger);

// Cookie parser para manejar cookies firmadas
app.use(cookieParser(SECRET_SESSION));

export const startServer = async () => {
    try {
        // Me aseguro que todas las variables de entorno necesarias estén presentes
        validateEnv();

        // Conexión a la base de datos, ya sea local o Atlas según env
        await connectAuto();

        // Configuración del store de sesiones usando Mongo
        const store = MongoStore.create({
            client: ((await import("mongoose")).default.connection.getClient()),
            ttl: 60 * 60 // la sesión dura 1 hora en la DB
        });

        // Configuro express-session con persistencia en Mongo
        app.use(
            session({
                secret: SECRET_SESSION,
                resave: false,
                saveUninitialized: false,
                store,
                cookie: {
                    maxAge: 1 * 60 * 60 * 1000, // 1 hora
                    httpOnly: true,
                    signed: true
                }
            })
        );

        /* =========================
           Passport
           ========================= */
        initPassport();               // cargo las estrategias (login, current JWT)
        app.use(passport.initialize()); 
        app.use(passport.session());    // habilito sesiones con passport

        // Serialización/deserialización para session
        passport.serializeUser((user, done) => done(null, user._id));
        passport.deserializeUser(async (id, done) => {
            try {
                const UserModel = (await import('../config/models/user.model.js')).UserModel;
                const user = await UserModel.findById(id).lean();
                done(null, user || false);
            } catch (err) {
                done(err);
            }
        });

        /* =========================
           Routers
           ========================= */
        initRouters(app); // inicializo todos los routers de la app

        /* =========================
           Servidor
           ========================= */
        app.listen(PORT, () => {
            console.log(`Servidor escuchando en http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Error al iniciar el servidor:", error);
        process.exit(1);
    }
};

// Llamo a la función para arrancar el servidor
startServer();
