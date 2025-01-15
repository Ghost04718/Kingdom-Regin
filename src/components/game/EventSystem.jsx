// src/components/game/EventSystem.jsx
import { useState, useEffect } from 'react';
import { 
  Card, 
  Flex, 
  Text, 
  Button, 
  View, 
  Badge,
  Divider,
  Heading,
  useTheme
} from "@aws-amplify/ui-react";

const EventSystem = ({ event, onChoiceSelect }) => {
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const { tokens } = useTheme();

  // Add timer for decisions
  useEffect(() => {
    if (event && !timeRemaining) {
      setTimeRemaining(60); // 60 seconds to make a decision
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [event]);

  if (!event) return null;

  // Parse choices safely
  let choices;
  try {
    choices = typeof event.choices === 'string' ? JSON.parse(event.choices) : event.choices;
  } catch (error) {
    console.error('Error parsing choices:', error);
    choices = [];
  }

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'ECONOMIC': return 'var(--amplify-colors-green-60)';
      case 'MILITARY': return 'var(--amplify-colors-red-60)';
      case 'SOCIAL': return 'var(--amplify-colors-blue-60)';
      default: return 'var(--amplify-colors-purple-60)';
    }
  };

  const getImpactDescription = (impact) => {
    let impactObj;
    try {
      impactObj = typeof impact === 'string' ? JSON.parse(impact) : impact;
    } catch (error) {
      console.error('Error parsing impact:', error);
      return null;
    }

    return Object.entries(impactObj).map(([stat, value]) => {
      const color = value >= 0 ? 'var(--amplify-colors-green-60)' : 'var(--amplify-colors-red-60)';
      return (
        <Text key={stat} color={color} fontSize="0.9em">
          {stat.charAt(0).toUpperCase() + stat.slice(1)}: {value >= 0 ? '+' : ''}{value}
        </Text>
      );
    });
  };

  const handleChoiceClick = (choice) => {
    setSelectedChoice(choice);
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    onChoiceSelect(selectedChoice);
    setSelectedChoice(null);
    setShowConfirmation(false);
  };

  const handleCancel = () => {
    setSelectedChoice(null);
    setShowConfirmation(false);
  };

  return (
    <Card variation="elevated" padding="2rem">
      <Flex direction="column" gap="1.5rem">
        {/* Timer */}
        {timeRemaining !== null && (
          <View>
            <Text color={timeRemaining < 10 ? 'red' : 'inherit'}>
              Time remaining: {timeRemaining}s
            </Text>
            <View 
              height="4px" 
              backgroundColor="background.secondary"
              marginTop="0.5rem"
            >
              <View
                height="100%"
                width={`${(timeRemaining / 60) * 100}%`}
                backgroundColor={timeRemaining < 10 ? 'red' : 'green'}
                transition="width 1s linear"
              />
            </View>
          </View>
        )}
        
        {/* Event Header */}
        <Flex justifyContent="space-between" alignItems="center">
          <Heading level={3}>{event.title}</Heading>
          <Badge
            backgroundColor={getEventTypeColor(event.type)}
            color="white"
          >
            {event.type}
          </Badge>
        </Flex>

        {/* Event Description */}
        <Text 
          fontSize="1.1em" 
          className="my-4" // Using Tailwind class instead of marginY
        >
          {event.description}
        </Text>

        <Divider />

        {/* Choices */}
        <Flex direction="column" gap="1rem">
          <Text fontWeight="bold">Choose your response:</Text>
          {choices.map((choice, index) => (
            <Button
              key={index}
              onClick={() => handleChoiceClick(choice)}
              variation={selectedChoice === choice ? "primary" : "default"}
              size="large"
              isDisabled={showConfirmation && selectedChoice !== choice}
            >
              <Flex direction="column" gap="0.5rem" width="100%">
                <Text fontSize="1em">{choice.text}</Text>
                <Flex gap="1rem" justifyContent="center">
                  {getImpactDescription(choice.impact)}
                </Flex>
              </Flex>
            </Button>
          ))}
        </Flex>

        {/* Confirmation Dialog */}
        {showConfirmation && (
          <Card variation="outlined" padding="1rem" marginTop="1rem">
            <Flex direction="column" gap="1rem">
              <Text fontWeight="bold">Confirm your choice:</Text>
              <Text>{selectedChoice.text}</Text>
              <Flex gap="1rem">
                <Button
                  onClick={handleConfirm}
                  variation="primary"
                >
                  Confirm
                </Button>
                <Button
                  onClick={handleCancel}
                  variation="warning"
                >
                  Cancel
                </Button>
              </Flex>
            </Flex>
          </Card>
        )}
      </Flex>
    </Card>
  );
};

export default EventSystem;