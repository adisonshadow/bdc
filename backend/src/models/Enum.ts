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

  validateOptions(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!Array.isArray(this.options)) {
      return { isValid: false, errors: ['枚举选项必须是数组'] };
    }
    
    const valuePattern = /^[a-z0-9_]+$/;
    const seenValues = new Set<string>();
    
    this.options.forEach((option, index) => {
      // 检查必填字段
      if (!option.value) {
        errors.push(`第 ${index + 1} 个选项缺少 value 字段`);
      }
      if (!option.label) {
        errors.push(`第 ${index + 1} 个选项缺少 label 字段`);
      }
      
      // 检查 value 格式
      if (option.value && !valuePattern.test(option.value)) {
        errors.push(`选项值 "${option.value}" 格式不正确，只能包含小写字母、数字和下划线`);
      }
      
      // 检查 value 唯一性
      if (option.value) {
        if (seenValues.has(option.value)) {
          errors.push(`选项值 "${option.value}" 重复`);
        } else {
          seenValues.add(option.value);
        }
      }
      
      // 检查可选字段类型
      if (option.description !== undefined && typeof option.description !== 'string') {
        errors.push(`选项值 "${option.value}" 的 description 字段必须是字符串类型`);
      }
      
      if (option.order !== undefined && typeof option.order !== 'number') {
        errors.push(`选项值 "${option.value}" 的 order 字段必须是数字类型`);
      }
    });
    
    return { isValid: errors.length === 0, errors };
  }
} 