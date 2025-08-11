import 'reflect-metadata';
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
  });