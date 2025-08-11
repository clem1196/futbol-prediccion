import { Request, Response, Router } from "express";
import {
  crearPrediccion,
  getPredicciones,
} from "../controllers/prediccionController";
import AppDataSource from "../data-source";
import { Prediccion } from "../entities/Prediccion";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// GET /api/predicciones
router.get("/", getPredicciones);

// POST /api/predicciones
router.post("/", authenticateToken, crearPrediccion);

// GET /api/predicciones/usuario/:usuarioId
router.get(
  "/usuario/:usuarioId",
  authenticateToken,
  async (req: Request, res: Response) => {
    
    if (parseInt(req.params.usuarioId) !== req.userId) {
      
      return res
        .status(403)
        .json({ message: "No puedes acceder a predicciones de otro usuario" });
    }
    const { usuarioId } = req.params;
    const prediccionRepo = AppDataSource.getRepository(Prediccion);

    try {
      const predicciones = await prediccionRepo.find({
        where: { usuarioId: parseInt(usuarioId) },
        relations: [
          "partido",
          "partido.equipoLocal",
          "partido.equipoVisitante",
        ],
      });
      return res.json(predicciones);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error al obtener predicciones del usuario" });
    }
  }
);

export default router;
