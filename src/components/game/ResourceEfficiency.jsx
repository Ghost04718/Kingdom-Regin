// src/components/game/ResourceEfficiency.jsx
import { Card, Flex, Text, View, useTheme } from "@aws-amplify/ui-react";

const ResourceEfficiency = ({ efficiency, status }) => {
  const { tokens } = useTheme();

  const getEfficiencyColor = (eff) => {
    if (eff >= 90) return tokens.colors.green[60];
    if (eff >= 70) return tokens.colors.brand.primary[60];
    if (eff >= 50) return tokens.colors.yellow[60];
    if (eff >= 30) return tokens.colors.orange[60];
    return tokens.colors.red[60];
  };

  const getEfficiencyLabel = (eff) => {
    if (eff >= 90) return 'Excellent';
    if (eff >= 70) return 'Good';
    if (eff >= 50) return 'Average';
    if (eff >= 30) return 'Poor';
    return 'Critical';
  };

  return (
    <Card padding="0.5rem">
      <Flex direction="column" gap="0.5rem">
        <Text fontSize="sm" fontWeight="bold">
          Resource Efficiency
        </Text>
        
        {/* Efficiency Gauge */}
        <View position="relative" height="8px" backgroundColor="background.secondary" borderRadius="full">
          <View
            position="absolute"
            height="100%"
            width={`${Math.min(100, Math.max(0, efficiency))}%`}
            backgroundColor={getEfficiencyColor(efficiency)}
            borderRadius="full"
            transition="width 0.3s ease, background-color 0.3s ease"
          />
        </View>
        
        <Flex justifyContent="space-between" alignItems="center">
          <Text fontSize="sm" color={getEfficiencyColor(efficiency)}>
            {getEfficiencyLabel(efficiency)}
          </Text>
          <Text fontSize="sm" fontWeight="bold">
            {efficiency.toFixed(1)}%
          </Text>
        </Flex>

        {/* Status Effects */}
        {status !== 'NORMAL' && (
          <Text fontSize="xs" color="font.warning">
            {status === 'CRITICAL' ? 'Critical efficiency loss!' :
             status === 'WARNING' ? 'Efficiency compromised' :
             'Monitoring required'}
          </Text>
        )}
      </Flex>
    </Card>
  );
};

export default ResourceEfficiency;