import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type DataStructure {
    id: ID!
    name: String!
    schema: JSON!
    isActive: Boolean!
    version: Int!
    createdAt: String!
    updatedAt: String!
  }

  input DataStructureInput {
    name: String!
    schema: JSON!
  }

  type Query {
    dataStructures: [DataStructure!]!
    dataStructure(id: ID!): DataStructure
  }

  type Mutation {
    createDataStructure(input: DataStructureInput!): DataStructure!
    updateDataStructure(id: ID!, input: DataStructureInput!): DataStructure!
    deleteDataStructure(id: ID!): Boolean!
  }

  scalar JSON
`; 