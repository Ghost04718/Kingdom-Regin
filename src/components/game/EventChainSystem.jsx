// src/components/game/EventChainSystem.jsx
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
  useTheme,
  Alert
} from "@aws-amplify/ui-react";

const EventChainSystem = ({ 
  event, 
  chainManager, 
  onChoiceSelect,
  chainId,
  chainState
}) => {
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const { tokens } = useTheme();

  useEffect(() => {
    if (!event) return;

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

  let choices;
  try {
    choices = typeof event.choices === 'string' ? JSON.parse(event.choices) : event.choices;
  } catch (error) {
    console.error('Error parsing choices:', error);
    choices = [];
  }

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'ECONOMIC': return tokens.colors.green[60];
      case 'MILITARY': return tokens.colors.red[60];
      case 'SOCIAL': return tokens.colors.blue[60];
      default: return tokens.colors.purple[60];
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

    return Object.entries(impactObj).map(([stat, value]) => (
      <Badge
        key={stat}
        variation={value >= 0 ? "success" : "error"}
        marginRight="0.5rem"
      >
        {stat}: {value >= 0 ? '+' : ''}{value}
      </Badge>
    ));
  };

  const handleChoiceClick = (choice) => {
    setSelectedChoice(choice);
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    try {
      await onChoiceSelect(selectedChoice);
      setSelectedChoice(null);
      setShowConfirmation(false);
    } catch (error) {
      console.error('Error processing choice:', error);
    }
  };

  return (
    <Card variation="elevated" padding="2rem">
      <Flex direction="column" gap="1.5rem">
        {/* Chain Progress */}
        {chainState && (
          <View>
            <Flex justifyContent="space-between" alignItems="center">
              <Text>Event Chain Progress</Text>
              <Badge>{chainState.currentStep + 1} / 5</Badge>
            </Flex>
            <View 
              height="4px" 
              backgroundColor="background.secondary"
              marginTop="0.5rem"
            >
              <View
                height="100%"
                width={`${((chainState.currentStep + 1) / 5) * 100}%`}
                backgroundColor={tokens.colors.brand.primary[60]}
              />
            </View>
          </View>
        )}

        {/* Timer */}
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
        <Text fontSize="1.1em">
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
              <Flex direction="column" width="100%" padding="0.5rem">
                <Text fontSize="1em">{choice.text}</Text>
                <Flex gap="0.5rem" justifyContent="center" marginTop="0.5rem">
                  {getImpactDescription(choice.impact)}
                </Flex>
                {choice.continueChain && (
                  <Badge variation="info" marginTop="0.5rem">
                    Continues Event Chain
                  </Badge>
                )}
              </Flex>
            </Button>
          ))}
        </Flex>

        {/* Confirmation Dialog */}
        {showConfirmation && (
          <Alert
            variation="info"
            isDismissible={true}
            onDismiss={() => setShowConfirmation(false)}
          >
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
                  onClick={() => setShowConfirmation(false)}
                  variation="default"
                >
                  Cancel
                </Button>
              </Flex>
            </Flex>
          </Alert>
        )}
      </Flex>
    </Card>
  );
};

export default EventChainSystem;