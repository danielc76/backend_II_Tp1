import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { UserModel } from "../models/user.model.js"; // <- tu modelo

// Cargo variables de entorno
dotenv.config();

// Función para inicializar Passport
export const initPassport = () => {

  /*
    ===============================
    ESTRATEGIA LOCAL - LOGIN
    ===============================
    Para login clásico con email + password.
    Usa sesiones (si lo configurás) o solo para autenticar.
  */
  passport.use(
    "local", // <- importante: debe coincidir con auth.router.js
    new LocalStrategy(
      {
        usernameField: "email", // login con email
        passwordField: "password",
        session: true            // si vas a usar sesiones con Passport
      },
      async (email, password, done) => {
        try {
          const user = await UserModel.findOne({ email });

          if (!user) return done(null, false, { message: "Usuario no encontrado" });

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) return done(null, false, { message: "Contraseña incorrecta" });

          // Devuelvo solo los datos útiles, sin la password
          return done(null, {
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            age: user.age,
            role: user.role
          });

        } catch (error) {
          return done(error);
        }
      }
    )
  );

  /*
    ===============================
    ESTRATEGIA JWT - CURRENT
    ===============================
    Valida al usuario actual a partir del token enviado en Authorization: Bearer <token>.
  */
  passport.use(
    "jwt", // <- más claro que "current"
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET
      },
      async (payload, done) => {
        try {
          const user = await UserModel.findById(payload.sub).lean();
          if (!user) return done(null, false); // usuario no encontrado

          return done(null, {
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            age: user.age,
            role: user.role
          });

        } catch (error) {
          return done(error);
        }
      }
    )
  );
};
