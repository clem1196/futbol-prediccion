import { Router } from 'express';
import { Prediccion } from '../entities/Prediccion';
import { Partido } from '../entities/Partido';
import { Equipo } from '../entities/Equipo';
import AppDataSource from '../data-source';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// GET /api/historial/usuario/1
router.get('/usuario/:usuarioId', authenticateToken, async (req, res) => {
  const { usuarioId } = req.params;
  const prediccionRepo = AppDataSource.getRepository(Prediccion);
  const partidoRepo = AppDataSource.getRepository(Partido);
  const equipoRepo = AppDataSource.getRepository(Equipo);

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
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener historial' });
  }
});

export default router;