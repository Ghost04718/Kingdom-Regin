// src/components/game/GameScreen.jsx
import React, { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  Card,
  Flex,
  Button,
  View,
  Alert,
  Text,
  Badge,
  useTheme
} from "@aws-amplify/ui-react";
import TurnSystem from '../../services/game/turnSystem';
import KingdomStats from './KingdomStats';
import EventSystem from './EventSystem';
import ResourceManager from './ResourceManager';
import TurnSummary from './TurnSummary';
import NotificationCenter from './NotificationCenter';
import LoadingOverlay from '../ui/LoadingOverlay';
import { ResourceProvider } from '../../contexts/ResourceContext';
import { VictoryScreen, DefeatScreen } from './GameOutcomeScreens';
import KingdomEventLog from './KingdomEventLog';

const TurnControls = ({ 
  onProcessTurn, 
  isProcessing, 
  currentTurn, 
  canEndTurn = true,
  onShowLog
}) => {
  return (
    <Card padding="1rem" variation="elevated">
      <Flex justifyContent="space-between" alignItems="center">
        <Flex gap="1rem" alignItems="center">
          <Text>Current Turn: {currentTurn}</Text>
          <Badge variation="info">
            Time: {(Math.floor(currentTurn / 12) + 1)} Year, {(currentTurn % 12) + 1} Month
          </Badge>
          <Button
            onClick={onShowLog}
            variation="link"
            size="small"
          >
            View Event Log
          </Button>
        </Flex>
        <Button 
          onClick={onProcessTurn} 
          isDisabled={!canEndTurn || isProcessing}
          variation="primary"
          loadingText="Processing Turn..."
          isLoading={isProcessing}
        >
          End Turn
        </Button>
      </Flex>
    </Card>
  );
};

