// src/services/resources/resourceManager.js
import { generateClient } from 'aws-amplify/data';

const client = generateClient();

const RESOURCE_CONFIG = {
  GOLD: {
    baseProduction: 50,
    baseConsumption: 30,
    minQuantity: 100,
    maxStorage: 10000,
  },
  FOOD: {
    baseProduction: 100,
    baseConsumption: 50,
    minQuantity: 200,
    maxStorage: 5000,
  },
  MILITARY_SUPPLIES: {
    baseProduction: 30,
    baseConsumption: 20,
    minQuantity: 100,
    maxStorage: 3000,
  }
};

class ResourceManager {
  constructor(kingdomId) {
    if (!kingdomId) {
      throw new Error('Kingdom ID is required for ResourceManager');
    }
    this.kingdomId = kingdomId;
  }

  async initializeResources() {
    console.log("Initializing resources for kingdom:", this.kingdomId);

    try {
      // Check for existing resources first with retry logic
      let existingResources;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          const { data: resources } = await client.models.Resource.list({
            filter: { kingdomId: { eq: this.kingdomId } }
          });
          existingResources = resources;
          break;
        } catch (error) {
          console.warn(`Failed to fetch resources, attempt ${retryCount + 1}:`, error);
          retryCount++;
          if (retryCount === maxRetries) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      if (existingResources && existingResources.length > 0) {
        console.log("Resources already exist for this kingdom");
        return existingResources;
      }

      const initialResources = Object.entries(RESOURCE_CONFIG).map(([type, config]) => ({
        name: type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' '),
        type,
        quantity: Math.floor(config.maxStorage * 0.2),
        production: config.baseProduction,
        consumption: config.baseConsumption,
        minQuantity: config.minQuantity,
        maxStorage: config.maxStorage,
        kingdomId: this.kingdomId,
        owner: this.kingdomId.split('_')[0]
      }));

      console.log("Creating initial resources:", initialResources);

      // Create resources with retry logic
      const createdResources = [];
      for (const resource of initialResources) {
        retryCount = 0;
        while (retryCount < maxRetries) {
          try {
            const response = await client.models.Resource.create(resource);
            createdResources.push(response.data);
            break;
          } catch (error) {
            console.warn(`Failed to create resource, attempt ${retryCount + 1}:`, error);
            retryCount++;
            if (retryCount === maxRetries) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }

      console.log("Resources created successfully:", createdResources);
      return createdResources;

    } catch (error) {
      console.error("Error initializing resources:", error);
      throw new Error(`Failed to initialize resources: ${error.message}`);
    }
  }

  async processTurn(kingdom) {
    try {
      const { data: resources } = await client.models.Resource.list({
        filter: { kingdomId: { eq: this.kingdomId } }
      });

      const notifications = [];
      const resourceUpdates = [];

      for (const resource of resources) {
        // Calculate production based on kingdom stats
        let production = resource.production;
        let consumption = resource.consumption;

        // Adjust consumption based on kingdom size
        if (resource.type === 'FOOD') {
          consumption *= (kingdom.population / 1000);
        }
        if (resource.type === 'MILITARY_SUPPLIES') {
          consumption *= (kingdom.military / 50);
        }

        // Calculate new quantity
        const netChange = production - consumption;
        const newQuantity = Math.max(0, 
          Math.min(
            resource.maxStorage,
            resource.quantity + netChange
          )
        );

        // Check for warnings
        if (newQuantity <= resource.minQuantity) {
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
          })
        );
      }

      await Promise.all(resourceUpdates);

      return {
        success: true,
        notifications
      };
    } catch (error) {
      console.error("Error processing resource turn:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getResourceReport() {
    try {
      const { data: resources } = await client.models.Resource.list({
        filter: { kingdomId: { eq: this.kingdomId } }
      });

      return resources.map(resource => ({
        id: resource.id,
        name: resource.name,
        quantity: resource.quantity,
        production: resource.production,
        consumption: resource.consumption,
        netChange: resource.production - resource.consumption,
        critical: resource.quantity <= resource.minQuantity,
        storageLimit: resource.maxStorage,
        storagePercentage: Math.floor((resource.quantity / resource.maxStorage) * 100)
      }));
    } catch (error) {
      console.error("Error generating resource report:", error);
      throw error;
    }
  }
}

export default ResourceManager;