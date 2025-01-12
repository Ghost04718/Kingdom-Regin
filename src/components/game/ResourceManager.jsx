// src/components/game/ResourceManager.jsx
import { useState } from 'react';
import { 
  Card, 
  Flex, 
  Text, 
  Grid, 
  View, 
  Button,
  SliderField,
  Alert
} from "@aws-amplify/ui-react";

const ResourceManager = ({ resources, onAllocateWorkers, onUpgradeResource }) => {
  const [selectedResource, setSelectedResource] = useState(null);
  const [workerAllocation, setWorkerAllocation] = useState(0);

  const getStatusColor = (resource) => {
    if (resource.critical) return 'red';
    if (resource.storagePercentage >= 90) return '#ed6c02';
    if (resource.netChange < 0) return '#f44336';
    return 'green';
  };

  const getStorageColor = (percentage) => {
    if (percentage >= 90) return '#ed6c02';
    if (percentage >= 75) return '#ffc107';
    return '#4caf50';
  };

  const formatNumber = (num) => {
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toLocaleString()}`;
  };

  const ResourceDetails = ({ resource }) => (
    <View padding="1rem">
      <Text fontSize="1.2em" fontWeight="bold">{resource.name}</Text>
      <Grid templateColumns="1fr 1fr" gap="0.5rem" marginTop="1rem">
        <Text>Quality Level:</Text>
        <Text>{resource.qualityLevel}</Text>
        
        <Text>Workers:</Text>
        <Text>{resource.workerAllocation}</Text>
        
        <Text>Efficiency:</Text>
        <Text>{(resource.efficiency * 100).toFixed(1)}%</Text>
        
        <Text>Market Value:</Text>
        <Text>{resource.marketValue.toFixed(2)}</Text>
        
        {resource.seasonalModifier !== 1.0 && (
          <>
            <Text>Seasonal Effect:</Text>
            <Text>{(resource.seasonalModifier * 100 - 100).toFixed(1)}%</Text>
          </>
        )}
      </Grid>

      <View marginTop="1rem">
        <SliderField
          label="Allocate Workers"
          value={workerAllocation}
          onChange={(e) => setWorkerAllocation(parseInt(e.target.value))}
          min={0}
          max={1000}
          step={10}
        />
        <Button
          onClick={() => onAllocateWorkers(resource.id, workerAllocation)}
          variation="primary"
          size="small"
          marginTop="0.5rem"
        >
          Confirm Worker Allocation
        </Button>
      </View>

      <Button
        onClick={() => onUpgradeResource(resource.id)}
        variation="primary"
        size="small"
        marginTop="1rem"
      >
        Upgrade Quality (Cost: {Math.pow(2, resource.qualityLevel) * 100} Gold)
      </Button>
    </View>
  );

  const ResourceItem = ({ resource }) => (
    <Card
      padding="1rem"
      backgroundColor={resource.critical ? 'rgba(255,0,0,0.1)' : 'rgba(0,0,0,0.05)'}
      borderRadius="medium"
      onClick={() => setSelectedResource(resource)}
      style={{ cursor: 'pointer' }}
    >
      <Flex direction="column" gap="0.5rem">
        <Flex justifyContent="space-between" alignItems="center">
          <Text fontWeight="bold">{resource.name}</Text>
          <Text 
            fontSize="0.8em" 
            color={getStorageColor(resource.storagePercentage)}
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
          {resource.deterioration > 0 && (
            <Flex justifyContent="space-between" fontSize="0.9em">
              <Text>Deterioration:</Text>
              <Text color="#ff9800">-{resource.deterioration.toLocaleString()}/turn</Text>
            </Flex>
          )}
        </View>

        {resource.critical && (
          <Alert
            variation="error"
            isDismissible={false}
            hasIcon={true}
            heading="Critical Level!"
            marginTop="0.5rem"
          >
            Resource below minimum threshold
          </Alert>
        )}
      </Flex>
    </Card>
  );

  return (
    <Card padding="1rem">
      <Flex justifyContent="space-between" alignItems="center" marginBottom="1rem">
        <Text variation="primary" fontSize="1.2em" fontWeight="bold">
          Resources
        </Text>
        {selectedResource && (
          <Button
            size="small"
            onClick={() => setSelectedResource(null)}
          >
            Close Details
          </Button>
        )}
      </Flex>

      <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap="1rem">
        {resources.map((resource) => (
          <ResourceItem key={resource.name} resource={resource} />
        ))}
      </Grid>

      {selectedResource && (
        <Card marginTop="1rem">
          <ResourceDetails resource={selectedResource} />
        </Card>
      )}
    </Card>
  );
};

export default ResourceManager;