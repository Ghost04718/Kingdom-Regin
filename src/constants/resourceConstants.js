// src/constants/resourceConstants.js

export const RESOURCE_TYPES = {
  GOLD: 'GOLD',
  FOOD: 'FOOD',
  MILITARY_SUPPLIES: 'MILITARY_SUPPLIES',
  LUXURY_GOODS: 'LUXURY_GOODS',
  BUILDING_MATERIALS: 'BUILDING_MATERIALS'
};

export const RESOURCE_CATEGORIES = {
  ECONOMIC: 'ECONOMIC',
  MILITARY: 'MILITARY',
  SOCIAL: 'SOCIAL',
  INFRASTRUCTURE: 'INFRASTRUCTURE'
};

export const QUALITY_LEVELS = {
  1: { 
    name: 'Basic',
    cost: 0,
    productionMultiplier: 1.0,
    consumptionMultiplier: 1.0,
    storageMultiplier: 1.0
  },
  2: { 
    name: 'Improved',
    cost: 1000,
    productionMultiplier: 1.25,
    consumptionMultiplier: 1.1,
    storageMultiplier: 1.2
  },
  3: { 
    name: 'Advanced',
    cost: 2500,
    productionMultiplier: 1.5,
    consumptionMultiplier: 1.2,
    storageMultiplier: 1.5
  },
  4: {
    name: 'Superior',
    cost: 5000,
    productionMultiplier: 2.0,
    consumptionMultiplier: 1.3,
    storageMultiplier: 2.0
  }
};

// Define resource interdependencies and balance configurations
export const BASE_RESOURCE_CONFIG = {
  GOLD: {
    name: 'Gold',
    category: RESOURCE_CATEGORIES.ECONOMIC,
    baseProduction: 50,
    baseConsumption: 30,
    minQuantity: 100,
    maxStorage: 10000,
    qualityLevels: QUALITY_LEVELS,
    modifiers: {
      economy: 0.5,
      happiness: 0.2,
      population: 0.3
    },
    dependencies: {
      LUXURY_GOODS: {
        production: 0.2,  // Luxury goods boost gold production
        consumption: 0.1  // Luxury goods slightly increase gold consumption
      },
      BUILDING_MATERIALS: {
        production: 0.1   // Building materials slightly boost gold production
      }
    },
    statusEffects: {
      CRITICAL: {
        economy: -20,
        happiness: -15
      },
      WARNING: {
        economy: -10,
        happiness: -5
      }
    }
  },
  FOOD: {
    name: 'Food',
    category: RESOURCE_CATEGORIES.SOCIAL,
    baseProduction: 100,
    baseConsumption: 50,
    minQuantity: 200,
    maxStorage: 5000,
    qualityLevels: QUALITY_LEVELS,
    modifiers: {
      economy: 0.3,
      happiness: 0.4,
      population: 0.5
    },
    dependencies: {
      BUILDING_MATERIALS: {
        production: 0.15  // Better infrastructure improves food production
      }
    },
    statusEffects: {
      CRITICAL: {
        population: -100,
        happiness: -20
      },
      WARNING: {
        happiness: -10,
        population: -50
      }
    }
  },
  MILITARY_SUPPLIES: {
    name: 'Military Supplies',
    category: RESOURCE_CATEGORIES.MILITARY,
    baseProduction: 30,
    baseConsumption: 20,
    minQuantity: 100,
    maxStorage: 3000,
    qualityLevels: QUALITY_LEVELS,
    modifiers: {
      military: 0.6,
      economy: -0.2,
      happiness: -0.1
    },
    dependencies: {
      BUILDING_MATERIALS: {
        production: 0.2
      },
      GOLD: {
        consumption: 0.2  // Military supplies cost more gold to maintain
      }
    },
    statusEffects: {
      CRITICAL: {
        military: -20,
        happiness: -5
      },
      WARNING: {
        military: -10
      }
    }
  },
  LUXURY_GOODS: {
    name: 'Luxury Goods',
    category: RESOURCE_CATEGORIES.ECONOMIC,
    baseProduction: 20,
    baseConsumption: 15,
    minQuantity: 50,
    maxStorage: 2000,
    qualityLevels: QUALITY_LEVELS,
    modifiers: {
      happiness: 0.7,
      economy: 0.4,
      military: -0.1
    },
    dependencies: {
      GOLD: {
        production: 0.3   // More gold means better luxury goods production
      }
    },
    statusEffects: {
      CRITICAL: {
        happiness: -15,
        economy: -10
      },
      WARNING: {
        happiness: -5,
        economy: -5
      }
    }
  },
  BUILDING_MATERIALS: {
    name: 'Building Materials',
    category: RESOURCE_CATEGORIES.INFRASTRUCTURE,
    baseProduction: 40,
    baseConsumption: 25,
    minQuantity: 150,
    maxStorage: 4000,
    qualityLevels: QUALITY_LEVELS,
    modifiers: {
      economy: 0.4,
      population: 0.3,
      happiness: 0.2
    },
    dependencies: {
      GOLD: {
        consumption: 0.1  // Building materials require gold for maintenance
      }
    },
    statusEffects: {
      CRITICAL: {
        economy: -15,
        population: -50
      },
      WARNING: {
        economy: -5,
        population: -20
      }
    }
  }
};

