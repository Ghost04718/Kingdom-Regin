// src/constants/resourceConstants.js
export const RESOURCE_CONFIG = {
  GOLD: {
    baseProduction: 100,
    baseConsumption: 80,
    minQuantity: 200,
    maxStorage: 10000,
    scaling: {
      economy: 0.5,      // Each point of economy adds 0.5 to production
      population: -0.1,  // Each population unit increases consumption by 0.1
      military: -0.2     // Each military point increases consumption by 0.2
    }
  },
  FOOD: {
    baseProduction: 200,
    baseConsumption: 150,
    minQuantity: 500,
    maxStorage: 8000,
    scaling: {
      economy: 0.3,      // Economy bonus to food production
      population: -0.2,  // Population food consumption
      happiness: 0.1     // Happy population is more efficient at food production
    }
  },
  MILITARY_SUPPLIES: {
    baseProduction: 50,
    baseConsumption: 30,
    minQuantity: 100,
    maxStorage: 5000,
    scaling: {
      military: -0.5,    // Military units consume supplies
      economy: 0.2,      // Economy helps with production
      happiness: 0.1     // Happy population produces more efficiently
    }
  }
};

// Resource calculation utilities
export const calculateResourceChange = (resource, kingdom) => {
  const config = RESOURCE_CONFIG[resource.type];
  if (!config) return { production: 0, consumption: 0 };

  // Calculate production with bonuses
  let production = config.baseProduction;
  production += kingdom.economy * (config.scaling.economy || 0);
  production += kingdom.happiness * (config.scaling.happiness || 0);
  production = Math.max(0, Math.round(production));

  // Calculate consumption with scaling
  let consumption = config.baseConsumption;
  consumption += kingdom.population * (config.scaling.population || 0);
  consumption += kingdom.military * (config.scaling.military || 0);
  consumption = Math.max(0, Math.round(consumption));

  return {
    production,
    consumption,
    netChange: production - consumption
  };
};

export const getResourceStatus = (quantity, production, consumption, minQuantity, maxStorage) => {
  const netChange = production - consumption;
  const turnsUntilEmpty = netChange < 0 ? Math.ceil(quantity / Math.abs(netChange)) : Infinity;
  const turnsUntilFull = netChange > 0 ? Math.ceil((maxStorage - quantity) / netChange) : Infinity;
  
  // Status checks
  if (quantity <= minQuantity) {
    return {
      status: 'CRITICAL',
      message: `Critical shortage! Only ${quantity} remaining!`,
      turnsUntilEmpty,
      turnsUntilFull
    };
  }
  
  if (netChange < 0 && turnsUntilEmpty <= 5) {
    return {
      status: 'WARNING',
      message: `Resource depleting! ${turnsUntilEmpty} turns until empty`,
      turnsUntilEmpty,
      turnsUntilFull
    };
  }
  
  if (quantity >= maxStorage * 0.9) {
    return {
      status: 'WARNING',
      message: 'Storage nearly full!',
      turnsUntilEmpty,
      turnsUntilFull
    };
  }

  return {
    status: 'NORMAL',
    message: '',
    turnsUntilEmpty,
    turnsUntilFull
  };
};

// Resource impact calculator for events
export const calculateEventResourceImpact = (choice, resources, kingdom) => {
  const impacts = {};
  
  for (const resource of resources) {
    const config = RESOURCE_CONFIG[resource.type];
    if (!config) continue;

    // Calculate base impact
    let impact = 0;
    
    // Add relevant impacts based on choice effects
    if (choice.impact.economy) {
      impact += choice.impact.economy * config.scaling.economy;
    }
    if (choice.impact.population) {
      impact += choice.impact.population * config.scaling.population;
    }
    if (choice.impact.military) {
      impact += choice.impact.military * config.scaling.military;
    }
    if (choice.impact.happiness) {
      impact += choice.impact.happiness * config.scaling.happiness;
    }

    // Add specific resource impacts if defined in the choice
    if (choice.impact[resource.type.toLowerCase()]) {
      impact += choice.impact[resource.type.toLowerCase()];
    }

    impacts[resource.type] = Math.round(impact);
  }

  return impacts;
};

// Crisis event thresholds
export const RESOURCE_CRISIS_THRESHOLDS = {
  CRITICAL: 0.1,  // 10% of minQuantity
  SEVERE: 0.25,   // 25% of minQuantity
  WARNING: 0.5    // 50% of minQuantity
};

// Resource display helpers
export const getResourceDisplayInfo = (resource) => {
  switch (resource.type) {
    case 'GOLD':
      return {
        icon: '💰',
        color: '#FFD700',
        description: 'Currency for trade and development'
      };
    case 'FOOD':
      return {
        icon: '🌾',
        color: '#90EE90',
        description: 'Required for population growth and happiness'
      };
    case 'MILITARY_SUPPLIES':
      return {
        icon: '⚔️',
        color: '#CD853F',
        description: 'Essential for maintaining military strength'
      };
    default:
      return {
        icon: '📦',
        color: '#808080',
        description: 'Basic resource'
      };
  }
};