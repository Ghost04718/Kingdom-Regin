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
  useTheme,
  Alert
} from "@aws-amplify/ui-react";

const ChoiceButton = ({ choice, onClick, isSelected, isDisabled }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  let impact;
  try {
    impact = typeof choice.impact === 'string' ? JSON.parse(choice.impact) : choice.impact;
  } catch (error) {
    console.error('Error parsing impact:', error);
    impact = {};
  }

  return (
    <Button
      onClick={onClick}
      variation={isSelected ? "primary" : "default"}
      size="large"
      isDisabled={isDisabled}
      className={`choice-button ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
      style={{
        transition: 'all 0.3s ease',
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Flex direction="column" width="100%" padding="1rem">
        <Text 
          fontSize="1.1em"
          style={{
            transition: 'transform 0.3s ease',
            transform: isHovered ? 'translateY(-2px)' : 'translateY(0)'
          }}
        >
          {choice.text}
        </Text>
        
        <Flex 
          gap="0.5rem" 
          justifyContent="center" 
          marginTop="1rem"
          wrap="wrap"
          style={{
            transition: 'opacity 0.3s ease',
            opacity: isHovered ? 1 : 0.8
          }}
        >
          {Object.entries(impact).map(([stat, value]) => (
            <Badge
              key={stat}
              variation={value >= 0 ? "success" : "error"}
              backgroundColor={value >= 0 ? 'var(--amplify-colors-green-60)' : 'var(--amplify-colors-red-60)'}
              color="white"
              className="impact-badge"
              style={{
                transform: isHovered ? 'translateY(0) scale(1.1)' : 'translateY(0) scale(1)',
                transition: 'all 0.3s ease'
              }}
            >
              {stat}: {value >= 0 ? '+' : ''}{value}
            </Badge>
          ))}
        </Flex>
      </Flex>
      
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isHovered ? 
            'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0))' : 
            'none',
          transition: 'all 0.3s ease',
          pointerEvents: 'none'
        }}
      />
    </Button>
  );
};

const EventTimer = ({ timeRemaining, totalTime }) => {
  const percentage = (timeRemaining / totalTime) * 100;
  const isWarning = timeRemaining < 10;
  
  return (
    <View>
      <Flex justifyContent="space-between" marginBottom="0.5rem">
        <Text color={isWarning ? 'red' : 'inherit'}>
          Time remaining: {timeRemaining}s
        </Text>
        <Badge variation={isWarning ? "error" : "info"}>
          {Math.round(percentage)}%
        </Badge>
      </Flex>
      <View 
        height="4px" 
        backgroundColor="background.secondary"
        borderRadius="full"
        overflow="hidden"
      >
        <View
          height="100%"
          width={`${percentage}%`}
          backgroundColor={isWarning ? 'red' : 'green'}
          style={{
            transition: 'width 1s linear, background-color 0.3s ease',
            animation: isWarning ? 'pulse 1s infinite' : 'none'
          }}
        />
      </View>
    </View>
  );
};

const ConfirmationDialog = ({ choice, onConfirm, onCancel }) => {
  return (
    <Alert
      variation="info"
      isDismissible={false}
      className="animate-scaleIn"
    >
      <Flex direction="column" gap="1rem">
        <Text fontWeight="bold">Confirm your choice:</Text>
        <Text>{choice.text}</Text>
        
        <View
          backgroundColor="background.secondary"
          padding="1rem"
          borderRadius="medium"
        >
          <Text fontSize="sm" fontWeight="bold">Impact Preview:</Text>
          <Flex gap="0.5rem" marginTop="0.5rem" flexWrap="wrap">
            {Object.entries(JSON.parse(choice.impact)).map(([stat, value]) => (
              <Badge
                key={stat}
                variation={value >= 0 ? "success" : "error"}
              >
                {stat}: {value >= 0 ? '+' : ''}{value}
              </Badge>
            ))}
          </Flex>
        </View>

        <Flex gap="1rem" justifyContent="flex-end">
          <Button
            onClick={onCancel}
            variation="default"
            className="hover-scale"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            variation="primary"
            className="hover-scale"
          >
            Confirm
          </Button>
        </Flex>
      </Flex>
    </Alert>
  );
};

const EventSystem = ({ event, onChoiceSelect }) => {
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [showEvent, setShowEvent] = useState(false);
  const [eventAnimation, setEventAnimation] = useState('');
  const { tokens } = useTheme();

  // Reset and show new event
  useEffect(() => {
    if (event) {
      setShowEvent(false);
      setSelectedChoice(null);
      setShowConfirmation(false);
      setTimeout(() => {
        setShowEvent(true);
        setEventAnimation('animate-slideIn');
      }, 300);
      setTimeRemaining(60);
    }
  }, [event]);

  // Timer effect
  useEffect(() => {
    if (!event || showConfirmation) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoChoice();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [event, showConfirmation]);

  const handleAutoChoice = () => {
    if (!event || showConfirmation) return;
    
    let choices;
    try {
      choices = typeof event.choices === 'string' ? JSON.parse(event.choices) : event.choices;
    } catch (error) {
      console.error('Error parsing choices:', error);
      choices = [];
    }

    // Select the safest choice (least negative impact)
    let safestChoice = choices[0];
    let leastNegativeImpact = -Infinity;

    choices.forEach(choice => {
      let impact;
      try {
        impact = typeof choice.impact === 'string' ? JSON.parse(choice.impact) : choice.impact;
        const totalImpact = Object.values(impact).reduce((sum, val) => sum + val, 0);
        if (totalImpact > leastNegativeImpact) {
          leastNegativeImpact = totalImpact;
          safestChoice = choice;
        }
      } catch (error) {
        console.error('Error parsing impact:', error);
      }
    });

    handleChoiceSelect(safestChoice);
  };

  const handleChoiceSelect = (choice) => {
    setSelectedChoice(choice);
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    try {
      setEventAnimation('animate-fadeOut');
      await onChoiceSelect(selectedChoice);
      setSelectedChoice(null);
      setShowConfirmation(false);
    } catch (error) {
      console.error('Error processing choice:', error);
    }
  };

  const handleCancel = () => {
    setSelectedChoice(null);
    setShowConfirmation(false);
    setEventAnimation('animate-fadeIn');
  };

  if (!event) return null;

  // Parse choices with better error handling
  let choices = [];
  try {
    // Handle both string and array formats
    if (typeof event.choices === 'string') {
      choices = JSON.parse(event.choices);
    } else if (Array.isArray(event.choices)) {
      choices = event.choices;
    } else {
      console.warn('Invalid choices format:', event.choices);
      // Provide fallback choices
      choices = [{
        text: "Continue",
        impact: JSON.stringify({ economy: 0, military: 0, happiness: 0, population: 0 })
      }];
    }
    
    // Ensure each choice has properly formatted impact
    choices = choices.map(choice => ({
      ...choice,
      impact: typeof choice.impact === 'string' ? choice.impact : JSON.stringify(choice.impact || {})
    }));
  } catch (error) {
    console.error('Error parsing choices:', error);
    // Provide fallback choices
    choices = [{
      text: "Continue",
      impact: JSON.stringify({ economy: 0, military: 0, happiness: 0, population: 0 })
    }];
  }

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'ECONOMIC': return tokens.colors.green[60];
      case 'MILITARY': return tokens.colors.red[60];
      case 'SOCIAL': return tokens.colors.blue[60];
      default: return tokens.colors.purple[60];
    }
  };

  return (
    <Card 
      variation="elevated" 
      padding="2rem"
      className={`event-card ${showEvent ? eventAnimation : ''}`}
    >
      <Flex direction="column" gap="1.5rem">
        {/* Timer */}
        <EventTimer timeRemaining={timeRemaining} totalTime={60} />

        {/* Event Header */}
        <Flex 
          justifyContent="space-between" 
          alignItems="center"
          className="animate-slideDown delay-100"
        >
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
          className="animate-fadeIn delay-200"
        >
          {event.description}
        </Text>

        <Divider />

        {/* Choices */}
        <Flex 
          direction="column" 
          gap="1rem"
          className="animate-slideUp delay-300"
        >
          <Text fontWeight="bold">Choose your response:</Text>
          {choices.map((choice, index) => (
            <ChoiceButton
              key={index}
              choice={choice}
              onClick={() => handleChoiceSelect(choice)}
              isSelected={selectedChoice === choice}
              isDisabled={showConfirmation && selectedChoice !== choice}
            />
          ))}
        </Flex>

        {/* Confirmation Dialog */}
        {showConfirmation && (
          <ConfirmationDialog
            choice={selectedChoice}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )}
      </Flex>
    </Card>
  );
};

export default EventSystem;