// src/services/ai/aiService.js
import OpenAI from "openai";
import { EVENT_TEMPLATES } from '../../constants/eventTemplates';

class AIService {
  constructor() {
    console.log('Environment variables available:', {
      hasApiKey: !!import.meta.env.VITE_OPENAI_API_KEY,
      hasBaseUrl: !!import.meta.env.VITE_OPENAI_BASE_URL,
      hasModel: !!import.meta.env.VITE_OPENAI_MODEL
    });

    const token = import.meta.env.VITE_OPENAI_API_KEY;
    const endpoint = import.meta.env.VITE_OPENAI_BASE_URL || "https://api.openai.com/v1";
    this.modelName = import.meta.env.VITE_OPENAI_MODEL || "gpt-4";

    if (!token) {
      console.warn('OpenAI API key not found, using fallback event system');
      this.client = null;
      this.usingFallback = true;
      return;
    }

    this.client = new OpenAI({ 
      baseURL: endpoint, 
      apiKey: token,
      dangerouslyAllowBrowser: true
    });
    this.usingFallback = false;
    this.eventHistory = [];
  }

  async generateEvent(kingdomState) {
    try {
      if (this.usingFallback) {
        console.log('Using fallback event system (no AI)');
        return this.getFallbackEvent(kingdomState);
      }

      console.log('Generating AI event for kingdom state:', kingdomState);

      const systemPrompt = this._generateSystemPrompt(kingdomState);
      const eventContext = this._generateEventContext(kingdomState);

      const response = await this.client.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: eventContext }
        ],
        temperature: 0.8,
        max_tokens: 500,
        model: this.modelName,
        response_format: { type: "json_object" }
      });

      const eventData = JSON.parse(response.choices[0].message.content);
      // Ensure the event data is properly formatted
      let validatedEvent;
      try {
        validatedEvent = await this.validateAndEnhanceEvent(eventData, kingdomState);
        // Convert choices to string if it's an array
        if (Array.isArray(validatedEvent.choices)) {
          validatedEvent.choices = JSON.stringify(validatedEvent.choices);
        }
      } catch (error) {
        console.error('Event validation failed:', error);
        return this.getFallbackEvent(kingdomState);
      }
      
      // Store event in history for context
      this.eventHistory.push({
        type: validatedEvent.type,
        timestamp: new Date().toISOString(),
        kingdomState: { ...kingdomState }
      });
      
      // Keep only last 10 events for context
      if (this.eventHistory.length > 10) {
        this.eventHistory.shift();
      }

      return validatedEvent;
    } catch (error) {
      console.error('AI event generation failed:', error);
      return this.getFallbackEvent(kingdomState);
    }
  }

  _generateSystemPrompt(kingdomState) {
    return `You are generating events for a medieval kingdom management game.
    Current Kingdom State:
    - Population: ${kingdomState.population}
    - Economy: ${kingdomState.economy}
    - Military: ${kingdomState.military}
    - Happiness: ${kingdomState.happiness}

    Generate contextual events that:
    1. Consider the kingdom's current state and challenges
    2. Offer meaningful choices with realistic consequences
    3. Create interesting narrative chains and storylines
    4. Balance risk and reward based on kingdom conditions
    5. Consider previous events and their outcomes
    
    Event impact guidelines:
    - Population changes: -300 to +300
    - Economy/Military/Happiness changes: -20 to +20
    - Higher-risk choices should have higher potential rewards
    - Impacts should be proportional to kingdom's current state

    Response must be a JSON object with:
    {
      "title": "Event title",
      "description": "Detailed event description",
      "type": "ECONOMIC|MILITARY|SOCIAL|RANDOM",
      "choices": [
        {
          "text": "Choice description",
          "impact": {
            "population": number,
            "economy": number,
            "military": number,
            "happiness": number
          }
        }
      ]
    }`;
  }

  _generateEventContext(kingdomState) {
    let context = `Generate an event considering:`;
    
    // Add critical state warnings
    if (kingdomState.population < 200) {
      context += "\n- Population is critically low";
    }
    if (kingdomState.economy < 20) {
      context += "\n- Economy is in crisis";
    }
    if (kingdomState.military < 20) {
      context += "\n- Military is severely weakened";
    }
    if (kingdomState.happiness < 20) {
      context += "\n- People are very unhappy";
    }

    // Add recent event history context
    if (this.eventHistory.length > 0) {
      context += "\n\nRecent events:";
      this.eventHistory.slice(-3).forEach(event => {
        context += `\n- ${event.type} event occurred when kingdom was in similar state`;
      });
    }

    // Add special opportunities based on state
    if (kingdomState.economy > 80) {
      context += "\n- Kingdom has strong economic opportunities";
    }
    if (kingdomState.military > 80) {
      context += "\n- Military is at its peak strength";
    }
    if (kingdomState.happiness > 80) {
      context += "\n- People are very supportive of leadership";
    }

    return context;
  }

  async validateAndEnhanceEvent(eventData, kingdomState) {
    console.log('Validating event data:', eventData);
    try {
      // Basic validation
      if (!eventData.title || !eventData.description || !Array.isArray(eventData.choices)) {
        throw new Error('Invalid event data structure');
      }

      // Enhance event based on kingdom state
      const enhancedEvent = {
        ...eventData,
        choices: eventData.choices.map(choice => {
          const impact = this._validateAndAdjustImpact(choice.impact, kingdomState);
          return {
            text: choice.text,
            impact: JSON.stringify(impact)
          };
        })
      };

      // Add narrative elements based on kingdom state
      if (kingdomState.economy < 30) {
        enhancedEvent.description += " The kingdom's treasury weighs heavily on everyone's minds.";
      }
      if (kingdomState.military < 30) {
        enhancedEvent.description += " The weakened state of the military is apparent.";
      }
      if (kingdomState.happiness < 30) {
        enhancedEvent.description += " The people's discontent can be felt throughout the kingdom.";
      }

      return {
        ...enhancedEvent,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Event validation/enhancement failed:', error);
      throw error;
    }
  }

  _validateAndAdjustImpact(impact, kingdomState) {
    const adjustedImpact = {};

    // Helper function to clamp values within range
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    // Adjust population impact
    if (impact.population) {
      const maxChange = Math.floor(kingdomState.population * 0.3); // Max 30% change
      adjustedImpact.population = clamp(impact.population, -maxChange, maxChange);
    }

    // Adjust other stats
    ['economy', 'military', 'happiness'].forEach(stat => {
      if (impact[stat]) {
        // More severe changes allowed when stats are higher
        const maxChange = Math.floor(kingdomState[stat] > 50 ? 20 : 15);
        adjustedImpact[stat] = clamp(impact[stat], -maxChange, maxChange);
      }
    });

    return adjustedImpact;
  }

  getFallbackEvent(kingdomState) {
    // Select appropriate template based on kingdom state
    let eventPool = [];
    
    if (kingdomState.economy < 30) {
      eventPool = eventPool.concat(Object.values(EVENT_TEMPLATES.ECONOMIC));
    }
    if (kingdomState.military < 30) {
      eventPool = eventPool.concat(Object.values(EVENT_TEMPLATES.MILITARY));
    }
    if (kingdomState.happiness < 30) {
      eventPool = eventPool.concat(Object.values(EVENT_TEMPLATES.SOCIAL));
    }
    
    // If no critical conditions, use random event
    if (eventPool.length === 0) {
      eventPool = [...Object.values(EVENT_TEMPLATES.RANDOM)];
    }

    const selectedEvent = eventPool[Math.floor(Math.random() * eventPool.length)];
    return {
      ...selectedEvent,
      timestamp: new Date().toISOString()
    };
  }
}

export default AIService;