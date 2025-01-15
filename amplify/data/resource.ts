// amplify/backend/data/resource.ts
import { a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Kingdom: a
    .model({
      name: a.string().required(),
      population: a.integer().required(),
      economy: a.integer().required(),
      military: a.integer().required(),
      happiness: a.integer().required(),
      description: a.string(),
      turn: a.integer().required(),
      lastUpdated: a.string().required(),
      owner: a.string().required(),
      previousPopulation: a.integer(),
      previousEconomy: a.integer(),
      previousMilitary: a.integer(),
      previousHappiness: a.integer(),
      difficulty: a.string()
    })
    .authorization(allow => allow.owner().to(['create', 'read', 'update', 'delete'])),

  Resource: a
  .model({
    id: a.id(),  // Changed to use id() helper
    name: a.string().required(),
    type: a.string().required(),
    category: a.string(),  // Made optional
    quantity: a.integer().default(0),  // Added default
    production: a.integer().default(0),  // Added default
    consumption: a.integer().default(0),  // Added default
    baseProduction: a.integer(),  // Made optional
    baseConsumption: a.integer(),  // Made optional
    minQuantity: a.integer().default(0),  // Added default
    maxStorage: a.integer().default(1000),  // Added default
    status: a.string().default('NORMAL'),  // Added default
    qualityLevel: a.integer().default(1),  // Added default
    efficiency: a.integer(),  // Made optional
    dependencies: a.string(),  // Optional JSON string
    statusEffects: a.string(),  // Optional JSON string
    trends: a.string(),  // Optional JSON string
    lastUpdated: a.string().required(),
    kingdomId: a.string().required(),
    owner: a.string().required()
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
      relatedResources: a.string(), // New field - JSON string of related resource IDs
    })
    .authorization(allow => allow.owner().to(['create', 'read', 'update', 'delete'])),

  Settings: a
    .model({
      id: a.string().required(),
      difficulty: a.string().required(),
      soundEnabled: a.boolean().required(),
      musicEnabled: a.boolean().required(),
      musicVolume: a.integer().required(),
      owner: a.string().required()
    })
    .authorization(allow => allow.owner().to(['create', 'read', 'update', 'delete'])),
});

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});