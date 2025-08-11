import { Request, Response } from "express";
import { Prediccion } from "../entities/Prediccion";
import AppDataSource from "../data-source";

export const crearPrediccion = async (req: Request, res: Response) => {
  const prediccionRepo = AppDataSource.getRepository(Prediccion);
  const { partidoId, golesLocal, golesVisitante } = req.body;
  const usuarioId = req.userId;
  if (!usuarioId) {
    return res.status(401).json({ message: 'No autorizado' });
  }
  try {
    const existe = await prediccionRepo.findOne({
      where: { partidoId, usuarioId },
    });

    if (existe) {
      return res.status(400).json({ message: "Ya has predicho este partido" });
    }

    const prediccion = prediccionRepo.create({
      partidoId,
      golesLocal,
      golesVisitante,
      usuarioId,
    });

    await prediccionRepo.save(prediccion);
    return res.status(201).json(prediccion);
  } catch (error: any) {
    console.error("❌ Error detallado en crearPrediccion:", error); // 🔥 Muestra todo el error
    console.error("❌ Mensaje:", error.message);
    console.error("❌ Stack:", error.stack);
    return res.status(500).json({ message: "Error al guardar predicción" });
  }
};

// ✅ Aquí estaba el error: req era de tipo Response ❌
export const getPredicciones = async (req: Request, res: Response) => {
  const prediccionRepo = AppDataSource.getRepository(Prediccion);
  try {
    const predicciones = await prediccionRepo.find({
      relations: ["partido", "partido.equipoLocal", "partido.equipoVisitante"],
    });
    return res.json(predicciones);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener predicciones" });
  }
};
