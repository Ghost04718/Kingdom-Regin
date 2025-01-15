// src/components/game/ResourceQualityPanel.jsx
import { Card, Flex, Text, Badge, Button } from "@aws-amplify/ui-react";
import { QUALITY_LEVELS } from '../../constants/resourceConstants';

const ResourceQualityPanel = ({ resource, onUpgrade }) => {
  const currentLevel = resource.qualityLevel;
  const nextLevel = QUALITY_LEVELS[currentLevel + 1];

  if (!nextLevel) return null;

  return (
    <Card padding="1rem">
      <Flex direction="column" gap="1rem">
        <Flex justifyContent="space-between" alignItems="center">
          <Text>Quality Level: {currentLevel}</Text>
          <Badge variation="info">
            {QUALITY_LEVELS[currentLevel].name}
          </Badge>
        </Flex>

        {nextLevel && (
          <Flex direction="column" gap="0.5rem">
            <Text>Next Level: {nextLevel.name}</Text>
            <Text fontSize="sm">Cost: {nextLevel.cost}</Text>
            <Button 
              onClick={() => onUpgrade(resource.id)}
              variation="primary"
              isFullWidth
            >
              Upgrade Resource
            </Button>
          </Flex>
        )}
      </Flex>
    </Card>
  );
};

export default ResourceQualityPanel;