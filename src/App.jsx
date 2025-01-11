// src/App.jsx
import { useState, useEffect } from "react";
import {
  Authenticator,
  Button,
  Heading,
  Flex,
  Card,
  Text,
} from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json";

import KingdomStats from "./components/game/KingdomStats";
import EventSystem from "./components/game/EventSystem";
import ResourceManager from "./components/game/ResourceManager";
import EventGenerator from "./services/events/eventGenerator";

Amplify.configure(outputs);
const client = generateClient();

export default function App() {
  const [kingdom, setKingdom] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [resources, setResources] = useState([]);
  const [turn, setTurn] = useState(1);
  const [eventGenerator, setEventGenerator] = useState(null);

  useEffect(() => {
    initializeGame();
  }, []);

  async function initializeGame() {
    try {
      setTurn(1);

      // Cleanup existing data
      const { data: existingKingdoms } = await client.models.Kingdom.list();
      for (const k of existingKingdoms) {
        await client.models.Kingdom.delete({ id: k.id });
      }

      // Create new kingdom
      const { data: newKingdom } = await client.models.Kingdom.create({
        name: "Your Kingdom",
        population: 1000,
        economy: 50,
        military: 30,
        happiness: 70,
        description: "A new kingdom rises!",
      });
      
      setKingdom(newKingdom);
      
      // Initialize event generator
      setEventGenerator(new EventGenerator(newKingdom.id));
      
      // Initialize resources
      const initialResources = [
        { name: "Gold", quantity: 1000, type: "GOLD" },
        { name: "Food", quantity: 500, type: "FOOD" },
        { name: "Timber", quantity: 200, type: "TIMBER" },
      ];
      
      for (const resource of initialResources) {
        await client.models.Resource.create({
          ...resource,
          kingdomId: newKingdom.id,
        });
      }
      
      await loadKingdomResources(newKingdom.id);
    } catch (error) {
      console.error("Error initializing game:", error);
    }
  }

  async function loadKingdomResources(kingdomId) {
    const { data: kingdomResources } = await client.models.Resource.list({
      filter: {
        kingdomId: {
          eq: kingdomId
        }
      }
    });
    setResources(kingdomResources);
  }

  // Check game state and trigger appropriate events/consequences
  function checkGameState(kingdom) {
    const failureMessages = [];
    let isGameOver = false;

    // Check each stat for failure conditions
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

    // Critical warnings (not game over but dangerous)
    const warnings = [];
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

  async function handleEventChoice(choice) {
    try {
      const impact = JSON.parse(choice.impact);
      
      // Calculate new values with validation
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
      setTurn(turn + 1);

      // Check game state after update
      const gameState = checkGameState(updatedKingdom);

      // Display warnings first if any
      if (gameState.warnings.length > 0) {
        gameState.warnings.forEach(warning => {
          alert(warning);
        });
      }

      // Check for game over conditions
      if (gameState.isGameOver) {
        const finalMessage = gameState.failureMessages.join("\n\n");
        alert(`GAME OVER!\n\n${finalMessage}\n\nYour reign lasted ${turn} turns.`);
        await initializeGame();
        return;
      }

    } catch (error) {
      console.error("Error handling event choice:", error);
      alert("An error occurred while processing your choice. Please try again.");
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
        population: kingdom.population
      };

      const newEvent = await eventGenerator.generateEvent(kingdomState);
      if (!newEvent) {
        console.error("Failed to generate event");
        // Generate a fallback event
        setCurrentEvent({
          title: "Kingdom Affairs",
          description: "A quiet day in the kingdom allows for reflection and planning.",
          type: "INTERNAL",
          impact: JSON.stringify({ happiness: 5 }),
          choices: JSON.stringify([
            {
              text: "Focus on internal affairs",
              impact: JSON.stringify({ economy: 5, happiness: 5 })
            },
            {
              text: "Strengthen defenses",
              impact: JSON.stringify({ military: 5, economy: -5 })
            }
          ]),
          timestamp: new Date().toISOString()
        });
        return;
      }

      setCurrentEvent(newEvent);
    } catch (error) {
      console.error("Error generating event:", error);
      // Set a fallback event in case of error
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
        timestamp: new Date().toISOString()
      });
    }
  }

  return (
    <Authenticator>
      {({ signOut }) => (
        <Flex direction="column" gap="2rem" padding="2rem">
          <Flex justifyContent="space-between" alignItems="center">
            <Heading level={1}>Kingdom's Reign</Heading>
            <Text fontSize="1.2em">Turn: {turn}</Text>
          </Flex>

          {kingdom && (
            <Flex direction="column" gap="2rem">
              <KingdomStats kingdom={kingdom} />
              <ResourceManager resources={resources} />
              
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
          
          <Button onClick={signOut}>Sign Out</Button>
        </Flex>
      )}
    </Authenticator>
  );
}