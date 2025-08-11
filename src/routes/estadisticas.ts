import { Router } from 'express';
import { Prediccion } from '../entities/Prediccion';
import { Partido } from '../entities/Partido';
import AppDataSource from '../data-source';

const router = Router();

// GET /api/estadisticas/usuario/1
router.get('/usuario/:usuarioId', async (req, res) => {
  const { usuarioId } = req.params;
  const prediccionRepo = AppDataSource.getRepository(Prediccion);
  const partidoRepo = AppDataSource.getRepository(Partido);

  try {
    // Obtener predicciones del usuario
    const predicciones = await prediccionRepo.find({
      where: { usuarioId: parseInt(usuarioId) },
      relations: ['partido'],
    });

    let total = 0;
    let aciertosExactos = 0;     // 3 puntos: marcador exacto
    let aciertosResultado = 0;   // 1 punto: gana/empata/pierde

    for (const pred of predicciones) {
      const partido = await partidoRepo.findOne({
        where: { id: pred.partidoId },
      });

      // Solo si el partido ya jugó y tiene resultados
      if (partido && partido.jugado && partido.golesLocal !== null && partido.golesVisitante !== null) {
        total++;

        const golesLocalP = pred.golesLocal;
        const golesVisitanteP = pred.golesVisitante;
        const golesLocalR = partido.golesLocal!;//" ! significa Confía en mí, ya verifiqué que no es null"
        const golesVisitanteR = partido.golesVisitante!; // ! significa "Confía en mí, ya verifiqué que no es null"

        // Acierto exacto
        if (golesLocalP === golesLocalR && golesVisitanteP === golesVisitanteR) {
          aciertosExactos++;
        }
        // Acierto de resultado (gana local, empate, gana visitante)
        else {
          const resultadoPred = (golesLocalP > golesVisitanteP) ? 'local' :
                                (golesLocalP < golesVisitanteP) ? 'visitante' : 'empate';
          const resultadoReal = (golesLocalR > golesVisitanteR) ? 'local' :
                                (golesLocalR < golesVisitanteR) ? 'visitante' : 'empate';

          if (resultadoPred === resultadoReal) {
            aciertosResultado++;
          }
        }
      }
    }

    return res.json({
      totalPrediccionesContadas: total,
      aciertosExactos,
      aciertosResultado,
      semiaciertos: aciertosResultado,
      porcentajeAcierto: total > 0 ? ((aciertosExactos + aciertosResultado) / total * 100).toFixed(1) : 0,
      totalAciertos: aciertosExactos + aciertosResultado
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
});

export default router;