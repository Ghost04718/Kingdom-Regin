// src/components/tutorial/TutorialOverlay.jsx
import { useState, useEffect } from 'react';
import {
  View,
  Flex,
  Card,
  Text,
  Button,
  Heading,
  useTheme
} from "@aws-amplify/ui-react";

const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Kingdom\'s Reign!',
    content: 'You are now the ruler of a growing kingdom. Your decisions will shape its future. Let\'s learn the basics of ruling.',
    target: null
  },
  {
    id: 'kingdom-stats',
    title: 'Kingdom Overview',
    content: 'These are your kingdom\'s vital statistics. Keep an eye on population, economy, military strength, and happiness.',
    target: '.kingdom-stats'
  },
  {
    id: 'resources',
    title: 'Resource Management',
    content: 'Monitor your resources carefully. Running out of essential resources can lead to crisis events.',
    target: '.resource-manager'
  },
  {
    id: 'events',
    title: 'Kingdom Events',
    content: 'Events will occur each turn. Your choices will affect multiple aspects of your kingdom. Choose wisely!',
    target: '.event-system'
  }
];

const TutorialOverlay = ({ onComplete, visible = true }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const { tokens } = useTheme();

  useEffect(() => {
    if (!visible) return;

    const currentTarget = TUTORIAL_STEPS[currentStep].target;
    if (currentTarget) {
      const element = document.querySelector(currentTarget);
      if (element) {
        const rect = element.getBoundingClientRect();
        setPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX
        });
      }
    } else {
      setPosition({
        top: window.innerHeight / 3,
        left: window.innerWidth / 3
      });
    }
  }, [currentStep, visible]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  if (!visible) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  };

  const cardStyle = {
    position: 'absolute',
    top: `${position.top}px`,
    left: `${position.left}px`,
    transform: 'translate(-50%, -50%)',
    maxWidth: '400px',
    backgroundColor: tokens.colors.background.primary
  };

  return (
    <View style={overlayStyle}>
      <Card style={cardStyle} padding={tokens.space.large}>
        <Flex direction="column" gap={tokens.space.medium}>
          <Heading level={3}>
            {TUTORIAL_STEPS[currentStep].title}
          </Heading>
          
          <Text>
            {TUTORIAL_STEPS[currentStep].content}
          </Text>
          
          <Flex justifyContent="space-between" alignItems="center">
            <Text variation="secondary">
              Step {currentStep + 1} of {TUTORIAL_STEPS.length}
            </Text>
            
            <Button
              onClick={handleNext}
              variation="primary"
            >
              {currentStep === TUTORIAL_STEPS.length - 1 ? 'Start Playing' : 'Next'}
            </Button>
          </Flex>
        </Flex>
      </Card>
    </View>
  );
};

export default TutorialOverlay;