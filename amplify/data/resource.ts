// amplify/backend/data/resource.ts
import { a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Kingdom: a
    .model({
      id: a.string().required(),
      name: a.string().required(),
      population: a.integer().required(),
      economy: a.integer().required(),
      military: a.integer().required(),
      happiness: a.integer().required(),
      description: a.string(),
      turn: a.integer().required(), // Add turn counter
      owner: a.string().required(),
    })
    .authorization(allow => allow.owner().to(['create', 'read', 'update', 'delete'])),

  Resource: a
    .model({
      id: a.string().required(),
      name: a.string().required(),
      type: a.string().required(),
      quantity: a.integer().required(),
      production: a.integer().required(),
      consumption: a.integer().required(),
      minQuantity: a.integer().required(),
      maxStorage: a.integer().required(),
      kingdomId: a.string().required(),
      owner: a.string().required(),
    })
    .authorization(allow => allow.owner().to(['create', 'read', 'update', 'delete'])),

  Event: a
    .model({
      id: a.string().required(),
      title: a.string().required(),
      description: a.string().required(),
      type: a.string().required(),
      impact: a.string().required(),
      choices: a.string().required(),
      timestamp: a.string().required(),
      kingdomId: a.string().required(),
      owner: a.string().required(),
    })
    .authorization(allow => allow.owner().to(['create', 'read', 'update', 'delete'])),
});

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});