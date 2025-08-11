import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100, unique: true })
  email!: string;

  @Column({ length: 50 })
  nombre!: string;

  @Column()
  password!: string; // Hashed
}