// Updated calculation functions
export function calculateModifiedResourceRates(resource, kingdom, allResources = []) {
  if (!resource?.type || !BASE_RESOURCE_CONFIG[resource.type]) {
    console.warn('Invalid resource configuration:', resource);
    return { production: 0, consumption: 0 };
  }

  const config = BASE_RESOURCE_CONFIG[resource.type];
  const qualityLevel = resource.qualityLevel || 1;
  const qualityMultipliers = QUALITY_LEVELS[qualityLevel] || QUALITY_LEVELS[1];

  let baseProduction = config.baseProduction * qualityMultipliers.productionMultiplier;
  let baseConsumption = config.baseConsumption * qualityMultipliers.consumptionMultiplier;

  // Apply interdependency effects
  if (config.dependencies && allResources.length > 0) {
    Object.entries(config.dependencies).forEach(([depType, effects]) => {
      const dependentResource = allResources.find(r => r.type === depType);
      if (dependentResource) {
        const depStatus = calculateResourceStatus(dependentResource);
        const depQuality = dependentResource.qualityLevel || 1;
        
        if (effects.production) {
          const productionBoost = effects.production * (depQuality / 2);
          baseProduction *= (1 + productionBoost);
        }
        
        if (effects.consumption) {
          const consumptionEffect = effects.consumption * (depQuality / 2);
          baseConsumption *= (1 + consumptionEffect);
        }

        // Apply penalties for dependent resource issues
        if (depStatus === 'CRITICAL' || depStatus === 'WARNING') {
          baseProduction *= 0.8;  // 20% reduction in production
        }
      }
    });
  }

  // Apply kingdom state modifiers
  let productionModifier = 1;
  let consumptionModifier = 1;

  if (kingdom) {
    // Scale consumption with population
    if (kingdom.population) {
      const populationScale = Math.sqrt(kingdom.population / 1000);
      baseConsumption *= populationScale;
    }

    // Apply kingdom stat modifiers
    Object.entries(config.modifiers).forEach(([stat, impact]) => {
      const kingdomStat = kingdom[stat.toLowerCase()];
      if (typeof kingdomStat === 'number') {
        const statModifier = kingdomStat / 100;
        if (impact > 0) {
          productionModifier += impact * statModifier;
        } else {
          consumptionModifier += Math.abs(impact) * statModifier;
        }
      }
    });
  }

  return {
    production: Math.floor(baseProduction * productionModifier),
    consumption: Math.floor(baseConsumption * consumptionModifier)
  };
}

export function calculateResourceStatus(resource) {
  if (!resource?.quantity || !resource?.minQuantity) {
    return 'UNKNOWN';
  }

  const netChange = calculateNetChange(resource.production || 0, resource.consumption || 0);
  const storagePercentage = calculateStoragePercentage(resource.quantity, resource.maxStorage);
  
  // Critical status check
  if (resource.quantity <= resource.minQuantity) {
    return 'CRITICAL';
  }
  
  // Warning status checks
  if (resource.quantity <= resource.minQuantity * 1.5 || 
      (netChange < 0 && resource.quantity <= resource.minQuantity * 2)) {
    return 'WARNING';
  }
  
  // Caution status checks
  if (netChange < 0 && resource.quantity <= resource.minQuantity * 3) {
    return 'CAUTION';
  }
  
  // Surplus status check
  if (storagePercentage >= 90) {
    return 'SURPLUS';
  }
  
  // Stable status check
  if (netChange >= 0 && storagePercentage > 30) {
    return 'STABLE';
  }
  
  return 'NORMAL';
}

export function calculateStoragePercentage(quantity = 0, maxStorage = 100) {
  return Math.min(100, Math.floor((quantity / maxStorage) * 100));
}

export function calculateNetChange(production, consumption) {
  return production - consumption;
}

// New helper functions for resource trends and predictions
export function predictResourceTrend(resource, turns = 5) {
  const netChange = calculateNetChange(resource.production, resource.consumption);
  const predictions = [];
  let currentQuantity = resource.quantity;

  for (let i = 1; i <= turns; i++) {
    currentQuantity = Math.max(0, Math.min(resource.maxStorage, currentQuantity + netChange));
    predictions.push({
      turn: i,
      quantity: currentQuantity,
      status: calculateResourceStatus({ ...resource, quantity: currentQuantity })
    });
  }

  return predictions;
}

export function calculateResourceEfficiency(resource) {
  // Add null checks and default values
  if (!resource) return 0;
  
  const production = resource.production || 0;
  const consumption = resource.consumption || 0;
  const quantity = resource.quantity || 0;
  const maxStorage = resource.maxStorage || 1;
  
  // Avoid division by zero
  if (production === 0) return 0;
  
  const netChange = calculateNetChange(production, consumption);
  const storagePercentage = calculateStoragePercentage(quantity, maxStorage);
  
  if (consumption === 0) {
    return Math.min(100, (production / maxStorage) * 100);
  }
  
  // Base efficiency on production/consumption ratio
  let efficiency = (production / consumption) * 100;
  
  // Apply storage penalty if storage is near full
  if (storagePercentage > 90) {
    efficiency *= 0.8; // 20% penalty for nearly full storage
  }
  
  // Cap efficiency at 100%
  return Math.min(100, Math.max(0, efficiency));
}

export function getResourceStatusEffects(resource) {
  const config = BASE_RESOURCE_CONFIG[resource.type];
  const status = calculateResourceStatus(resource);
  
  return config.statusEffects?.[status] || {};
}