import { Router } from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { UserModel } from "../config/models/user.model.js";
import { requireLogin, alreadyLogin } from "../middleware/auth.middleware.js";
import { polices } from "../middleware/polices.middleware.js";

const router = Router();

/* =========================
   REGISTER
========================= */
router.post("/register", alreadyLogin, async (req, res) => {
    try {
        const { first_name, last_name, email, password, age, role } = req.body;

        if (!first_name || !last_name || !email || !password || !age) {
            return res.status(400).json({ error: "Todos los datos son requeridos" });
        }

        const exist = await UserModel.findOne({ email });
        if (exist) return res.status(400).json({ error: `El email ${email} ya está registrado` });

        const hash = await bcrypt.hash(password, 10);

        const user = new UserModel({
            first_name,
            last_name,
            email,
            password: hash,
            age,
            role: role || "user"
        });

        await user.save();

        res.status(201).json({
            message: "Usuario registrado con éxito",
            user
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* =========================
   LOGIN
========================= */
router.post("/login", alreadyLogin, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) return res.status(400).json({ error: "Todos los datos son requeridos" });

        const user = await UserModel.findOne({ email });
        if (!user) return res.status(400).json({ error: "Usuario inexistente" });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: "Credenciales inválidas" });

        req.session.user = {
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            age: user.age,
            role: user.role
        };

        res.status(200).json({
            message: "Login exitoso",
            user: req.session.user
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* =========================
   LOGOUT
========================= */
router.post("/logout", requireLogin, async (req, res) => {
    try {
        const { first_name, last_name } = req.session.user;

        req.session.destroy(err => {
            if (err) return res.status(500).json({ error: "Error al cerrar sesión" });

            res.clearCookie("connect.sid");
            res.status(200).json({
                message: "Logout exitoso",
                byebye: `${first_name} ${last_name}`
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* =========================
   GET ALL USERS
========================= */
router.get("/", requireLogin, async (req, res) => {
    try {
        const users = await UserModel.find();
        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* =========================
   UPDATE USER
========================= */
router.put("/:uid", requireLogin, polices("admin"), async (req, res) => {
    try {
        const { uid } = req.params;
        if (!mongoose.Types.ObjectId.isValid(uid)) return res.status(400).json({ error: "Formato de ID inválido" });

        const { first_name, last_name, age, role } = req.body;

        const updateData = {};
        if (first_name) updateData.first_name = first_name;
        if (last_name) updateData.last_name = last_name;
        if (age) updateData.age = age;
        if (role) updateData.role = role;

        if (Object.keys(updateData).length === 0) return res.status(400).json({ error: "No hay datos para actualizar" });

        const userUpdated = await UserModel.findByIdAndUpdate(uid, updateData, { new: true });
        if (!userUpdated) return res.status(404).json({ error: "Usuario no encontrado" });

        res.status(200).json({
            message: "Usuario actualizado correctamente",
            user: userUpdated
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* =========================
   DELETE USER
========================= */
router.delete("/:uid", requireLogin, polices("admin"), async (req, res) => {
    try {
        const { uid } = req.params;
        if (!mongoose.Types.ObjectId.isValid(uid)) return res.status(400).json({ error: "Formato de ID inválido" });

        const userDeleted = await UserModel.findByIdAndDelete(uid);
        if (!userDeleted) return res.status(404).json({ error: "Usuario no encontrado" });

        res.status(200).json({
            message: "Usuario eliminado correctamente",
            user: userDeleted
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
