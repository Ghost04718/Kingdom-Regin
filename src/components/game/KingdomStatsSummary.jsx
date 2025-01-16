// src/components/game/KingdomStatsSummary.jsx
import { 
  Card, 
  Flex, 
  Text, 
  View, 
  Heading,
  Badge,
} from "@aws-amplify/ui-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const KingdomStatsSummary = ({ kingdom, history = [] }) => {
  // Calculate percentages
  const calculateGrowth = (current, previous) => {
    if (!previous) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const stats = [
    {
      label: 'Population',
      value: kingdom.population,
      growth: calculateGrowth(kingdom.population, kingdom.previousPopulation),
      color: 'green'
    },
    {
      label: 'Economy',
      value: kingdom.economy,
      growth: calculateGrowth(kingdom.economy, kingdom.previousEconomy),
      color: 'blue'
    },
    {
      label: 'Military',
      value: kingdom.military,
      growth: calculateGrowth(kingdom.military, kingdom.previousMilitary),
      color: 'red'
    },
    {
      label: 'Happiness',
      value: kingdom.happiness,
      growth: calculateGrowth(kingdom.happiness, kingdom.previousHappiness),
      color: 'purple'
    }
  ];

  return (
    <Card padding="1rem">
      <Flex direction="column" gap="1rem">
        <Heading level={4}>Kingdom Overview</Heading>
        
        <Flex wrap="wrap" gap="1rem">
          {stats.map((stat) => (
            <Card key={stat.label} variation="outlined" flex="1">
              <Flex direction="column" gap="0.5rem">
                <Text fontSize="sm" color="font.secondary">
                  {stat.label}
                </Text>
                <Flex justifyContent="space-between" alignItems="baseline">
                  <Text fontSize="xl" fontWeight="bold">
                    {stat.value}
                  </Text>
                  {stat.growth !== 0 && (
                    <Badge
                      variation={Number(stat.growth) > 0 ? "success" : "error"}
                    >
                      {stat.growth > 0 ? '+' : ''}{stat.growth}%
                    </Badge>
                  )}
                </Flex>
              </Flex>
            </Card>
          ))}
        </Flex>

        {history.length > 0 && (
          <View height="200px">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="turn" />
                <YAxis />
                <Tooltip />
                <Legend />
                {stats.map((stat) => (
                  <Line
                    key={stat.label.toLowerCase()}
                    type="monotone"
                    dataKey={stat.label.toLowerCase()}
                    stroke={stat.color === 'green' ? '#10B981' : 
                           stat.color === 'blue' ? '#3B82F6' :
                           stat.color === 'red' ? '#EF4444' : '#8B5CF6'}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </View>
        )}
      </Flex>
    </Card>
  );
};

export default KingdomStatsSummary;