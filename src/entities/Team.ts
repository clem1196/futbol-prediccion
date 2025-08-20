import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Match } from "./Match";

@Entity()
export class Team {
  @PrimaryGeneratedColumn()
  id!: number; // "!" indica que será inicializada por TypeORM
  @Column({ name: "idApi" }) // ← Así se guarda en la DB como idApi
  idApi!: number; 
  @Column({ type: "varchar", length: 100 })
  nombre!: string;
  @Column({ type: "varchar", default:"España", length: 50 })
  pais!: string;
  @OneToMany(() => Match, (partido) => partido.equipoLocal)
  partidosComoLocal!: Match[];

  @OneToMany(() => Match, (partido) => partido.equipoVisitante)
  partidosComoVisitante!: Match[];
}
