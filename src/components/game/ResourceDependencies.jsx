// src/components/game/ResourceDependencies.jsx
import { Flex, Text, Badge, View, Icon } from "@aws-amplify/ui-react";
import { BASE_RESOURCE_CONFIG } from '../../constants/resourceConstants';

const ResourceDependencies = ({ resource, dependencies }) => {
  if (!resource?.type || !dependencies?.length) return null;

  const config = BASE_RESOURCE_CONFIG[resource.type];
  if (!config.dependencies) return null;

  return (
    <View padding="0.5rem">
      <Text fontSize="sm" fontWeight="bold" marginBottom="0.5rem">
        Dependencies
      </Text>
      <Flex direction="column" gap="0.5rem">
        {dependencies.map(dep => {
          const effects = config.dependencies[dep.type];
          return (
            <Flex 
              key={dep.type} 
              justifyContent="space-between" 
              alignItems="center"
              padding="0.25rem"
              backgroundColor="background.secondary"
              borderRadius="medium"
            >
              <Flex alignItems="center" gap="0.5rem">
                <Icon
                  ariaLabel={dep.status}
                  viewBox={{ width: 16, height: 16 }}
                  color={dep.status === 'CRITICAL' ? 'red' : dep.status === 'WARNING' ? 'orange' : 'green'}
                  paths={[
                    {
                      d: "M8 16A8 8 0 108 0a8 8 0 000 16zm.93-9.412l-2.29 5.3a.5.5 0 01-.93 0l-2.29-5.3a.5.5 0 01.93-.38L6 11.06l2.29-5.3a.5.5 0 01.93.38z",
                    }
                  ]}
                />
                <Text fontSize="sm">{dep.name}</Text>
              </Flex>
              <Flex gap="0.5rem">
                {effects.production && (
                  <Badge variation="success">
                    +{(effects.production * 100).toFixed(0)}% Prod
                  </Badge>
                )}
                {effects.consumption && (
                  <Badge variation="warning">
                    +{(effects.consumption * 100).toFixed(0)}% Cons
                  </Badge>
                )}
              </Flex>
            </Flex>
          );
        })}
      </Flex>
    </View>
  );
};

export default ResourceDependencies;