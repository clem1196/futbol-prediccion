import { DataSource } from "typeorm";
import "reflect-metadata";
//import { Equipo } from "./entities/Equipo";
//import { Partido } from "./entities/Partido";
//import { Prediccion } from "./entities/Prediccion";
//import { Usuario } from "./entities/Usuario";
//connection for production
import path from "path";
import { Partido } from "./entities/Partido";
import { Equipo } from "./entities/Equipo";
import { Prediccion } from "./entities/Prediccion";
import { Usuario } from "./entities/Usuario";
/*let ent = ["src/entities/*.ts"];
if (path.extname(__filename) === ".js") {
  ent = ["build/entities/*.js"];
}*/
const isProd = process.env.NODE_ENV === 'production';

const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: isProd
    ? [path.join(__dirname, '/entities/*.js')]
    : [Equipo, Usuario, Partido, Prediccion],

  synchronize: true,
  logging: false,
});
export default AppDataSource
