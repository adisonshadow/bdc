import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ai_configs', { schema: 'bdc' })
export class AiConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  provider: string;

  @Column({ type: 'varchar', length: 500, nullable: false, name: 'api_url' })
  apiUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: false, name: 'api_key' })
  apiKey: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  model: string;

  @Column({ type: 'jsonb', nullable: true })
  config: any;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt: Date;

  // 验证方法
  validateProvider(): boolean {
    return !!this.provider && this.provider.trim().length > 0;
  }

  validateApiUrl(): boolean {
    return !!this.apiUrl && this.apiUrl.trim().length > 0;
  }

  validateApiKey(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  validateModel(): boolean {
    return !!this.model && this.model.trim().length > 0;
  }

  validateAll(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.validateProvider()) {
      errors.push('提供商不能为空');
    }

    if (!this.validateApiUrl()) {
      errors.push('API地址不能为空');
    }

    if (!this.validateApiKey()) {
      errors.push('API密钥不能为空');
    }

    if (!this.validateModel()) {
      errors.push('模型名称不能为空');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 