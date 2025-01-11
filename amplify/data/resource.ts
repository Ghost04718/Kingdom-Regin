// data/resource.ts
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Kingdom: a
    .model({
      name: a.string(),
      population: a.integer(),
      economy: a.integer(),
      military: a.integer(),
      happiness: a.integer(),
      description: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  Event: a
    .model({
      title: a.string(),
      description: a.string(),
      type: a.enum(['INTERNAL', 'EXTERNAL', 'RANDOM']),
      impact: a.string(), // JSON string of stat changes
      choices: a.string(), // JSON string of available choices
      timestamp: a.datetime(),
      // Simple foreign key to Kingdom
      kingdomId: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  Resource: a
    .model({
      name: a.string(),
      quantity: a.integer(),
      type: a.enum(['GOLD', 'FOOD', 'TIMBER', 'STONE']),
      // Simple foreign key to Kingdom
      kingdomId: a.string(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});