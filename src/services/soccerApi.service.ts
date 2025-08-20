import axios from "axios";
import AppDataSource from "../data-source";
import { Team } from "../entities/Team";
import { Match } from "../entities/Match";
import { FutbolApiMatchesResponse } from "../types/soccerApi";

const API_URL = "https://api.football-data.org/v4";


export class FutbolApiService {
  static async sincronizarLiga(ligaId: string) {
    const partidoRepo = AppDataSource.getRepository(Match);
    const equipoRepo = AppDataSource.getRepository(Team);
    // ✅ Validar aquí, cuando el método se llama
    const API_KEY = process.env.FOOTBALL_API_KEY;
    if (!API_KEY) {
      console.error("❌ FOOTBALL_API_KEY no está definida");
      return;
    }

    const headers = {
      "X-Auth-Token": API_KEY,
      "User-Agent": "FutbolPrediccionApp/1.0", // Recomendado por la API
    };
    try {
      console.log(`🔄 Sincronizando liga: ${ligaId}`);
      const response = await axios.get<FutbolApiMatchesResponse>(
        `${API_URL}/competitions/${ligaId}/matches?status=SCHEDULED`,
        { headers }
      );
      const partidos = response.data.matches;

      for (const match of partidos) {
        // Validación básica
        if (!match.homeTeam?.name || !match.awayTeam?.name) {
          console.warn("⚠️  Partido con equipos incompletos, omitido:", match);
          continue;
        }

        function getPaisFromCompetition(competitionId: number): string {
          const paisesPorLiga: Record<number, string> = {
            2014: "Spain", // PD - LaLiga
            2021: "England", // PL - Premier League
            2002: "Germany", // BL1 - Bundesliga
            2019: "Italy", // SA - Serie A
            2015: "France", // FL1 - Ligue 1
          };
          return paisesPorLiga[competitionId] || "Desconocido";
        }
        const pais =
          match.competition?.area?.name ||
          (match.competition?.id
            ? getPaisFromCompetition(match.competition.id)
            : "Desconocido");
        // Guardar equipo local
        let equipoLocal = await equipoRepo.findOneBy({
          nombre: match.homeTeam.name,
        });
        if (!equipoLocal) {
          equipoLocal = equipoRepo.create({
            nombre: match.homeTeam.name,
            pais,
          });
          await equipoRepo.save(equipoLocal);
          console.log(`✅ Equipo creado: ${equipoLocal.nombre}`);
        }

        // Guardar equipo visitante
        let equipoVisitante = await equipoRepo.findOneBy({
          nombre: match.awayTeam.name,
        });
        if (!equipoVisitante) {
          equipoVisitante = equipoRepo.create({
            nombre: match.awayTeam.name,
            pais,
          });
          await equipoRepo.save(equipoVisitante);
          console.log(`✅ Equipo creado: ${equipoVisitante.nombre}`);
        }

        // Verificar si el partido ya existe
        const fechaPartido = new Date(match.utcDate);
        const partidoExiste = await partidoRepo.findOneBy({
          equipoLocalId: equipoLocal.id,
          equipoVisitanteId: equipoVisitante.id,
          fecha: fechaPartido,
        });

        if (!partidoExiste) {
          const partido = partidoRepo.create({
            equipoLocal,
            equipoVisitante,
            fecha: fechaPartido,
            jugado: false,
          });
          await partidoRepo.save(partido);
          console.log(
            `✅ Partido agregado: ${equipoLocal.nombre} vs ${equipoVisitante.nombre}`
          );
        }
      }

      console.log("🎉 Sincronización completada.");
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.error(
          "❌ Acceso denegado: verifica tu API Key o límite de peticiones."
        );
      } else if (error.response?.status === 429) {
        console.error("❌ Demasiadas peticiones. Espera un minuto.");
      } else {
        console.error("❌ Error al consumir la API:", error.message);
      }
    }
  }
}
