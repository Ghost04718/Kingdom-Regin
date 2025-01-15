// src/components/game/ResourceUpgradeModal.jsx
import { 
    Alert,
    Button,
    Flex,
    Text,
    Heading,
    Badge,
    Divider,
    View
  } from "@aws-amplify/ui-react";
  import { BASE_RESOURCE_CONFIG } from '../../constants/resourceConstants';
  
  const ResourceUpgradeModal = ({ 
    resource, 
    upgradeCheck, 
    isOpen, 
    onClose, 
    onConfirm, 
    kingdom 
  }) => {
    if (!resource || !upgradeCheck || !isOpen) return null;
  
    const config = BASE_RESOURCE_CONFIG[resource.type];
    const currentLevel = resource.qualityLevel || 1;
    const nextLevel = currentLevel + 1;
    
    const getQualityMultipliers = (level) => {
      return config.qualityLevels[level] || config.qualityLevels[1];
    };
  
    const currentMultipliers = getQualityMultipliers(currentLevel);
    const nextMultipliers = getQualityMultipliers(nextLevel);
  
    const getUpgradeRequirementStatus = (stat, required) => {
      const current = kingdom[stat.toLowerCase()];
      return {
        met: current >= required,
        current,
        required
      };
    };
  
    return (
      <Alert
        isOpen={isOpen}
        onClose={onClose}
        size="large"
      >
        <Flex direction="column" padding="2rem" gap="1.5rem">
          <Heading level={3}>Upgrade {resource.name}</Heading>
          
          <View>
            <Text fontWeight="bold">Current Level: {currentLevel}</Text>
            <Text>Next Level: {nextLevel}</Text>
          </View>
  
          {/* Production/Consumption Changes */}
          <View>
            <Heading level={5}>Production Changes</Heading>
            <Flex gap="2rem" marginTop="0.5rem">
              <View>
                <Text fontWeight="bold">Current:</Text>
                <Text>Production: x{currentMultipliers.productionMultiplier.toFixed(1)}</Text>
                <Text>Consumption: x{currentMultipliers.consumptionMultiplier.toFixed(1)}</Text>
              </View>
              <Text fontSize="1.5em" alignSelf="center">→</Text>
              <View>
                <Text fontWeight="bold">Next Level:</Text>
                <Text color="green">
                  Production: x{nextMultipliers.productionMultiplier.toFixed(1)}
                  <Text as="span" fontSize="0.8em" marginLeft="0.5rem">
                    (+{((nextMultipliers.productionMultiplier - currentMultipliers.productionMultiplier) * 100).toFixed(0)}%)
                  </Text>
                </Text>
                <Text color="red">
                  Consumption: x{nextMultipliers.consumptionMultiplier.toFixed(1)}
                  <Text as="span" fontSize="0.8em" marginLeft="0.5rem">
                    (+{((nextMultipliers.consumptionMultiplier - currentMultipliers.consumptionMultiplier) * 100).toFixed(0)}%)
                  </Text>
                </Text>
              </View>
            </Flex>
          </View>
  
          <Divider />
  
          {/* Upgrade Requirements */}
          <View>
            <Heading level={5}>Requirements</Heading>
            <Flex direction="column" gap="0.5rem" marginTop="0.5rem">
              {Object.entries(config.upgradeRequirements[nextLevel] || {}).map(([stat, required]) => {
                const status = getUpgradeRequirementStatus(stat, required);
                return (
                  <Flex key={stat} justifyContent="space-between" alignItems="center">
                    <Text>{stat}:</Text>
                    <Flex gap="0.5rem" alignItems="center">
                      <Text>{status.current} / {required}</Text>
                      <Badge
                        backgroundColor={status.met ? 'var(--amplify-colors-green-60)' : 'var(--amplify-colors-red-60)'}
                        color="white"
                      >
                        {status.met ? 'Met' : 'Not Met'}
                      </Badge>
                    </Flex>
                  </Flex>
                );
              })}
            </Flex>
          </View>
  
          {/* Confirmation Buttons */}
          <Flex gap="1rem" justifyContent="flex-end" marginTop="1rem">
            <Button
              onClick={onClose}
              variation="default"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              variation="primary"
              isDisabled={!upgradeCheck.canUpgrade}
            >
              Confirm Upgrade
            </Button>
          </Flex>
        </Flex>
      </Alert>
    );
  };
  
  export default ResourceUpgradeModal;