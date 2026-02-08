import jwt from "jsonwebtoken";
import passport from "passport";

// Verifica que exista una sesión activa
export function requireLogin(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Not authorized" });
    }
    next();
}

// Evita que un usuario ya logueado vuelva a loguearse o registrarse
export function alreadyLogin(req, res, next) {
    if (req.session && req.session.user) {
        return res.status(403).json({ error: "User already logged in" });
    }
    next();
}

// Autorización por un rol específico
export function requireRole(role) {
    return (req, res, next) => {
        const user = req.session?.user || req.user;
        if (!user) {
            return res.status(401).json({ error: "Not authorized" });
        }
        if (user.role !== role) {
            return res.status(403).json({ error: "Forbidden" });
        }
        next();
    };
}

// Autenticación JWT usando passport y cookie
export const requireJwtCookie = passport.authenticate("jwt-cookie", {
    session: false
});

// Autorización por múltiples roles
export function requireManyRoles(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Not authorized" });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        next();
    };
}

// Validación manual de JWT desde el header Authorization
export function requiereJWT(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: "Token missing" });
    }

    try {
        req.jwt = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}
