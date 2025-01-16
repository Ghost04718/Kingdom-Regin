// src/components/game/GameOutcomeScreens.jsx
import {
    Card,
    Flex,
    Text,
    Heading,
    Button,
    Badge,
    Divider,
    View,
    useTheme
  } from "@aws-amplify/ui-react";
  
  export const VictoryScreen = ({ 
    kingdom, 
    victoryType, 
    turnsPlayed, 
    onNewGame, 
    onMainMenu 
  }) => {
    const { tokens } = useTheme();
  
    const getVictoryDetails = () => {
      switch (victoryType) {
        case 'ECONOMIC':
          return {
            title: "Economic Victory!",
            description: "Your kingdom has become an economic powerhouse!",
            color: tokens.colors.green[60],
            icon: "💰"
          };
        case 'MILITARY':
          return {
            title: "Military Victory!",
            description: "Your military might is unmatched!",
            color: tokens.colors.red[60],
            icon: "⚔️"
          };
        case 'CULTURAL':
          return {
            title: "Cultural Victory!",
            description: "Your kingdom is a beacon of culture and enlightenment!",
            color: tokens.colors.purple[60],
            icon: "👑"
          };
        default:
          return {
            title: "Victory!",
            description: "Your kingdom has achieved greatness!",
            color: tokens.colors.blue[60],
            icon: "🌟"
          };
      }
    };
  
    const details = getVictoryDetails();
  
    return (
      <Card
        variation="elevated"
        padding="2rem"
        backgroundColor={`${details.color}10`}
        borderLeft={`4px solid ${details.color}`}
      >
        <Flex direction="column" gap="2rem" alignItems="center">
          <Heading level={2} color={details.color}>
            {details.icon} {details.title}
          </Heading>
          
          <Text fontSize="xl" textAlign="center">
            {details.description}
          </Text>
  
          <Divider />
  
          <Flex direction="column" gap="1rem">
            <Text fontWeight="bold">Final Statistics:</Text>
            <Flex gap="2rem">
              <View>
                <Text>Population: {kingdom.population}</Text>
                <Text>Economy: {kingdom.economy}</Text>
              </View>
              <View>
                <Text>Military: {kingdom.military}</Text>
                <Text>Happiness: {kingdom.happiness}</Text>
              </View>
            </Flex>
            <Badge>Turns Played: {turnsPlayed}</Badge>
          </Flex>
  
          <Flex gap="1rem">
            <Button onClick={onNewGame} variation="primary">
              Start New Game
            </Button>
            <Button onClick={onMainMenu}>
              Return to Main Menu
            </Button>
          </Flex>
        </Flex>
      </Card>
    );
  };
  
  export const DefeatScreen = ({ 
    kingdom, 
    defeatReason, 
    turnsPlayed, 
    onNewGame, 
    onMainMenu,
    onLoadLastSave 
  }) => {
    return (
      <Card
        variation="elevated"
        padding="2rem"
        backgroundColor="var(--amplify-colors-red-10)"
        borderLeft="4px solid var(--amplify-colors-red-60)"
      >
        <Flex direction="column" gap="2rem" alignItems="center">
          <Heading level={2} color="var(--amplify-colors-red-60)">
            Kingdom Has Fallen
          </Heading>
          
          <Text fontSize="xl" textAlign="center">
            {defeatReason}
          </Text>
  
          <Divider />
  
          <Flex direction="column" gap="1rem">
            <Text fontWeight="bold">Final State:</Text>
            <Flex gap="2rem">
              <View>
                <Text>Population: {kingdom.population}</Text>
                <Text>Economy: {kingdom.economy}</Text>
              </View>
              <View>
                <Text>Military: {kingdom.military}</Text>
                <Text>Happiness: {kingdom.happiness}</Text>
              </View>
            </Flex>
            <Badge variation="warning">Survived {turnsPlayed} Turns</Badge>
          </Flex>
  
          <Flex gap="1rem">
            <Button onClick={onNewGame} variation="primary">
              Start New Game
            </Button>
            <Button 
              onClick={onLoadLastSave} 
              isDisabled={!onLoadLastSave}
              variation="warning"
            >
              Load Last Save
            </Button>
            <Button onClick={onMainMenu}>
              Return to Main Menu
            </Button>
          </Flex>
        </Flex>
      </Card>
    );
  };