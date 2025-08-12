import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Partido } from "./Partido";

@Entity()
export class Equipo {
  @PrimaryGeneratedColumn()
  id!: number; // "!" indica que será inicializada por TypeORM
  @Column({ name: "idApi" }) // ← Así se guarda en la DB como idApi
  idApi!: number; 
  @Column({ type: "varchar", length: 100 })
  nombre!: string;
  @Column({ type: "varchar", default:"España", length: 50 })
  pais!: string;
  @OneToMany(() => Partido, (partido) => partido.equipoLocal)
  partidosComoLocal!: Partido[];

  @OneToMany(() => Partido, (partido) => partido.equipoVisitante)
  partidosComoVisitante!: Partido[];
}
