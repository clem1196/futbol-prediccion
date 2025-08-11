import { DataSource } from "typeorm";
import { Equipo } from "./entities/Equipo";
import { Partido } from "./entities/Partido";
import { Prediccion } from "./entities/Prediccion";
import { Usuario } from "./entities/Usuario";

const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST||"localhost",
  port: Number(process.env.DB_PORT) || 3306,
  username:process.env.DB_USERNAME|| "root",
  password:process.env.DB_PASSWORD|| "c1l2e3m1196",
  database:process.env.DB_NAME|| "predictiondb",
  entities: [Equipo, Partido, Prediccion, Usuario],
  synchronize: true,
  logging: false,
});

export default AppDataSource;
