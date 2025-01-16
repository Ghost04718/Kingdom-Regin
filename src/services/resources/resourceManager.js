// src/services/resources/resourceManager.js
import { generateClient } from 'aws-amplify/data';
import { 
  BASE_RESOURCE_CONFIG,
  RESOURCE_TYPES
} from '../../constants/resourceConstants';

const client = generateClient();

class ResourceManagerService {
  constructor(kingdomId) {
    if (!kingdomId) {
      throw new Error('Kingdom ID is required for ResourceManager');
    }
    this.kingdomId = kingdomId;
    console.log('ResourceManager constructed with kingdomId:', kingdomId);
  }

  async initializeResources(userId) {
    try {
      console.log("Starting initializeResources for kingdom:", this.kingdomId, "userId:", userId);
      
      // Check for existing resources
      const { data: existingResources } = await client.models.Resource.list({
        filter: { kingdomId: { eq: this.kingdomId } }
      });

      if (existingResources?.length > 0) {
        console.log("Found existing resources:", existingResources);
        return existingResources;
      }

      console.log("No existing resources found, creating new ones...");
      
      const createdResources = [];
      
      // Create each resource type
      for (const type of Object.values(RESOURCE_TYPES)) {
        try {
          const config = BASE_RESOURCE_CONFIG[type];
          const resourceData = {
            id: `resource_${type.toLowerCase()}_${Date.now()}`,
            name: config.name,
            type: type,
            category: config.category,
            quantity: config.baseProduction * 10,
            production: config.baseProduction,
            consumption: config.baseConsumption,
            baseProduction: config.baseProduction,
            baseConsumption: config.baseConsumption,
            minQuantity: config.minQuantity,
            maxStorage: config.maxStorage,
            status: 'NORMAL',
            qualityLevel: 1,
            kingdomId: this.kingdomId,
            owner: userId,
            lastUpdated: new Date().toISOString()
          };

          console.log(`Creating resource ${type} with data:`, resourceData);

          const { data: resource } = await client.models.Resource.create(resourceData);
          
          if (!resource?.id) {
            console.error(`No data returned when creating resource ${type}`);
            throw new Error(`Failed to create resource: ${type}`);
          }
          
          console.log(`Successfully created resource: ${type}`, resource);
          createdResources.push(resource);
          
        } catch (error) {
          console.error(`Error creating resource ${type}:`, error);
          throw new Error(`Failed to create resource: ${type}`);
        }
      }

      return createdResources;

    } catch (error) {
      console.error("Error in initializeResources:", error);
      throw error;
    }
  }

  async getResourceReport(kingdom) {
    try {
      const { data: resources } = await client.models.Resource.list({
        filter: { kingdomId: { eq: this.kingdomId } }
      });

      return resources || [];
    } catch (error) {
      console.error("Error getting resource report:", error);
      return [];
    }
  }

  async processTurn(turnNumber) {
    try {
      const resources = await this.getResourceReport();
      const notifications = [];

      for (const resource of resources) {
        try {
          // Calculate new quantity
          const netChange = resource.production - resource.consumption;
          const newQuantity = Math.max(0, 
            Math.min(
              resource.maxStorage,
              resource.quantity + netChange
            )
          );

          // Update resource
          const { data: updatedResource } = await client.models.Resource.update({
            id: resource.id,
            quantity: newQuantity,
            lastUpdated: new Date().toISOString()
          });

          if (!updatedResource) {
            throw new Error(`Failed to update resource: ${resource.name}`);
          }

          // Generate notifications
          if (newQuantity <= resource.minQuantity) {
            notifications.push({
              type: 'CRITICAL',
              message: `${resource.name} has reached critical levels!`
            });
          } else if (newQuantity <= resource.minQuantity * 1.5) {
            notifications.push({
              type: 'WARNING',
              message: `${resource.name} is running low!`
            });
          }
        } catch (error) {
          console.error(`Error processing resource ${resource.name}:`, error);
          notifications.push({
            type: 'ERROR',
            message: `Failed to process ${resource.name}: ${error.message}`
          });
        }
      }

      return {
        success: true,
        notifications
      };
    } catch (error) {
      console.error('Error processing resources:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async upgradeResource(resourceId) {
    try {
      const { data: resource } = await client.models.Resource.get({
        id: resourceId
      });

      if (!resource) {
        throw new Error('Resource not found');
      }

      const config = BASE_RESOURCE_CONFIG[resource.type];
      const nextLevel = resource.qualityLevel + 1;

      if (!config.qualityLevels[nextLevel]) {
        throw new Error('Maximum level reached');
      }

      const { data: updatedResource } = await client.models.Resource.update({
        id: resourceId,
        qualityLevel: nextLevel,
        lastUpdated: new Date().toISOString()
      });

      return {
        success: true,
        resource: updatedResource
      };

    } catch (error) {
      console.error('Error upgrading resource:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default ResourceManagerService;