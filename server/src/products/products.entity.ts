import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('produtos')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column('decimal', { precision: 10, scale: 2 })
  preco: number;
}
