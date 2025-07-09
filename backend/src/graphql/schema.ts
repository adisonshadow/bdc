import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type DataStructure {
    id: ID!
    name: String!
    code: String!
    fields: JSON!
    keyIndexes: JSON
    physicalStorage: JSON
    validationErrors: [JSON!]
    description: String
    isActive: Boolean!
    isLocked: Boolean!
    version: Int!
    createdAt: String!
    updatedAt: String!
  }

  input DataStructureInput {
    name: String!
    code: String!
    fields: JSON!
    keyIndexes: JSON
    physicalStorage: JSON
    validationErrors: [JSON!]
    description: String
    isActive: Boolean
    isLocked: Boolean
  }

  type Query {
    dataStructures: [DataStructure!]!
    dataStructure(id: ID): DataStructure
    dataStructureByName(name: String!): DataStructure
  }

  type Mutation {
    createDataStructure(input: DataStructureInput!): DataStructure!
    updateDataStructure(id: ID!, input: DataStructureInput!): DataStructure!
    deleteDataStructure(id: ID!): Boolean!
  }

  scalar JSON
`; 