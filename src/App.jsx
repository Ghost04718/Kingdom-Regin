// src/App.jsx
import { useState, useEffect } from "react";
import {
  Authenticator,
  Button,
  Heading,
  Flex,
  Card,
  Text,
  Alert,
  View,
  useAuthenticator
} from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from "aws-amplify/data";
import config from "../amplify_outputs.json";

// Import base components
import KingdomStats from "./components/game/KingdomStats";
import EventSystem from "./components/game/EventSystem";
import ResourceManager from "./components/game/ResourceManager";
import NotificationCenter from "./components/game/NotificationCenter";
import TurnSummary from "./components/game/TurnSummary";
import SettingsPanel from "./components/game/SettingsPanel";
import { ResourceProvider } from './contexts/ResourceContext';

// Import services
import EventGenerator from "./services/events/eventGenerator";
import TurnManager from "./services/game/turnManager";
import SettingsManager from "./services/game/settingsManager";
import { GAME_CONFIG } from './constants/gameConstants';
import ErrorBoundary from './components/ErrorBoundary';

Amplify.configure(config);
const client = generateClient();

function GameContent({ signOut }) {
  // State
  const [kingdom, setKingdom] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [turn, setTurn] = useState(1);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [turnSummary, setTurnSummary] = useState(null);
  const [eventGenerator, setEventGenerator] = useState(null);
  const [turnManager, setTurnManager] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(null);
  const [settingsManager, setSettingsManager] = useState(null);
  
  const { user } = useAuthenticator();

  // Initialize settings when user is available
  useEffect(() => {
    if (user) {
      const manager = new SettingsManager(user.username || user.userId);
      setSettingsManager(manager);
      
      manager.loadSettings()
        .then(loadedSettings => {
          setSettings(loadedSettings);
        })
        .catch(error => {
          console.error('Failed to load settings:', error);
          addNotification({
            type: 'ERROR',
            message: 'Failed to load game settings'
          });
        });
    }
  }, [user]);

  // Initialize kingdom when user is available
  useEffect(() => {
    if (user) {
      console.log('Initializing game for user:', user);
      initializeGame();
    }
  }, [user]);

  // Initialize services when kingdom is available
  useEffect(() => {
    if (kingdom?.id) {
      setEventGenerator(new EventGenerator(kingdom.id));
      setTurnManager(new TurnManager(kingdom.id));
    }
  }, [kingdom?.id]);

//... in App.jsx

async function initializeGame(loadExisting = true) {
  console.log('Starting game initialization...');
  setLoading(true);
  setError(null);

  try {
    if (!user) {
      throw new Error('No user found');
    }

    if (loadExisting) {
      console.log('Checking for existing kingdoms...');
      try {
        const { data: kingdoms } = await client.models.Kingdom.list({
          filter: { owner: { eq: user.username || user.userId } }
        });

        if (kingdoms?.length > 0) {
          const validKingdom = kingdoms.find(k => 
            k && k.id && 
            typeof k.population === 'number' &&
            typeof k.economy === 'number' &&
            typeof k.military === 'number' &&
            typeof k.happiness === 'number'
          );

          if (validKingdom) {
            console.log('Found valid kingdom:', validKingdom);

            setKingdom(validKingdom);
            setTurn(validKingdom.turn || 1);
            setLoading(false);
            return;
          }
        }
      } catch (listError) {
        console.error('Error listing kingdoms:', listError);
      }
    }

    // Create new kingdom
    console.log('Creating new kingdom...');
    const kingdomData = {
      name: "Your Kingdom",
      population: 1000,
      economy: 50,
      military: 30,
      happiness: 70,
      description: "A new kingdom rises!",
      turn: 1,
      lastUpdated: new Date().toISOString(),
      owner: user.username || user.userId,
      difficulty: settings?.difficulty || 'NORMAL'
    };

    const { data: newKingdom } = await client.models.Kingdom.create(kingdomData);

    if (!newKingdom) {
      throw new Error('Failed to create new kingdom');
    }

    console.log('Successfully created new kingdom:', newKingdom);
    setKingdom(newKingdom);
    setTurn(1);

  } catch (error) {
    console.error('Game initialization error:', error);
    setError(`Failed to initialize game: ${error.message}`);
    setKingdom(null);
    setTurn(1);
  } finally {
    setLoading(false);
  }
}

  function addNotification(notification) {
    setNotifications(prev => {
      const isDuplicate = prev.some(n => 
        n.message === notification.message && 
        n.type === notification.type
      );

      if (!isDuplicate) {
        const newNotifications = [...prev, notification];
        if (notification.type !== 'CRITICAL') {
          setTimeout(() => {
            setNotifications(current => 
              current.filter(n => n !== notification)
            );
          }, 5000);
        }
        return newNotifications;
      }
      return prev;
    });
  }

  function handleDismissNotification(index) {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSettingsSave(newSettings) {
    try {
      if (!settingsManager) throw new Error('Settings manager not initialized');
      
      const updatedSettings = await settingsManager.saveSettings(newSettings);
      setSettings(updatedSettings);
      
      addNotification({
        type: 'SUCCESS',
        message: 'Settings saved successfully'
      });
      
      // Apply difficulty changes if needed
      if (updatedSettings.difficulty !== settings?.difficulty) {
        await initializeGame(false);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  async function handleEventChoice(choice) {
    try {
      setLoading(true);
      
      if (!turnManager) {
        throw new Error('Turn manager not initialized');
      }

      const impact = typeof choice.impact === 'string' 
        ? JSON.parse(choice.impact) 
        : choice.impact;
      
      // Apply choice impacts
      const updatedStats = {
        ...kingdom,
        population: Math.max(
          GAME_CONFIG.MIN_POPULATION,
          Math.min(
            GAME_CONFIG.MAX_POPULATION,
            kingdom.population + (impact.population || 0)
          )
        ),
        economy: Math.max(
          GAME_CONFIG.MIN_ECONOMY,
          Math.min(
            GAME_CONFIG.MAX_ECONOMY,
            kingdom.economy + (impact.economy || 0)
          )
        ),
        military: Math.max(
          GAME_CONFIG.MIN_MILITARY,
          Math.min(
            GAME_CONFIG.MAX_MILITARY,
            kingdom.military + (impact.military || 0)
          )
        ),
        happiness: Math.max(
          GAME_CONFIG.MIN_HAPPINESS,
          Math.min(
            GAME_CONFIG.MAX_HAPPINESS,
            kingdom.happiness + (impact.happiness || 0)
          )
        )
      };

      const turnResult = await turnManager.processTurn(updatedStats);
      
      if (!turnResult.success) {
        throw new Error(turnResult.error || 'Failed to process turn');
      }

      setKingdom(turnResult.kingdom);
      setTurnSummary(turnResult.summary);
      setCurrentEvent(null);
      setTurn(prev => prev + 1);

      turnResult.notifications?.forEach(addNotification);

    } catch (error) {
      console.error("Error handling event choice:", error);
      addNotification({
        type: 'CRITICAL',
        message: 'Failed to process your choice: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleTurnProgress() {
    if (!kingdom || loading) return;

    try {
      setLoading(true);
      
      if (!turnManager) {
        throw new Error('Turn manager not initialized');
      }

      const turnResult = await turnManager.processTurn(kingdom);
      
      if (!turnResult.success) {
        throw new Error(turnResult.error || 'Failed to process turn');
      }

      setKingdom(turnResult.kingdom);
      setTurnSummary(turnResult.summary);
      setTurn(prev => prev + 1);

      turnResult.notifications?.forEach(addNotification);

      if (!currentEvent && eventGenerator) {
        try {
          const event = await eventGenerator.generateEvent({
            ...turnResult.kingdom,
            owner: kingdom.owner
          });
          setCurrentEvent(event);
        } catch (error) {
          console.error("Error generating event:", error);
          addNotification({
            type: 'WARNING',
            message: 'Failed to generate event'
          });
        }
      }

    } catch (error) {
      console.error('Turn progression error:', error);
      addNotification({
        type: 'ERROR',
        message: `Turn progression failed: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  }

  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);

  const handleNewGameClick = () => {
    if (kingdom && kingdom.id) {
      setShowNewGameConfirm(true);
    } else {
      initializeGame(false);
    }
  };

  return (
    <View className="game-container">
{kingdom && kingdom.id ? (
  <ResourceProvider kingdom={kingdom}>
    <Flex direction="column" gap="2rem" style={{ padding: '2rem' }}>
      {/* Header */}
      <Flex justifyContent="space-between" alignItems="center">
        <Heading level={1}>Kingdom's Reign</Heading>
        <Flex gap="2rem" alignItems="center">
          <Text fontSize="1.2em">Turn: {turn}</Text>
          {/* Add Start New Game button */}
          <Button 
            onClick={handleNewGameClick}  // Use this instead of direct initializeGame call
            variation="default"
          >
            Start New Game
          </Button>
          <Button onClick={() => setShowSettings(true)}>Settings</Button>
          <Button onClick={signOut}>Sign Out</Button>
        </Flex>
      </Flex>

      {/* Loading State */}
      {loading && (
        <Alert variation="info">
          Processing kingdom updates...
        </Alert>
      )}

      {/* Error State */}
      {error && (
        <Alert
          variation="error"
          isDismissible={true}
          onDismiss={() => setError(null)}
        >
          <Text>{error}</Text>
        </Alert>
      )}

      {/* Notifications */}
      <NotificationCenter 
        notifications={notifications}
        onDismiss={handleDismissNotification}
      />

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          initialSettings={settings}
          onSave={handleSettingsSave}
          onClose={() => setShowSettings(false)}
        />
      )}

{showNewGameConfirm && (
  <Alert
    variation="warning"
    isDismissible={true}
    heading="Start New Game?"
    onDismiss={() => setShowNewGameConfirm(false)}
  >
    <Text>Starting a new game will erase your current progress. Are you sure?</Text>
    <Flex gap="1rem" marginTop="1rem">
      <Button
        onClick={() => {
          setShowNewGameConfirm(false);
          initializeGame(false);
        }}
        variation="primary"
      >
        Yes, Start New Game
      </Button>
      <Button
        onClick={() => setShowNewGameConfirm(false)}
        variation="link"
      >
        Cancel
      </Button>
    </Flex>
  </Alert>
)}

      {/* Game Content */}
      {!loading && !error && (
        <Flex direction="column" gap="2rem">
          <KingdomStats kingdom={kingdom} />
          <ResourceManager 
            onNotification={addNotification}  // Pass notification handler
          />
          
          {/* Turn Summary */}
          {turnSummary && !currentEvent && (
            <TurnSummary summary={turnSummary} />
          )}

          {/* Event or Turn Progress */}
          {currentEvent ? (
            <EventSystem 
              event={currentEvent}
              onChoiceSelect={handleEventChoice}
            />
          ) : (
            <Card style={{ padding: '2rem', textAlign: 'center' }}>
              <Flex gap="1rem" justifyContent="center">
                <Button 
                  onClick={handleTurnProgress}
                  size="large"
                  variation="primary"
                  isDisabled={loading}
                >
                  Next Turn
                </Button>
              </Flex>
            </Card>
          )}
        </Flex>
      )}
    </Flex>
  </ResourceProvider>
      ) : (
        // Initial/Error state
        <Flex direction="column" style={{ padding: '2rem' }} gap="1rem">
          <Heading level={1}>Kingdom's Reign</Heading>
          
          {/* Header with settings if needed */}
          <Flex justifyContent="flex-end">
            <Button onClick={() => setShowSettings(true)}>Settings</Button>
          </Flex>
  
          {loading ? (
            <Alert variation="info">Initializing your kingdom...</Alert>
          ) : error ? (
            <Alert 
              variation="error"
              isDismissible={true}
              onDismiss={() => setError(null)}
            >
              <Text>{error}</Text>
              <Flex marginTop="1rem" gap="1rem">
                <Button 
                  onClick={() => initializeGame(false)}
                  variation="primary"
                >
                  Start New Game
                </Button>
                <Button 
                  onClick={() => initializeGame(true)}
                  variation="link"
                >
                  Try Loading Existing Game
                </Button>
              </Flex>
            </Alert>
          ) : (
            // Welcome screen with start options
            <Card padding="2rem">
              <Flex direction="column" gap="1.5rem" alignItems="center">
                <Heading level={3}>Welcome to Kingdom's Reign</Heading>
                <Text>Choose how you would like to begin:</Text>
                <Flex gap="1rem">
                  <Button 
                    onClick={() => initializeGame(false)}
                    variation="primary"
                    size="large"
                  >
                    Start New Game
                  </Button>
                  <Button 
                    onClick={() => initializeGame(true)}
                    variation="link"
                    size="large"
                  >
                    Load Existing Game
                  </Button>
                </Flex>
              </Flex>
            </Card>
            )}
          </Flex>
      )}
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Authenticator>
        {({ signOut }) => <GameContent signOut={signOut} />}
      </Authenticator>
    </ErrorBoundary>
  );
}