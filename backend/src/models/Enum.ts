import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

interface EnumOption {
  value: string;
  label: string;
  description?: string;
  order?: number;
}

@Entity({ name: 'enums', schema: 'bdc' })
export class Enum {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ 
    type: 'varchar', 
    length: 100, 
    unique: true,
    nullable: false 
  })
  code: string;

  @Column({ 
    type: 'varchar', 
    length: 100,
    nullable: false 
  })
  name: string;

  @Column({ 
    type: 'varchar', 
    length: 100,
    nullable: true,
    comment: '枚举描述'
  })
  description: string;

  @Column({ 
    type: 'jsonb', 
    nullable: false 
  })
  options: EnumOption[];

  @Column({ 
    type: 'boolean', 
    default: true,
    name: 'is_active'
  })
  isActive: boolean;

  @CreateDateColumn({ 
    type: 'timestamp with time zone',
    name: 'created_at'
  })
  createdAt: Date;

  @UpdateDateColumn({ 
    type: 'timestamp with time zone',
    name: 'updated_at'
  })
  updatedAt: Date;

  // 验证方法
  validateCode(): boolean {
    const codeRegex = /^[a-z][a-z0-9_:]*$/;
    return codeRegex.test(this.code);
  }

  validateName(): boolean {
    return typeof this.name === 'string' && this.name.length > 0;
  }

  validateOptions(): boolean {
    if (!Array.isArray(this.options)) {
      return false;
    }
    return this.options.every(option => 
      typeof option.value === 'string' && 
      typeof option.label === 'string' &&
      (!option.description || typeof option.description === 'string') &&
      (!option.order || typeof option.order === 'number')
    );
  }
} 