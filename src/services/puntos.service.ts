
import { Prediccion } from '../entities/Prediccion';
import { Partido } from '../entities/Partido';
import AppDataSource from '../data-source';

export class PuntosService {
  static async calcularYPuntos() {
    const partidoRepo = AppDataSource.getRepository(Partido);
    const prediccionRepo = AppDataSource.getRepository(Prediccion);

    // Buscar partidos finalizados sin goles actualizados en predicciones
    const partidosJugados = await partidoRepo.find({
      where: { jugado: true },
      relations: ['equipoLocal', 'equipoVisitante'],
    });

    for (const partido of partidosJugados) {
      const predicciones = await prediccionRepo.find({
        where: { partidoId: partido.id },
        relations: ['partido'],
      });

      for (const prediccion of predicciones) {
        let puntos = 0;

        // Verificar si el marcador es exacto
        if (
          prediccion.golesLocal === partido.golesLocal &&
          prediccion.golesVisitante === partido.golesVisitante
        ) {
          puntos = 3;
        }
        // Verificar si acertó el resultado (gana local, empate, gana visitante)
        else {
          const resultadoPredicho = this.getResultado(prediccion.golesLocal, prediccion.golesVisitante);
          const resultadoReal = this.getResultado(partido.golesLocal!, partido.golesVisitante!);

          if (resultadoPredicho === resultadoReal) {
            puntos = 1;
          }
        }

        // Solo actualizamos si cambió
        if (prediccion.puntos !== puntos) {
          prediccion.puntos = puntos;
          await prediccionRepo.save(prediccion);
          console.log(`✅ Puntos actualizados: Predicción ${prediccion.id} → ${puntos} pts`);
        }
      }
    }

    console.log('🎉 Cálculo de puntos completado.');
  }

  private static getResultado(golesLocal: number, golesVisitante: number): 'local' | 'empate' | 'visitante' {
    if (golesLocal > golesVisitante) return 'local';
    if (golesLocal < golesVisitante) return 'visitante';
    return 'empate';
  }
}