import { DataStructure, Field } from '../models/DataStructure';
import { getDataSource } from '../data-source';
import { DeepPartial } from 'typeorm';

export interface DataStructureInput {
  name: string;
  code: string;
  fields: Array<DeepPartial<Field>>;
  keyIndexes?: {
    primaryKey?: string[];
    indexes?: Array<{
      name: string;
      fields: string[];
      type: 'unique' | 'normal' | 'fulltext' | 'spatial';
    }>;
  };
  physicalStorage?: {
    database?: string;
    table?: string;
    lastMaterializedAt?: Date;
    materializedVersion?: number;
  };
  validationErrors?: Array<{
    code: string;
    message: string;
    timestamp: Date;
    details?: Record<string, any>;
  }>;
  description?: string;
  isActive?: boolean;
  isLocked?: boolean;
}

export const resolvers = {
  Query: {
    dataStructures: async () => {
      const dataStructureRepository = getDataSource().getRepository(DataStructure);
      return await dataStructureRepository.find();
    },
    dataStructure: async (_: unknown, { id }: { id?: string }) => {
      if (!id) return null;
      const dataStructureRepository = getDataSource().getRepository(DataStructure);
      return await dataStructureRepository.findOneBy({ id });
    },
    dataStructureByName: async (_: unknown, { name }: { name: string }) => {
      const dataStructureRepository = getDataSource().getRepository(DataStructure);
      return await dataStructureRepository.findOneBy({ name });
    },
  },
  Mutation: {
    createDataStructure: async (_: unknown, { input }: { input: DataStructureInput }) => {
      const dataStructureRepository = getDataSource().getRepository(DataStructure);
      const dataStructure = dataStructureRepository.create({
        ...input,
        isActive: input.isActive ?? true,
        isLocked: input.isLocked ?? false
      } as DeepPartial<DataStructure>);
      return await dataStructureRepository.save(dataStructure);
    },
    updateDataStructure: async (_: unknown, { id, input }: { id: string; input: DataStructureInput }) => {
      const dataStructureRepository = getDataSource().getRepository(DataStructure);
      const existing = await dataStructureRepository.findOneBy({ id });
      if (!existing) {
        throw new Error('DataStructure not found');
      }

      const updateData: DeepPartial<DataStructure> = {
        ...input,
        isActive: input.isActive ?? existing.isActive,
        isLocked: input.isLocked ?? existing.isLocked
      };

      // 如果有字段更新，增加版本号
      if (input.fields && JSON.stringify(input.fields) !== JSON.stringify(existing.fields)) {
        updateData.version = (existing.version || 1) + 1;
      }

      await dataStructureRepository.update(id, updateData);
      return await dataStructureRepository.findOneBy({ id });
    },
    deleteDataStructure: async (_: unknown, { id }: { id: string }) => {
      const dataStructureRepository = getDataSource().getRepository(DataStructure);
      const result = await dataStructureRepository.delete(id);
      return result.affected ? result.affected > 0 : false;
    },
  },
}; 