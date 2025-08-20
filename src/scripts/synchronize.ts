// backend/src/scripts/sincronizar.ts
import AppDataSource from '../data-source';
import { Match } from '../entities/Match';
import { Team } from '../entities/Team';
import axios from 'axios';

const API_KEY = process.env.FOOTBALL_API_KEY;
const API_URL = 'https://api.football-data.org/v4';

export const sincronizarPartidos = async () => {
  const partidoRepo = AppDataSource.getRepository(Match);
  const equipoRepo = AppDataSource.getRepository(Team);

  try {
    const response = await axios.get(`${API_URL}/competitions/PD/matches?status=SCHEDULED`, {
      headers: { 'X-Auth-Token': API_KEY }
    });

    for (const match of response.data.matches) {
      // Buscar equipo local por idApi
      let equipoLocal = await equipoRepo.findOne({
        where: { idApi: match.homeTeam.id }
      });

      if (!equipoLocal) {
        equipoLocal = equipoRepo.create({
          idApi: match.homeTeam.id,
          nombre: match.homeTeam.name,
          pais: match.homeTeam.country || 'España'
        });
        await equipoRepo.save(equipoLocal);
        console.log(`✅ Equipo creado: ${equipoLocal.nombre}`);
      }

      // Buscar equipo visitante por idApi
      let equipoVisitante = await equipoRepo.findOne({
        where: { idApi: match.awayTeam.id }
      });

      if (!equipoVisitante) {
        equipoVisitante = equipoRepo.create({
          idApi: match.awayTeam.id,
          nombre: match.awayTeam.name,
          pais: match.awayTeam.country || 'España'
        });
        await equipoRepo.save(equipoVisitante);
        console.log(`✅ Equipo creado: ${equipoVisitante.nombre}`);
      }

      // Verificar si el partido ya existe
      const partidoExistente = await partidoRepo.findOne({
        where: {
          fecha: new Date(match.utcDate),
          equipoLocalId: equipoLocal.id,
          equipoVisitanteId: equipoVisitante.id
        }
      });

      if (!partidoExistente) {
        const nuevoPartido = partidoRepo.create({
          fecha: new Date(match.utcDate),
          equipoLocal,
          equipoVisitante,
          equipoLocalId: equipoLocal.id,
          equipoVisitanteId: equipoVisitante.id,
          jugado: false,
         
        });
        await partidoRepo.save(nuevoPartido);
        console.log(`✅ Partido guardado: ${equipoLocal.nombre} vs ${equipoVisitante.nombre}`);
      }
    }
  } catch (error: any) {
    console.error('❌ Error al sincronizar partidos:', error.message);
  }
};
/*import 'reflect-metadata';
import dotenv from 'dotenv'; // ← Importa dotenv
import AppDataSource from '../data-source';
import { FutbolApiService } from '../services/futbolApi.service';
dotenv.config(); // ← ¡Esta línea es clave!

// Ahora sí puedes usar process.env
console.log('API Key cargada:', process.env.FOOTBALL_API_KEY ? '✅ Sí' : '❌ No');
AppDataSource.initialize()
  .then(async () => {
    console.log('✅ Base de datos conectada');
    await FutbolApiService.sincronizarLiga('PD'); // 'PD' = LaLiga
    // Puedes probar con:
    // 'PL' = Premier League (Inglaterra)
    // 'BL1' = Bundesliga (Alemania)
    // 'SA' = Serie A (Italia)
  })
  .catch((error) => {
    console.error('❌ Error:', error);
  });*/