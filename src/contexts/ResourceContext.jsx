// src/contexts/ResourceContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import ResourceManager from '../services/resources/resourceManager';
import { 
  calculateModifiedResourceRates,
  calculateResourceStatus,
  calculateNetChange,
  predictResourceTrend,
  calculateResourceEfficiency,
  getResourceStatusEffects,
  BASE_RESOURCE_CONFIG
} from '../constants/resourceConstants';

const client = generateClient();
const ResourceContext = createContext(null);

export const ResourceProvider = ({ children, kingdom }) => {
  const [resources, setResources] = useState([]);
  const [resourceTrends, setResourceTrends] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resourceManager, setResourceManager] = useState(null);
  const { user } = useAuthenticator();

  // Initialize resource manager when kingdom changes
  useEffect(() => {
    if (kingdom?.id) {
      setResourceManager(new ResourceManager(kingdom.id));
    }
  }, [kingdom?.id]);

  // Calculate resource trends
  const calculateTrends = useCallback((currentResources) => {
    const trends = {};
    currentResources.forEach(resource => {
      trends[resource.id] = {
        predictions: predictResourceTrend(resource),
        efficiency: calculateResourceEfficiency(resource),
        statusEffects: getResourceStatusEffects(resource)
      };
    });
    return trends;
  }, []);

    // Enrich resource data with calculations and dependencies
const enrichResourceData = useCallback((resources, kingdom) => {
  if (!Array.isArray(resources)) return [];
  
  return resources.map(resource => {
    try {
      const { production, consumption } = calculateModifiedResourceRates(resource, kingdom, resources);
      const status = calculateResourceStatus(resource);
      const netChange = calculateNetChange(production || 0, consumption || 0);
      const config = BASE_RESOURCE_CONFIG[resource.type];
      
      // Get dependent resources with default empty array
      const dependencies = config?.dependencies ? Object.keys(config.dependencies)
        .map(depType => resources.find(r => r.type === depType))
        .filter(Boolean) : [];

      return {
        ...resource,
        production: production || 0,
        consumption: consumption || 0,
        netChange,
        status: status || 'NORMAL',
        dependencies,
        category: config?.category || 'OTHER'
      };
    } catch (error) {
      console.error(`Error enriching resource data for ${resource.id}:`, error);
      return {
        ...resource,
        production: 0,
        consumption: 0,
        netChange: 0,
        status: 'ERROR',
        dependencies: [],
        category: 'OTHER'
      };
    }
  });
}, []);

// Update initResources to handle errors better
const initResources = useCallback(async () => {
  if (!resourceManager || !kingdom || !user) {
    return;
  }

  try {
    setIsLoading(true);
    setError(null);
    
    const report = await resourceManager.getResourceReport(kingdom);
    
    if (!report || report.length === 0) {
      console.log('No resources found, initializing...');
      const newResources = await resourceManager.initializeResources(user.username || user.userId);
      if (!newResources?.length) {
        throw new Error('Failed to initialize resources');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newReport = await resourceManager.getResourceReport(kingdom);
      const enrichedResources = enrichResourceData(newReport || [], kingdom);
      setResources(enrichedResources);
      setResourceTrends(calculateTrends(enrichedResources));
    } else {
      const enrichedResources = enrichResourceData(report, kingdom);
      setResources(enrichedResources);
      setResourceTrends(calculateTrends(enrichedResources));
    }
  } catch (err) {
    console.error("Resource initialization failed:", err);
    setError(err.message || 'Failed to initialize resources');
    setResources([]);
    setResourceTrends({});
  } finally {
    setIsLoading(false);
  }
}, [resourceManager, kingdom, user, enrichResourceData, calculateTrends]);

  // Load resources
  const loadResources = useCallback(async () => {
    if (!resourceManager || !kingdom) return;

    try {
      const report = await resourceManager.getResourceReport(kingdom);
      const enrichedResources = enrichResourceData(report, kingdom);
      setResources(enrichedResources);
      setResourceTrends(calculateTrends(enrichedResources));
    } catch (err) {
      console.error('Error loading resources:', err);
      setError(err.message);
    }
  }, [resourceManager, kingdom, enrichResourceData, calculateTrends]);

  // Update resource on quality upgrade
  const upgradeResource = useCallback(async (resourceId) => {
    if (!resourceManager) return;

    try {
      const result = await resourceManager.upgradeResource(resourceId);
      if (result.success) {
        await loadResources();
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [resourceManager, loadResources]);

  // Call initResources when dependencies change
  useEffect(() => {
    if (resourceManager && kingdom && user) {
      initResources();
    }
  }, [resourceManager, kingdom, user, initResources]);

  const value = {
    resources,
    resourceTrends,
    isLoading,
    error,
    loadResources,
    upgradeResource,
    resourceManager
  };

  return (
    <ResourceContext.Provider value={value}>
      {children}
    </ResourceContext.Provider>
  );
};

export const useResources = () => {
  const context = useContext(ResourceContext);
  if (!context) {
    throw new Error('useResources must be used within ResourceProvider');
  }
  return context;
};

export default ResourceContext;