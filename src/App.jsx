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

Amplify.configure(outputs);
const client = generateClient();

const EVENTS = [
  {
    title: "Trade Proposal",
    description: "A neighboring kingdom offers a trade agreement that could boost our economy but requires military resources for protection of trade routes.",
    choices: [
      {
        text: "Accept the trade agreement",
        impact: { economy: 15, military: -5, happiness: 5 }
      },
      {
        text: "Reject and focus on military",
        impact: { economy: -5, military: 10, happiness: -5 }
      }
    ]
  },
  {
    title: "Population Crisis",
    description: "A drought has caused food shortages in the outer regions of your kingdom.",
    choices: [
      {
        text: "Distribute food reserves",
        impact: { economy: -10, happiness: 15, population: 100 }
      },
      {
        text: "Maintain reserves for the military",
        impact: { military: 10, happiness: -15, population: -200 }
      }
    ]
  },
  {
    title: "Military Decision",
    description: "Your generals suggest increasing military training, but it will require more resources and may affect public mood.",
    choices: [
      {
        text: "Approve the training program",
        impact: { military: 20, economy: -10, happiness: -5 }
      },
      {
        text: "Focus on civilian projects instead",
        impact: { military: -5, economy: 10, happiness: 10 }
      }
    ]
  }
];

export default function App() {
  const [kingdom, setKingdom] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [resources, setResources] = useState([]);
  const [turn, setTurn] = useState(1);

  useEffect(() => {
    initializeGame();
  }, []);

  async function initializeGame() {
    try {
      // Reset turn counter when initializing game
      setTurn(1);  // Add this line

      // Cleanup any existing data
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

  async function handleEventChoice(choice) {
    try {
      const impact = JSON.parse(choice.impact);
      
      const { data: updatedKingdom } = await client.models.Kingdom.update({
        id: kingdom.id,
        population: kingdom.population + (impact.population || 0),
        economy: Math.max(0, kingdom.economy + (impact.economy || 0)),
        military: Math.max(0, kingdom.military + (impact.military || 0)),
        happiness: Math.max(0, Math.min(100, kingdom.happiness + (impact.happiness || 0))),
      });
      
      setKingdom(updatedKingdom);
      setCurrentEvent(null);
      setTurn(turn + 1);

      // Check game over conditions
      if (updatedKingdom.happiness <= 0 || updatedKingdom.economy <= 0) {
        alert("Game Over! Your kingdom has fallen into chaos.");
        await initializeGame();
        return;
      }
    } catch (error) {
      console.error("Error handling event choice:", error);
    }
  }

  function generateNewEvent() {
    const randomEvent = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    setCurrentEvent({
      ...randomEvent,
      choices: JSON.stringify(randomEvent.choices.map(choice => ({
        ...choice,
        impact: JSON.stringify(choice.impact)
      })))
    });
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