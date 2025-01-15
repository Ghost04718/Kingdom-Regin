// src/components/game/KingdomStats.jsx
import { Card, Flex, Text, View, Grid, Badge } from "@aws-amplify/ui-react";

const KingdomStats = ({ kingdom }) => {
  const getStatTrend = (stat, value) => {
    const previousValue = kingdom[`previous${stat.charAt(0).toUpperCase() + stat.slice(1)}`];
    if (!previousValue) return null;
    
    const change = value - previousValue;
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      percentage: Math.abs((change / previousValue) * 100).toFixed(1)
    };
  };
  
  // Function to determine stat status
  const getStatStatus = (stat, value) => {
    if (stat === 'population') {
      if (value <= 0) return 'critical';
      if (value <= 200) return 'danger';
      if (value <= 500) return 'warning';
      return 'normal';
    } else {
      if (value <= 0) return 'critical';
      if (value <= 20) return 'danger';
      if (value <= 40) return 'warning';
      return 'normal';
    }
  };

  // Function to get background color based on status
  const getBackgroundColor = (status) => {
    switch (status) {
      case 'critical':
        return 'rgba(255,0,0,0.2)';
      case 'danger':
        return 'rgba(255,0,0,0.1)';
      case 'warning':
        return 'rgba(255,165,0,0.1)';
      default:
        return 'rgba(0,0,0,0.05)';
    }
  };

  // Function to get text color based on status
  const getTextColor = (status) => {
    switch (status) {
      case 'critical':
        return 'red';
      case 'danger':
        return '#d32f2f';
      case 'warning':
        return '#ed6c02';
      default:
        return 'inherit';
    }
  };

  const StatDisplay = ({ label, value, stat }) => {
    const trend = getStatTrend(stat, value);
    const status = getStatStatus(stat, value);
    
    return (
      <Flex 
        direction="column" 
        padding="1rem"
        backgroundColor={getBackgroundColor(status)}
        borderRadius="medium"
        transition="all 0.3s ease"
        className="hover:shadow-lg"
      >
        <Flex justifyContent="space-between" alignItems="center">
          <Text fontWeight="bold">{label}</Text>
          {trend && (
            <Badge
              backgroundColor={trend.direction === 'up' ? 'green.100' : 'red.100'}
              color={trend.direction === 'up' ? 'green.900' : 'red.900'}
            >
              {trend.direction === 'up' ? '↑' : '↓'} {trend.percentage}%
            </Badge>
          )}
        </Flex>
        <Text 
          fontSize="1.5em" 
          color={getTextColor(status)}
          marginTop="0.5rem"
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
          {stat === 'happiness' && '%'}
        </Text>
        
        {/* Status indicator */}
        <View marginTop="0.5rem">
          <Badge variation={status.toLowerCase()}>
            {status}
          </Badge>
        </View>
      </Flex>
    );
  };

  return (
    <Card padding="1rem">
      <Flex direction="column" gap="1rem">
        <Text variation="primary" fontSize="1.5em" fontWeight="bold">
          {kingdom.name}
        </Text>
        <Grid templateColumns="1fr 1fr" gap="1rem">
          <StatDisplay label="Population" value={kingdom.population} stat="population" />
          <StatDisplay label="Economy" value={kingdom.economy} stat="economy" />
          <StatDisplay label="Military" value={kingdom.military} stat="military" />
          <StatDisplay label="Happiness" value={kingdom.happiness} stat="happiness" />
        </Grid>
      </Flex>
    </Card>
  );
};

export default KingdomStats;