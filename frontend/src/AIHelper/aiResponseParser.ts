/**
 * AI响应解析工具
 * 用于处理AI返回的响应，包括JSON解析、截断处理、思考过程过滤等
 */

export interface ParsedAIResponse {
  success: boolean;
  data?: any;
  error?: string;
  originalResponse?: string;
  cleanedResponse?: string;
}

/**
 * 清理AI响应，移除思考过程和无关内容
 */
export function cleanAIResponse(response: string): string {
  if (!response) return '';
  
  let cleaned = response;
  
  // 移除 <think> 标签及其内容
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, '');
  
  // 移除 ```json 和 ``` 标记
  cleaned = cleaned.replace(/```json\s*/g, '');
  cleaned = cleaned.replace(/```\s*$/g, '');
  
  // 移除开头的 ``` 标记
  cleaned = cleaned.replace(/^```\s*/, '');
  
  // 移除结尾的 ``` 标记
  cleaned = cleaned.replace(/\s*```$/, '');
  
  // 移除多余的空行和空格
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * 尝试修复被截断的JSON
 */
export function fixTruncatedJSON(jsonStr: string): string {
  if (!jsonStr) return '';
  
  let fixed = jsonStr;
  
  // 计算括号和引号的平衡
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < fixed.length; i++) {
    const char = fixed[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
      else if (char === '[') bracketCount++;
      else if (char === ']') bracketCount--;
    }
  }
  
  // 添加缺失的闭合括号
  while (braceCount > 0) {
    fixed += '}';
    braceCount--;
  }
  
  while (bracketCount > 0) {
    fixed += ']';
    bracketCount--;
  }
  
  // 如果以逗号结尾，移除它
  if (fixed.endsWith(',')) {
    fixed = fixed.slice(0, -1);
  }
  
  // 如果以不完整的字符串结尾，尝试修复
  if (fixed.includes('"') && !fixed.endsWith('"')) {
    const lastQuoteIndex = fixed.lastIndexOf('"');
    if (lastQuoteIndex > 0) {
      const beforeLastQuote = fixed.substring(0, lastQuoteIndex);
      const afterLastQuote = fixed.substring(lastQuoteIndex + 1);
      
      // 如果最后一个引号后面还有内容，尝试移除不完整的部分
      if (afterLastQuote.includes('"')) {
        const nextQuoteIndex = afterLastQuote.indexOf('"');
        if (nextQuoteIndex > 0) {
          fixed = beforeLastQuote + afterLastQuote.substring(nextQuoteIndex);
        }
      } else {
        // 移除不完整的字符串
        fixed = beforeLastQuote;
      }
    }
  }
  
  return fixed;
}

/**
 * 解析AI响应中的JSON
 */
export function parseAIResponse(response: string): ParsedAIResponse {
  if (!response) {
    return {
      success: false,
      error: '响应为空',
      originalResponse: response
    };
  }
  
  try {
    // 1. 清理响应
    const cleanedResponse = cleanAIResponse(response);
    
    // 2. 尝试找到JSON部分
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: '未找到有效的JSON数据',
        originalResponse: response,
        cleanedResponse
      };
    }
    
    let jsonStr = jsonMatch[0];
    
    // 3. 尝试修复被截断的JSON
    const fixedJsonStr = fixTruncatedJSON(jsonStr);
    
    // 4. 解析JSON
    try {
      const parsedData = JSON.parse(fixedJsonStr);
      return {
        success: true,
        data: parsedData,
        originalResponse: response,
        cleanedResponse
      };
    } catch (parseError: any) {
      // 如果修复后的JSON仍然无法解析，尝试更激进的修复
      console.warn('JSON解析失败，尝试更激进的修复:', parseError);
      
      // 尝试找到最后一个完整的对象
      const objects = [];
      let braceCount = 0;
      let startIndex = -1;
      
      for (let i = 0; i < jsonStr.length; i++) {
        if (jsonStr[i] === '{') {
          if (braceCount === 0) {
            startIndex = i;
          }
          braceCount++;
        } else if (jsonStr[i] === '}') {
          braceCount--;
          if (braceCount === 0 && startIndex !== -1) {
            objects.push(jsonStr.substring(startIndex, i + 1));
            startIndex = -1;
          }
        }
      }
      
      // 尝试解析最后一个完整的对象
      if (objects.length > 0) {
        try {
          const lastObject = objects[objects.length - 1];
          const parsedData = JSON.parse(lastObject);
          return {
            success: true,
            data: parsedData,
            originalResponse: response,
            cleanedResponse
          };
        } catch (finalError: any) {
          return {
            success: false,
            error: `JSON解析失败: ${finalError.message}`,
            originalResponse: response,
            cleanedResponse
          };
        }
      }
      
      return {
        success: false,
        error: `JSON解析失败: ${parseError.message}`,
        originalResponse: response,
        cleanedResponse
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `解析过程出错: ${error.message}`,
      originalResponse: response
    };
  }
}

/**
 * 验证解析出的数据是否符合预期格式
 */
export function validateParsedData(data: any): { valid: boolean; error?: string } {
  if (!data) {
    return { valid: false, error: '数据为空' };
  }
  
  // 检查是否包含必要的字段
  if (!data.fields || !Array.isArray(data.fields)) {
    return { valid: false, error: '缺少fields数组' };
  }
  
  // 检查fields是否为空
  if (data.fields.length === 0) {
    return { valid: false, error: 'fields数组为空' };
  }
  
  // 检查每个field是否有必要的属性
  for (let i = 0; i < data.fields.length; i++) {
    const field = data.fields[i];
    if (!field.name || !field.type) {
      return { valid: false, error: `第${i + 1}个字段缺少name或type属性` };
    }
  }
  
  return { valid: true };
} 