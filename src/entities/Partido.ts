import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Equipo } from './Equipo';

@Entity()
export class Partido {
  @PrimaryGeneratedColumn()
    id!: number;

  @ManyToOne(() => Equipo)
    @JoinColumn({ name: 'equipoLocalId' })
    equipoLocal!: Equipo;

  @ManyToOne(() => Equipo)
    @JoinColumn({ name: 'equipoVisitanteId' })
    equipoVisitante!: Equipo;

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