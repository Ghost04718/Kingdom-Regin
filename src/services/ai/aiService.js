// src/services/ai/aiService.js
import OpenAI from "openai";

class AIService {
  constructor() {
    // Debug log the environment variables (sanitized)
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
  }

  async generateEvent(kingdomState) {
    try {
      // If no client is available, use fallback immediately
      if (this.usingFallback) {
        console.log('Using fallback event system (no AI)');
        return this.getFallbackEvent(kingdomState);
      }

      console.log('Attempting to generate event using OpenAI...');

      const systemPrompt = `
        You are an AI generating events for a medieval kingdom management game.
        Generate events in the following strict JSON format:
        {
          "title": "string",
          "description": "string",
          "type": "INTERNAL" | "EXTERNAL" | "RANDOM",
          "choices": [
            {
              "text": "string",
              "impact": {
                "population": number,
                "economy": number,
                "military": number,
                "happiness": number
              }
            }
          ]
        }`;

      const response = await this.client.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Generate an event based on this kingdom state:
              Population: ${kingdomState.population}
              Economy: ${kingdomState.economy}
              Military: ${kingdomState.military}
              Happiness: ${kingdomState.happiness}

              Return ONLY the JSON object with no additional text.` 
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        model: this.modelName,
        response_format: { type: "json_object" }
      });

      const eventText = response.choices[0].message.content;
      let eventData;
      
      try {
        eventData = JSON.parse(eventText);
      } catch (error) {
        console.error('Failed to parse AI response:', eventText);
        return this.getFallbackEvent(kingdomState);
      }

      return this.validateAndFormatEvent(eventData);
    } catch (error) {
        console.error('AI Service Error:', error);
        console.log('Falling back to local event generation');
        return this.getFallbackEvent(kingdomState);
      }
  }

  validateAndFormatEvent(eventData) {
    try {
      // Validate required fields
      if (!eventData.title || !eventData.description || !eventData.type || !Array.isArray(eventData.choices)) {
        throw new Error('Missing required fields in event data');
      }

      // Validate event type
      const validTypes = ['INTERNAL', 'EXTERNAL', 'RANDOM'];
      if (!validTypes.includes(eventData.type)) {
        throw new Error('Invalid event type');
      }

      // Validate and format choices
      if (eventData.choices.length < 2 || eventData.choices.length > 3) {
        throw new Error('Invalid number of choices');
      }

      const formattedChoices = eventData.choices.map(choice => {
        if (!choice.text || !choice.impact) {
          throw new Error('Invalid choice format');
        }

        // Validate impact values
        const impact = choice.impact;
        const validMetrics = ['population', 'economy', 'military', 'happiness'];
        
        validMetrics.forEach(metric => {
          if (impact[metric] !== undefined) {
            if (!Number.isInteger(impact[metric])) {
              impact[metric] = Math.round(impact[metric]);
            }
            if (Math.abs(impact[metric]) > 20) {
              impact[metric] = Math.sign(impact[metric]) * 20;
            }
          }
        });

        return {
          text: choice.text,
          impact: JSON.stringify(impact)
        };
      });

      return {
        title: eventData.title.trim(),
        description: eventData.description.trim(),
        type: eventData.type,
        choices: JSON.stringify(formattedChoices),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Event validation error:', error);
      throw new Error(`Event validation failed: ${error.message}`);
    }
  }

  getFallbackEvent(kingdomState) {
    // Simple fallback event when AI generation fails
    const fallbackEvents = [
      {
        title: "Council Meeting",
        description: "Your advisors have gathered to discuss the kingdom's future.",
        type: "INTERNAL",
        choices: JSON.stringify([
          {
            text: "Focus on economy",
            impact: JSON.stringify({ economy: 10, military: -5, happiness: 5 })
          },
          {
            text: "Strengthen military",
            impact: JSON.stringify({ military: 10, economy: -5, happiness: -5 })
          }
        ])
      },
      {
        title: "Trade Proposal",
        description: "Merchants request new trade routes.",
        type: "EXTERNAL",
        choices: JSON.stringify([
          {
            text: "Accept trade deal",
            impact: JSON.stringify({ economy: 10, happiness: 5 })
          },
          {
            text: "Decline offer",
            impact: JSON.stringify({ economy: -5, happiness: -5 })
          }
        ])
      }
    ];

    const fallbackEvent = fallbackEvents[Math.floor(Math.random() * fallbackEvents.length)];
    return {
      ...fallbackEvent,
      timestamp: new Date().toISOString()
    };
  }
}

export default AIService;