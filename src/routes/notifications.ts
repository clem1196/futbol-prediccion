import { suscripciones } from "../index";
import express, { Request, Response, Router } from "express";
const router = Router();
router.post(
  "/api/notifications/subscribe",
  express.json(),
  (req: Request, res: Response) => {
    const subscription = req.body;

    // Validar estructura básica
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: "Suscripción inválida" });
    }

    suscripciones.add(subscription);
    console.log("✅ Suscripción push guardada:", subscription.endpoint);
    res.status(201).json({ message: "Suscrito a notificaciones" });
  }
);
export default router;
