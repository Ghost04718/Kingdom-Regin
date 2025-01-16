// src/services/ai/kingdomGenerator.js
import OpenAI from "openai";

class KingdomGeneratorService {
  constructor() {
    this.client = null;
    this.initialize();
  }

  initialize() {
    const token = import.meta.env.VITE_OPENAI_API_KEY;
    const endpoint = import.meta.env.VITE_OPENAI_BASE_URL || "https://api.openai.com/v1";
    this.modelName = import.meta.env.VITE_OPENAI_MODEL || "gpt-4";

    if (!token) {
      console.warn('OpenAI API key not found, using fallback generation system');
      return;
    }

    this.client = new OpenAI({ 
      baseURL: endpoint, 
      apiKey: token,
      dangerouslyAllowBrowser: true
    });
  }

  async generateKingdom(difficulty = 'NORMAL', preferences = {}) {
    try {
      if (!this.client) {
        console.log('No AI client available, using fallback generation');
        return this.generateFallbackKingdom(difficulty);
      }

      const systemPrompt = `
        Generate a basic game profile with numerical statistics.
        The profile should be appropriate for a ${difficulty} difficulty level.
        Focus: ${preferences.focus || 'BALANCED'}
        Strategy: ${preferences.startingStrategy || 'STANDARD'}
        
        Respond with only a JSON object in this format:
        {
          "name": "string (realm name)",
          "population": number (between 500-2000),
          "economy": number (between 30-70),
          "military": number (between 20-60),
          "happiness": number (between 40-80),
          "description": "string (brief background)"
        }`;

      const response = await this.client.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate a new game profile." }
        ],
        temperature: 0.7,
        max_tokens: 300,
        model: this.modelName,
        response_format: { type: "json_object" }
      });

      console.log('AI generation response:', response);

      const kingdomData = JSON.parse(response.choices[0].message.content);
      return this.processKingdomData(kingdomData, difficulty);

    } catch (error) {
      console.warn('AI generation failed, using fallback:', error);
      return this.generateFallbackKingdom(difficulty);
    }
  }

  processKingdomData(kingdomData, difficulty) {
    const difficultyModifier = {
      EASY: 1.2,
      NORMAL: 1.0,
      HARD: 0.8
    }[difficulty] || 1.0;

    // Ensure values are within bounds and apply difficulty modifier
    const processedData = {
      id: `kingdom_${Date.now()}`,
      name: kingdomData.name || this.generateFallbackName(),
      population: Math.floor(Math.min(2000, Math.max(500, kingdomData.population)) * difficultyModifier),
      economy: Math.floor(Math.min(70, Math.max(30, kingdomData.economy)) * difficultyModifier),
      military: Math.floor(Math.min(60, Math.max(20, kingdomData.military)) * difficultyModifier),
      happiness: Math.floor(Math.min(80, Math.max(40, kingdomData.happiness)) * difficultyModifier),
      description: kingdomData.description || "A new kingdom begins its journey.",
      difficulty: difficulty,
      turn: 1,
      lastUpdated: new Date().toISOString()
    };

    console.log('Processed kingdom data:', processedData);
    return processedData;
  }

  generateFallbackKingdom(difficulty) {
    const difficultyModifier = {
      EASY: 1.2,
      NORMAL: 1.0,
      HARD: 0.8
    }[difficulty] || 1.0;

    const baseStats = {
      population: 1000,
      economy: 50,
      military: 40,
      happiness: 60
    };

    return {
      id: `kingdom_${Date.now()}`,
      name: this.generateFallbackName(),
      population: Math.floor(baseStats.population * difficultyModifier),
      economy: Math.floor(baseStats.economy * difficultyModifier),
      military: Math.floor(baseStats.military * difficultyModifier),
      happiness: Math.floor(baseStats.happiness * difficultyModifier),
      description: "A new kingdom rises from humble beginnings.",
      difficulty: difficulty,
      turn: 1,
      lastUpdated: new Date().toISOString()
    };
  }

  generateFallbackName() {
    const prefixes = ['New', 'Old', 'Great', 'High', 'Golden'];
    const roots = ['realm', 'haven', 'gate', 'keep', 'cross'];
    const suffixes = ['shire', 'mark', 'land', 'vale', 'reign'];

    const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
    
    return getRandomElement(prefixes) + 
           getRandomElement(roots).charAt(0).toUpperCase() + 
           getRandomElement(roots).slice(1) + 
           getRandomElement(suffixes);
  }
}

export default KingdomGeneratorService;