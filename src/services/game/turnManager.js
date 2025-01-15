// src/services/game/turnManager.js
import { generateClient } from 'aws-amplify/data';
import { GAME_CONFIG } from '../../constants/gameConstants';
import { calculateGrowthRates } from '../../constants/gameConstants';
import ResourceManagerService from '../resources/resourceManager';

const client = generateClient();

class TurnManager {
  constructor(kingdomId) {
    if (!kingdomId) {
      throw new Error('Kingdom ID is required for TurnManager');
    }
    this.kingdomId = kingdomId;
    this.resourceManager = new ResourceManagerService(kingdomId);
  }

  async processTurn(kingdom) {
    try {
      console.log('Processing turn for kingdom:', kingdom.id);
      
      // 1. Process natural growth and declines
      const growthRates = calculateGrowthRates(kingdom, kingdom.difficulty || 'NORMAL');
      const growthChanges = {};
      let notifications = [];

      // Calculate base changes
      Object.entries(growthRates).forEach(([stat, rate]) => {
        const currentValue = kingdom[stat];
        const maxValue = GAME_CONFIG[`MAX_${stat.toUpperCase()}`];
        const minValue = GAME_CONFIG[`MIN_${stat.toUpperCase()}`];
        
        // Calculate natural change
        let change = Math.floor(currentValue * rate);
        
        // Apply random variation (-20% to +20%)
        const variation = 1 + (Math.random() * 0.4 - 0.2);
        change = Math.floor(change * variation);
        
        // Ensure within limits
        const newValue = Math.min(maxValue, Math.max(minValue, currentValue + change));
        growthChanges[stat] = newValue;
        
        // Generate notifications for significant changes
        if (Math.abs(change) > currentValue * 0.1) { // More than 10% change
          notifications.push({
            type: change > 0 ? 'SUCCESS' : 'WARNING',
            message: `${stat.charAt(0).toUpperCase() + stat.slice(1)} has ${change > 0 ? 'increased' : 'decreased'} significantly!`
          });
        }
      });

      // 2. Process resources and their effects
      const resourceResult = await this.resourceManager.processTurn({
        ...kingdom,
        ...growthChanges
      });

      if (resourceResult.notifications) {
        notifications = [...notifications, ...resourceResult.notifications];
      }

      // 3. Calculate final kingdom stats with resource impacts
      const resourceImpacts = this.calculateResourceImpacts(resourceResult.resources || []);
      Object.entries(resourceImpacts).forEach(([stat, impact]) => {
        growthChanges[stat] = Math.min(
          GAME_CONFIG[`MAX_${stat.toUpperCase()}`],
          Math.max(
            GAME_CONFIG[`MIN_${stat.toUpperCase()}`],
            growthChanges[stat] + impact
          )
        );
      });

      // 4. Update kingdom
      const { data: updatedKingdom } = await client.models.Kingdom.update({
        id: kingdom.id,
        ...growthChanges,
        turn: kingdom.turn + 1,
        lastUpdated: new Date().toISOString()
      });

      if (!updatedKingdom) {
        throw new Error('Failed to update kingdom');
      }

      // 5. Generate summary
      const turnSummary = this.generateTurnSummary(kingdom, updatedKingdom);

      return {
        success: true,
        kingdom: updatedKingdom,
        summary: turnSummary,
        notifications,
        resourceResult
      };

    } catch (error) {
      console.error('Error processing turn:', error);
      return {
        success: false,
        error: error.message,
        notifications: [{
          type: 'CRITICAL',
          message: 'Failed to process turn'
        }]
      };
    }
  }

