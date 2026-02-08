// npm install express mongoose passport passport-local passport-jwt bcrypt dotenv cookie-parser express-session connect-mongo jsonwebtoken

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