const GameContent = ({ kingdom, turnSystem, onKingdomUpdate }) => {
  const [currentEvent, setCurrentEvent] = useState(null);
  const [turnSummary, setTurnSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [error, setError] = useState(null);
  const [showEventLog, setShowEventLog] = useState(false);
  const [eventLog, setEventLog] = useState([]);
  const [gameOutcome, setGameOutcome] = useState(null);
  const { tokens } = useTheme();

  // Check victory/defeat conditions after each turn
  useEffect(() => {
    if (kingdom) {
      // Check victory conditions
      if (kingdom.economy >= 90 && kingdom.happiness >= 80 && kingdom.population >= 5000) {
        setGameOutcome({ type: 'victory', victoryType: 'ECONOMIC' });
      }
      else if (kingdom.military >= 90 && kingdom.economy >= 70 && kingdom.population >= 3000) {
        setGameOutcome({ type: 'victory', victoryType: 'MILITARY' });
      }
      else if (kingdom.happiness >= 90 && kingdom.economy >= 70 && kingdom.population >= 4000) {
        setGameOutcome({ type: 'victory', victoryType: 'CULTURAL' });
      }
      // Check defeat conditions
      else if (kingdom.happiness <= 0) {
        setGameOutcome({ 
          type: 'defeat', 
          reason: 'Your people have completely lost faith in your leadership. A rebellion has overthrown your rule!' 
        });
      }
      else if (kingdom.economy <= 0) {
        setGameOutcome({ 
          type: 'defeat', 
          reason: 'The kingdom\'s treasury is empty. Economic collapse has led to widespread chaos!' 
        });
      }
      else if (kingdom.military <= 0) {
        setGameOutcome({ 
          type: 'defeat', 
          reason: 'With no military force remaining, your kingdom has been conquered by neighboring powers!' 
        });
      }
    }
  }, [kingdom]);

  const handleNotification = (notification) => {
    setNotifications(prev => [...prev, { ...notification, id: Date.now() }]);
  };

  const dismissNotification = (index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  // Add event to log
  const addToEventLog = (event) => {
    setEventLog(prev => [...prev, {
      ...event,
      id: Date.now(),
      turn: kingdom.turn,
      timestamp: new Date().toISOString()
    }]);
  };

  const handleEventChoice = async (choice) => {
    if (!turnSystem) return;

    try {
      setIsLoading(true);
      setError(null);

      const result = await turnSystem.processEventChoice(currentEvent, choice);

      if (!result.success) {
        throw new Error(result.error || 'Failed to process choice');
      }

      onKingdomUpdate(result.kingdom);
      setCurrentEvent(result.event);
      setTurnSummary(result.turnSummary);
      
      // Log the choice
      addToEventLog({
        type: currentEvent.type,
        title: currentEvent.title,
        description: currentEvent.description,
        choice: choice.text,
        impact: choice.impact
      });
      
      result.notifications?.forEach(handleNotification);

    } catch (error) {
      console.error('Choice processing error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const processTurn = async () => {
    if (!turnSystem) return;

    try {
      setIsProcessingTurn(true);
      setError(null);

      const result = await turnSystem.processTurn(currentEvent);

      if (!result.success) {
        throw new Error(result.error || 'Failed to process turn');
      }

      onKingdomUpdate(result.kingdom);
      setCurrentEvent(result.event);
      setTurnSummary(result.turnSummary);
      
      // Log turn summary
      if (result.turnSummary) {
        addToEventLog({
          type: 'INFO',
          title: `Turn ${kingdom.turn} Completed`,
          description: result.turnSummary.summaryText
        });
      }
      
      result.notifications?.forEach(handleNotification);

    } catch (error) {
      console.error('Turn processing error:', error);
      setError(error.message);
    } finally {
      setIsProcessingTurn(false);
    }
  };

  return (
    <Flex direction="column" gap="2rem">
      {isLoading && <LoadingOverlay />}

      <NotificationCenter 
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      {error && (
        <Alert 
          variation="error" 
          isDismissible={true}
          onDismiss={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <TurnControls 
        onProcessTurn={processTurn}
        isProcessing={isProcessingTurn}
        currentTurn={kingdom.turn}
        canEndTurn={!currentEvent}
        onShowLog={() => setShowEventLog(true)}
      />

      <Flex gap="2rem">
        <View flex="2">
          <KingdomStats kingdom={kingdom} />
          
          {currentEvent && (
            <View marginTop="2rem">
              <EventSystem
                event={currentEvent}
                onChoiceSelect={handleEventChoice}
              />
            </View>
          )}

          {turnSummary && !currentEvent && (
            <View marginTop="2rem">
              <TurnSummary summary={turnSummary} />
            </View>
          )}
        </View>

        <View flex="1">
          <ResourceManager 
            onNotification={handleNotification}
          />
        </View>
      </Flex>
      
      {/* Event Log Alert */}
      <Alert
        isOpen={showEventLog}
        onClose={() => setShowEventLog(false)}
        title="Kingdom Event Log"
        size="large"
      >
        <KingdomEventLog events={eventLog} />
      </Alert>

      {/* Victory/Defeat Screens */}
      {gameOutcome?.type === 'victory' && (
        <Alert
          isOpen={true}
          onClose={() => {}}
          hideCloseButton={true}
          size="large"
        >
          <VictoryScreen
            kingdom={kingdom}
            victoryType={gameOutcome.victoryType}
            turnsPlayed={kingdom.turn}
            onNewGame={() => window.location.reload()}
            onMainMenu={() => window.location.reload()}
          />
        </Alert>
      )}

      {gameOutcome?.type === 'defeat' && (
        <Alert
          isOpen={true}
          onClose={() => {}}
          hideCloseButton={true}
          size="large"
        >
          <DefeatScreen
            kingdom={kingdom}
            defeatReason={gameOutcome.reason}
            turnsPlayed={kingdom.turn}
            onNewGame={() => window.location.reload()}
            onMainMenu={() => window.location.reload()}
          />
        </Alert>
      )}
    </Flex>
  );
};

const GameScreen = ({ kingdom: initialKingdom }) => {
  const [kingdom, setKingdom] = useState(initialKingdom);
  const [turnSystem, setTurnSystem] = useState(null);

  // Initialize turn system
  useEffect(() => {
    if (kingdom?.id) {
      setTurnSystem(new TurnSystem(kingdom.id));
    }
  }, [kingdom?.id]);

  if (!kingdom) {
    return <Alert variation="error">No kingdom data available</Alert>;
  }

  return (
    <ResourceProvider kingdom={kingdom}>
      <GameContent 
        kingdom={kingdom}
        turnSystem={turnSystem}
        onKingdomUpdate={setKingdom}
      />
    </ResourceProvider>
  );
};

export default GameScreen;