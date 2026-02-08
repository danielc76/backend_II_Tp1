import homeRouter from "./home.router.js";
import studentRouter from "./student.router.js";
import userRouter from "./user.router.js";
import authRouter from "./auth.router.js";

/*
  Este archivo es el router padre.
  Acá engancho todos los routers de la app
  para mantener el servidor ordenado.
*/
export function initRouters(app) {

    /* =========================
       HOME
       ========================= */
    app.use("/", homeRouter);

    /* =========================
       ESTUDIANTES (CRUD)
       ========================= */
    app.use("/api/students", studentRouter);

    /* =========================
       USUARIOS (CRUD)
       ========================= */
    app.use("/api/users", userRouter);

    /* =========================
       AUTENTICACIÓN
       login / register / current
       ========================= */
    app.use("/api/auth", authRouter);

    /* =========================
       404
       ========================= */
    app.use((req, res) => {
        res.status(404).json({
            error: "Ruta no encontrada"
        });
    });
}
