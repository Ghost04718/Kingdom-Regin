// src/services/resources/resourceManager.js
import { generateClient } from 'aws-amplify/data';
import { 
  BASE_RESOURCE_CONFIG,
  calculateModifiedResourceRates,
  calculateResourceStatus,
  calculateResourceEfficiency,
  predictResourceTrend
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

  async getResourceReport(kingdom) {
    try {
      console.log("Getting resource report for kingdom:", this.kingdomId);
      
      // First, let's try a simple list operation with detailed error logging
      let response;
      try {
        response = await client.models.Resource.list({
          filter: { kingdomId: { eq: this.kingdomId } }
        });
        console.log('Raw response from resource list:', response);
      } catch (listError) {
        console.error('Direct error from list operation:', listError);
        throw new Error(`List operation failed: ${listError.message}`);
      }

      // Check for errors in response
      if (response.errors) {
        console.error('Response errors:', response.errors);
        // Instead of throwing error, we'll just log it and continue with initialization
        return [];
      }

      // Validate response.data
      if (!response.data || !Array.isArray(response.data)) {
        console.log('No valid resources data found, returning empty array');
        return [];
      }

      // Filter and validate resources
      const validResources = response.data.filter(resource => {
        if (!resource || typeof resource !== 'object') {
          console.log('Invalid resource object:', resource);
          return false;
        }
        if (!resource.id || !resource.type) {
          console.log('Resource missing required fields:', resource);
          return false;
        }
        if (!BASE_RESOURCE_CONFIG[resource.type]) {
          console.log('Resource has invalid type:', resource.type);
          return false;
        }
        return true;
      });

      console.log('Valid resources found:', validResources.length);

      // Process valid resources
      const enrichedResources = await Promise.all(validResources.map(async (resource) => {
        try {
          const baseConfig = BASE_RESOURCE_CONFIG[resource.type];
          
          // Create a complete resource object with defaults
          const completeResource = {
            id: resource.id,
            name: resource.name || baseConfig.name,
            type: resource.type,
            category: resource.category || baseConfig.category,
            quantity: typeof resource.quantity === 'number' ? resource.quantity : baseConfig.baseProduction * 10,
            production: typeof resource.production === 'number' ? resource.production : baseConfig.baseProduction,
            consumption: typeof resource.consumption === 'number' ? resource.consumption : baseConfig.baseConsumption,
            baseProduction: baseConfig.baseProduction,
            baseConsumption: baseConfig.baseConsumption,
            minQuantity: baseConfig.minQuantity,
            maxStorage: baseConfig.maxStorage,
            qualityLevel: resource.qualityLevel || 1,
            dependencies: JSON.stringify(baseConfig.dependencies || {}),
            statusEffects: JSON.stringify(baseConfig.statusEffects || {}),
            status: 'NORMAL',
            lastUpdated: new Date().toISOString(),
            kingdomId: this.kingdomId,
            owner: resource.owner
          };

          // Calculate rates and stats
          const rates = calculateModifiedResourceRates(completeResource, kingdom, validResources);
          const efficiency = calculateResourceEfficiency(completeResource);
          const status = calculateResourceStatus(completeResource);
          const trends = predictResourceTrend(completeResource);

          // Combine everything into final resource object
          return {
            ...completeResource,
            production: rates.production,
            consumption: rates.consumption,
            netChange: rates.production - rates.consumption,
            efficiency,
            status,
            trends: JSON.stringify(trends)
          };

        } catch (processError) {
          console.error(`Error processing resource ${resource.id}:`, processError);
          // Return a safe version of the resource
          const baseConfig = BASE_RESOURCE_CONFIG[resource.type];
          return {
            id: resource.id,
            name: resource.name || baseConfig.name,
            type: resource.type,
            category: baseConfig.category,
            quantity: baseConfig.baseProduction * 10,
            production: baseConfig.baseProduction,
            consumption: baseConfig.baseConsumption,
            status: 'ERROR',
            qualityLevel: 1,
            kingdomId: this.kingdomId,
            owner: resource.owner,
            lastUpdated: new Date().toISOString()
          };
        }
      }));

      return enrichedResources;

    } catch (error) {
      console.error("Error in getResourceReport:", error);
      // Instead of throwing, return empty array to allow initialization
      return [];
    }
  }

  async initializeResources(userId) {
    console.log("Starting initializeResources for kingdom:", this.kingdomId, "userId:", userId);

    try {
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
      
      // Create each resource type defined in BASE_RESOURCE_CONFIG
      for (const [type, config] of Object.entries(BASE_RESOURCE_CONFIG)) {
        try {
          const resourceData = {
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
            efficiency: 100,
            dependencies: JSON.stringify(config.dependencies || {}),
            statusEffects: JSON.stringify(config.statusEffects || {}),
            trends: JSON.stringify([]),
            lastUpdated: new Date().toISOString(),
            kingdomId: this.kingdomId,
            owner: userId
          };

          const { data: resource } = await client.models.Resource.create(resourceData);
          
          if (!resource) {
            throw new Error(`Failed to create resource: ${type}`);
          }
          
          createdResources.push(resource);
          console.log(`Successfully created resource: ${type}`);
          
        } catch (error) {
          console.error(`Error creating resource ${type}:`, error);
          throw error;
        }
      }

      return createdResources;

    } catch (error) {
      console.error("Error in initializeResources:", error);
      throw error;
    }
  }

  async upgradeResource(resourceId) {
    try {
      const { data: resource } = await client.models.Resource.get({ id: resourceId });
      
      if (!resource) {
        throw new Error('Resource not found');
      }

      const config = BASE_RESOURCE_CONFIG[resource.type];
      const nextLevel = resource.qualityLevel + 1;

      if (!config.qualityLevels[nextLevel]) {
        throw new Error('Maximum level reached');
      }

      const qualityMultipliers = config.qualityLevels[nextLevel];
      const newMaxStorage = Math.floor(config.maxStorage * qualityMultipliers.storageMultiplier);

      const updatedResource = {
        ...resource,
        qualityLevel: nextLevel,
        maxStorage: newMaxStorage,
        production: Math.floor(resource.baseProduction * qualityMultipliers.productionMultiplier),
        consumption: Math.floor(resource.baseConsumption * qualityMultipliers.consumptionMultiplier),
        lastUpdated: new Date().toISOString()
      };

      const { data: result } = await client.models.Resource.update(updatedResource);

      return {
        success: true,
        resource: result
      };

    } catch (error) {
      console.error('Error upgrading resource:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

// src/services/resources/resourceManager.js

// ... previous methods remain the same ...

async processTurn(kingdom) {
  try {
    console.log("Processing turn for kingdom:", this.kingdomId);
    const resources = await this.getResourceReport(kingdom);
    const notifications = [];
    const updatedResources = [];

    for (const resource of resources) {
      try {
        // Calculate new quantity based on production/consumption
        const netChange = resource.production - resource.consumption;
        const newQuantity = Math.max(0, 
          Math.min(
            resource.maxStorage,
            resource.quantity + netChange
          )
        );

        // Prepare update data with only valid fields
        const updateData = {
          id: resource.id,
          quantity: newQuantity,
          lastUpdated: new Date().toISOString(),
          production: resource.production,
          consumption: resource.consumption,
          status: resource.status,
          efficiency: resource.efficiency || 100
        };

        // Update resource
        const { data: result } = await client.models.Resource.update(updateData);
        
        if (!result) {
          throw new Error(`Failed to update resource: ${resource.name}`);
        }
        
        updatedResources.push(result);

        // Generate notifications based on status
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

        // Add notification for storage capacity
        if (newQuantity >= resource.maxStorage * 0.9) {
          notifications.push({
            type: 'WARNING',
            message: `${resource.name} storage is nearly full!`
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
      notifications,
      resources: updatedResources
    };

  } catch (error) {
    console.error('Error processing resource turn:', error);
    return {
      success: false,
      error: error.message,
      notifications: [{
        type: 'ERROR',
        message: 'Failed to process resources'
      }]
    };
  }
}
}

export default ResourceManagerService;