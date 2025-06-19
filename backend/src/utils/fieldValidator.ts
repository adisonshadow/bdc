import { Field, FieldType, DateType } from '../models/DataStructure';
import { ValidationError } from '../errors/types';

export class FieldValidator {
  /**
   * 验证字段名称
   * @param name 字段名称
   */
  static validateFieldName(name: string): void {
    const nameRegex = /^[a-z][a-z0-9_]*$/;
    if (!nameRegex.test(name)) {
      throw new ValidationError('字段名称必须以小写字母开头，只能包含小写字母、数字和下划线');
    }
  }

  /**
   * 验证字段基本属性
   * @param field 字段定义
   */
  static validateBasicProperties(field: Field): void {
    if (!field.name) {
      throw new ValidationError('字段名称是必填项');
    }
    this.validateFieldName(field.name);

    if (!field.type) {
      throw new ValidationError('字段类型是必填项');
    }
    if (!Object.values(FieldType).includes(field.type)) {
      throw new ValidationError('无效的字段类型');
    }
  }

  /**
   * 验证字符串类型字段
   * @param field 字段定义
   */
  static validateStringField(field: Field): void {
    if (field.length !== undefined && (field.length < 1 || field.length > 65535)) {
      throw new ValidationError('字符串长度必须在 1-65535 之间');
    }
  }

  /**
   * 验证日期类型字段
   * @param field 字段定义
   */
  static validateDateField(field: Field): void {
    if (field.dateType && !Object.values(DateType).includes(field.dateType)) {
      throw new ValidationError('无效的日期类型');
    }
  }

  /**
   * 验证枚举类型字段
   * @param field 字段定义
   */
  static validateEnumField(field: Field): void {
    if (!field.enumConfig) {
      throw new ValidationError('枚举类型字段必须提供 enumConfig');
    }
    if (!field.enumConfig.targetEnumCode) {
      throw new ValidationError('枚举类型字段必须指定 targetEnumCode');
    }
  }

  /**
   * 验证媒体类型字段
   * @param field 字段定义
   */
  static validateMediaField(field: Field): void {
    if (!field.mediaConfig) {
      throw new ValidationError('媒体类型字段必须提供 mediaConfig');
    }
    const { mediaType, formats, maxSize } = field.mediaConfig;
    if (!['image', 'video', 'audio', 'document', 'file'].includes(mediaType)) {
      throw new ValidationError('无效的媒体类型');
    }
    if (!Array.isArray(formats) || formats.length === 0) {
      throw new ValidationError('必须指定允许的文件格式');
    }
    if (maxSize <= 0) {
      throw new ValidationError('文件大小限制必须大于 0');
    }
  }

  /**
   * 验证关联类型字段
   * @param field 字段定义
   */
  static validateRelationField(field: Field): void {
    if (!field.relationConfig) {
      throw new ValidationError('关联类型字段必须提供 relationConfig');
    }
    const { targetSchemaCode, cascadeDelete, displayFields } = field.relationConfig;
    if (!targetSchemaCode) {
      throw new ValidationError('必须指定目标数据结构');
    }
    if (!['restrict', 'cascade', 'setNull'].includes(cascadeDelete)) {
      throw new ValidationError('无效的级联删除策略');
    }
    if (!Array.isArray(displayFields) || displayFields.length === 0) {
      throw new ValidationError('必须指定显示字段');
    }
  }

  /**
   * 验证 API 数据源字段
   * @param field 字段定义
   */
  static validateApiField(field: Field): void {
    if (!field.apiConfig) {
      throw new ValidationError('API 数据源字段必须提供 apiConfig');
    }
    const { endpoint, method, resultMapping } = field.apiConfig;
    if (!endpoint) {
      throw new ValidationError('必须指定 API 端点');
    }
    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
      throw new ValidationError('无效的 HTTP 方法');
    }
    if (!resultMapping || !resultMapping.path || !resultMapping.fields) {
      throw new ValidationError('必须指定结果映射配置');
    }
  }

  /**
   * 验证字段定义
   * @param field 字段定义
   */
  static validateField(field: Field): void {
    // 验证基本属性
    this.validateBasicProperties(field);

    // 根据字段类型进行特定验证
    switch (field.type) {
      case FieldType.STRING:
      case FieldType.TEXT:
        this.validateStringField(field);
        break;
      case FieldType.DATE:
        this.validateDateField(field);
        break;
      case FieldType.ENUM:
        this.validateEnumField(field);
        break;
      case FieldType.MEDIA:
        this.validateMediaField(field);
        break;
      case FieldType.RELATION:
        this.validateRelationField(field);
        break;
      case FieldType.API:
        this.validateApiField(field);
        break;
    }
  }

  /**
   * 验证字段列表
   * @param fields 字段列表
   */
  static validateFields(fields: Field[]): void {
    // 验证是否为数组
    if (!Array.isArray(fields)) {
      throw new ValidationError('字段列表必须是数组');
    }

    // 如果字段列表为空，直接返回
    if (fields.length === 0) {
      return;
    }

    // 检查字段名称是否重复
    const fieldNames = new Set<string>();
    fields.forEach(field => {
      if (fieldNames.has(field.name)) {
        throw new ValidationError(`字段名称 "${field.name}" 重复`);
      }
      fieldNames.add(field.name);
    });

    // 验证每个字段
    fields.forEach(field => this.validateField(field));
  }
} 