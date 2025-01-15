// src/components/game/TurnSummary.jsx
import { 
    Card, 
    Flex, 
    Text, 
    Badge,
    Heading,
    Divider,
    View
  } from "@aws-amplify/ui-react";
  
  const TurnSummary = ({ summary }) => {
    if (!summary) return null;
  
    const { changes, significantChanges } = summary;
  
    const getChangeColor = (change) => {
      if (change > 0) return 'var(--amplify-colors-green-60)';
      if (change < 0) return 'var(--amplify-colors-red-60)';
      return 'inherit';
    };
  
    const formatChange = (change, includeSign = true) => {
      const sign = change > 0 && includeSign ? '+' : '';
      return `${sign}${change.toFixed(1)}`;
    };
  
    return (
      <Card padding="1rem">
        <Flex direction="column" gap="1rem">
          <Heading level={4}>Turn Summary</Heading>
          
          <Flex direction="column" gap="0.5rem">
            {Object.entries(changes).map(([stat, data]) => (
              <Flex
                key={stat}
                justifyContent="space-between"
                alignItems="center"
                padding="0.5rem"
                backgroundColor={Math.abs(data.percentChange) >= 10 ? 'var(--amplify-colors-background-secondary)' : undefined}
                borderRadius="medium"
              >
                <Text fontWeight="bold">
                  {stat.charAt(0).toUpperCase() + stat.slice(1)}
                </Text>
                
                <Flex gap="1rem" alignItems="center">
                  <Text>{data.old}</Text>
                  <Text>→</Text>
                  <Text color={getChangeColor(data.change)}>
                    {data.new}
                    <Text
                      as="span"
                      fontSize="0.8em"
                      marginLeft="0.5rem"
                    >
                      ({formatChange(data.percentChange)}%)
                    </Text>
                  </Text>
                </Flex>
              </Flex>
            ))}
          </Flex>
  
          {significantChanges.length > 0 && (
            <View>
              <Divider marginY="1rem" />
              <Heading level={5}>Significant Changes</Heading>
              <Flex gap="0.5rem" marginTop="0.5rem" flexWrap="wrap">
                {significantChanges.map(({ stat, change, percentChange }, index) => (
                  <Badge
                    key={index}
                    backgroundColor={getChangeColor(change)}
                    color="white"
                  >
                    {stat}: {formatChange(percentChange)}%
                  </Badge>
                ))}
              </Flex>
            </View>
          )}
        </Flex>
      </Card>
    );
  };
  
  export default TurnSummary;