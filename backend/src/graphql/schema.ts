import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type DataStructure {
    id: ID!
    name: String!
    schema: JSON!
    description: String
    isActive: Boolean!
    version: Int!
    createdAt: String!
    updatedAt: String!
  }

  input DataStructureInput {
    name: String!
    schema: JSON!
    description: String
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