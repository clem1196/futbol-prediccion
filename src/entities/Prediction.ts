import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';        // ✅ Ahora existe
import { Match } from './Match';

@Entity()
export class Prediction {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuarioId' })
  usuario!: User;

  @ManyToOne(() => Match)
  @JoinColumn({ name: 'partidoId' })
  partido!: Match;

  @Column({ type: 'int' })
  golesLocal!: number;

  @Column({ type: 'int' })
  golesVisitante!: number;

  @Column({ type: 'int', default: 0 })
  puntos!: number;

  @Column({ name: 'usuarioId', nullable: true })
  usuarioId?: number;

  @Column({ name: 'partidoId', nullable: true })
  partidoId?: number;
}