// src/constants/gameConstants.js

export const GAME_CONFIG = {
  // Game difficulty settings
  DIFFICULTY_LEVELS: {
    EASY: {
      STARTING_RESOURCES: { GOLD: 2000, FOOD: 1000, MILITARY_SUPPLIES: 500 },
      EVENT_IMPACT_MODIFIERS: { positive: 1.2, negative: 0.8 },
      GROWTH_RATES: { population: 1.2, economy: 1.2, military: 1.2 }
    },
    NORMAL: {
      STARTING_RESOURCES: { GOLD: 1500, FOOD: 800, MILITARY_SUPPLIES: 400 },
      EVENT_IMPACT_MODIFIERS: { positive: 1.0, negative: 1.0 },
      GROWTH_RATES: { population: 1.0, economy: 1.0, military: 1.0 }
    },
    HARD: {
      STARTING_RESOURCES: { GOLD: 1000, FOOD: 600, MILITARY_SUPPLIES: 300 },
      EVENT_IMPACT_MODIFIERS: { positive: 0.8, negative: 1.2 },
      GROWTH_RATES: { population: 0.8, economy: 0.8, military: 0.8 }
    }
  },

  // Kingdom stat limits
  MAX_POPULATION: 10000,
  MIN_POPULATION: 0,
  MAX_ECONOMY: 100,
  MIN_ECONOMY: 0,
  MAX_MILITARY: 100,
  MIN_MILITARY: 0,
  MAX_HAPPINESS: 100,
  MIN_HAPPINESS: 0,

  // Event impact modifiers
  EVENT_IMPACT_MODIFIERS: {
    population: 1.0,
    economy: 1.0,
    military: 1.0,
    happiness: 1.0
  },

  // Critical thresholds for warnings
  CRITICAL_THRESHOLDS: {
    population: 200,
    economy: 20,
    military: 20,
    happiness: 20
  },

  // Growth rates per turn
  BASE_GROWTH_RATES: {
    population: 0.05,  // 5% per turn
    economy: 0.03,     // 3% per turn
    military: 0.02,    // 2% per turn
    happiness: -0.01   // -1% per turn (natural decline)
  },

  // Interdependency modifiers
  STAT_DEPENDENCIES: {
    population: {
      economy: 0.2,    // Population growth affected by economy
      happiness: 0.3   // Population growth affected by happiness
    },
    economy: {
      population: 0.2, // Economy growth affected by population
      military: 0.1    // Economy growth affected by military
    },
    military: {
      economy: 0.3,    // Military growth affected by economy
      population: 0.2  // Military growth affected by population
    },
    happiness: {
      economy: 0.4,    // Happiness affected by economy
      military: -0.1   // Happiness slightly decreased by high military
    }
  }
};

export function calculateGrowthRates(kingdom, difficulty = 'NORMAL') {
  const difficultySettings = GAME_CONFIG.DIFFICULTY_LEVELS[difficulty];
  const baseRates = GAME_CONFIG.BASE_GROWTH_RATES;
  const dependencies = GAME_CONFIG.STAT_DEPENDENCIES;
  
  // Initialize growth rates with base values
  let growthRates = { ...baseRates };

  // Apply stat dependencies
  Object.entries(dependencies).forEach(([stat, modifiers]) => {
    Object.entries(modifiers).forEach(([dependentStat, impact]) => {
      const dependentValue = kingdom[dependentStat.toLowerCase()] / 100; // Convert to percentage
      growthRates[stat] += baseRates[stat] * impact * dependentValue;
    });
  });

  // Apply difficulty modifiers
  Object.entries(growthRates).forEach(([stat, rate]) => {
    growthRates[stat] *= difficultySettings.GROWTH_RATES[stat] || 1;
  });

  return growthRates;
}

export function checkVictoryConditions(kingdom) {
  // Economic Victory
  if (kingdom.economy >= 90 && kingdom.happiness >= 80 && kingdom.population >= 5000) {
    return {
      achieved: true,
      type: 'ECONOMIC',
      message: "Your kingdom has become an economic powerhouse with happy citizens!"
    };
  }

  // Military Victory
  if (kingdom.military >= 90 && kingdom.economy >= 70 && kingdom.population >= 3000) {
    return {
      achieved: true,
      type: 'MILITARY',
      message: "Your military might has made your kingdom a formidable power!"
    };
  }

  // Cultural Victory
  if (kingdom.happiness >= 90 && kingdom.economy >= 70 && kingdom.population >= 4000) {
    return {
      achieved: true,
      type: 'CULTURAL',
      message: "Your kingdom has become a beacon of culture and prosperity!"
    };
  }

  // Population Victory
  if (kingdom.population >= 8000 && kingdom.happiness >= 70 && kingdom.economy >= 60) {
    return {
      achieved: true,
      type: 'POPULATION',
      message: "Your kingdom has grown into a mighty nation!"
    };
  }

  return { achieved: false };
}

export function checkDefeatConditions(kingdom) {
  const reasons = [];

  if (kingdom.population <= GAME_CONFIG.CRITICAL_THRESHOLDS.population) {
    reasons.push("Your kingdom's population has fallen to critically low levels.");
  }

  if (kingdom.economy <= GAME_CONFIG.CRITICAL_THRESHOLDS.economy) {
    reasons.push("Your kingdom's economy has collapsed.");
  }

  if (kingdom.military <= GAME_CONFIG.CRITICAL_THRESHOLDS.military) {
    reasons.push("Your kingdom's military has been decimated.");
  }

  if (kingdom.happiness <= GAME_CONFIG.CRITICAL_THRESHOLDS.happiness) {
    reasons.push("Your people have completely lost faith in your leadership.");
  }

  // Special combined conditions
  if (kingdom.economy <= 30 && kingdom.happiness <= 30) {
    reasons.push("Economic hardship and civil unrest have led to revolution.");
  }

  if (kingdom.military <= 30 && kingdom.economy <= 30) {
    reasons.push("Weak military and poor economy have made your kingdom vulnerable to invasion.");
  }

  return {
    defeated: reasons.length > 0,
    reasons: reasons
  };
}

// Event probability weights based on kingdom state
export function calculateEventWeights(kingdom) {
  return {
    ECONOMIC: {
      weight: kingdom.economy < 50 ? 2 : 1,
      events: ['TRADE_OFFER', 'MARKET_CRISIS', 'INNOVATION']
    },
    MILITARY: {
      weight: kingdom.military < 50 ? 2 : 1,
      events: ['INVASION', 'REBELLION', 'ALLIANCE_OFFER']
    },
    SOCIAL: {
      weight: kingdom.happiness < 50 ? 2 : 1,
      events: ['FESTIVAL', 'PLAGUE', 'IMMIGRATION']
    },
    RANDOM: {
      weight: 1,
      events: ['NATURAL_DISASTER', 'DISCOVERY', 'PROPHECY']
    }
  };
}