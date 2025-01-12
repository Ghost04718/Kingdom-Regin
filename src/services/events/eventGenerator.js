// src/services/events/eventGenerator.js
import { generateClient } from 'aws-amplify/data';

const client = generateClient();

const EVENT_TYPES = {
  INTERNAL: 'INTERNAL',
  EXTERNAL: 'EXTERNAL',
  RANDOM: 'RANDOM',
  RESOURCE_CRISIS: 'RESOURCE_CRISIS'
};

// Event Templates
const EVENT_TEMPLATES = {
  // Internal Events
  REBELLION: {
    title: 'Civil Unrest',
    description: 'Citizens are demanding better living conditions.',
    type: EVENT_TYPES.INTERNAL,
    impact: { happiness: -10, population: -50 }
  },
  ECONOMY: {
    title: 'Economic Challenge',
    description: 'Market fluctuations are affecting the kingdom.',
    type: EVENT_TYPES.INTERNAL,
    impact: { economy: -15, happiness: -5 }
  },
  FESTIVAL: {
    title: 'Festival Season',
    description: 'The people request a grand festival to boost morale.',
    type: EVENT_TYPES.INTERNAL,
    impact: { happiness: 15, economy: -10 }
  },
  TRADE: {
    title: 'Trade Opportunity',
    description: 'Merchants propose new trade routes.',
    type: EVENT_TYPES.EXTERNAL,
    impact: { economy: 15, happiness: 5 }
  },
  WAR: {
    title: 'Military Threat',
    description: 'A neighboring kingdom threatens our borders.',
    type: EVENT_TYPES.EXTERNAL,
    impact: { military: -20, population: -100 }
  }
};

class EventGenerator {
  constructor(kingdomId) {
    this.kingdomId = kingdomId;
  }

  async generateEvent(kingdomState) {
    try {
      // Select a random event template
      const templates = Object.values(EVENT_TEMPLATES);
      const template = templates[Math.floor(Math.random() * templates.length)];

      // Generate choices based on the event
      const choices = this._generateChoices(template, kingdomState);

      // Create the event
      const eventChoices = this._generateChoices(template, kingdomState);
      const event = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: template.title,
        description: template.description,
        type: template.type,
        impact: JSON.stringify(template.impact),
        choices: JSON.stringify(eventChoices.map(choice => ({
          ...choice,
          impact: JSON.stringify(choice.impact)
        }))),
        timestamp: new Date().toISOString(),
        kingdomId: this.kingdomId,
        resourceEffects: '{}',
        owner: kingdomState.owner
      };

      const { data } = await client.models.Event.create(event);
      return data;

    } catch (error) {
      console.error('Error generating event:', error);
      throw error;
    }
  }

  _generateChoices(template, kingdomState) {
    // Generate standard choices based on event type
    const baseChoices = [
      {
        text: "Accept and adapt",
        impact: {
          ...template.impact,
          happiness: Math.floor(template.impact.happiness * 0.8 || 0)
        }
      },
      {
        text: "Take aggressive action",
        impact: {
          happiness: -10,
          military: 5,
          economy: -5
        }
      }
    ];

    // Add conditional choices based on kingdom state
    if (kingdomState.economy > 30) {
      baseChoices.push({
        text: "Use treasury to resolve situation",
        impact: {
          economy: -20,
          happiness: 10,
          military: 5
        }
      });
    }

    if (kingdomState.military > 40) {
      baseChoices.push({
        text: "Show military strength",
        impact: {
          military: -10,
          happiness: 5,
          economy: 5
        }
      });
    }

    return baseChoices;
  }
}

export default EventGenerator;