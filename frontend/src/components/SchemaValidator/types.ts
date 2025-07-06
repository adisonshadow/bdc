export type Field = API.UuidField | API.AutoIncrementField | API.StringField | API.TextField | API.NumberField | API.BooleanField | API.DateField | API.EnumField | API.RelationField | API.MediaField | API.ApiField;

export interface SchemaListItem {
  id?: string;
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  fields: Field[];
  keyIndexes?: {
    primaryKey?: string[];
    indexes?: {
      name?: string;
      fields?: string[];
      type?: "unique" | "normal" | "fulltext" | "spatial";
    }[];
  };
} 