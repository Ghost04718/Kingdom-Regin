// src/services/events/eventGenerator.js
import { generateClient } from 'aws-amplify/data';

const client = generateClient();

const EVENT_TYPES = {
  INTERNAL: 'INTERNAL',
  EXTERNAL: 'EXTERNAL',
  RANDOM: 'RANDOM'
};

// Basic event templates
const EVENT_TEMPLATES = [
  {
    title: 'Trade Opportunity',
    description: 'Merchants propose new trade routes to boost the economy.',
    type: EVENT_TYPES.EXTERNAL,
    choices: [
      {
        text: 'Accept the trade proposal',
        impact: { economy: 10, happiness: 5, military: -5 }
      },
      {
        text: 'Decline the offer',
        impact: { economy: -5, happiness: -5 }
      }
    ]
  },
  {
    title: 'Military Training',
    description: 'Your generals request resources for military exercises.',
    type: EVENT_TYPES.INTERNAL,
    choices: [
      {
        text: 'Fund the training program',
        impact: { military: 15, economy: -10, happiness: -5 }
      },
      {
        text: 'Focus on civilian needs instead',
        impact: { military: -5, happiness: 10, economy: 5 }
      }
    ]
  },
  {
    title: 'Population Growth',
    description: 'New families are looking to settle in your kingdom.',
    type: EVENT_TYPES.INTERNAL,
    choices: [
      {
        text: 'Welcome the newcomers',
        impact: { population: 100, happiness: 5, economy: -5 }
      },
      {
        text: 'Restrict immigration',
        impact: { population: -50, happiness: -5, economy: 5 }
      }
    ]
  },
  {
    title: 'Natural Disaster',
    description: 'A severe storm has damaged parts of the kingdom.',
    type: EVENT_TYPES.RANDOM,
    choices: [
      {
        text: 'Focus on immediate repairs',
        impact: { economy: -15, happiness: 10, population: -50 }
      },
      {
        text: 'Save resources for later',
        impact: { economy: -5, happiness: -10, population: -100 }
      }
    ]
  }
];

class EventGenerator {
  constructor(kingdomId) {
    this.kingdomId = kingdomId;
  }

  async generateEvent(kingdomState) {
    try {
      // Select random event template
      const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
      
      // Adjust event based on kingdom state
      const adjustedEvent = this._adjustEventForKingdom(template, kingdomState);

      // Create the event in the database
      const event = {
        title: adjustedEvent.title,
        description: adjustedEvent.description,
        type: adjustedEvent.type,
        impact: JSON.stringify({}), // Base impact is empty, choices contain the impacts
        choices: JSON.stringify(adjustedEvent.choices),
        timestamp: new Date().toISOString(),
        kingdomId: this.kingdomId,
        owner: kingdomState.owner
      };

      const { data } = await client.models.Event.create(event);
      return data;

    } catch (error) {
      console.error('Error generating event:', error);
      throw error;
    }
  }

  _adjustEventForKingdom(template, kingdomState) {
    // Make a deep copy of the template
    const event = JSON.parse(JSON.stringify(template));

    // Adjust impacts based on kingdom state
    event.choices = event.choices.map(choice => {
      const impact = { ...choice.impact };

      // Adjust population changes based on current population
      if (impact.population) {
        impact.population = Math.floor(impact.population * (kingdomState.population / 1000));
      }

      // Adjust economic impact based on current economy
      if (impact.economy) {
        impact.economy = Math.floor(impact.economy * (kingdomState.economy / 50));
      }

      return {
        ...choice,
        impact
      };
    });

    return event;
  }
}

export default EventGenerator;