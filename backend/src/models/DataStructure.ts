import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class DataStructure {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column('jsonb')
  schema!: {
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
      description?: string;
    }>;
    relationships?: Array<{
      name: string;
      type: string;
      target: string;
    }>;
  };

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 1 })
  version!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 