  calculateResourceImpacts(resources) {
    const impacts = {
      population: 0,
      economy: 0,
      military: 0,
      happiness: 0
    };

    resources.forEach(resource => {
      if (resource.status === 'CRITICAL') {
        impacts.happiness -= 5;
        impacts.economy -= 3;
      } else if (resource.status === 'WARNING') {
        impacts.happiness -= 2;
        impacts.economy -= 1;
      }

      // Specific resource type impacts
      switch (resource.type) {
        case 'FOOD':
          if (resource.status === 'CRITICAL') {
            impacts.population -= 100;
            impacts.happiness -= 10;
          } else if (resource.status === 'FULL') {
            impacts.population += 50;
            impacts.happiness += 5;
          }
          break;

        case 'MILITARY_SUPPLIES':
          if (resource.status === 'CRITICAL') {
            impacts.military -= 10;
            impacts.happiness -= 5;
          } else if (resource.status === 'FULL') {
            impacts.military += 5;
          }
          break;

        case 'GOLD':
          if (resource.status === 'CRITICAL') {
            impacts.economy -= 10;
            impacts.happiness -= 5;
          } else if (resource.status === 'FULL') {
            impacts.economy += 5;
            impacts.happiness += 2;
          }
          break;

        case 'LUXURY_GOODS':
          if (resource.status === 'CRITICAL') {
            impacts.happiness -= 15;
            impacts.economy -= 5;
          } else if (resource.status === 'FULL') {
            impacts.happiness += 10;
            impacts.economy += 3;
          }
          break;

        case 'BUILDING_MATERIALS':
          if (resource.status === 'CRITICAL') {
            impacts.economy -= 8;
            impacts.happiness -= 3;
          } else if (resource.status === 'FULL') {
            impacts.economy += 4;
            impacts.happiness += 2;
          }
          break;
      }
    });

    return impacts;
  }

  generateTurnSummary(oldKingdom, newKingdom) {
    const changes = {};
    const significantChanges = [];

    // Calculate changes for each stat
    ['population', 'economy', 'military', 'happiness'].forEach(stat => {
      const oldValue = oldKingdom[stat];
      const newValue = newKingdom[stat];
      const change = newValue - oldValue;
      const percentChange = (change / oldValue) * 100;

      changes[stat] = {
        old: oldValue,
        new: newValue,
        change: change,
        percentChange: percentChange
      };

      // Track significant changes (more than 10%)
      if (Math.abs(percentChange) >= 10) {
        significantChanges.push({
          stat,
          change,
          percentChange
        });
      }
    });

    // Generate summary text
    let summaryText = `Turn ${newKingdom.turn} Summary:\n`;

    // Add significant changes to summary
    if (significantChanges.length > 0) {
      summaryText += "\nSignificant Changes:";
      significantChanges.forEach(({ stat, change, percentChange }) => {
        const direction = change > 0 ? 'increased' : 'decreased';
        summaryText += `\n${stat.charAt(0).toUpperCase() + stat.slice(1)} ${direction} by ${Math.abs(percentChange).toFixed(1)}%`;
      });
    }

    return {
      changes,
      significantChanges,
      summaryText
    };
  }

  async checkUpgradeOpportunities(kingdom) {
    try {
      const resources = await this.resourceManager.getResourceReport(kingdom);
      const opportunities = [];

      for (const resource of resources) {
        const upgradeCheck = this.resourceManager.checkResourceUpgrade(resource, kingdom);
        if (upgradeCheck.canUpgrade) {
          opportunities.push({
            resourceId: resource.id,
            resourceName: resource.name,
            currentLevel: resource.qualityLevel,
            nextLevel: upgradeCheck.nextLevel
          });
        }
      }

      return opportunities;
    } catch (error) {
      console.error('Error checking upgrade opportunities:', error);
      return [];
    }
  }

  async processUpgrade(resourceId) {
    try {
      const { data: resource } = await client.models.Resource.get({ id: resourceId });
      if (!resource) {
        throw new Error('Resource not found');
      }

      const newLevel = (resource.qualityLevel || 1) + 1;
      const { data: updatedResource } = await client.models.Resource.update({
        id: resourceId,
        qualityLevel: newLevel,
        lastUpdated: new Date().toISOString()
      });

      return {
        success: true,
        resource: updatedResource
      };
    } catch (error) {
      console.error('Error processing upgrade:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default TurnManager;