// 枚举校验工具
export interface EnumValidationIssue {
  type: 'error' | 'warning';
  field: string;
  message: string;
  details?: any;
}

export interface EnumValidationResult {
  isValid: boolean;
  issues: EnumValidationIssue[];
  errorCount: number;
  warningCount: number;
}

// 校验枚举数据
export const validateEnum = (enumData: API.Enum): EnumValidationResult => {
  const issues: EnumValidationIssue[] = [];

  // 校验基本信息
  if (!enumData.code) {
    issues.push({
      type: 'error',
      field: 'code',
      message: '枚举代码不能为空'
    });
  } else if (!/^[a-zA-Z][a-zA-Z0-9_:]*$/.test(enumData.code)) {
    issues.push({
      type: 'error',
      field: 'code',
      message: '枚举代码格式不正确，必须以字母开头，只能包含字母、数字、下划线和冒号'
    });
  }

  if (!enumData.name) {
    issues.push({
      type: 'error',
      field: 'name',
      message: '枚举名称不能为空'
    });
  } else if (!/^[a-z][a-z0-9_]*$/.test(enumData.name)) {
    issues.push({
      type: 'error',
      field: 'name',
      message: '枚举名称格式不正确，必须以小写字母开头，只能包含小写字母、数字和下划线'
    });
  }

  // 校验选项
  const options = enumData.options || [];
  if (options.length === 0) {
    issues.push({
      type: 'warning',
      field: 'options',
      message: '枚举没有选项，建议添加至少一个选项'
    });
  }

  // 校验选项的value和label
  const valueSet = new Set<string>();
  const labelSet = new Set<string>();
  
  options.forEach((option: any, index: number) => {
    // 校验value
    if (!option.value) {
      issues.push({
        type: 'error',
        field: `options[${index}].value`,
        message: `选项${index + 1}的值不能为空`
      });
    } else if (!/^[a-z0-9_]+$/.test(option.value)) {
      issues.push({
        type: 'error',
        field: `options[${index}].value`,
        message: `选项${index + 1}的值格式不正确，只能包含小写字母、数字和下划线`
      });
    } else if (valueSet.has(option.value)) {
      issues.push({
        type: 'error',
        field: `options[${index}].value`,
        message: `选项${index + 1}的值重复：${option.value}`
      });
    } else {
      valueSet.add(option.value);
    }

    // 校验label
    if (!option.label) {
      issues.push({
        type: 'error',
        field: `options[${index}].label`,
        message: `选项${index + 1}的标签不能为空`
      });
    } else if (labelSet.has(option.label)) {
      issues.push({
        type: 'warning',
        field: `options[${index}].label`,
        message: `选项${index + 1}的标签重复：${option.label}`
      });
    } else {
      labelSet.add(option.label);
    }

    // 校验order
    if (option.order !== undefined && (typeof option.order !== 'number' || option.order < 0)) {
      issues.push({
        type: 'warning',
        field: `options[${index}].order`,
        message: `选项${index + 1}的排序值应该是非负整数`
      });
    }
  });

  // 检查是否有重复的order值
  const orderSet = new Set<number>();
  options.forEach((option: any, index: number) => {
    if (option.order !== undefined) {
      if (orderSet.has(option.order)) {
        issues.push({
          type: 'warning',
          field: `options[${index}].order`,
          message: `选项${index + 1}的排序值重复：${option.order}`
        });
      } else {
        orderSet.add(option.order);
      }
    }
  });

  const errorCount = issues.filter(issue => issue.type === 'error').length;
  const warningCount = issues.filter(issue => issue.type === 'warning').length;

  return {
    isValid: errorCount === 0,
    issues,
    errorCount,
    warningCount
  };
};

// 获取校验状态的显示文本
export const getValidationDisplayText = (result: EnumValidationResult): string => {
  if (result.isValid && result.warningCount === 0) {
    return '正常';
  }
  
  const parts: string[] = [];
  if (result.errorCount > 0) {
    parts.push(`${result.errorCount}个错误`);
  }
  if (result.warningCount > 0) {
    parts.push(`${result.warningCount}个警告`);
  }
  
  return parts.join(', ');
};

// 获取校验状态的颜色
export const getValidationColor = (result: EnumValidationResult): string => {
  if (result.errorCount > 0) {
    return 'error';
  }
  if (result.warningCount > 0) {
    return 'warning';
  }
  return 'success';
}; 