// src/services/events/eventGenerator.js
import { generateClient } from 'aws-amplify/data';

const client = generateClient();

// Event Categories
const EVENT_CATEGORIES = {
  INTERNAL: 'INTERNAL',
  EXTERNAL: 'EXTERNAL',
  RANDOM: 'RANDOM'
};

// Event Types per Category
const EVENT_TYPES = {
  INTERNAL: ['REBELLION', 'ECONOMY', 'POPULATION', 'HAPPINESS'],
  EXTERNAL: ['WAR', 'TRADE', 'DIPLOMACY'],
  RANDOM: ['NATURAL_DISASTER', 'DISCOVERY', 'DIVINE_INTERVENTION']
};

// Base event templates
const EVENT_TEMPLATES = {
  // Internal Events
  REBELLION: {
    title: 'Civil Unrest',
    description: 'Citizens are demanding better living conditions.',
    baseImpact: { happiness: -10, population: -50 }
  },
  ECONOMY: {
    title: 'Economic Challenge',
    description: 'Market fluctuations are affecting the kingdom.',
    baseImpact: { economy: -15, happiness: -5 }
  },
  POPULATION: {
    title: 'Population Growth',
    description: 'A surge in population brings both opportunities and challenges.',
    baseImpact: { population: 100, economy: -5, happiness: -5 }
  },
  HAPPINESS: {
    title: 'Festival Season',
    description: 'The people request a grand festival to boost morale.',
    baseImpact: { happiness: 15, economy: -10 }
  },

  // External Events
  WAR: {
    title: 'Military Conflict',
    description: 'A neighboring kingdom threatens our borders.',
    baseImpact: { military: -20, population: -100 }
  },
  TRADE: {
    title: 'Trade Opportunity',
    description: 'Merchants propose new trade routes.',
    baseImpact: { economy: 15, happiness: 5 }
  },
  DIPLOMACY: {
    title: 'Diplomatic Mission',
    description: 'A neighboring kingdom seeks to establish relations.',
    baseImpact: { economy: 10, military: 5 }
  },

  // Random Events
  NATURAL_DISASTER: {
    title: 'Natural Calamity',
    description: 'Unexpected weather threatens the kingdom.',
    baseImpact: { population: -150, happiness: -15, economy: -10 }
  },
  DISCOVERY: {
    title: 'Ancient Discovery',
    description: 'Explorers have found ancient ruins with valuable artifacts.',
    baseImpact: { economy: 20, happiness: 10 }
  },
  DIVINE_INTERVENTION: {
    title: 'Divine Blessing',
    description: 'A mystical event brings hope to the kingdom.',
    baseImpact: { happiness: 20, population: 50, economy: 10 }
  }
};

class EventGenerator {
  constructor(kingdomId) {
    this.kingdomId = kingdomId;
  }

  // Generate random event based on kingdom state
  async generateEvent(kingdomState) {
    const category = this._selectCategory(kingdomState);
    const eventType = this._selectEventType(category);
    const template = EVENT_TEMPLATES[eventType];
    
    if (!template) {
      throw new Error(`No template found for event type: ${eventType}`);
    }

    const event = this._customizeEvent(template, kingdomState);
    return await this._saveEvent(event);
  }

  // Select event category based on kingdom state
  _selectCategory(kingdomState) {
    const { happiness, economy, military } = kingdomState;
    
    // If any metric is critically low, favor internal events
    if (happiness < 30 || economy < 20) {
      return EVENT_CATEGORIES.INTERNAL;
    }
    
    // If military is strong, favor external events
    if (military > 70) {
      return EVENT_CATEGORIES.EXTERNAL;
    }
    
    // Otherwise, random selection with weights
    const weights = {
      INTERNAL: 0.4,
      EXTERNAL: 0.4,
      RANDOM: 0.2
    };
    
    const rand = Math.random();
    let sum = 0;
    for (const [category, weight] of Object.entries(weights)) {
      sum += weight;
      if (rand <= sum) {
        return EVENT_CATEGORIES[category];
      }
    }
    
    return EVENT_CATEGORIES.RANDOM;
  }

  // Select specific event type from category
  _selectEventType(category) {
    const types = EVENT_TYPES[category];
    if (!types || types.length === 0) {
      console.warn(`No event types found for category: ${category}, falling back to INTERNAL`);
      return EVENT_TYPES.INTERNAL[0];
    }

    // Filter for types that have templates
    const availableTypes = types.filter(type => EVENT_TEMPLATES[type]);
    if (availableTypes.length === 0) {
      console.warn(`No templates found for any event type in category: ${category}, falling back to INTERNAL`);
      return EVENT_TYPES.INTERNAL[0];
    }

    return availableTypes[Math.floor(Math.random() * availableTypes.length)];
  }

  // Customize event based on kingdom state
  _customizeEvent(template, kingdomState) {
    const { happiness, economy, military, population } = kingdomState;
    
    // Adjust impact based on kingdom state
    const impact = { ...template.baseImpact };
    if (happiness < 30) impact.happiness = Math.max(impact.happiness, -5);
    if (economy < 20) impact.economy = Math.max(impact.economy, -5);
    
    // Generate choices based on event type and kingdom state
    const choices = this._generateChoices(template, impact, kingdomState);

    return {
      title: template.title,
      description: template.description,
      type: this._getEventType(template),
      impact: JSON.stringify(impact),
      choices: JSON.stringify(choices),
      kingdomId: this.kingdomId,
      timestamp: new Date().toISOString()
    };
  }

  // Generate choices for the event
  _generateChoices(template, impact, kingdomState) {
    // Default choices - can be expanded based on event type
    const choices = [
      {
        text: 'Accept and adapt',
        impact: JSON.stringify({
          ...impact,
          happiness: impact.happiness ? impact.happiness * 0.8 : 0
        })
      },
      {
        text: 'Take aggressive action',
        impact: JSON.stringify({
          happiness: -10,
          military: 5,
          economy: -5
        })
      },
      {
        text: 'Seek compromise',
        impact: JSON.stringify({
          happiness: 5,
          economy: -5,
          military: -5
        })
      }
    ];

    return choices;
  }

  // Get event type from template and validate
  _getEventType(template) {
    // First try to find by exact title match
    for (const [category, types] of Object.entries(EVENT_TYPES)) {
      for (const type of types) {
        if (EVENT_TEMPLATES[type] && EVENT_TEMPLATES[type].title === template.title) {
          return category;
        }
      }
    }

    // If no match found, check which category contains this event type
    for (const [category, types] of Object.entries(EVENT_TYPES)) {
      if (types.some(type => EVENT_TEMPLATES[type] && EVENT_TEMPLATES[type].title === template.title)) {
        return category;
      }
    }

    // Default to RANDOM if no match found
    console.warn(`Could not determine event type for template: ${template.title}, defaulting to RANDOM`);
    return EVENT_CATEGORIES.RANDOM;
  }

  // Save event to database
  async _saveEvent(event) {
    try {
      const { data } = await client.models.Event.create(event);
      return data;
    } catch (error) {
      console.error('Error saving event:', error);
      throw error;
    }
  }
}

export default EventGenerator;