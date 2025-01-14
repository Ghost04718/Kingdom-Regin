// src/components/game/ResourceManager.jsx
import { 
  Card, 
  Flex, 
  Text, 
  Grid, 
  View,
  Button,
  Badge,
  Icon
} from "@aws-amplify/ui-react";

const ResourceManager = ({ resources, kingdom }) => {
  const getStatusInfo = (resource) => {
    const { quantity, minQuantity, maxStorage, production, consumption } = resource;
    const netChange = production - consumption;
    const turnsUntilEmpty = netChange < 0 ? Math.ceil(quantity / Math.abs(netChange)) : Infinity;
    const turnsUntilFull = netChange > 0 ? Math.ceil((maxStorage - quantity) / netChange) : Infinity;
    
    let status = 'normal';
    let message = '';
    
    if (quantity <= minQuantity) {
      status = 'critical';
      message = `Critical: ${quantity} remaining!`;
    } else if (netChange < 0 && turnsUntilEmpty <= 5) {
      status = 'warning';
      message = `Depleted in ${turnsUntilEmpty} turns!`;
    } else if (quantity >= maxStorage * 0.9) {
      status = 'warning';
      message = `Storage almost full!`;
    }

    return { status, message, turnsUntilEmpty, turnsUntilFull };
  };

  const getResourceEffects = (resource) => {
    switch (resource.type) {
      case 'FOOD':
        return `Affects population growth and happiness`;
      case 'GOLD':
        return `Affects economy and trade`;
      case 'MILITARY_SUPPLIES':
        return `Affects military strength and defense`;
      default:
        return '';
    }
  };

  const TrendIcon = ({ trend }) => (
    <Icon
      ariaLabel={trend > 0 ? "Increasing" : "Decreasing"}
      color={trend > 0 ? "green" : "red"}
      viewBox={{ width: 24, height: 24 }}
      paths={[
        {
          d: trend > 0 
            ? "M7 14l5-5 5 5H7z" // Up arrow
            : "M7 10l5 5 5-5H7z", // Down arrow
        }
      ]}
    />
  );

  const ResourceItem = ({ resource }) => {
    const statusInfo = getStatusInfo(resource);
    const effects = getResourceEffects(resource);

    return (
      <Card
        padding="1rem"
        backgroundColor={
          statusInfo.status === 'critical' ? 'rgba(255,0,0,0.1)' :
          statusInfo.status === 'warning' ? 'rgba(255,165,0,0.1)' :
          'rgba(0,0,0,0.05)'
        }
        borderRadius="medium"
      >
        <Flex direction="column" gap="0.5rem">
          {/* Resource Header */}
          <Flex justifyContent="space-between" alignItems="center">
            <Text fontWeight="bold">{resource.name}</Text>
            {statusInfo.message && (
              <Badge
                variation={statusInfo.status === 'critical' ? 'error' : 'warning'}
              >
                {statusInfo.message}
              </Badge>
            )}
          </Flex>
          
          {/* Resource Quantity */}
          <View>
            <Flex justifyContent="space-between" alignItems="center">
              <Text fontSize="1.2em">
                {resource.quantity.toLocaleString()} / {resource.storageLimit.toLocaleString()}
              </Text>
              <Flex alignItems="center" gap="0.5rem">
                {resource.netChange !== 0 && (
                  <TrendIcon trend={resource.netChange} />
                )}
                <Text
                  fontSize="0.9em"
                  color={resource.netChange > 0 ? 'green' : resource.netChange < 0 ? 'red' : 'inherit'}
                >
                  {resource.netChange > 0 ? '+' : ''}{resource.netChange}/turn
                </Text>
              </Flex>
            </Flex>
            
            {/* Storage Bar */}
            <View 
              backgroundColor="rgba(0,0,0,0.1)" 
              height="4px" 
              marginTop="0.5rem"
              borderRadius="full"
            >
              <View
                backgroundColor={
                  statusInfo.status === 'critical' ? 'red' :
                  statusInfo.status === 'warning' ? 'orange' :
                  'green'
                }
                width={`${(resource.quantity / resource.storageLimit) * 100}%`}
                height="100%"
                borderRadius="full"
                transition="width 0.3s ease"
              />
            </View>
          </View>
          
          {/* Production/Consumption Details */}
          <Grid templateColumns="1fr 1fr" gap="0.5rem" marginTop="0.5rem">
            <Flex direction="column">
              <Text fontSize="0.8em" color="gray">Production</Text>
              <Text color="green">+{resource.production}/turn</Text>
            </Flex>
            <Flex direction="column" alignItems="flex-end">
              <Text fontSize="0.8em" color="gray">Consumption</Text>
              <Text color="red">-{resource.consumption}/turn</Text>
            </Flex>
          </Grid>

          {/* Resource Effects */}
          <Text fontSize="0.8em" color="gray" marginTop="0.5rem">
            {effects}
          </Text>

          {/* Alerts */}
          {statusInfo.status !== 'normal' && (
            <Flex gap="0.5rem" alignItems="center" marginTop="0.5rem">
              <Icon
                ariaLabel="Warning"
                color="orange"
                viewBox={{ width: 24, height: 24 }}
                paths={[
                  {
                    d: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z",
                  }
                ]}
              />
              <Text fontSize="0.8em" color="orange">
                {statusInfo.status === 'critical' 
                  ? 'Critical shortage! Take immediate action!'
                  : `Resource needs attention`}
              </Text>
            </Flex>
          )}
        </Flex>
      </Card>
    );
  };

  return (
    <Card padding="1rem">
      <Flex direction="column" gap="1rem">
        <Flex justifyContent="space-between" alignItems="center">
          <Text variation="primary" fontSize="1.2em" fontWeight="bold">
            Resources
          </Text>
          <Text fontSize="0.9em" color="gray">
            Population: {kingdom.population.toLocaleString()} | 
            Military: {kingdom.military.toLocaleString()}
          </Text>
        </Flex>
        
        <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap="1rem">
          {resources.map((resource) => (
            <ResourceItem key={resource.id} resource={resource} />
          ))}
        </Grid>
      </Flex>
    </Card>
  );
};

export default ResourceManager;