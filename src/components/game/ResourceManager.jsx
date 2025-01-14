// src/components/game/ResourceManager.jsx
import { 
  Card, 
  Flex, 
  Text, 
  Grid, 
  View
} from "@aws-amplify/ui-react";

const ResourceManager = ({ resources }) => {
  const getStatusColor = (resource) => {
    if (resource.critical) return 'red';
    if (resource.netChange < 0) return '#f44336';
    return 'green';
  };

  const formatNumber = (num) => {
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toLocaleString()}`;
  };

  const ResourceItem = ({ resource }) => (
    <Card
      padding="1rem"
      backgroundColor={resource.critical ? 'rgba(255,0,0,0.1)' : 'rgba(0,0,0,0.05)'}
      borderRadius="medium"
    >
      <Flex direction="column" gap="0.5rem">
        <Flex justifyContent="space-between" alignItems="center">
          <Text fontWeight="bold">{resource.name}</Text>
          <Text 
            fontSize="0.8em" 
            color={resource.storagePercentage >= 90 ? '#ed6c02' : 'inherit'}
          >
            {resource.storagePercentage}% Full
          </Text>
        </Flex>
        
        <View>
          <Text fontSize="1.2em">
            {resource.quantity.toLocaleString()} / {resource.storageLimit.toLocaleString()}
            <span
              style={{
                fontSize: '0.8em',
                color: getStatusColor(resource),
                marginLeft: '0.5rem'
              }}
            >
              ({formatNumber(resource.netChange)}/turn)
            </span>
          </Text>
        </View>
        
        <View marginTop="0.5rem">
          <Flex justifyContent="space-between" fontSize="0.9em">
            <Text>Production:</Text>
            <Text color="green">{resource.production.toLocaleString()}/turn</Text>
          </Flex>
          <Flex justifyContent="space-between" fontSize="0.9em">
            <Text>Consumption:</Text>
            <Text color="red">-{resource.consumption.toLocaleString()}/turn</Text>
          </Flex>
        </View>
      </Flex>
    </Card>
  );

  return (
    <Card padding="1rem">
      <Text variation="primary" fontSize="1.2em" fontWeight="bold" marginBottom="1rem">
        Resources
      </Text>
      <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap="1rem">
        {resources.map((resource) => (
          <ResourceItem key={resource.id} resource={resource} />
        ))}
      </Grid>
    </Card>
  );
};

export default ResourceManager;