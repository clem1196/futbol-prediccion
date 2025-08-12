import "reflect-metadata";
import dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "../.env") });
import express from "express";
import cors from "cors";
import AppDataSource from "./data-source";
import partidosRouter from "./routes/partidos";
import prediccionesRouter from "./routes/predicciones";
import { FutbolApiService } from "./services/futbolApi.service";
import authRouter from "./routes/auth";
import { PuntosService } from "./services/puntos.service";
import clasificacionRouter from "./routes/clasificacion";
import estadisticasRouter from "./routes/estadisticas";
import historialRouter from './routes/historial';
import cron from "node-cron";
import { ActualizarResultadosService } from "./services/actualizarResultados.service";
import { sincronizarPartidos } from './scripts/sincronizar';

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
//Debe estar ANTES de cualquier ruta y despues de app.use(express.json())
app.use(
  cors({
    origin: "http://localhost:5173", // tu frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"], // ✅ Incluye 'Authorization'
    credentials: true, // opcional, si usas cookies
  })
);

// Rutas
app.use("/api/partidos", partidosRouter);
app.use("/api/predicciones", prediccionesRouter);
app.use("/api/auth", authRouter);
app.use("/api/clasificacion", clasificacionRouter);
app.use("/api/estadisticas", estadisticasRouter);
app.use('/api/historial', historialRouter);
app.get("/", (req, res) => {
  res.send(`
    <h1>✅ API de Predicción de Fútbol</h1>
    <p>Usa <code>GET /api/partidos</code> para ver los partidos.</p>
  `);
});

// Inicializar DataSource
AppDataSource.initialize()
  .then(async() => {
    console.log("✅ Conexión con la base de datos establecida");
    // 🔁 Programar tarea diaria: Sincronizar LaLiga (PD)
    cron.schedule("0 2 * * *", async () => {
      console.log("📅 [CRON] Iniciando sincronización diaria de partidos...");
      await FutbolApiService.sincronizarLiga("PD");
      console.log("✅ [CRON] Sincronización diaria completada");
    });
    // 🔁 Calcular puntos cada hora
    cron.schedule("0 * * * *", async () => {
      console.log("📅 [CRON] Calculando puntos para partidos finalizados...");
      await PuntosService.calcularYPuntos();
    });
    // 🔁 Actualizar resultados cada 30 minutos
    cron.schedule("*/30 * * * *", async () => {
      console.log("📅 [CRON] Buscando partidos finalizados...");
      await ActualizarResultadosService.actualizarResultados("PD"); // LaLiga
      // Puedes agregar otras ligas: 'PL', 'BL1', etc.
    });
    // Opcional: Sincronizar también otras ligas
    // cron.schedule('0 3 * * *', async () => {
    //   await FutbolApiService.sincronizarLiga('PL'); // Premier League
    // });
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
// ✅ Sincroniza partidos al iniciar
    console.log('🔄 Iniciando sincronización de partidos...');
    await sincronizarPartidos();
    console.log('✅ Partidos sincronizados al iniciar');

    // Luego inicia el cron
    cron.schedule('*/30 * * * *', async () => {
      console.log('📅 [CRON] Sincronizando partidos...');
      await sincronizarPartidos();
    });
    // 🔁 Ejecutar la primera sincronización al iniciar (opcional)
    // Descomenta si querés que se ejecute ahora al iniciar
    //console.log('🔧 Sincronizando por primera vez al iniciar...');
    //FutbolApiService.sincronizarLiga('PD');
  })
  .catch((error) => {
    console.error("❌ Error al conectar con la base de datos:", error);
  });
// Después de AppDataSource.initialize()
setTimeout(async () => {
  await PuntosService.calcularYPuntos();
  console.log("✅ Puntos recalculados al iniciar");
}, 2000);
