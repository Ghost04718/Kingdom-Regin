// src/components/game/ResourceManager.jsx
import { Card, Flex, Text, Grid } from "@aws-amplify/ui-react";

const ResourceManager = ({ resources }) => {
  return (
    <Card padding="1rem">
      <Text variation="primary" fontSize="1.2em" fontWeight="bold" marginBottom="1rem">
        Resources
      </Text>
      <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap="1rem">
        {resources.map((resource) => (
          <Flex 
            key={resource.id} 
            direction="column" 
            padding="1rem"
            backgroundColor="rgba(0,0,0,0.05)"
            borderRadius="medium"
          >
            <Text fontWeight="bold">{resource.name}</Text>
            <Text fontSize="1.2em">{resource.quantity.toLocaleString()}</Text>
          </Flex>
        ))}
      </Grid>
    </Card>
  );
};

export default ResourceManager;