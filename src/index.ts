// src/index.ts
import "reflect-metadata";
import dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "../.env") });
import express from "express";
import cors from "cors";
import http from "http"; // 👈 Nuevo
import { Server as SocketIOServer } from "socket.io"; // 👈 Nuevo

import AppDataSource from "./data-source";
import partidosRouter from "./routes/matches";
import prediccionesRouter from "./routes/predictions";
import { FutbolApiService } from "./services/soccerApi.service";
import authRouter from "./routes/auth";
import { PuntosService } from "./services/points.service";
import clasificacionRouter from "./routes/classification";
import estadisticasRouter from "./routes/statistics";
import historialRouter from "./routes/history";
import cron from "node-cron";
import { ActualizarResultadosService } from "./services/updateResults.service";
import { sincronizarPartidos } from "./scripts/synchronize";
import webpush from "web-push";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
app.use(express.json());

// 👇 Creamos el servidor HTTP
const server = http.createServer(app);

// 👇 Inicializamos Socket.IO
export const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:5173",
        "https://68a3911d8f0f376efe754f64--futbol-prediccion-frontend.netlify.app",
        "https://futbol-prediccion-frontend.netlify.app",
      ];

      // Permitir solicitudes sin origen (como Postman o curl)
      if (!origin) return callback(null, true);

      // Verificar si el origen está permitido
      const isAllowed = allowedOrigins.some((allowed) =>
        origin.startsWith(allowed.trim())
      );
      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`Origin not allowed: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Rutas CORS (tu código actual)
if (process.env.NODE_ENV === "development") {
  app.use(
    cors({
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );
}

if (process.env.NODE_ENV === "production") {
  app.use(
    cors({
      origin: [
        "https://68a3911d8f0f376efe754f64--futbol-prediccion-frontend.netlify.app",
        "https://futbol-prediccion-frontend.netlify.app",
      ],
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );
}
//push(PWA)
const vapidKeys = webpush.generateVAPIDKeys();
console.log("🔑 VAPID Public Key:", vapidKeys.publicKey);
console.log("🔒 VAPID Private Key:", vapidKeys.privateKey);
// En tu backend Usa las claves que generaste
webpush.setVapidDetails(
  'mailto:clementedela@gmail.com',
  'BF4z5J27Ghp1IYRZHSZSoOeLtGoj37yiUnuy6020ndGecrmMLq2c9kWhO5lzWhj8MZ6LK2C_tmJNz7fFv7h5jq0',
  'VUZtqcrX0RA38xIFk-TPMEy3jp1wKQI_aDw-JvsqUcc'
);

// Guarda suscripciones (en memoria o DB)
export const suscripciones = new Set<PushSubscription>();

app.post('/api/notifications/subscribe', (req, res) => {
  const subscription = req.body.subscription;
  suscripciones.add(subscription);
  res.status(201).json({ message: 'Suscrito' });
});
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

    // ✅ 1. Sincronizar partidos programados
    console.log("🔄 Iniciando sincronización de partidos...");
    await sincronizarPartidos();
    console.log("✅ Partidos sincronizados al iniciar");

    cron.schedule("0 */6 * * *", async () => {
      console.log("📅 [CRON] Sincronizando partidos programados...");
      await sincronizarPartidos();
      console.log("✅ Sincronización de partidos completada");
    });

    // ✅ 2. Actualizar resultados y emitir evento
    cron.schedule("*/30 * * * *", async () => {
      console.log("📅 [CRON] Buscando partidos finalizados...");
      await ActualizarResultadosService.actualizarResultados("PD");
      console.log("✅ Resultados actualizados y puntos calculados");

      // 👇 Emitir a todos los clientes
      io.emit("partido-actualizado", {
        mensaje: "Se actualizaron los resultados de partidos finalizados",
        timestamp: new Date(),
      });
    });

    // ✅ 3. Sincronizar ligas grandes
    cron.schedule("0 2 * * *", async () => {
      console.log("📅 [CRON] Iniciando sincronización diaria de LaLiga...");
      await FutbolApiService.sincronizarLiga("PD");
      console.log("✅ [CRON] Sincronización diaria completada");

      io.emit("nuevos-partidos", {
        mensaje: "Nuevos partidos programados disponibles",
        timestamp: new Date(),
      });
    });

    // ✅ Iniciar servidor con Socket.IO
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`🎮 Socket.IO habilitado para tiempo real`);
    });
    io.on("connection", (socket) => {
      console.log("🟢 Cliente conectado:", socket.id);

      // 👇 Enviamos un evento de prueba al frontend
      socket.emit("saludo", {
        mensaje: "¡Conectado con el backend!",
        hora: new Date().toLocaleTimeString(),
      });

      socket.on("disconnect", () => {
        console.log("🔴 Cliente desconectado:", socket.id);
      });
    });
  })
  .catch((error) => {
    console.error("❌ Error al conectar con la base de datos:", error);
  });

// Recalcular puntos al iniciar
setTimeout(async () => {
  await PuntosService.calcularYPuntos();
  console.log("✅ Puntos recalculados al iniciar");

  // 👇 Notificar que los puntos están listos
  io.emit("puntos-recalculados", {
    mensaje: "Puntos iniciales recalculados",
    timestamp: new Date(),
  });
}, 2000);
