// amplify/backend/data/resource.ts
import { a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Kingdom: a
    .model({
      id: a.string().required(),  // Add explicit ID field
      name: a.string().required(),
      population: a.integer().required(),
      economy: a.integer().required(),
      military: a.integer().required(),
      happiness: a.integer().required(),
      description: a.string(),
      lastResourceUpdate: a.string().required(), // Changed from datetime to string
      resourceModifiers: a.string(),
      techLevel: a.integer(),
      tradeRoutes: a.integer(),
      owner: a.string().required(), // Explicit owner field
    })
    .authorization(allow => allow.owner().to(['create', 'read', 'update', 'delete'])),

  Resource: a
    .model({
      id: a.string().required(),
      name: a.string().required(),
      quantity: a.integer().required(),
      type: a.string().required(), // Changed from enum to string
      baseProduction: a.integer().required(),
      productionMultiplier: a.float(),
      consumption: a.integer().required(),
      consumptionMultiplier: a.float(),
      minimumQuantity: a.integer().required(),
      maximumStorage: a.integer().required(),
      kingdomId: a.string().required(),
      lastTradeUpdate: a.string(),
      modifiers: a.string(),
      productionEfficiency: a.float(),
      workerAllocation: a.integer(),
      qualityLevel: a.integer(),
      marketValue: a.float(),
      deteriorationRate: a.float(),
      seasonalModifier: a.float(),
      owner: a.string().required(),
    })
    .authorization(allow => allow.owner().to(['create', 'read', 'update', 'delete'])),

  ResourceTrade: a
    .model({
      id: a.string().required(),
      fromKingdomId: a.string().required(),
      toKingdomId: a.string().required(),
      resourceType: a.string().required(),
      quantity: a.integer().required(),
      price: a.float().required(),
      status: a.string().required(), // Changed from enum to string
      expirationTime: a.string().required(),
      terms: a.string(),
      owner: a.string().required(),
    })
    .authorization(allow => allow.owner().to(['create', 'read', 'update', 'delete'])),

  Event: a
    .model({
      id: a.string().required(),
      title: a.string().required(),
      description: a.string().required(),
      type: a.string().required(), // Changed from enum to string
      impact: a.string().required(),
      choices: a.string().required(),
      timestamp: a.string().required(),
      kingdomId: a.string().required(),
      resourceEffects: a.string(),
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