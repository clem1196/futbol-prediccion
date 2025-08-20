import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Team } from './Team';

@Entity()
export class Match {
  @PrimaryGeneratedColumn()
    id!: number;

  @ManyToOne(() => Team)
    @JoinColumn({ name: 'equipoLocalId' })
    equipoLocal!: Team;

  @ManyToOne(() => Team)
    @JoinColumn({ name: 'equipoVisitanteId' })
    equipoVisitante!: Team;

  @Column({ type: 'timestamp', nullable: false })
    fecha!: Date;

  @Column({ type: 'int', nullable: true })
    golesLocal?: number;

  @Column({ type: 'int', nullable: true })
    golesVisitante?: number;

  @Column({ type: 'boolean', default: false })
    jugado!: boolean;

  @Column({ type: 'int', nullable: true })
    equipoLocalId?: number;

  @Column({ type: 'int', nullable: true })
    equipoVisitanteId?: number;
}