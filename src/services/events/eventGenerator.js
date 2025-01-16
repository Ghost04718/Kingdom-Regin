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

  async generateEvent(kingdomState, activeChain = null) {
    try {
      console.log('Generating event for kingdom state:', kingdomState);
      console.log('Active chain:', activeChain);

      // If there's an active chain, prioritize chain-related events
      if (activeChain) {
        try {
          const chainEvent = await this._generateChainRelatedEvent(kingdomState, activeChain);
          if (chainEvent) {
            console.log('Generated chain-related event:', chainEvent);
            return chainEvent;
          }
        } catch (chainError) {
          console.warn('Failed to generate chain-related event:', chainError);
          // Fall back to regular event generation
        }
      }

      // Get event data either from AI or fallback
      let eventData;
      try {
        eventData = await this.aiService.generateEvent(kingdomState, activeChain);
        console.log('AI generated event:', eventData);
      } catch (aiError) {
        console.warn('AI event generation failed, using fallback system:', aiError);
        eventData = this._generateFallbackEvent(kingdomState, activeChain);
      }

      // Add chain interaction if appropriate
      eventData = this._addChainInteraction(eventData, activeChain);

      // Create event in database
      const event = {
        ...eventData,
        kingdomId: this.kingdomId,
        owner: kingdomState.owner,
        impact: eventData.impact || JSON.stringify({}),
        timestamp: new Date().toISOString()
      };

      console.log('Creating event in database:', event);
      const { data: createdEvent } = await client.models.Event.create(event);
      return createdEvent;

    } catch (error) {
      console.error('Event generation error:', error);
      return this._getEmergencyFallbackEvent(kingdomState, activeChain);
    }
  }

  async _generateChainRelatedEvent(kingdomState, activeChain) {
    // Check chain type and current state to generate related events
    const chainType = activeChain.chainType;
    const chainOutcomes = activeChain.outcomes || [];
    
    // Example: Generate events that reference or relate to the active chain
    let relatedEvent;
    switch (chainType) {
      case 'DIPLOMATIC':
        relatedEvent = this._generateDiplomaticRelatedEvent(chainOutcomes);
        break;
      case 'CRISIS':
        relatedEvent = this._generateCrisisRelatedEvent(chainOutcomes);
        break;
      case 'OPPORTUNITY':
        relatedEvent = this._generateOpportunityRelatedEvent(chainOutcomes);
        break;
      default:
        return null;
    }

    return {
      ...relatedEvent,
      relatedChainId: activeChain.id
    };
  }

  _addChainInteraction(eventData, activeChain) {
    // If there's an active chain, possibly modify event to reference it
    if (activeChain) {
      const modifiedEvent = { ...eventData };
      let choices = typeof eventData.choices === 'string' ? 
        JSON.parse(eventData.choices) : eventData.choices;

      // Add chain-aware choices
      choices = choices.map(choice => ({
        ...choice,
        chainImpact: this._calculateChainImpact(choice, activeChain)
      }));

      // Add chain-specific choice if appropriate
      if (this._shouldAddChainChoice(eventData, activeChain)) {
        choices.push(this._generateChainRelatedChoice(activeChain));
      }

      modifiedEvent.choices = JSON.stringify(choices);
      modifiedEvent.description = this._addChainContext(
        modifiedEvent.description, 
        activeChain
      );

      return modifiedEvent;
    }

    return eventData;
  }

  _calculateChainImpact(choice, activeChain) {
    // Calculate how this choice might affect the active chain
    const impact = {};
    
    if (activeChain.chainType === 'DIPLOMATIC') {
      // Example: Choices that affect military might impact diplomatic chains
      if (choice.impact.military) {
        impact.diplomatic = -Math.abs(choice.impact.military) / 2;
      }
    }

    return impact;
  }

  _shouldAddChainChoice(eventData, activeChain) {
    // Determine if we should add a chain-specific choice
    // Example: Add diplomatic options during a diplomatic chain
    return activeChain && 
           eventData.type !== 'RANDOM' && 
           !eventData.description.includes(activeChain.trigger);
  }

  _generateChainRelatedChoice(activeChain) {
    // Generate a choice that specifically relates to the active chain
    const baseChoice = {
      chainSpecific: true,
      continueChain: true
    };

    switch (activeChain.chainType) {
      case 'DIPLOMATIC':
        return {
          ...baseChoice,
          text: "Focus on diplomatic relations",
          impact: JSON.stringify({ 
            economy: -5, 
            happiness: 5, 
            military: -5 
          })
        };
      case 'CRISIS':
        return {
          ...baseChoice,
          text: "Address the ongoing crisis",
          impact: JSON.stringify({ 
            economy: -10, 
            happiness: -5, 
            military: -5 
          })
        };
      default:
        return {
          ...baseChoice,
          text: "Consider the bigger picture",
          impact: JSON.stringify({ 
            economy: -5, 
            happiness: 0, 
            military: 0 
          })
        };
    }
  }

  _addChainContext(description, activeChain) {
    // Add context about the active chain to the event description
    return `${description}\n\nMeanwhile, the situation with ${activeChain.trigger} continues to develop.`;
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