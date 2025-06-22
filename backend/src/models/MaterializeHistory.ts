import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'materialize_history', schema: 'bdc' })
export class MaterializeHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'connection_id' })
  connectionId: string;

  @Column({ name: 'connection_name' })
  connectionName: string;

  @Column({ type: 'jsonb', name: 'schema_codes' })
  schemaCodes: string[];

  @Column({ type: 'jsonb' })
  config: {
    overwrite?: boolean;
    includeIndexes?: boolean;
    includeConstraints?: boolean;
    targetSchema?: string;
    tablePrefix?: string;
  };

  @Column({
    type: 'enum',
    enum: ['success', 'failed', 'pending'],
    default: 'pending'
  })
  status: 'success' | 'failed' | 'pending';

  @Column({ type: 'jsonb' })
  results: Array<{
    schemaCode: string;
    success: boolean;
    message: string;
    tableName?: string;
    error?: string;
  }>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt?: Date;
} 