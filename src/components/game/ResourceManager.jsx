// src/components/game/ResourceManager.jsx
import { 
  Card, 
  Flex, 
  Text, 
  Grid, 
  View,
  Badge,
  Button,
  Alert,
  Placeholder,
  Tabs,
  useTheme,
  Divider
} from "@aws-amplify/ui-react";
import { useResources } from '../../contexts/ResourceContext';
import ResourceTrendChart from './ResourceTrendChart';
import ResourceDependencies from './ResourceDependencies';
import ResourceEfficiency from './ResourceEfficiency';
import { RESOURCE_CATEGORIES } from '../../constants/resourceConstants';

const ResourceManager = ({ onNotification }) => {
  const { 
    resources, 
    resourceTrends, 
    isLoading, 
    error, 
    resourceManager, 
    loadResources,
    upgradeResource 
  } = useResources();
  
  const { tokens } = useTheme();

  if (isLoading) {
    return (
      <Card padding="1rem">
        <Flex direction="column" gap="1rem">
          <Text>Loading resources...</Text>
          <Grid 
            templateColumns={{
              base: "1fr",
              small: "repeat(2, 1fr)",
              medium: "repeat(3, 1fr)"
            }} 
            gap="1rem"
          >
            {[1, 2, 3].map((i) => (
              <Card key={i} padding="1rem">
                <Flex direction="column" gap="1rem">
                  <Placeholder height="20px" />
                  <Placeholder height="40px" />
                  <Placeholder height="20px" />
                </Flex>
              </Card>
            ))}
          </Grid>
        </Flex>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variation="error" isDismissible={false}>
        <Text>Failed to load resources: {error}</Text>
        <Button onClick={loadResources} marginTop="1rem">
          Retry Loading
        </Button>
      </Alert>
    );
  }

  const handleUpgrade = async (resourceId) => {
    try {
      const result = await upgradeResource(resourceId);
      if (result.success) {
        onNotification?.({
          type: 'SUCCESS',
          message: 'Resource upgraded successfully!'
        });
      } else {
        throw new Error(result.error || 'Failed to upgrade resource');
      }
    } catch (error) {
      console.error('Error upgrading resource:', error);
      onNotification?.({
        type: 'ERROR',
        message: `Failed to upgrade resource: ${error.message}`
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CRITICAL': return tokens.colors.red[60];
      case 'WARNING': return tokens.colors.orange[60];
      case 'CAUTION': return tokens.colors.yellow[60];
      case 'SURPLUS': return tokens.colors.blue[60];
      case 'STABLE': return tokens.colors.green[60];
      default: return tokens.colors.neutral[60];
    }
  };

// Inside ResourceManager.jsx, update the ResourceCard component

const ResourceCard = ({ resource }) => {
  const trend = resourceTrends[resource.id];
  const statusColor = getStatusColor(resource.status);

  return (
    <Card
      padding="1rem"
      backgroundColor={`${statusColor}10`}
      style={{
        borderLeft: `4px solid ${statusColor}`
      }}
    >
      <Flex direction="column" gap="1rem">
        {/* Header */}
        <Flex justifyContent="space-between" alignItems="center">
          <Flex direction="column">
            <Text fontWeight="bold">{resource.name}</Text>
            <Text fontSize="sm" color="font.secondary">
              Level {resource.qualityLevel}
            </Text>
          </Flex>
          <Badge variation={resource.status.toLowerCase()}>
            {resource.status}
          </Badge>
        </Flex>

        <Divider />

        {/* Main Stats */}
        <Grid templateColumns="1fr 1fr" gap="1rem">
          <View>
            <Text fontSize="sm" color="font.secondary">Production</Text>
            <Text color="green" fontWeight="bold">
              +{resource.production}/turn
            </Text>
          </View>
          <View>
            <Text fontSize="sm" color="font.secondary">Consumption</Text>
            <Text color="red" fontWeight="bold">
              -{resource.consumption}/turn
            </Text>
          </View>
        </Grid>

        {/* Storage Bar */}
        <View>
          <Flex justifyContent="space-between" alignItems="center">
            <Text fontSize="sm">
              {resource.quantity.toLocaleString()} / {resource.maxStorage.toLocaleString()}
            </Text>
            <Text
              fontSize="sm"
              color={resource.netChange > 0 ? 'green' : resource.netChange < 0 ? 'red' : 'inherit'}
            >
              {resource.netChange > 0 ? '+' : ''}{resource.netChange}/turn
            </Text>
          </Flex>
          <View 
            backgroundColor="background.secondary"
            height="8px"
            marginTop="0.5rem"
            borderRadius="full"
          >
            <View
              backgroundColor={statusColor}
              width={`${Math.min(100, (resource.quantity / resource.maxStorage) * 100)}%`}
              height="100%"
              borderRadius="full"
              style={{
                transition: 'width 0.3s ease'
              }}
            />
          </View>
        </View>

        {/* Tabs for detailed info */}
        <Tabs>
          <Tabs.Item title="Trends">
            <ResourceTrendChart
              predictions={trend.predictions}
              maxStorage={resource.maxStorage}
            />
          </Tabs.Item>
          <Tabs.Item title="Dependencies">
            <ResourceDependencies
              resource={resource}
              dependencies={resource.dependencies}
            />
          </Tabs.Item>
          <Tabs.Item title="Efficiency">
            <ResourceEfficiency
              efficiency={trend.efficiency}
              status={resource.status}
            />
          </Tabs.Item>
        </Tabs>

        {/* Status Effects */}
        {trend.statusEffects && Object.keys(trend.statusEffects).length > 0 && (
          <View backgroundColor="background.warning" padding="0.5rem" borderRadius="medium">
            <Text fontSize="sm" fontWeight="bold">Status Effects:</Text>
            <Flex gap="0.5rem" marginTop="0.25rem" flexWrap="wrap">
              {Object.entries(trend.statusEffects).map(([stat, value]) => (
                <Badge
                  key={stat}
                  variation="warning"
                >
                  {stat}: {value > 0 ? '+' : ''}{value}
                </Badge>
              ))}
            </Flex>
          </View>
        )}

        {/* Upgrade Button */}
        {resource.qualityLevel < 4 && (
          <Button
            onClick={() => handleUpgrade(resource.id)}
            variation="primary"
            size="small"
            style={{ width: '100%' }}
          >
            Upgrade to Level {resource.qualityLevel + 1}
          </Button>
        )}
      </Flex>
    </Card>
  );
};

  // Group resources by category
  const resourcesByCategory = Object.values(RESOURCE_CATEGORIES).reduce((acc, category) => {
    acc[category] = resources.filter(r => r.category === category);
    return acc;
  }, {});

  return (
    <Card padding="1rem">
      <Flex direction="column" gap="2rem">
        {/* Category Sections */}
        {Object.entries(resourcesByCategory).map(([category, categoryResources]) => (
          categoryResources.length > 0 && (
            <View key={category}>
              <Flex justifyContent="space-between" alignItems="center" marginBottom="1rem">
                <Text variation="primary" fontSize="1.2em" fontWeight="bold">
                  {category}
                </Text>
              </Flex>
              
              <Grid 
                templateColumns={{
                  base: "1fr",
                  small: "repeat(2, 1fr)",
                  medium: "repeat(3, 1fr)"
                }} 
                gap="1rem"
              >
                {categoryResources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </Grid>
            </View>
          )
        ))}

        {/* Resource Tips */}
        <Card variation="outlined" padding="1rem">
          <Text fontSize="0.9em" color="font.secondary">
            Tips:
            {resources.some(r => r?.status === 'CRITICAL' || r?.status === 'WARNING') ? (
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                {resources.map(r => {
                  if (r?.status === 'CRITICAL' || r?.status === 'WARNING') {
                    return (
                      <li key={r.id}>
                        {r.name}: {r.netChange < 0 
                          ? `Consuming ${Math.abs(r.netChange)} more than producing` 
                          : `Production barely meeting demand`}
                      </li>
                    );
                  }
                  return null;
                }).filter(Boolean)}
              </ul>
            ) : (
              <Text as="span" marginLeft="0.5rem">
                All resources are at healthy levels
              </Text>
            )}
          </Text>
        </Card>
      </Flex>
    </Card>
  );
};

export default ResourceManager;