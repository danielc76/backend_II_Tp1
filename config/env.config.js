import dotenv from 'dotenv';

// Cargo las variables de entorno desde .env
dotenv.config();

// Defino todas las variables que voy a usar en la app
const env = {
    NODE_ENV: process.env.NODE_ENV || 'development', // ambiente por defecto
    PORT: parseInt(process.env.PORT || '5000', 10),  // puerto del server
    MONGO_TARGET: process.env.MONGO_TARGET || 'LOCAL', // si uso Mongo local o Atlas
    MONGO_URL: process.env.MONGO_URL || '',            // URL de Mongo local
    MONGO_ATLAS_URL: process.env.MONGO_ATLAS_URL || '',// URL de Mongo Atlas
    SECRET_SESSION: process.env.SECRET_SESSION || '',  // clave secreta para session
    JWT_SECRET: process.env.JWT_SECRET || ''           // clave secreta para JWT
};

// Función para asegurarme que no falte ninguna variable crítica
export function validateEnv() {
    const missing = [];

    if (!env.SECRET_SESSION) missing.push('SECRET_SESSION');
    if (!env.JWT_SECRET) missing.push('JWT_SECRET');
    if (env.MONGO_TARGET === 'LOCAL' && !env.MONGO_URL) missing.push('MONGO_URL');
    if (env.MONGO_TARGET === 'ATLAS' && !env.MONGO_ATLAS_URL) missing.push('MONGO_ATLAS_URL');

    if (missing.length > 0) {
        console.error(`[ENV] Faltan variables de entorno obligatorias:`, missing.join(', '));
        process.exit(1); // corto la ejecución si falta algo
    }
}

// Función para exponer solo las variables públicas
export function getPublicEnv() {
    return {
        NODE_ENV: env.NODE_ENV,
        PORT: env.PORT,
        MONGO_TARGET: env.MONGO_TARGET
    };
}

// Exporto todas las variables para usar en la app
export default env;
