declare namespace API {
  type ApiField =
    // #/components/schemas/BaseField
    BaseField & {
      type?: "api";
      /** API接口地址 */
      endpoint?: string;
      /** 请求方法 */
      method?: "GET" | "POST" | "PUT" | "DELETE";
      /** 请求参数配置 */
      params?: Record<string, any>;
      /** 请求头配置 */
      headers?: Record<string, any>;
      /** 返回结果映射配置 */
      resultMapping?: Record<string, any>;
    };

  type BaseField = {
    /** 字段ID（系统自动生成） */
    id?: string;
    /** 字段名称（必须以小写字母开头，只能包含小写字母、数字和下划线） */
    name: string;
    /** 字段类型 */
    type:
      | "uuid"
      | "auto-increment"
      | "string"
      | "text"
      | "number"
      | "boolean"
      | "date"
      | "enum"
      | "relation"
      | "media"
      | "api";
    /** 字段描述（支持多行文本） */
    description?: string;
    /** 是否必填 */
    isRequired?: boolean;
    /** 默认值 */
    defaultValue?: string;
  };

  type DataStructure = {
    /** 数据结构ID */
    id?: string;
    /** 数据结构名称 */
    name: string;
    /** 数据结构定义（JSON Schema） */
    schema?: Record<string, any>;
    /** 数据结构描述 */
    description?: string;
    /** 是否启用 */
    isActive?: boolean;
    /** 版本号 */
    version?: number;
    /** 创建时间 */
    createdAt?: string;
    /** 更新时间 */
    updatedAt?: string;
    /** 数据结构代码 */
    code: string;
    /** 字段定义列表 */
    fields: BaseField[];
  };

  type DateField =
    // #/components/schemas/BaseField
    BaseField & {
      type?: "date";
      /** 日期类型 */
      dateType?: "year" | "year-month" | "date" | "datetime";
      /** 是否使用当前时间作为默认值 */
      useNowAsDefault?: boolean;
    };

  type deleteEnumsIdParams = {
    /** 枚举ID */
    id: string;
  };

  type deleteSchemasIdParams = {
    /** 数据结构定义ID */
    id: string;
  };

  type Enum = {
    /** 枚举ID */
    id: string;
    /** 枚举代码（使用:分隔的多级结构，如 system:user:status） */
    code: string;
    /** 枚举名称 */
    name: string;
    /** 枚举描述 */
    description?: string;
    options: {
      value: string;
      label: string;
      description?: string;
      order?: number;
    }[];
    /** 是否启用 */
    isActive: boolean;
    /** 创建时间 */
    createdAt?: string;
    /** 更新时间 */
    updatedAt?: string;
  };

  type EnumField =
    // #/components/schemas/BaseField
    BaseField & {
      type?: "enum";
      /** 关联的枚举定义ID */
      enumId?: string;
      /** 是否允许多选 */
      multiple?: boolean;
      /** 默认选中的枚举值 */
      defaultValues?: string[];
    };

  type EnumOption = {
    /** 选项键 */
    key: string;
    /** 选项值 */
    value: string;
    /** 选项描述 */
    description?: string;
    /** 排序号 */
    sortOrder?: number;
    /** 是否启用 */
    isActive?: boolean;
  };

  type getEnumsCodeCodeParams = {
    /** 枚举代码 */
    code: string;
  };

  type getEnumsIdParams = {
    /** 枚举ID */
    id: string;
  };

  type getEnumsParams = {
    /** 是否只返回启用的枚举 */
    isActive?: boolean;
    /** 按枚举代码模糊搜索 */
    code?: string;
    /** 按枚举名称模糊搜索 */
    name?: string;
  };

  type getSchemasIdParams = {
    /** 数据结构定义ID */
    id: string;
  };

  type getSchemasParams = {
    /** 按数据结构代码模糊搜索 */
    code?: string;
    /** 按数据结构名称模糊搜索 */
    name?: string;
  };

  type MediaField =
    // #/components/schemas/BaseField
    BaseField & {
      type?: "media";
      /** 媒体类型 */
      mediaType?: "image" | "video" | "audio" | "document" | "file";
      /** 允许的文件格式 */
      formats?: string[];
      /** 最大文件大小限制（MB） */
      maxSize?: number;
      /** 是否允许多个媒体 */
      multiple?: boolean;
    };

  type NumberField =
    // #/components/schemas/BaseField
    BaseField & {
      type?: "number";
      /** 数字类型 */
      numberType?: "integer" | "float" | "decimal";
      /** 精度 */
      precision?: number;
      /** 小数位数 */
      scale?: number;
    };

  type postSchemasIdValidateParams = {
    /** 数据结构定义ID */
    id: string;
  };

  type putEnumsIdParams = {
    /** 枚举ID */
    id: string;
  };

  type putSchemasIdParams = {
    /** 数据结构定义ID */
    id: string;
  };

  type RelationField =
    // #/components/schemas/BaseField
    BaseField & {
      type?: "relation";
      /** 目标数据表的schema标识 */
      targetSchema?: string;
      /** 关联的目标字段（默认为主键） */
      targetField?: string;
      /** 是否允许多选 */
      multiple?: boolean;
      /** 关联记录删除时的处理策略 */
      cascadeDelete?: "restrict" | "cascade" | "setNull";
      /** 选择关联数据时展示的字段列表 */
      displayFields?: string[];
    };

  type StringField =
    // #/components/schemas/BaseField
    BaseField & {
      /** 字符串类型（varchar） */
      type?: "string";
      /** 字符串长度限制 */
      length?: number;
    };

  type TextField =
    // #/components/schemas/BaseField
    BaseField & {
      /** 文本类型（text） */
      type?: "text";
      /** 最大文本长度 */
      maxLength?: number;
    };

  type EnumTreeNode = {
    /** 节点值（用于级联选择器） */
    value: string;
    /** 节点标签（用于显示） */
    label: string;
    /** 子节点 */
    children?: EnumTreeNode[];
    /** 节点ID（叶子节点为枚举ID，非叶子节点为临时ID） */
    id: string;
    /** 是否启用 */
    isActive: boolean;
    /** 节点描述（仅叶子节点有） */
    description?: string;
    /** 枚举选项（仅叶子节点有） */
    options?: {
      value: string;
      label: string;
      description?: string;
      order?: number;
    }[];
    /** 原始枚举数据（仅叶子节点有） */
    rawEnum?: Enum;
  };
}
