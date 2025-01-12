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

import KingdomStats from "./components/game/KingdomStats";
import EventSystem from "./components/game/EventSystem";
import ResourceManager from "./components/game/ResourceManager";
import NotificationCenter from "./components/game/NotificationCenter";
import EventGenerator from "./services/events/eventGenerator";
import ResourceManagerService from "./services/resources/resourceManager";

Amplify.configure(config);
const client = generateClient();

function GameContent({ signOut }) {
  const [kingdom, setKingdom] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [resources, setResources] = useState([]);
  const [turn, setTurn] = useState(1);
  const [eventGenerator, setEventGenerator] = useState(null);
  const [resourceManager, setResourceManager] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuthenticator();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (user && !hasInitialized) {
      setHasInitialized(true);
      initializeGame();
    }
  }, [user, hasInitialized]);

  async function cleanupKingdom() {
    try {
      // Clean up existing kingdoms
      const { data: existingKingdoms } = await client.models.Kingdom.list({
        filter: {
          owner: { eq: user.username || user.userId }
        }
      });
      
      if (existingKingdoms && existingKingdoms.length > 0) {
        for (const k of existingKingdoms) {
          try {
            // Clean up associated resources
            const { data: resources } = await client.models.Resource.list({
              filter: {
                kingdomId: { eq: k.id }
              }
            });
            for (const r of resources) {
              await client.models.Resource.delete({ id: r.id });
            }

            // Clean up associated events
            const { data: events } = await client.models.Event.list({
              filter: {
                kingdomId: { eq: k.id }
              }
            });
            for (const e of events) {
              await client.models.Event.delete({ id: e.id });
            }

            // Delete the kingdom
            await client.models.Kingdom.delete({ id: k.id });
          } catch (e) {
            console.warn(`Error cleaning up kingdom ${k.id}:`, e);
          }
        }
      }
    } catch (e) {
      console.warn("Error during cleanup:", e);
    }
  }

  async function initializeGame() {
    setLoading(true);
    setError(null);
    setTurn(1);
    setNotifications([]);
    setCurrentEvent(null);

    try {
      await cleanupKingdom();

      const kingdomData = {
        id: `kingdom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: "Your Kingdom",
        population: 1000,
        economy: 50,
        military: 30,
        happiness: 70,
        description: "A new kingdom rises!",
        lastResourceUpdate: new Date().toISOString(),
        resourceModifiers: '{}',
        techLevel: 1,
        tradeRoutes: 1,
        owner: user.username || user.userId
      };

      console.log("Creating kingdom with data:", kingdomData);

      const response = await client.models.Kingdom.create(kingdomData);
      if (!response?.data) {
        throw new Error("Kingdom creation failed - no data returned");
      }

      const newKingdom = response.data;
      setKingdom(newKingdom);

      const newEventGenerator = new EventGenerator(newKingdom.id);
      const newResourceManager = new ResourceManagerService(newKingdom.id);
      
      setEventGenerator(newEventGenerator);
      setResourceManager(newResourceManager);

      await newResourceManager.initializeResources();
      await loadKingdomResources(newKingdom.id);

    } catch (error) {
      console.error("Game initialization error:", error);
      setError(error.message || "Failed to initialize game");
    } finally {
      setLoading(false);
    }
  }

  async function loadKingdomResources(kingdomId) {
    if (!kingdomId) return;

    try {
      const resourceMgr = new ResourceManagerService(kingdomId);
      const resourceReport = await resourceMgr.getResourceReport();
      setResources(resourceReport);
    } catch (error) {
      console.error("Error loading resources:", error);
      setError("Failed to load resources");
    }
  }

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

  async function handleEventChoice(choice) {
    try {
      console.log('Handling event choice:', choice);
      const impact = typeof choice.impact === 'string' 
        ? JSON.parse(choice.impact) 
        : choice.impact;
      console.log('Parsed impact:', impact);
      
      const newPopulation = Math.max(0, kingdom.population + (impact.population || 0));
      const newEconomy = Math.max(0, kingdom.economy + (impact.economy || 0));
      const newMilitary = Math.max(0, kingdom.military + (impact.military || 0));
      const newHappiness = Math.max(0, Math.min(100, kingdom.happiness + (impact.happiness || 0)));

      const { data: updatedKingdom } = await client.models.Kingdom.update({
        id: kingdom.id,
        population: newPopulation,
        economy: newEconomy,
        military: newMilitary,
        happiness: newHappiness,
      });
      
      setKingdom(updatedKingdom);
      setCurrentEvent(null);

      if (resourceManager) {
        const resourceResult = await resourceManager.processTurn(updatedKingdom);
        if (resourceResult.notifications?.length > 0) {
          resourceResult.notifications.forEach(notification => {
            addNotification(notification);
          });
        }
        await loadKingdomResources(kingdom.id);
      }

      setTurn(prev => prev + 1);

      const gameState = checkGameState(updatedKingdom);

      if (gameState.isGameOver) {
        const finalMessage = gameState.failureMessages.join("\n\n");
        setError(`GAME OVER!\n\n${finalMessage}\n\nYour reign lasted ${turn} turns.`);
        return;
      }

      if (gameState.warnings.length > 0) {
        gameState.warnings.forEach(warning => {
          addNotification({
            type: 'WARNING',
            message: warning
          });
        });
      }

    } catch (error) {
      console.error("Error handling event choice:", error);
      setError("An error occurred while processing your choice");
    }
  }

  async function generateNewEvent() {
    try {
      if (!eventGenerator || !kingdom) {
        console.warn("Cannot generate event: eventGenerator or kingdom not initialized");
        return;
      }

      const kingdomState = {
        happiness: kingdom.happiness,
        economy: kingdom.economy,
        military: kingdom.military,
        population: kingdom.population,
        owner: kingdom.owner
      };

      console.log("Generating event with kingdom state:", kingdomState);
      const newEvent = await eventGenerator.generateEvent(kingdomState);
      console.log("Generated event:", newEvent);

      if (!newEvent) {
        throw new Error("Failed to generate event");
      }

      setCurrentEvent(newEvent);
    } catch (error) {
      console.error("Error generating event:", error);
      setCurrentEvent({
        title: "Peaceful Times",
        description: "The kingdom enjoys a moment of peace and stability.",
        type: "RANDOM",
        impact: JSON.stringify({ happiness: 5 }),
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

  function checkGameState(kingdom) {
    const failureMessages = [];
    let isGameOver = false;
    const warnings = [];

    if (kingdom.happiness <= 0) {
      failureMessages.push("Your people have completely lost faith in your leadership. A rebellion has overthrown your rule!");
      isGameOver = true;
    }

    if (kingdom.economy <= 0) {
      failureMessages.push("The kingdom's treasury is empty. Economic collapse has led to widespread chaos!");
      isGameOver = true;
    }

    if (kingdom.military <= 0) {
      failureMessages.push("With no military force remaining, your kingdom has been conquered by neighboring powers!");
      isGameOver = true;
    }

    if (kingdom.population <= 0) {
      failureMessages.push("Your kingdom has been completely depopulated. The once-great realm is now a ghost kingdom!");
      isGameOver = true;
    }

    if (kingdom.happiness <= 20 && kingdom.happiness > 0) {
      warnings.push("WARNING: Civil unrest is reaching dangerous levels!");
    }
    if (kingdom.economy <= 20 && kingdom.economy > 0) {
      warnings.push("WARNING: The kingdom's economy is on the brink of collapse!");
    }
    if (kingdom.military <= 20 && kingdom.military > 0) {
      warnings.push("WARNING: Your military forces are critically weakened!");
    }
    if (kingdom.population <= 200 && kingdom.population > 0) {
      warnings.push("WARNING: The kingdom's population has reached dangerously low levels!");
    }

    return {
      isGameOver,
      failureMessages,
      warnings
    };
  }

  async function handleWorkerAllocation(resourceId, workers) {
    try {
      if (!resourceManager) return;
      
      const result = await resourceManager.allocateWorkers(resourceId, workers);
      
      if (result.success) {
        await loadKingdomResources(kingdom.id);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error allocating workers:', error);
      setError('Failed to allocate workers');
    }
  }

  async function handleResourceUpgrade(resourceId) {
    try {
      if (!resourceManager) return;
      
      const result = await resourceManager.upgradeResourceQuality(resourceId);
      
      if (result.success) {
        await loadKingdomResources(kingdom.id);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error upgrading resource:', error);
      setError('Failed to upgrade resource');
    }
  }

  return (
    <View>
      <Flex direction="column" gap="2rem" padding="2rem">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading level={1}>Kingdom's Reign</Heading>
          <Text fontSize="1.2em">Turn: {turn}</Text>
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
            <Button onClick={initializeGame} marginTop="1rem">
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
              onAllocateWorkers={handleWorkerAllocation}
              onUpgradeResource={handleResourceUpgrade}
            />
            
            {currentEvent ? (
              <EventSystem 
                event={currentEvent}
                onChoiceSelect={handleEventChoice}
              />
            ) : (
              <Card padding="2rem" textAlign="center">
                <Button 
                  onClick={generateNewEvent}
                  size="large"
                  variation="primary"
                >
                  Next Turn
                </Button>
              </Card>
            )}
          </Flex>
        )}
        
        <Flex justifyContent="space-between">
          <Button 
            onClick={initializeGame}
            isDisabled={loading}
          >
            New Game
          </Button>
          <Button onClick={signOut}>Sign Out</Button>
        </Flex>
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