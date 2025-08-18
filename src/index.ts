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
import historialRouter from "./routes/historial";
import cron from "node-cron";
import { ActualizarResultadosService } from "./services/actualizarResultados.service";
import { sincronizarPartidos } from "./scripts/sincronizar";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
app.use(express.json());

//Debe estar ANTES de cualquier ruta y despues de app.use(express.json())
if (process.env.NODE_ENV === "development") {
  app.use(
    cors({      
      origin: "http://localhost:5173", //para desarrollo
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"], // ✅ Incluye 'Authorization'
      credentials: true, // Necesario si usas cookies o credenciales
    })
  );
}
if (process.env.NODE_ENV === "production") {
  app.use(
    cors({
      //para produccion
      origin: [
      "https://68a38d1cc986d06129654cc3--futbol-prediccion-frontend.netlify.app",
      "https://futbol-prediccion-frontend.netlify.app",
    ], 
     
    })
  );
}

// Rutas
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});
app.use("/api/partidos", partidosRouter);
app.use("/api/predicciones", prediccionesRouter);
app.use("/api/auth", authRouter);
app.use("/api/clasificacion", clasificacionRouter);
app.use("/api/estadisticas", estadisticasRouter);
app.use("/api/historial", historialRouter);
app.get("/", (req, res) => {
  res.send(`
    <h1>✅ API de Predicción de Fútbol</h1>
    <p>Usa <code>GET /api/partidos</code> para ver los partidos.</p>
  `);
});

// Inicializar DataSource
AppDataSource.initialize()
  .then(async () => {
    console.log("✅ Conexión con la base de datos establecida");

    // ✅ 1. Sincronizar partidos programados (futuros)
    // Ejecutar al iniciar
    console.log("🔄 Iniciando sincronización de partidos...");
    await sincronizarPartidos();
    console.log("✅ Partidos sincronizados al iniciar");

    // Programar sincronización diaria (o cada 6 horas)
    cron.schedule("0 */6 * * *", async () => {
      console.log("📅 [CRON] Sincronizando partidos programados...");
      await sincronizarPartidos();
      console.log("✅ Sincronización de partidos completada");
    });

    // ✅ 2. Actualizar resultados de partidos finalizados
    // Cada 30 minutos
    cron.schedule("*/30 * * * *", async () => {
      console.log("📅 [CRON] Buscando partidos finalizados...");
      await ActualizarResultadosService.actualizarResultados("PD");
      console.log("✅ Resultados actualizados y puntos calculados");
    });

    // ✅ 3. Calcular puntos (opcional: solo si no lo hace actualizarResultados)
    // PuntosService.calcularYPuntos() ya se llama dentro de actualizarResultados
    // → No necesitas un cron aparte a menos que sea para otra liga

    // ✅ 4. Sincronizar ligas grandes una vez al día
    cron.schedule("0 2 * * *", async () => {
      console.log("📅 [CRON] Iniciando sincronización diaria de LaLiga...");
      await FutbolApiService.sincronizarLiga("PD");
      console.log("✅ [CRON] Sincronización diaria completada");
    });
    // ✅ Iniciar servidor
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Error al conectar con la base de datos:", error);
  });
// Después de AppDataSource.initialize()
setTimeout(async () => {
  await PuntosService.calcularYPuntos();
  console.log("✅ Puntos recalculados al iniciar");
}, 2000);
