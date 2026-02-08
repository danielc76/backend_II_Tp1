import { Router } from "express";

const router = Router();

/*
    =========================
    HOME ROUTER
    =========================
    Ruta principal de la API. 
*/
router.get("/", (req, res) => {
    res.status(200).json({
        message: "🚀 Backend 2 funcionando correctamente",
        status: "OK",
        timestamp: new Date().toISOString()
    });
});

export default router;
