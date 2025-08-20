import 'reflect-metadata';
import dotenv from 'dotenv';
import { resolve } from 'path';

// 🔥 Cargar variables de entorno ANTES de cualquier otra cosa
dotenv.config({ path: resolve(__dirname, '../../.env') });
import AppDataSource from '../data-source';
import { ActualizarResultadosService } from '../services/updateResults.service';

AppDataSource.initialize()
  .then(async () => {
    await ActualizarResultadosService.actualizarResultados('PD');
    console.log('🎯 Actualización de resultados completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error al conectar con la base de datos:', error);
    process.exit(1);
  });