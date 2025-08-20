import { Router, Request, Response } from 'express';
import { Prediction } from '../entities/Prediction';
import { Match } from '../entities/Match';
//import { Team } from '../entities/Team';
import AppDataSource from '../data-source';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// GET /api/historial/usuario/1
router.get('/usuario/:usuarioId', authenticateToken, async (req:Request, res:Response) => {
  const { usuarioId } = req.params;
  const prediccionRepo = AppDataSource.getRepository(Prediction);
  const partidoRepo = AppDataSource.getRepository(Match);
  //const equipoRepo = AppDataSource.getRepository(Team);

  try {
    const predicciones = await prediccionRepo.find({
      where: { usuarioId: parseInt(usuarioId) },
      relations: ['partido', 'partido.equipoLocal', 'partido.equipoVisitante'],
      order: { partido: { fecha: 'DESC' } },
    });

    const historial = await Promise.all(
      predicciones.map(async (pred) => {
        const partido = await partidoRepo.findOne({
          where: { id: pred.partidoId },
          relations: ['equipoLocal', 'equipoVisitante'],
        });

        if (!partido || !partido.jugado || partido.golesLocal === null || partido.golesVisitante === null) {
          return null; // Aún no jugado
        }

        const golesLocalR = partido.golesLocal!;
        const golesVisitanteR = partido.golesVisitante!;
        const golesLocalP = pred.golesLocal;
        const golesVisitanteP = pred.golesVisitante;

        let resultado = '❌';
        let detalle = 'Fallado';

        if (golesLocalP === golesLocalR && golesVisitanteP === golesVisitanteR) {
          resultado = '✅';
          detalle = 'Marcador exacto';
        } else {
          const resPred = (golesLocalP > golesVisitanteP) ? 'local' : (golesLocalP < golesVisitanteP) ? 'visitante' : 'empate';
          const resReal = (golesLocalR > golesVisitanteR) ? 'local' : (golesLocalR < golesVisitanteR) ? 'visitante' : 'empate';
          if (resPred === resReal) {
            resultado = '🔶';
            detalle = 'Resultado correcto';
          }
        }

        return {
          partidoId: partido.id,
          equipoLocal: partido.equipoLocal.nombre,
          equipoVisitante: partido.equipoVisitante.nombre,
          predicho: `${golesLocalP} - ${golesVisitanteP}`,
          real: `${golesLocalR} - ${golesVisitanteR}`,
          resultado,
          detalle,
          puntos: pred.puntos,
          fecha: partido.fecha,
        };
      })
    );

    // Filtrar partidos no jugados
    const historialFiltrado = historial.filter(Boolean).sort(
      (a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );

    return res.json(historialFiltrado);
// oxlint-disable-next-line no-unused-vars
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener historial' });
  }
});

export default router;