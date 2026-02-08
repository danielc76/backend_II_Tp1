import { Router } from "express";
import { User } from "../config/models/user.model.js";
import jwt from "jsonwebtoken";
import passport from "passport";
import { requireJwtCookie, requireManyRoles } from "../middleware/auth.middleware.js";

const router = Router();

/*
    =========================
    REGISTER
    =========================
    Este endpoint crea un usuario con JWT
*/
router.post("/register", async (req, res) => {
    try {
        const { first_name, last_name, email, age, password, role } = req.body;

        // Campos obligatorios
        if (!first_name || !last_name || !email || !age || !password) {
            return res.status(400).json({ error: "Todos los datos son requeridos" });
        }

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ error: "El email ya está registrado" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            first_name,
            last_name,
            email,
            age,
            role: role || "user",
            password: hashedPassword
        });

        res.status(201).json({
            message: "Usuario creado con éxito",
            user: {
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                age: user.age,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/*
    =========================
    LOGIN
    =========================
    Devuelve JWT en cookie HttpOnly
*/
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) return res.status(400).json({ error: "Todos los datos son requeridos" });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "Usuario inexistente" });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: "Credenciales inválidas" });

        // Payload para JWT
        const payload = { user: { _id: user._id, email: user.email, role: user.role } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

        // Cookie HttpOnly
        res.cookie("access_token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            maxAge: 60 * 60 * 1000,
            path: "/"
        });

        res.status(200).json({
            message: "Login OK (JWT en cookie)",
            token,
            user: {
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                age: user.age,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/*
    =========================
    CURRENT USER
    =========================
    Retorna info del usuario logueado usando JWT
*/
router.get(
    "/current",
    requireJwtCookie,
    requireManyRoles("user", "admin"),
    async (req, res) => {
        try {
            const user = await User.findById(req.user._id);
            if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

            const { first_name, last_name, email, age, role } = user;
            res.status(200).json({
                message: "Usuario encontrado",
                user: { first_name, last_name, email, age, role }
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

/*
    =========================
    LOGOUT
    =========================
    Elimina cookie de JWT
*/
router.post("/logout", requireJwtCookie, (req, res) => {
    try {
        res.clearCookie("access_token", { path: "/" });
        res.status(200).json({ message: "Logout OK - cookie eliminada" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
