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
  useAuthenticator,
  useTheme
} from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from "aws-amplify/data";
import config from "../amplify_outputs.json";

import KingdomStats from "./components/game/KingdomStats";
import EventSystem from "./components/game/EventSystem";
import ResourceManager from "./components/game/ResourceManager";
import NotificationCenter from "./components/game/NotificationCenter";
import TutorialOverlay from './components/tutorial/TutorialOverlay';
import HelpButton from './components/tutorial/HelpButton';
import EventGenerator from "./services/events/eventGenerator";
import ResourceManagerService from "./services/resources/resourceManager";
import GameStateManager from './services/game/gameStateManager';
import { calculateEventResourceImpact } from './constants/resourceConstants';

Amplify.configure(config);
const client = generateClient();

function GameContent({ signOut }) {
  // State Management
  const [kingdom, setKingdom] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [resources, setResources] = useState([]);
  const [turn, setTurn] = useState(1);
  const [eventGenerator, setEventGenerator] = useState(null);
  const [resourceManager, setResourceManager] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const { user } = useAuthenticator();
  const [hasInitialized, setHasInitialized] = useState(false);
  const { tokens } = useTheme();

  // Tutorial Management
  useEffect(() => {
    const tutorialSeen = localStorage.getItem('tutorial_completed');
    setHasSeenTutorial(!!tutorialSeen);
    if (!tutorialSeen) {
      setShowTutorial(true);
    }
  }, []);

  // Game Initialization
  useEffect(() => {
    if (user && !hasInitialized) {
      setHasInitialized(true);
      initializeGame();
    }
  }, [user, hasInitialized]);

  // Game Functions
  async function cleanupKingdom() {
    try {
      const { data: existingKingdoms } = await client.models.Kingdom.list({
        filter: { owner: { eq: user.username || user.userId } }
      });
      
      if (existingKingdoms?.length > 0) {
        for (const kingdom of existingKingdoms) {
          if (!kingdom?.id) continue;

          try {
            const { data: resources } = await client.models.Resource.list({
              filter: { kingdomId: { eq: kingdom.id } }
            });
            
            for (const resource of resources || []) {
              if (resource?.id) {
                await client.models.Resource.delete({ id: resource.id });
              }
            }

            const { data: events } = await client.models.Event.list({
              filter: { kingdomId: { eq: kingdom.id } }
            });
            
            for (const event of events || []) {
              if (event?.id) {
                await client.models.Event.delete({ id: event.id });
              }
            }

            await client.models.Kingdom.delete({ id: kingdom.id });
          } catch (e) {
            console.warn(`Error cleaning up kingdom ${kingdom.id}:`, e);
          }
        }
      }
    } catch (e) {
      console.warn("Error during cleanup:", e);
    }
  }

  async function initializeGame(loadExisting = true) {
    setLoading(true);
    setError(null);
    setNotifications([]);
    setCurrentEvent(null);

    try {
      if (loadExisting) {
        const { data: existingKingdoms } = await client.models.Kingdom.list({
          filter: { owner: { eq: user.username || user.userId } }
        });

        const validKingdom = existingKingdoms?.find(k => k?.id);
        
        if (validKingdom) {
          setKingdom(validKingdom);
          
          const newEventGenerator = new EventGenerator(validKingdom.id);
          const newResourceManager = new ResourceManagerService(validKingdom.id);
          
          setEventGenerator(newEventGenerator);
          setResourceManager(newResourceManager);

          await loadKingdomResources(validKingdom.id);
          setTurn(validKingdom.turn || 1);
          setLoading(false);
          return;
        }
      }

      await cleanupKingdom();

      const kingdomData = {
        name: "Your Kingdom",
        population: 1000,
        economy: 50,
        military: 30,
        happiness: 70,
        description: "A new kingdom rises!",
        turn: 1,
        owner: user.username || user.userId
      };

      const response = await client.models.Kingdom.create(kingdomData);
      if (!response?.data) throw new Error("Failed to create kingdom");

      const newKingdom = response.data;
      setKingdom(newKingdom);
      setTurn(1);

      const newEventGenerator = new EventGenerator(newKingdom.id);
      const newResourceManager = new ResourceManagerService(newKingdom.id);
      
      setEventGenerator(newEventGenerator);
      setResourceManager(newResourceManager);

      await newResourceManager.initializeResources();
      await loadKingdomResources(newKingdom.id);

    } catch (error) {
      console.error("Game initialization error:", error);
      setError(error.message || "Failed to initialize game");
      setKingdom(null);
      setEventGenerator(null);
      setResourceManager(null);
      setResources([]);
      setTurn(1);
    } finally {
      setLoading(false);
    }
  }

  // Resource Management
  async function loadKingdomResources(kingdomId) {
    if (!kingdomId) {
      console.warn("No kingdom ID provided");
      setResources([]);
      return;
    }
  
    try {
      const resourceMgr = new ResourceManagerService(kingdomId);
      const resourceReport = await resourceMgr.getResourceReport(kingdom);
      setResources(resourceReport);
    } catch (error) {
      console.error("Error loading resources:", error);
      setError("Failed to load resources");
      setResources([]);
    }
  }

  // Notification Management
  function handleDismissNotification(index) {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  }

  function addNotification(notification) {
    const isDuplicate = notifications.some(n => 
      n.message === notification.message && 
      n.type === notification.type
    );

    if (!isDuplicate) {
      setNotifications(prev => [...prev, notification]);
      if (notification.type !== 'CRITICAL') {
        setTimeout(() => {
          setNotifications(prev => 
            prev.filter(n => n.message !== notification.message)
          );
        }, 5000);
      }
    }
  }

  // Event Management
  async function generateNewEvent() {
    try {
      if (!eventGenerator || !kingdom) {
        console.warn("Cannot generate event: missing dependencies");
        return;
      }

      const kingdomState = {
        happiness: kingdom.happiness,
        economy: kingdom.economy,
        military: kingdom.military,
        population: kingdom.population,
        owner: kingdom.owner
      };

      const newEvent = await eventGenerator.generateEvent(kingdomState);
      if (!newEvent) throw new Error("Failed to generate event");

      setCurrentEvent(newEvent);
    } catch (error) {
      console.error("Error generating event:", error);
      setCurrentEvent({
        title: "Peaceful Times",
        description: "The kingdom enjoys a moment of peace and stability.",
        type: "RANDOM",
        choices: JSON.stringify([
          {
            text: "Maintain the peace",
            impact: JSON.stringify({ happiness: 5 })
          },
          {
            text: "Prepare for the future",
            impact: JSON.stringify({ military: 5, economy: 5, happiness: -5 })
          }
        ]),
        timestamp: new Date().toISOString(),
        owner: kingdom.owner
      });
    }
  }

  async function handleEventChoice(choice) {
    try {
      const impact = typeof choice.impact === 'string' 
        ? JSON.parse(choice.impact) 
        : choice.impact;
      
      // Calculate resource impacts
      const resourceImpacts = calculateEventResourceImpact(choice, resources, kingdom);
      
      // Update kingdom stats
      const newStats = {
        population: Math.max(0, kingdom.population + (impact.population || 0)),
        economy: Math.max(0, kingdom.economy + (impact.economy || 0)),
        military: Math.max(0, kingdom.military + (impact.military || 0)),
        happiness: Math.max(0, Math.min(100, kingdom.happiness + (impact.happiness || 0)))
      };

      const { data: updatedKingdom } = await client.models.Kingdom.update({
        id: kingdom.id,
        ...newStats
      });
      
      setKingdom(updatedKingdom);
      setCurrentEvent(null);

      // Process resources
      if (resourceManager) {
        const resourceResult = await resourceManager.processTurn(updatedKingdom);
        
        Object.entries(resourceImpacts).forEach(([resourceType, impact]) => {
          if (impact !== 0) {
            addNotification({
              type: impact < 0 ? 'WARNING' : 'INFO',
              message: `${resourceType}: ${impact > 0 ? '+' : ''}${impact}`
            });
          }
        });

        if (resourceResult.notifications?.length > 0) {
          resourceResult.notifications.forEach(notification => {
            addNotification(notification);
          });
        }

        await loadKingdomResources(kingdom.id);
      }

      // Update turn and check game state
      const newTurn = turn + 1;
      setTurn(newTurn);

      const gameState = GameStateManager.getGameState(updatedKingdom, newTurn);
      
      if (gameState.isGameOver) {
        const message = gameState.victory 
          ? `Victory! ${gameState.message}`
          : `Defeat! ${gameState.message}`;
        setError(`${message}\nYour reign lasted ${newTurn} turns.`);
        return;
      }

      gameState.warnings?.forEach(warning => {
        addNotification({
          type: 'WARNING',
          message: warning
        });
      });

    } catch (error) {
      console.error("Error handling event choice:", error);
      setError("Failed to process your choice");
    }
  }

  async function handleTurnProgression() {
    if (loading || error) return;

    try {
      setLoading(true);
      const gameState = GameStateManager.getGameState(kingdom, turn);
      
      if (gameState.isGameOver) {
        setError(`Game Over! ${gameState.message}\nYour reign lasted ${turn} turns.`);
        return;
      }

      gameState.warnings?.forEach(warning => {
        addNotification({
          type: 'WARNING',
          message: warning
        });
      });

      if (!currentEvent) {
        await generateNewEvent();
      }

    } catch (error) {
      console.error("Error processing turn:", error);
      setError("Failed to process turn");
    } finally {
      setLoading(false);
    }
  }

  // Tutorial Management
  const handleTutorialComplete = () => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
    localStorage.setItem('tutorial_completed', 'true');
  };

  // New Game Management
  const handleNewGame = () => {
    setShowNewGameConfirm(true);
  };

  const confirmNewGame = () => {
    setShowNewGameConfirm(false);
    initializeGame(false);
  };

  // Render
  return (
    <View className="game-container">
      <TutorialOverlay 
        visible={showTutorial} 
        onComplete={handleTutorialComplete}
      />

      <Flex direction="column" gap="2rem" padding="2rem">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading level={1}>Kingdom's Reign</Heading>
          <Flex gap="2rem" alignItems="center">
            <Text fontSize="1.2em">Turn: {turn}</Text>
            <HelpButton />
          </Flex>
        </Flex>

        {loading && (
          <Alert variation="info" isDismissible={false} heading="Loading">
            Initializing your kingdom...
          </Alert>
        )}

        {error && (
          <Alert
            variation="error"
            isDismissible={true}
            onDismiss={() => setError(null)}
            heading="Error"
          >
            {error}
            <Button onClick={() => initializeGame(false)} marginTop="1rem">
              Start New Game
            </Button>
          </Alert>
        )}

        <NotificationCenter 
          notifications={notifications}
          onDismiss={handleDismissNotification}
        />

        {!loading && !error && kingdom && (
          <Flex direction="column" gap="2rem">
            <KingdomStats kingdom={kingdom} />
            <ResourceManager 
              resources={resources}
              kingdom={kingdom}
            />
            
            {currentEvent ? (
              <EventSystem 
                event={currentEvent}
                onChoiceSelect={handleEventChoice}
              />
            ) : (
              <Card padding="2rem" textAlign="center">
                <Button 
                  onClick={handleTurnProgression}
                  size="large"
                  variation="primary"
                >
                  Next Turn
                </Button>
              </Card>
            )}
          </Flex>
        )}
        
        <Card padding="1rem" variation="outlined">
          <Flex justifyContent="space-between" alignItems="center">
            <Flex gap="1rem">
              <Button
                onClick={handleNewGame}
                isDisabled={loading}
                variation="primary"
                size="large"
              >
                Start New Game
              </Button>
              {kingdom?.id && (
                <Button
                  onClick={() => initializeGame(true)}
                  isDisabled={loading}
                  variation="default"
                  size="large"
                >
                  Load Game
                </Button>
              )}
            </Flex>
            <Button 
              onClick={signOut}
              variation="warning"
              size="large"
            >
              Sign Out
            </Button>
          </Flex>

          {showNewGameConfirm && (
            <Alert
              variation="warning"
              isDismissible={true}
              onDismiss={() => setShowNewGameConfirm(false)}
              heading="Start New Game?"
              marginTop="1rem"
            >
              <Text>Starting a new game will erase your current progress. Are you sure?</Text>
              <Flex gap="1rem" marginTop="1rem">
                <Button
                  onClick={confirmNewGame}
                  variation="primary"
                >
                  Yes, Start New Game
                </Button>
                <Button
                  onClick={() => setShowNewGameConfirm(false)}
                  variation="default"
                >
                  Cancel
                </Button>
              </Flex>
            </Alert>
          )}
        </Card>
      </Flex>
    </View>
  );
}

export default function App() {
  return (
    <Authenticator>
      {({ signOut }) => <GameContent signOut={signOut} />}
    </Authenticator>
  );
}