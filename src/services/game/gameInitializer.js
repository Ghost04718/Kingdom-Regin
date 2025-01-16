// src/services/game/gameInitializer.js
import { generateClient } from 'aws-amplify/data';
import KingdomGeneratorService from '../ai/kingdomGenerator';
import ResourceManagerService from '../resources/resourceManager';

const client = generateClient();

class GameInitializer {
  constructor() {
    this.kingdomGenerator = new KingdomGeneratorService();
  }

  async initializeNewGame(userId, options = {}) {
    let createdKingdom = null;
    
    try {
      console.log('Initializing new game for user:', userId);

      // Generate initial kingdom data
      let kingdomData = this.kingdomGenerator.generateFallbackKingdom(options.difficulty || 'NORMAL');
      kingdomData.owner = userId;

      console.log('Creating kingdom with data:', kingdomData);

      // Create kingdom in database
      try {
        const result = await client.models.Kingdom.create({
          id: kingdomData.id,
          name: kingdomData.name,
          population: kingdomData.population,
          economy: kingdomData.economy,
          military: kingdomData.military,
          happiness: kingdomData.happiness,
          description: kingdomData.description,
          difficulty: kingdomData.difficulty,
          turn: kingdomData.turn,
          lastUpdated: kingdomData.lastUpdated,
          owner: kingdomData.owner
        });

        console.log('Kingdom creation result:', result);
        createdKingdom = result.data;

        if (!createdKingdom?.id) {
          throw new Error('No data returned from kingdom creation');
        }

        // Initialize resources
        console.log('Initializing resources for kingdom:', createdKingdom.id);
        const resourceManager = new ResourceManagerService(createdKingdom.id);
        const resources = await resourceManager.initializeResources(userId);

        if (!resources || resources.length === 0) {
          throw new Error('Failed to create initial resources');
        }

        // Create settings
        try {
          await client.models.Settings.create({
            id: `settings_${Date.now()}`,
            difficulty: options.difficulty || 'NORMAL',
            soundEnabled: true,
            musicEnabled: true,
            musicVolume: 70,
            owner: userId
          });
        } catch (settingsError) {
          console.warn('Failed to create settings:', settingsError);
          // Non-critical error, continue
        }

        return {
          success: true,
          kingdom: createdKingdom
        };

      } catch (error) {
        // If we created a kingdom but failed at resources/settings, clean up
        if (createdKingdom?.id) {
          try {
            await client.models.Kingdom.delete({ id: createdKingdom.id });
            console.log('Cleaned up kingdom after failure:', createdKingdom.id);
          } catch (cleanupError) {
            console.error('Failed to cleanup kingdom:', cleanupError);
          }
        }
        console.error('Database operation failed:', error);
        throw new Error('Database operation failed: ' + error.message);
      }

    } catch (error) {
      console.error('Game initialization failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default GameInitializer;