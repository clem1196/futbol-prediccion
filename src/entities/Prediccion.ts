import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './Usuario';        // ✅ Ahora existe
import { Partido } from './Partido';

@Entity()
export class Prediccion {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuarioId' })
  usuario!: Usuario;

  @ManyToOne(() => Partido)
  @JoinColumn({ name: 'partidoId' })
  partido!: Partido;

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