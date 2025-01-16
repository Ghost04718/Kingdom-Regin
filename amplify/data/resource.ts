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
      description: a.string().required(),
      difficulty: a.string().required(),
      turn: a.integer().required(),
      lastUpdated: a.string().required(),
      owner: a.string().required(),
      // Optional fields
      previousPopulation: a.integer(),
      previousEconomy: a.integer(),
      previousMilitary: a.integer(),
      previousHappiness: a.integer()
    })
    .authorization(allow => allow.owner().to(['create', 'read', 'update', 'delete'])),

  Resource: a
  .model({
    id: a.string().required(),
    name: a.string().required(),
    type: a.string().required(),
    category: a.string().required(),
    quantity: a.integer().required(),
    production: a.integer().required(),
    consumption: a.integer().required(),
    baseProduction: a.integer().required(),
    baseConsumption: a.integer().required(),
    minQuantity: a.integer().required(),
    maxStorage: a.integer().required(),
    status: a.string().required(),
    qualityLevel: a.integer().required(),
    kingdomId: a.string().required(),
    owner: a.string().required(),
    lastUpdated: a.string().required()
  })
    .authorization(allow => allow.owner().to(['create', 'read', 'update', 'delete'])),

  Event: a
    .model({
      id: a.string().required(),
      title: a.string().required(),
      description: a.string().required(),
      type: a.string().required(),
      impact: a.string().required(),  // JSON string
      choices: a.string().required(), // JSON string
      timestamp: a.string().required(),
      kingdomId: a.string().required(),
      owner: a.string().required(),
      // Optional fields
      chainId: a.string(),
      relatedResources: a.string() // JSON string
    })
    .authorization(allow => allow.owner().to(['create', 'read', 'update', 'delete'])),

  EventChain: a
    .model({
      id: a.string().required(),
      trigger: a.string().required(),
      currentStep: a.integer().required(),
      outcomes: a.string().required(), // JSON string
      isComplete: a.boolean().required(),
      startTime: a.string().required(),
      kingdomId: a.string().required(),
      owner: a.string().required(),
      // Optional fields
      endTime: a.string(),
      archiveDate: a.string(),
      chainType: a.string(),
      impact: a.string() // JSON string
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
    defaultAuthorizationMode: 'userPool'
  }
});