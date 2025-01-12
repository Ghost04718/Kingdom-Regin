// src/components/game/EventSystem.jsx
import { Card, Flex, Text, Button, View } from "@aws-amplify/ui-react";

const EventSystem = ({ event, onChoiceSelect }) => {
  if (!event) return null;

  // Parse choices safely
  let choices;
  try {
    choices = typeof event.choices === 'string' ? JSON.parse(event.choices) : event.choices;
  } catch (error) {
    console.error('Error parsing choices:', error);
    choices = [];
  }

  return (
    <Card variation="elevated" padding="2rem">
      <Flex direction="column" gap="1.5rem">
        <View>
          <Text fontSize="1.5em" fontWeight="bold">{event.title}</Text>
          <Text fontSize="1.1em" marginTop="0.5rem">{event.description}</Text>
        </View>

        <Flex direction="column" gap="1rem">
          {choices.map((choice, index) => {
            let impact;
            try {
              impact = typeof choice.impact === 'string' 
                ? JSON.parse(choice.impact) 
                : choice.impact;
            } catch (error) {
              console.error('Error parsing impact:', error);
              impact = {};
            }

            return (
              <Button
                key={index}
                onClick={() => onChoiceSelect({
                  ...choice,
                  impact: typeof choice.impact === 'string' 
                    ? choice.impact 
                    : JSON.stringify(choice.impact)
                })}
                variation="primary"
                size="large"
              >
                <Flex direction="column" gap="0.5rem" width="100%">
                  <Text>{choice.text}</Text>
                  <Text fontSize="0.8em" color="rgba(255,255,255,0.8)">
                    Impact: {Object.entries(impact)
                      .map(([key, value]) => `${key} ${value >= 0 ? '+' : ''}${value}`)
                      .join(', ')}
                  </Text>
                </Flex>
              </Button>
            );
          })}
        </Flex>
      </Flex>
    </Card>
  );
};

export default EventSystem;