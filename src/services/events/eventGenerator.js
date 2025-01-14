// src/services/events/eventGenerator.js
import { generateClient } from 'aws-amplify/data';
import AIService from '../ai/aiService';

const client = generateClient();

class EventGenerator {
  constructor(kingdomId) {
    if (!kingdomId) {
      throw new Error('Kingdom ID is required for EventGenerator');
    }
    this.kingdomId = kingdomId;
    this.aiService = new AIService();
  }

  async generateEvent(kingdomState) {
    try {
      console.log('Generating event for kingdom state:', kingdomState);

      // Get event data either from AI or fallback
      let eventData;
      try {
        eventData = await this.aiService.generateEvent(kingdomState);
        console.log('AI generated event:', eventData);
      } catch (aiError) {
        console.warn('AI event generation failed, using fallback system:', aiError);
        eventData = this._generateFallbackEvent(kingdomState);
      }

      // Validate event data
      if (!eventData.title || !eventData.description || !eventData.type || !eventData.choices) {
        throw new Error('Invalid event data structure');
      }

      // Ensure choices is a string
      if (typeof eventData.choices !== 'string') {
        eventData.choices = JSON.stringify(eventData.choices);
      }

      // Add required fields for database
      const event = {
        ...eventData,
        kingdomId: this.kingdomId,
        owner: kingdomState.owner,
        impact: JSON.stringify({}), // Add empty impact if not present
        timestamp: eventData.timestamp || new Date().toISOString()
      };

      console.log('Creating event in database:', event);

      // Create event in database with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      while (retryCount < maxRetries) {
        try {
          const { data: createdEvent } = await client.models.Event.create(event);
          if (!createdEvent) {
            throw new Error('No event data returned from database');
          }
          console.log('Event created successfully:', createdEvent);
          return createdEvent;
        } catch (dbError) {
          console.warn(`Database creation attempt ${retryCount + 1} failed:`, dbError);
          retryCount++;
          if (retryCount === maxRetries) {
            throw new Error('Failed to create event after multiple attempts');
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    } catch (error) {
      console.error('Event generation error:', error);
      // Return a simple fallback event that doesn't require database storage
      return this._getEmergencyFallbackEvent(kingdomState);
    }
  }

  _getEmergencyFallbackEvent(kingdomState) {
    // This is a last-resort fallback that returns an event object directly
    // without database interaction
    return {
      id: 'fallback-' + Date.now(),
      title: 'Peaceful Day',
      description: 'Your kingdom enjoys a moment of peace.',
      type: 'RANDOM',
      choices: JSON.stringify([
        {
          text: "Maintain the peace",
          impact: JSON.stringify({ happiness: 5 })
        },
        {
          text: "Focus on improvements",
          impact: JSON.stringify({ economy: 5, military: 5, happiness: -5 })
        }
      ]),
      timestamp: new Date().toISOString(),
      kingdomId: this.kingdomId,
      owner: kingdomState.owner
    };
  }

  _generateFallbackEvent(kingdomState) {
    const templates = [
      {
        title: 'Trade Opportunity',
        description: 'Merchants propose new trade routes.',
        type: 'EXTERNAL',
        choices: [
          {
            text: 'Accept trade agreement',
            impact: { economy: 10, happiness: 5, military: -5 }
          },
          {
            text: 'Reject and focus internally',
            impact: { economy: -5, happiness: -5, military: 5 }
          }
        ]
      },
      {
        title: 'Military Training',
        description: 'Your generals request resources for exercises.',
        type: 'INTERNAL',
        choices: [
          {
            text: 'Approve training program',
            impact: { military: 15, economy: -10, happiness: -5 }
          },
          {
            text: 'Focus on civilian needs',
            impact: { military: -5, happiness: 10, economy: 5 }
          }
        ]
      }
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Convert impacts to strings
    const choices = template.choices.map(choice => ({
      text: choice.text,
      impact: JSON.stringify(choice.impact)
    }));

    return {
      title: template.title,
      description: template.description,
      type: template.type,
      choices: JSON.stringify(choices),
      timestamp: new Date().toISOString()
    };
  }
}

export default EventGenerator;