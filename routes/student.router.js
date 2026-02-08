import { Router } from "express";
import mongoose from "mongoose";
import { StudentModel } from "../config/models/student.model.js";

const router = Router();

/* =========================
   GET TODOS LOS ESTUDIANTES
========================= */
router.get("/", async (req, res) => {
    try {
        const students = await StudentModel.find();
        res.status(200).json({ students });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* =========================
   CREAR ESTUDIANTE
========================= */
router.post("/", async (req, res) => {
    try {
        let { name, email, age } = req.body;

        if (!name || !email || !age) {
            return res.status(400).json({ error: "Todos los datos son obligatorios" });
        }

        email = String(email).trim().toLowerCase();

        const emailInUse = await StudentModel.exists({ email });
        if (emailInUse) {
            return res.status(400).json({ error: `El email ${email} ya está en uso` });
        }

        const student = new StudentModel({ name, email, age });
        await student.save();

        res.status(201).json({ message: "Estudiante creado correctamente", student });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* =========================
   GET ESTUDIANTE POR ID
========================= */
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Formato de ID inválido" });
        }

        const student = await StudentModel.findById(id);
        if (!student) return res.status(404).json({ error: "Estudiante no encontrado" });

        res.status(200).json({ student });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* =========================
   ACTUALIZAR ESTUDIANTE
========================= */
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let { name, email, age } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Formato de ID inválido" });
        }
        if (!name || !email || !age) {
            return res.status(400).json({ error: "Todos los datos son obligatorios" });
        }

        email = String(email).trim().toLowerCase();

        const emailInUse = await StudentModel.exists({ email, _id: { $ne: id } });
        if (emailInUse) return res.status(400).json({ error: `El email ${email} ya está en uso` });

        const student = await StudentModel.findByIdAndUpdate(
            id,
            { name, email, age },
            { new: true, runValidators: true }
        );

        if (!student) return res.status(404).json({ error: "Estudiante no encontrado" });

        res.status(200).json({ message: "Estudiante actualizado correctamente", student });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* =========================
   ELIMINAR ESTUDIANTE
========================= */
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Formato de ID inválido" });
        }

        const student = await StudentModel.findByIdAndDelete(id);
        if (!student) return res.status(404).json({ error: "Estudiante no encontrado" });

        res.status(204).json();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
