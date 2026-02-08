import mongoose from "mongoose";
import dotenv from "dotenv";

// Cargo las variables de entorno para poder leer MONGO_URL y MONGO_ATLAS_URL
dotenv.config();

// Opciones básicas para la conexión a Mongo
const baseMongooseOpts = {
    serverSelectionTimeoutMS: 10000, // tiempo máximo que espero para conectarme al server
};

/* =========================
   Conexión a Mongo Local
   ========================= */
export const connectMongoDB = async () => {
    try {
        const url = process.env.MONGO_URL;
        if (!url) throw new Error("No encontré la URL de Mongo en el .env");

        // Intento conectarme a la DB local
        await mongoose.connect(url, baseMongooseOpts);
        console.log("Conectado a MongoDB local correctamente");
    } catch (err) {
        console.error(err);
        process.exit(1); // corto la app si falla la conexión
    }
};

/* =========================
   Conexión a Mongo Atlas
   ========================= */
export const connectMongoAtlasDB = async () => {
    try {
        const url = process.env.MONGO_ATLAS_URL;
        if (!url) throw new Error("No encontré la URL de Mongo Atlas en el .env");

        // Intento conectarme a la DB remota
        await mongoose.connect(url, baseMongooseOpts);
        console.log("Conectado a Mongo Atlas correctamente");
    } catch (err) {
        console.error(err);
        process.exit(1); // corto la app si falla la conexión
    }
};

/* =========================
   Conexión automática según la variable de entorno
   ========================= */
export const connectAuto = async () => {
    const target = (process.env.MONGO_TARGET || "LOCAL").toUpperCase();

    // Si está configurado Atlas, conecto a Atlas, sino a local
    if (target === "ATLAS") return connectMongoAtlasDB();
    return connectMongoDB();
};
