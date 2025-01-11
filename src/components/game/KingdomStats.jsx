// src/components/game/KingdomStats.jsx
import { Card, Flex, Text, View, Grid } from "@aws-amplify/ui-react";

const KingdomStats = ({ kingdom }) => {
  return (
    <Card padding="1rem">
      <Flex direction="column" gap="1rem">
        <Text variation="primary" fontSize="1.5em" fontWeight="bold">
          {kingdom.name}
        </Text>
        <Grid templateColumns="1fr 1fr" gap="1rem">
          <Flex direction="column" padding="1rem" backgroundColor="rgba(0,0,0,0.05)" borderRadius="medium">
            <Text fontWeight="bold">Population</Text>
            <Text fontSize="1.2em">{kingdom.population.toLocaleString()}</Text>
          </Flex>
          <Flex direction="column" padding="1rem" backgroundColor="rgba(0,0,0,0.05)" borderRadius="medium">
            <Text fontWeight="bold">Economy</Text>
            <Text fontSize="1.2em">{kingdom.economy}</Text>
          </Flex>
          <Flex direction="column" padding="1rem" backgroundColor="rgba(0,0,0,0.05)" borderRadius="medium">
            <Text fontWeight="bold">Military</Text>
            <Text fontSize="1.2em">{kingdom.military}</Text>
          </Flex>
          <Flex direction="column" padding="1rem" backgroundColor="rgba(0,0,0,0.05)" borderRadius="medium">
            <Text fontWeight="bold">Happiness</Text>
            <Text fontSize="1.2em">{kingdom.happiness}%</Text>
          </Flex>
        </Grid>
      </Flex>
    </Card>
  );
};

export default KingdomStats;