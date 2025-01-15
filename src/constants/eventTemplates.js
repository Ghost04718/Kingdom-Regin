// src/constants/eventTemplates.js

export const EVENT_TEMPLATES = {
    ECONOMIC: {
      TRADE_OFFER: {
        title: "Trade Opportunity",
        description: "Merchants from distant lands propose new trade routes.",
        choices: [
          {
            text: "Accept trade agreement",
            impact: { economy: 15, happiness: 5, military: -5 }
          },
          {
            text: "Negotiate better terms",
            impact: { economy: 10, happiness: 0, military: 0 }
          },
          {
            text: "Reject and focus internally",
            impact: { economy: -5, happiness: -5, military: 5 }
          }
        ]
      },
      MARKET_CRISIS: {
        title: "Market Crisis",
        description: "A sudden market crash threatens the economy!",
        choices: [
          {
            text: "Intervene with treasury funds",
            impact: { economy: 10, happiness: 5, military: -10 }
          },
          {
            text: "Let the market correct itself",
            impact: { economy: -15, happiness: -10, military: 0 }
          }
        ]
      },
      INNOVATION: {
        title: "Technological Innovation",
        description: "Your scholars have made a breakthrough!",
        choices: [
          {
            text: "Invest in implementation",
            impact: { economy: 20, happiness: 5, military: 5, population: 50 }
          },
          {
            text: "Keep it for military use",
            impact: { economy: 5, happiness: -5, military: 15 }
          }
        ]
      }
    },
  
    MILITARY: {
      INVASION: {
        title: "Enemy at the Gates",
        description: "A rival kingdom threatens invasion!",
        choices: [
          {
            text: "Prepare for war",
            impact: { military: 15, economy: -15, happiness: -10 }
          },
          {
            text: "Seek diplomatic solution",
            impact: { military: -5, economy: -5, happiness: 5 }
          },
          {
            text: "Pay them off",
            impact: { military: 0, economy: -20, happiness: 0 }
          }
        ]
      },
      REBELLION: {
        title: "Internal Uprising",
        description: "A group of nobles challenges your authority!",
        choices: [
          {
            text: "Crush the rebellion",
            impact: { military: -10, happiness: -15, population: -100 }
          },
          {
            text: "Negotiate with rebels",
            impact: { military: -5, happiness: 5, economy: -10 }
          }
        ]
      },
      ALLIANCE_OFFER: {
        title: "Military Alliance",
        description: "A neighboring kingdom seeks military cooperation.",
        choices: [
          {
            text: "Form alliance",
            impact: { military: 10, economy: 5, happiness: 5 }
          },
          {
            text: "Maintain independence",
            impact: { military: -5, economy: -5, happiness: 0 }
          }
        ]
      }
    },
  
    SOCIAL: {
      FESTIVAL: {
        title: "Grand Festival",
        description: "Your advisors suggest hosting a festival to boost morale.",
        choices: [
          {
            text: "Host lavish celebration",
            impact: { happiness: 20, economy: -15, population: 50 }
          },
          {
            text: "Modest celebration",
            impact: { happiness: 10, economy: -5, population: 20 }
          },
          {
            text: "Cancel festival",
            impact: { happiness: -10, economy: 5, population: -20 }
          }
        ]
      },
      PLAGUE: {
        title: "Disease Outbreak",
        description: "A mysterious illness spreads through the kingdom!",
        choices: [
          {
            text: "Quarantine affected areas",
            impact: { population: -200, happiness: -10, economy: -10 }
          },
          {
            text: "Invest in medicine",
            impact: { population: -100, happiness: 5, economy: -15 }
          }
        ]
      },
      IMMIGRATION: {
        title: "Population Boom",
        description: "Refugees seek shelter in your kingdom.",
        choices: [
          {
            text: "Welcome them",
            impact: { population: 300, happiness: -5, economy: -10 }
          },
          {
            text: "Selective acceptance",
            impact: { population: 100, happiness: 0, economy: -5 }
          },
          {
            text: "Close borders",
            impact: { population: 0, happiness: -10, economy: 5 }
          }
        ]
      }
    },
  
    RANDOM: {
      NATURAL_DISASTER: {
        title: "Natural Calamity",
        description: "A devastating storm has struck your kingdom!",
        choices: [
          {
            text: "Focus on immediate rescue",
            impact: { population: -150, happiness: 5, economy: -15 }
          },
          {
            text: "Protect economic assets",
            impact: { population: -300, happiness: -10, economy: -5 }
          }
        ]
      },
      DISCOVERY: {
        title: "Ancient Discovery",
        description: "Workers have uncovered ancient ruins!",
        choices: [
          {
            text: "Study the ruins",
            impact: { economy: 10, happiness: 10, military: 5 }
          },
          {
            text: "Search for treasures",
            impact: { economy: 20, happiness: 5, military: -5 }
          }
        ]
      },
      PROPHECY: {
        title: "Mysterious Prophecy",
        description: "A prophet shares a vision of the future!",
        choices: [
          {
            text: "Embrace the prophecy",
            impact: { happiness: 15, economy: -5, military: -5 }
          },
          {
            text: "Ignore the prophecy",
            impact: { happiness: -10, economy: 5, military: 5 }
          }
        ]
      }
    }
  };
  
  export function getRandomEvent(type) {
    const categoryEvents = EVENT_TEMPLATES[type];
    if (!categoryEvents) return null;
    
    const eventKeys = Object.keys(categoryEvents);
    const randomKey = eventKeys[Math.floor(Math.random() * eventKeys.length)];
    return { ...categoryEvents[randomKey], type };
  }
  
  export function selectEventBasedOnKingdom(kingdom) {
    const weights = calculateEventWeights(kingdom);
    let totalWeight = 0;
    
    // Calculate total weight
    Object.values(weights).forEach(category => {
      totalWeight += category.weight;
    });
    
    // Select random event type based on weights
    let random = Math.random() * totalWeight;
    let selectedType = 'RANDOM';
    
    for (const [type, category] of Object.entries(weights)) {
      random -= category.weight;
      if (random <= 0) {
        selectedType = type;
        break;
      }
    }
    
    return getRandomEvent(selectedType);
  }
  
  export function adjustEventImpact(event, difficulty) {
    const difficultyModifiers = GAME_CONFIG.DIFFICULTY_LEVELS[difficulty].EVENT_IMPACT_MODIFIERS;
    
    if (!event || !event.choices) return event;
    
    const adjustedEvent = { ...event };
    adjustedEvent.choices = event.choices.map(choice => {
      const adjustedChoice = { ...choice };
      const impact = typeof choice.impact === 'string' ? JSON.parse(choice.impact) : choice.impact;
      
      const adjustedImpact = {};
      Object.entries(impact).forEach(([stat, value]) => {
        const modifier = value >= 0 ? difficultyModifiers.positive : difficultyModifiers.negative;
        adjustedImpact[stat] = Math.round(value * modifier);
      });
      
      adjustedChoice.impact = adjustedImpact;
      return adjustedChoice;
    });
    
    return adjustedEvent;
  }