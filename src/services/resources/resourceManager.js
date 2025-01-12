// src/services/resources/resourceManager.js
import { generateClient } from 'aws-amplify/data';

const client = generateClient();

// Resource configuration constants
const RESOURCE_CONFIG = {
  GOLD: {
    baseDeteriorationRate: 0,
    seasonalEffects: false,
    baseStorageLimit: 10000,
    workerEfficiency: 2.0,
    baseMarketValue: 1.0,
  },
  FOOD: {
    baseDeteriorationRate: 0.05,
    seasonalEffects: true,
    baseStorageLimit: 5000,
    workerEfficiency: 1.0,
    baseMarketValue: 0.8,
  },
  TIMBER: {
    baseDeteriorationRate: 0.02,
    seasonalEffects: true,
    baseStorageLimit: 2000,
    workerEfficiency: 1.5,
    baseMarketValue: 1.2,
  },
  IRON: {
    baseDeteriorationRate: 0.01,
    seasonalEffects: false,
    baseStorageLimit: 1000,
    workerEfficiency: 1.8,
    baseMarketValue: 2.0,
  },
  STONE: {
    baseDeteriorationRate: 0,
    seasonalEffects: false,
    baseStorageLimit: 3000,
    workerEfficiency: 1.2,
    baseMarketValue: 1.5,
  }
};

class ResourceManager {
  constructor(kingdomId) {
    this.kingdomId = kingdomId;
  }

