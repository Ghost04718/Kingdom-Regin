// src/components/tutorial/HelpButton.jsx
import { useState } from 'react';
import {
  Button,
  Alert,
  Flex,
  Text,
  Heading,
  View,
  Icon
} from "@aws-amplify/ui-react";

const HelpButton = () => {
  const [showHelp, setShowHelp] = useState(false);

  const helpTopics = [
    {
      title: 'Kingdom Management',
      content: 'Your kingdom has four main attributes: Population, Economy, Military, and Happiness. Keep them balanced for success.'
    },
    {
      title: 'Resources',
      content: 'Monitor your resources carefully. Each resource affects different aspects of your kingdom. Running low on resources can trigger crisis events.'
    },
    {
      title: 'Events',
      content: 'Each turn brings new events. Your choices have consequences - consider the impact on all aspects of your kingdom before deciding.'
    },
    {
      title: 'Victory Conditions',
      content: 'Achieve victory through military conquest, economic dominance, or cultural prosperity. But beware - let any vital stat drop to zero, and your reign ends in failure.'
    }
  ];

  return (
    <>
      <Button
        onClick={() => setShowHelp(true)}
        variation="link"
      >
        <Icon
          ariaLabel="Help"
          viewBox={{ width: 24, height: 24 }}
          paths={[
            {
              d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z",
            }
          ]}
        />
        <Text>Help</Text>
      </Button>

      {showHelp && (
        <Alert
          variation="info"
          isDismissible={true}
          hasIcon={true}
          heading="Kingdom Management Guide"
          onDismiss={() => setShowHelp(false)}
        >
          <Flex direction="column" gap="1rem">
            {helpTopics.map((topic, index) => (
              <View key={index}>
                <Heading level={5} marginBottom="0.5rem">{topic.title}</Heading>
                <Text>{topic.content}</Text>
              </View>
            ))}
          </Flex>
        </Alert>
      )}
    </>
  );
};

export default HelpButton;