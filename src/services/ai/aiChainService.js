// src/services/ai/aiChainService.js
import OpenAI from "openai";

class AIChainService {
  constructor() {
    const token = import.meta.env.VITE_OPENAI_API_KEY;
    const endpoint = import.meta.env.VITE_OPENAI_BASE_URL || "https://api.openai.com/v1";
    this.modelName = import.meta.env.VITE_OPENAI_MODEL || "gpt-4";

    if (!token) {
      console.warn('OpenAI API key not found, using fallback chain system');
      this.client = null;
      this.usingFallback = true;
      return;
    }

    this.client = new OpenAI({ 
      baseURL: endpoint, 
      apiKey: token,
      dangerouslyAllowBrowser: true
    });
  }

  async generateChainEvent(chainState, kingdomState) {
    try {
      if (this.usingFallback) {
        return this.getFallbackChainEvent(chainState, kingdomState);
      }

      console.log('Generating chain event using OpenAI...');

      const systemPrompt = `
        You are an AI generating events for a medieval kingdom management game.
        This is part of an event chain "${chainState.trigger}".
        Current step: ${chainState.currentStep + 1}
        Previous outcomes: ${JSON.stringify(chainState.outcomes)}
        
        Generate next event in this chain in the following strict JSON format:
        {
          "title": "string",
          "description": "string",
          "type": "INTERNAL" | "EXTERNAL" | "RANDOM",
          "choices": [
            {
              "text": "string",
              "impact": {
                "population": number (-20 to 20),
                "economy": number (-20 to 20),
                "military": number (-20 to 20),
                "happiness": number (-20 to 20)
              },
              "continueChain": boolean
            }
          ]
        }
        
        Make sure the event follows logically from previous choices and maintains narrative consistency.
        At least one choice should have continueChain: true unless this is the final event.`;

      const response = await this.client.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Generate next event in the chain based on:
              Kingdom state:
              - Population: ${kingdomState.population}
              - Economy: ${kingdomState.economy}
              - Military: ${kingdomState.military}
              - Happiness: ${kingdomState.happiness}
              
              Return ONLY the JSON object with no additional text.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        model: this.modelName,
        response_format: { type: "json_object" }
      });

      const eventData = JSON.parse(response.choices[0].message.content);
      return this.validateAndFormatChainEvent(eventData);

    } catch (error) {
      console.error('AI Chain Service Error:', error);
      return this.getFallbackChainEvent(chainState, kingdomState);
    }
  }

  validateAndFormatChainEvent(eventData) {
    try {
      if (!eventData.title || !eventData.description || !eventData.type || !Array.isArray(eventData.choices)) {
        throw new Error('Invalid event data structure');
      }

      // Ensure choices have the correct format
      const formattedChoices = eventData.choices.map(choice => {
        if (!choice.text || !choice.impact) {
          throw new Error('Invalid choice format');
        }

        // Validate and normalize impact values
        const impact = {};
        ['population', 'economy', 'military', 'happiness'].forEach(stat => {
          const value = choice.impact[stat];
          if (typeof value === 'number') {
            impact[stat] = Math.max(-20, Math.min(20, Math.round(value)));
          }
        });

        return {
          text: choice.text.trim(),
          impact: JSON.stringify(impact),
          continueChain: !!choice.continueChain
        };
      });

      return {
        title: eventData.title.trim(),
        description: eventData.description.trim(),
        type: eventData.type,
        choices: JSON.stringify(formattedChoices)
      };

    } catch (error) {
      console.error('Chain event validation error:', error);
      throw error;
    }
  }

  getFallbackChainEvent(chainState, kingdomState) {
    // Generate appropriate fallback events based on chain state
    const chainTemplates = {
      DIPLOMATIC: [
        {
          title: 'Diplomatic Tensions Rise',
          description: 'The neighboring kingdom responds to your previous action.',
          type: 'EXTERNAL',
          choices: [
            {
              text: 'Seek peaceful resolution',
              impact: { economy: -5, happiness: 5 },
              continueChain: true
            },
            {
              text: 'Stand firm',
              impact: { military: 10, happiness: -10 },
              continueChain: true
            },
            {
              text: 'Cut diplomatic ties',
              impact: { economy: -15, military: 5 },
              continueChain: false
            }
          ]
        },
        // Add more templates...
      ],
      CRISIS: [
        {
          title: 'Crisis Deepens',
          description: 'The situation becomes more dire.',
          type: 'INTERNAL',
          choices: [
            {
              text: 'Take drastic measures',
              impact: { economy: -10, happiness: -10, military: 10 },
              continueChain: true
            },
            {
              text: 'Seek outside help',
              impact: { economy: -5, happiness: 5 },
              continueChain: true
            }
          ]
        },
        // Add more templates...
      ],
      // Add more chain types...
    };

    // Select appropriate template based on chain type and state
    const templates = chainTemplates[chainState.chainType] || chainTemplates.DIPLOMATIC;
    const template = templates[Math.floor(Math.random() * templates.length)];

    // Format choices
    const choices = template.choices.map(choice => ({
      ...choice,
      impact: JSON.stringify(choice.impact)
    }));

    return {
      ...template,
      choices: JSON.stringify(choices)
    };
  }
}

export default AIChainService;