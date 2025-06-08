import { DataStructure } from '../models/DataStructure';
import { AppDataSource } from '../config/database';

const dataStructureRepository = AppDataSource.getRepository(DataStructure);

export interface DataStructureInput {
  name: string;
  schema: {
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
      description?: string;
    }>;
    relationships?: Array<{
      name: string;
      type: string;
      target: string;
    }>;
  };
}

export const resolvers = {
  Query: {
    dataStructures: async () => {
      return await dataStructureRepository.find();
    },
    dataStructure: async (_: unknown, { id }: { id: string }) => {
      return await dataStructureRepository.findOneBy({ id });
    },
  },
  Mutation: {
    createDataStructure: async (_: unknown, { input }: { input: DataStructureInput }) => {
      const dataStructure = dataStructureRepository.create(input);
      return await dataStructureRepository.save(dataStructure);
    },
    updateDataStructure: async (_: unknown, { id, input }: { id: string; input: DataStructureInput }) => {
      await dataStructureRepository.update(id, input);
      return await dataStructureRepository.findOneBy({ id });
    },
    deleteDataStructure: async (_: unknown, { id }: { id: string }) => {
      const result = await dataStructureRepository.delete(id);
      return result.affected ? result.affected > 0 : false;
    },
  },
}; 