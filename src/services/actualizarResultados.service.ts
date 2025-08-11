import axios from 'axios';
import AppDataSource from '../data-source';
import { Partido } from '../entities/Partido';
console.log('🔑 API Key cargada:', process.env.FOOTBALL_API_KEY ? '✅ Sí' : '❌ No');
if (!process.env.FOOTBALL_API_KEY) {
  throw new Error('FOOTBALL_API_KEY no está definida');
}
const API_URL = 'https://api.football-data.org/v4';
const API_KEY = process.env.FOOTBALL_API_KEY;

const headers = {
  'X-Auth-Token': API_KEY,
};

export class ActualizarResultadosService {
  static async actualizarResultados(ligaId: string) {
    const partidoRepo = AppDataSource.getRepository(Partido);

    try {
      console.log(`🔄 Actualizando resultados para la liga: ${ligaId}`);

      // Obtener partidos finalizados
      const response = await axios.get(
        `${API_URL}/competitions/${ligaId}/matches?status=FINISHED`,
        { headers }
      );

      const partidos = response.data.matches;

      for (const match of partidos) {
        const fecha = new Date(match.utcDate);

        // Buscar partido en la base de datos
        const partido = await partidoRepo.findOne({
          where: {
            fecha: fecha,
            equipoLocalId: match.homeTeam.id,
            equipoVisitanteId: match.awayTeam.id,
          },
        });

        if (partido && !partido.jugado) {
          // Actualizar con resultados reales
          partido.golesLocal = match.score.fullTime.home;
          partido.golesVisitante = match.score.fullTime.away;
          partido.jugado = true;

          await partidoRepo.save(partido);
          console.log(
            `✅ Partido actualizado: ${partido.equipoLocal.nombre} ${partido.golesLocal} - ${partido.golesVisitante} ${partido.equipoVisitante.nombre}`
          );
        }
      }

      console.log('🎉 Resultados actualizados. Calculando puntos...');
      // Disparar cálculo de puntos
      await import('./puntos.service').then(async (mod) => {
        await mod.PuntosService.calcularYPuntos();
      });
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.error('❌ Acceso denegado: verifica tu API Key');
      } else if (error.response?.status === 429) {
        console.error('❌ Demasiadas peticiones. Espera un minuto.');
      } else {
        console.error('❌ Error al actualizar resultados:', error.message);
      }
    }
  }
}