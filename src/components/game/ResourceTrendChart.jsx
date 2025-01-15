// src/components/game/ResourceTrendChart.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, View, useTheme } from "@aws-amplify/ui-react";

const ResourceTrendChart = ({ predictions, maxStorage }) => {
  const { tokens } = useTheme();
  
  const chartData = predictions.map((pred, index) => ({
    turn: `Turn ${pred.turn}`,
    quantity: pred.quantity,
    maxStorage: maxStorage,
    status: pred.status
  }));

  return (
    <View height="200px" width="100%">
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="turn" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="quantity" 
          stroke={tokens.colors.brand.primary[80]}
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="maxStorage" 
          stroke={tokens.colors.neutral[60]}
          strokeDasharray="5 5"
        />
      </LineChart>
    </View>
  );
};

export default ResourceTrendChart;