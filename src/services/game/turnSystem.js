// src/services/game/turnSystem.js
import { generateClient } from 'aws-amplify/data';
import TurnManager from './turnManager';
import EventGenerator from '../events/eventGenerator';
import { GAME_CONFIG } from '../../constants/gameConstants';

const client = generateClient();

class TurnSystem {
  constructor(kingdomId) {
    if (!kingdomId) {
      throw new Error('Kingdom ID is required for TurnSystem');
    }
    this.kingdomId = kingdomId;
    this.turnManager = new TurnManager(kingdomId);
    this.eventGenerator = new EventGenerator(kingdomId);
  }

  async processTurn(currentEvent = null) {
    try {
      console.log('Processing turn for kingdom:', this.kingdomId);
      
      // Get current kingdom state
      const { data: kingdom } = await client.models.Kingdom.get({
        id: this.kingdomId
      });

      if (!kingdom) {
        throw new Error('Kingdom not found');
      }

      // Store previous stats
      const previousStats = {
        previousPopulation: kingdom.population,
        previousEconomy: kingdom.economy,
        previousMilitary: kingdom.military,
        previousHappiness: kingdom.happiness
      };

      // Process turn with TurnManager
      const turnResult = await this.turnManager.processTurn(kingdom);
      
      if (!turnResult.success) {
        throw new Error(turnResult.error || 'Turn processing failed');
      }

      // Generate new event if no current event
      let event = currentEvent;
      if (!event) {
        event = await this.eventGenerator.generateEvent(turnResult.kingdom);
      }

      // Update kingdom with new turn and previous stats
      const updatedData = {
        ...turnResult.kingdom,
        ...previousStats,
        turn: kingdom.turn + 1,
        lastUpdated: new Date().toISOString()
      };

      const { data: updatedKingdom } = await client.models.Kingdom.update(updatedData);

      return {
        success: true,
        kingdom: updatedKingdom,
        event: event,
        turnSummary: turnResult.summary,
        notifications: [
          ...turnResult.notifications,
          ...(event ? [{ type: 'INFO', message: 'New event available!' }] : [])
        ]
      };

    } catch (error) {
      console.error('Turn processing error:', error);
      return {
        success: false,
        error: error.message,
        notifications: [{
          type: 'CRITICAL',
          message: `Turn processing failed: ${error.message}`
        }]
      };
    }
  }

  async processEventChoice(event, choice) {
    try {
      // Get current kingdom state
      const { data: kingdom } = await client.models.Kingdom.get({
        id: this.kingdomId
      });

      if (!kingdom) {
        throw new Error('Kingdom not found');
      }

      // Parse choice impact
      let impact;
      try {
        impact = typeof choice.impact === 'string' ? 
          JSON.parse(choice.impact) : choice.impact;
      } catch (error) {
        console.error('Error parsing choice impact:', error);
        throw new Error('Invalid choice impact data');
      }

      // Apply difficulty modifiers
      const difficultyModifiers = GAME_CONFIG.DIFFICULTY_LEVELS[kingdom.difficulty || 'NORMAL'].EVENT_IMPACT_MODIFIERS;

      // Calculate new stats with impact
      const newStats = {
        population: Math.max(0, kingdom.population + (impact.population || 0) * difficultyModifiers.positive),
        economy: Math.max(0, Math.min(100, kingdom.economy + (impact.economy || 0) * 
          (impact.economy >= 0 ? difficultyModifiers.positive : difficultyModifiers.negative))),
        military: Math.max(0, Math.min(100, kingdom.military + (impact.military || 0) * 
          (impact.military >= 0 ? difficultyModifiers.positive : difficultyModifiers.negative))),
        happiness: Math.max(0, Math.min(100, kingdom.happiness + (impact.happiness || 0) * 
          (impact.happiness >= 0 ? difficultyModifiers.positive : difficultyModifiers.negative)))
      };

      // Update kingdom with new stats
      const { data: updatedKingdom } = await client.models.Kingdom.update({
        id: kingdom.id,
        ...newStats,
        lastUpdated: new Date().toISOString()
      });

      // Process turn with new event
      return this.processTurn();

    } catch (error) {
      console.error('Event choice processing error:', error);
      return {
        success: false,
        error: error.message,
        notifications: [{
          type: 'ERROR',
          message: `Failed to process choice: ${error.message}`
        }]
      };
    }
  }
}

export default TurnSystem;