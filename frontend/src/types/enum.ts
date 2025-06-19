/**
 * 枚举树节点类型定义
 */
export interface EnumTreeNode {
  /** 节点值 */
  value: string;
  /** 节点标签 */
  label: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 子节点 */
  children?: EnumTreeNode[];
  /** 是否是叶子节点 */
  isLeaf?: boolean;
  /** 枚举ID（仅叶子节点有此属性） */
  enumId?: string;
  /** 枚举描述（仅叶子节点有此属性） */
  description?: string;
  /** 原始枚举数据（仅叶子节点有此属性） */
  rawEnum?: {
    id: string;
    code: string;
    name: string;
    description?: string;
    options: Array<{
      value: string;
      label: string;
      description?: string;
      order?: number;
    }>;
  };
} 