  // Initialize resources for a new kingdom
  async initializeResources() {
    const initialResources = [
      {
        name: "Gold",
        type: "GOLD",
        quantity: 1000,
        baseProduction: 50,
        productionMultiplier: 1.0,
        consumption: 30,
        consumptionMultiplier: 1.0,
        minimumQuantity: 100,
        maximumStorage: RESOURCE_CONFIG.GOLD.baseStorageLimit,
        productionEfficiency: 1.0,
        workerAllocation: 50,
        qualityLevel: 1,
        marketValue: RESOURCE_CONFIG.GOLD.baseMarketValue,
        deteriorationRate: RESOURCE_CONFIG.GOLD.baseDeteriorationRate,
        seasonalModifier: 1.0,
        modifiers: {},
      },
      {
        name: "Food",
        type: "FOOD",
        quantity: 500,
        baseProduction: 100,
        productionMultiplier: 1.0,
        consumption: 50,
        consumptionMultiplier: 1.0,
        minimumQuantity: 200,
        maximumStorage: RESOURCE_CONFIG.FOOD.baseStorageLimit,
        productionEfficiency: 1.0,
        workerAllocation: 100,
        qualityLevel: 1,
        marketValue: RESOURCE_CONFIG.FOOD.baseMarketValue,
        deteriorationRate: RESOURCE_CONFIG.FOOD.baseDeteriorationRate,
        seasonalModifier: this._calculateSeasonalModifier("FOOD"),
        modifiers: {},
      },
      // Add more initial resources...
    ];

    try {
      for (const resource of initialResources) {
        await client.models.Resource.create({
          ...resource,
          kingdomId: this.kingdomId,
          lastTradeUpdate: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error initializing resources:", error);
      throw error;
    }
  }

  // Calculate seasonal effects on resources
  _calculateSeasonalModifier(resourceType) {
    if (!RESOURCE_CONFIG[resourceType].seasonalEffects) return 1.0;
    
    const currentDate = new Date();
    const month = currentDate.getMonth();
    
    // Seasonal modifiers (spring: 2-4, summer: 5-7, fall: 8-10, winter: 11-1)
    const seasonalModifiers = {
      FOOD: {
        spring: 1.2,
        summer: 1.5,
        fall: 1.0,
        winter: 0.6,
      },
      TIMBER: {
        spring: 1.0,
        summer: 1.2,
        fall: 1.1,
        winter: 0.8,
      },
    };

    let season;
    if (month >= 2 && month <= 4) season = 'spring';
    else if (month >= 5 && month <= 7) season = 'summer';
    else if (month >= 8 && month <= 10) season = 'fall';
    else season = 'winter';

    return seasonalModifiers[resourceType]?.[season] || 1.0;
  }

  // Calculate production and consumption with all modifiers
  _calculateResourceChanges(resource, kingdom) {
    // Base production calculation
    let production = resource.baseProduction * resource.productionEfficiency;
    
    // Apply worker efficiency
    production *= (resource.workerAllocation * RESOURCE_CONFIG[resource.type].workerEfficiency) / 100;
    
    // Apply seasonal and quality modifiers
    production *= resource.seasonalModifier * (1 + (resource.qualityLevel - 1) * 0.1);
    
    // Apply kingdom-level modifiers
    const kingdomModifiers = kingdom.resourceModifiers || {};
    if (kingdomModifiers[resource.type]) {
      production *= kingdomModifiers[resource.type].productionMultiplier || 1.0;
    }

    // Calculate consumption
    let consumption = resource.consumption * resource.consumptionMultiplier;
    
    // Apply population-based consumption
    if (resource.type === 'FOOD') {
      consumption *= (kingdom.population / 1000);
    }

    // Apply military consumption for certain resources
    if (['FOOD', 'GOLD', 'IRON'].includes(resource.type)) {
      consumption *= (1 + (kingdom.military / 100) * 0.2);
    }

    return { production: Math.floor(production), consumption: Math.floor(consumption) };
  }

  // Process resource deterioration
  _processDeterioration(resource) {
    if (resource.deteriorationRate <= 0) return 0;
    
    const deterioration = Math.floor(resource.quantity * resource.deteriorationRate);
    return Math.min(deterioration, resource.quantity);
  }

  // Update market values based on supply and demand
  async _updateMarketValues(resources) {
    const baseValues = {};
    const supplyDemandRatio = {};

    // Calculate supply/demand ratios
    for (const resource of resources) {
      const production = this._calculateResourceChanges(resource).production;
      const consumption = this._calculateResourceChanges(resource).consumption;
      supplyDemandRatio[resource.type] = production / (consumption || 1);

      // Update market value based on supply/demand
      const newMarketValue = RESOURCE_CONFIG[resource.type].baseMarketValue * 
        (1 + (1 - supplyDemandRatio[resource.type]) * 0.5);

      await client.models.Resource.update({
        id: resource.id,
        marketValue: Math.max(0.1, Math.min(5.0, newMarketValue)), // Clamp between 0.1 and 5.0
      });
    }
  }

  // Process resource production and consumption for a turn
  async processTurn(kingdom) {
    try {
      const { data: resources } = await client.models.Resource.list({
        filter: { kingdomId: { eq: this.kingdomId } }
      });

      const notifications = [];
      const resourceUpdates = [];

      // Update seasonal modifiers
      for (const resource of resources) {
        if (RESOURCE_CONFIG[resource.type].seasonalEffects) {
          resource.seasonalModifier = this._calculateSeasonalModifier(resource.type);
        }
      }

      // Process each resource
      for (const resource of resources) {
        // Calculate production and consumption
        const { production, consumption } = this._calculateResourceChanges(resource, kingdom);
        
        // Calculate deterioration
        const deterioration = this._processDeterioration(resource);

        // Calculate net change
        const netChange = production - consumption - deterioration;
        
        // Calculate new quantity with storage limits
        const newQuantity = Math.max(0, 
          Math.min(
            resource.maximumStorage,
            resource.quantity + netChange
          )
        );

        // Check for storage capacity warnings
        if (newQuantity >= resource.maximumStorage * 0.9) {
          notifications.push({
            type: 'WARNING',
            message: `${resource.name} storage is nearly full!`
          });
        }

        // Check for critical resources
        if (newQuantity <= resource.minimumQuantity) {
          notifications.push({
            type: 'CRITICAL',
            message: `${resource.name} has reached critical levels!`
          });
        }

        // Update resource
        resourceUpdates.push(
          client.models.Resource.update({
            id: resource.id,
            quantity: newQuantity,
            productionMultiplier: production / (resource.baseProduction || 1),
            consumptionMultiplier: consumption / (resource.consumption || 1),
            seasonalModifier: resource.seasonalModifier,
          })
        );
      }

      // Update market values
      await this._updateMarketValues(resources);

      // Wait for all updates to complete
      await Promise.all(resourceUpdates);

      return {
        success: true,
        notifications,
      };
    } catch (error) {
      console.error("Error processing resource turn:", error);
      return {
        success: false,
        error: error.message,
        notifications: [{
          type: 'ERROR',
          message: 'Failed to process resource production and consumption'
        }]
      };
    }
  }

  // Get detailed resource report
  async getResourceReport() {
    try {
      const { data: resources } = await client.models.Resource.list({
        filter: { kingdomId: { eq: this.kingdomId } }
      });

      return resources.map(resource => {
        const production = Math.floor(
          resource.baseProduction * 
          resource.productionEfficiency * 
          resource.seasonalModifier * 
          (resource.workerAllocation * RESOURCE_CONFIG[resource.type].workerEfficiency / 100)
        );

        const consumption = Math.floor(
          resource.consumption * 
          resource.consumptionMultiplier
        );

        const deterioration = this._processDeterioration(resource);

        return {
          name: resource.name,
          quantity: resource.quantity,
          production,
          consumption,
          deterioration,
          netChange: production - consumption - deterioration,
          critical: resource.quantity <= resource.minimumQuantity,
          storageLimit: resource.maximumStorage,
          storagePercentage: Math.floor((resource.quantity / resource.maximumStorage) * 100),
          marketValue: resource.marketValue,
          qualityLevel: resource.qualityLevel,
          workerAllocation: resource.workerAllocation,
          seasonalModifier: resource.seasonalModifier,
          efficiency: resource.productionEfficiency
        };
      });
    } catch (error) {
      console.error("Error generating resource report:", error);
      throw error;
    }
  }

  // Allocate workers to resource production
  async allocateWorkers(resourceId, workers) {
    try {
      const { data: resource } = await client.models.Resource.get({ id: resourceId });
      
      if (!resource) {
        throw new Error('Resource not found');
      }

      await client.models.Resource.update({
        id: resourceId,
        workerAllocation: Math.max(0, Math.min(1000, workers)) // Limit between 0 and 1000 workers
      });

      return {
        success: true,
        message: `Successfully allocated ${workers} workers to ${resource.name} production`
      };
    } catch (error) {
      console.error("Error allocating workers:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Upgrade resource quality
  async upgradeResourceQuality(resourceId) {
    try {
      const { data: resource } = await client.models.Resource.get({ id: resourceId });
      
      if (!resource) {
        throw new Error('Resource not found');
      }

      const upgradeCost = Math.pow(2, resource.qualityLevel) * 100; // Exponential cost increase
      
      // Check if kingdom can afford upgrade
      const { data: goldResource } = await client.models.Resource.list({
        filter: {
          kingdomId: { eq: this.kingdomId },
          type: { eq: 'GOLD' }
        }
      });

      if (!goldResource[0] || goldResource[0].quantity < upgradeCost) {
        return {
          success: false,
          error: 'Insufficient gold for upgrade'
        };
      }

      // Perform upgrade
      await Promise.all([
        client.models.Resource.update({
          id: resourceId,
          qualityLevel: resource.qualityLevel + 1
        }),
        client.models.Resource.update({
          id: goldResource[0].id,
          quantity: goldResource[0].quantity - upgradeCost
        })
      ]);

      return {
        success: true,
        message: `Successfully upgraded ${resource.name} to quality level ${resource.qualityLevel + 1}`
      };
    } catch (error) {
      console.error("Error upgrading resource:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Trade resources with other kingdoms
  async createTradeOffer(resourceType, quantity, price, toKingdomId) {
    try {
      // Verify resource availability
      const { data: resources } = await client.models.Resource.list({
        filter: {
          kingdomId: { eq: this.kingdomId },
          type: { eq: resourceType }
        }
      });

      if (!resources[0] || resources[0].quantity < quantity) {
        return {
          success: false,
          error: 'Insufficient resources for trade'
        };
      }

      // Create trade offer
      const { data: trade } = await client.models.ResourceTrade.create({
        fromKingdomId: this.kingdomId,
        toKingdomId,
        resourceType,
        quantity,
        price,
        status: 'PENDING',
        expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hour expiration
        terms: `Trade offer: ${quantity} ${resourceType} for ${price} gold`
      });

      return {
        success: true,
        tradeId: trade.id,
        message: 'Trade offer created successfully'
      };
    } catch (error) {
      console.error("Error creating trade offer:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Accept trade offer
  async acceptTradeOffer(tradeId) {
    try {
      const { data: trade } = await client.models.ResourceTrade.get({ id: tradeId });
      
      if (!trade || trade.status !== 'PENDING') {
        return {
          success: false,
          error: 'Invalid or expired trade offer'
        };
      }

      // Verify buyer has enough gold
      const { data: buyerGold } = await client.models.Resource.list({
        filter: {
          kingdomId: { eq: this.kingdomId },
          type: { eq: 'GOLD' }
        }
      });

      if (!buyerGold[0] || buyerGold[0].quantity < trade.price) {
        return {
          success: false,
          error: 'Insufficient gold for trade'
        };
      }

      // Process trade
      await this._processTradeTransaction(trade);

      return {
        success: true,
        message: 'Trade completed successfully'
      };
    } catch (error) {
      console.error("Error accepting trade:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process trade transaction
  async _processTradeTransaction(trade) {
    // Update seller's resources
    const { data: sellerResource } = await client.models.Resource.list({
      filter: {
        kingdomId: { eq: trade.fromKingdomId },
        type: { eq: trade.resourceType }
      }
    });

    // Update buyer's resources
    const { data: buyerResource } = await client.models.Resource.list({
      filter: {
        kingdomId: { eq: trade.toKingdomId },
        type: { eq: trade.resourceType }
      }
    });

    // Update trade status and resources atomically
    await Promise.all([
      client.models.ResourceTrade.update({
        id: trade.id,
        status: 'COMPLETED'
      }),
      client.models.Resource.update({
        id: sellerResource[0].id,
        quantity: sellerResource[0].quantity - trade.quantity
      }),
      client.models.Resource.update({
        id: buyerResource[0].id,
        quantity: buyerResource[0].quantity + trade.quantity
      })
    ]);
  }
}

export default ResourceManager;